"""Tareas de Celery."""
import hashlib
import logging
import zipfile
from datetime import datetime

from . import consultas, simulacion
from .celery_app import celery
from .config import config

log = logging.getLogger("sprintscrum.tareas")
PAQUETES_CONSERVADOS = 3


@celery.task(name="sprintscrum.simular_sprint")
def simular_sprint(simulacion_id: str, parametros: dict) -> dict:
    """Monte Carlo del sprint con los datos vigentes de la base; deja el resultado en SprintScrum_simulaciones."""
    try:
        r = simulacion.simular(consultas.tareas(), consultas.historias(), consultas.integrantes(),
                               iteraciones=parametros["iteraciones"], variabilidad=parametros["variabilidad"],
                               capacidad=parametros["capacidad_horas_dia"], semilla=parametros.get("semilla"))
    except Exception:
        # El detalle va al log del worker; al visitante solo un mensaje genérico
        log.exception("Fallo al simular %s", simulacion_id)
        consultas.fallar_simulacion(simulacion_id, "No se pudo completar la simulación.")
        raise
    consultas.completar_simulacion(simulacion_id, r)
    consultas.purgar_simulaciones()
    return {"prob_a_tiempo": r["prob_a_tiempo"], "duracion_ms": r["duracion_ms"]}


@celery.task(name="sprintscrum.generar_entregable")
def generar_entregable(paquete_id: str) -> dict:
    """Empaqueta todos los entregables del catálogo en un ZIP con su manifiesto SHA-256."""
    try:
        cfg = config()
        archivos = consultas.entregables()
        cfg.dir_paquetes.mkdir(parents=True, exist_ok=True)
        nombre = f"SprintScrum_Actividad1_Equipo2073F_{datetime.now():%Y%m%d-%H%M%S}_{paquete_id[:8]}.zip"
        destino = cfg.dir_paquetes / nombre
        with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for a in archivos:
                z.write(cfg.dir_entregables / a["ruta"], arcname=f"SprintScrum_Actividad1/{a['ruta']}")
            z.writestr("SprintScrum_Actividad1/MANIFIESTO_SHA256.txt",
                       "".join(f"{a['sha256']}  {a['ruta']}\n" for a in archivos))
        sha = hashlib.sha256(destino.read_bytes()).hexdigest()
        consultas.completar_paquete(paquete_id, nombre, len(archivos) + 1, destino.stat().st_size, sha)
        _purgar(cfg.dir_paquetes)
        return {"archivo": nombre, "sha256": sha}
    except Exception:
        log.exception("Fallo al generar el paquete %s", paquete_id)
        consultas.fallar_paquete(paquete_id, "No se pudo generar el paquete.")
        raise


def _purgar(carpeta) -> None:
    """Conserva solo los últimos paquetes: borra registros viejos y cualquier ZIP que ya no esté registrado."""
    consultas.purgar_paquetes(PAQUETES_CONSERVADOS)
    vigentes = {p["archivo"] for p in consultas.paquetes_recientes(PAQUETES_CONSERVADOS + 5) if p.get("archivo")}
    for f in carpeta.glob("*.zip"):
        if f.name not in vigentes:
            f.unlink(missing_ok=True)
