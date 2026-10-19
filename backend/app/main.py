"""API REST — contrato en specs/001-portal-sprintscrum/contracts/api.md."""
import logging
import zipfile
from contextlib import asynccontextmanager

import redis
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from . import consultas, cumplimiento, db
from .config import config

log = logging.getLogger("sprintscrum")


@asynccontextmanager
async def ciclo_vida(_: FastAPI):
    yield
    db.cerrar()


# Sin documentación interactiva en producción: no se publica el mapa de la API
app = FastAPI(title="SprintScrum · AgendaFácil", version="1.0.0", lifespan=ciclo_vida,
              docs_url=None, openapi_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=config().cors, allow_methods=["GET", "POST"],
                   allow_headers=["content-type", "x-requested-with"])

CABECERA_PORTAL = "portal-sprintscrum"


def desde_el_portal(request: Request) -> None:
    """Las acciones que escriben exigen una cabecera propia: obliga a un preflight CORS, así que otra web no
    puede dispararlas desde el navegador de un visitante (solo se permite el origen del portal)."""
    if request.headers.get("x-requested-with") != CABECERA_PORTAL:
        raise HTTPException(403, "Petición no permitida")


def _proyecto() -> dict:
    p = consultas.proyecto()
    if not p:
        raise HTTPException(404, "El contenido del proyecto no está cargado")
    return p


# ── Salud ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    estado = {"db": False, "redis": False}
    try:
        estado["db"] = db.uno("select 1 as ok")["ok"] == 1
    except Exception as e:
        log.warning("db no responde: %s", e)
    try:
        estado["redis"] = bool(redis.Redis.from_url(config().redis_url, socket_timeout=2).ping())
    except Exception as e:
        log.warning("redis no responde: %s", e)
    ok = all(estado.values())
    return JSONResponse({"status": "ok" if ok else "degradado", **estado}, status_code=200 if ok else 503)


# ── Contenido de la actividad ───────────────────────────────────────────────
@app.get("/api/resumen")
def resumen():
    _proyecto()
    r = consultas.resumen()
    r["kpis"]["simulaciones"] = consultas.total_simulaciones()
    return r


@app.get("/api/proyecto")
def proyecto():
    p = _proyecto()
    return {**p, "palabras": consultas.palabras(" ".join(p["descripcion"]))}


@app.get("/api/equipo")
def equipo():
    gente = consultas.integrantes()
    ts = consultas.tareas()
    carga = {c["integrante_id"]: c for c in consultas.carga_por_persona(ts, gente)}
    for g in gente:
        g["carga"] = carga[g["id"]]
        g["tareas"] = [t for t in ts if t["responsable_id"] == g["id"]]
    return {"integrantes": gente, "eventos": consultas.eventos(), "proyecto": _proyecto()}


@app.get("/api/backlog")
def backlog():
    p = _proyecto()
    return {"historias": consultas.historias(), "nota": p["nota_backlog"]}


@app.get("/api/sprint")
def sprint():
    p = _proyecto()
    return {**consultas.sprint(), "objetivo_sprint": p["objetivo_sprint"]}


@app.get("/api/reflexiones")
def reflexiones():
    return consultas.reflexiones()


@app.get("/api/conclusion")
def conclusion():
    p = _proyecto()
    return {"texto": p["conclusion"], "palabras": consultas.palabras(p["conclusion"]), "equipo": p["portada"]["equipo"]}


@app.get("/api/cumplimiento")
def get_cumplimiento():
    _proyecto()
    return cumplimiento.requisitos()


# ── Simulación Monte Carlo (Celery) ─────────────────────────────────────────
class PeticionSimulacion(BaseModel):
    iteraciones: int = Field(2000, ge=500, le=5000)
    variabilidad: float = Field(0.25, ge=0.05, le=0.6)
    capacidad_horas_dia: float = Field(6.0, ge=4.0, le=8.0)
    semilla: int | None = Field(None, ge=0, le=2**31 - 1)


@app.post("/api/simulacion", status_code=202, dependencies=[Depends(desde_el_portal)])
def simular(peticion: PeticionSimulacion):
    from .tareas import simular_sprint

    parametros = peticion.model_dump()
    s = consultas.crear_simulacion(parametros)
    try:
        r = simular_sprint.apply_async(args=[s["id"], parametros], task_id=s["id"])
    except Exception as e:
        log.exception("No se pudo encolar la simulación")
        consultas.fallar_simulacion(s["id"], "La cola de trabajos no está disponible.")
        raise HTTPException(503, "La cola de trabajos no está disponible") from e
    consultas.asignar_tarea_simulacion(s["id"], r.id)
    return {"id": s["id"], "estado": s["estado"]}


@app.get("/api/simulacion/ultima")
def simulacion_ultima():
    s = consultas.ultima_simulacion()
    if not s:
        raise HTTPException(404, "Todavía no hay simulaciones")
    return s


@app.get("/api/simulacion/{sid}")
def simulacion(sid: str):
    try:
        s = consultas.simulacion(sid)
    except Exception:
        s = None  # un id que no es uuid
    if not s:
        raise HTTPException(404, "Simulación no encontrada")
    return s


# ── Entregables ─────────────────────────────────────────────────────────────
def _entrega(archivos: list[dict]) -> dict | None:
    """El ZIP oficial para Moodle, con su contenido leído del propio archivo (no de una lista fija)."""
    registro = next((a for a in archivos if a["tipo"] == "Paquete"), None)
    if not registro:
        return None
    ruta = config().dir_entregables / registro["ruta"]
    if not ruta.is_file():
        return None
    with zipfile.ZipFile(ruta) as z:
        contenido = [{"nombre": i.filename.split("/", 1)[-1], "bytes": i.file_size} for i in z.infolist() if not i.is_dir()]
        leeme = next((z.read(i).decode() for i in z.namelist() if i.endswith("LEEME.md")), "")
    return {**registro, "contenido": contenido, "leeme": leeme}


@app.get("/api/entregables")
def entregables():
    archivos = consultas.entregables()
    return {"archivos": archivos, "total_bytes": sum(a["bytes"] for a in archivos), "entrega": _entrega(archivos),
            "ultimo_paquete": consultas.ultimo_paquete(), "recientes": consultas.paquetes_recientes()}


@app.get("/api/entregables/archivo")
def entregable_archivo(ruta: str, ver: bool = False):
    """Descarga (o muestra en línea, con ver=1) un archivo del catálogo. Solo se sirven rutas registradas."""
    registro = consultas.entregable_por_ruta(ruta)
    base = config().dir_entregables.resolve()
    destino = (base / ruta).resolve() if registro else None
    if not registro or base not in destino.parents or not destino.is_file():
        raise HTTPException(404, "Archivo no encontrado")
    if ver:
        return FileResponse(destino, content_disposition_type="inline", filename=destino.name)
    return FileResponse(destino, filename=destino.name)


@app.post("/api/entregables/generar", status_code=202, dependencies=[Depends(desde_el_portal)])
def entregables_generar():
    from .tareas import generar_entregable

    # Si ya se está generando uno, o el último sigue vigente (posterior a los archivos del catálogo
    # desplegado y su ZIP existe), se devuelve ese en vez de construir otro igual.
    en_curso = consultas.paquete_en_curso()
    if en_curso:
        return {"paquete_id": en_curso["id"], "reutilizado": True}
    ultimo = consultas.ultimo_paquete()
    if ultimo and (config().dir_paquetes / ultimo["archivo"]).is_file() and \
            ultimo["completado_en"].timestamp() > _version_catalogo():
        return {"paquete_id": ultimo["id"], "reutilizado": True}

    p = consultas.crear_paquete()
    try:
        r = generar_entregable.apply_async(args=[p["id"]], task_id=p["id"])
    except Exception as e:
        log.exception("No se pudo encolar el paquete")
        consultas.fallar_paquete(p["id"], "La cola de trabajos no está disponible.")
        raise HTTPException(503, "La cola de trabajos no está disponible") from e
    consultas.asignar_tarea_paquete(p["id"], r.id)
    return {"paquete_id": p["id"]}


def _version_catalogo() -> float:
    """Momento del despliegue del catálogo: la fecha más reciente de sus archivos."""
    base = config().dir_entregables
    return max((f.stat().st_mtime for f in base.rglob("*") if f.is_file()), default=0.0)


@app.get("/api/entregables/paquete/{pid}")
def entregables_paquete(pid: str):
    try:
        p = consultas.paquete(pid)
    except Exception:
        p = None
    if not p:
        raise HTTPException(404, "Paquete no encontrado")
    return p


@app.get("/api/entregables/paquete/{pid}/descargar")
def entregables_descargar(pid: str):
    try:
        p = consultas.paquete(pid)
    except Exception:
        p = None
    if not p or p["estado"] != "completada":
        raise HTTPException(404, "El paquete no existe o todavía no está listo")
    destino = config().dir_paquetes / p["archivo"]
    if not destino.is_file():
        raise HTTPException(410, "El archivo del paquete ya no está en el servidor; genera uno nuevo")
    return FileResponse(destino, filename=p["archivo"], media_type="application/zip")
