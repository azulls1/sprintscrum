"""Cumplimiento del enunciado y de la rúbrica, comprobado contra los datos de la base y el .docx entregado
(nada se marca a mano: cada requisito lleva la evidencia que lo comprueba)."""
import re
import zipfile
from pathlib import Path

from . import consultas
from .config import config

FIBONACCI = {1, 2, 3, 5, 8, 13, 21}
FORMATO_HU = re.compile(r"^Como .+ quiero .+ para .+", re.IGNORECASE)


def _req(id_: str, criterio: str, texto: str, cumplido: bool, evidencia: str, ruta: str, aviso: bool = False) -> dict:
    return {"id": id_, "criterio": criterio, "texto": texto, "cumplido": cumplido, "aviso": aviso,
            "evidencia": evidencia, "ruta": ruta}


def _formato_docx() -> dict | None:
    """Lee el estilo Normal del .docx entregado: fuente, tamaño (medios puntos) e interlineado (240 = sencillo)."""
    docx = next(iter(sorted(config().dir_entregables.glob("**/*.docx"))), None)
    if not docx:
        return None
    with zipfile.ZipFile(docx) as z:
        estilos = z.read("word/styles.xml").decode()
        documento = z.read("word/document.xml").decode()
    normal = re.search(r'<w:style [^>]*w:styleId="Normal".*?</w:style>', estilos, re.S)
    bloque = normal.group(0) if normal else ""
    fuente = re.search(r'w:ascii="([^"]+)"', bloque)
    tam = re.search(r'<w:sz w:val="(\d+)"', bloque)
    lineas = re.findall(r'<w:spacing [^>]*w:line="(\d+)"', documento + bloque)
    return {"archivo": docx.name, "fuente": fuente.group(1) if fuente else None,
            "puntos": int(tam.group(1)) / 2 if tam else None,
            "interlineado": max((int(x) for x in lineas), default=240) / 240}


def requisitos() -> list[dict]:
    p = consultas.proyecto()
    gente = consultas.integrantes()
    hs = consultas.historias()
    ts = consultas.tareas()
    refl = consultas.reflexiones()
    r: list[dict] = []

    # C1 · Descripción del proyecto
    desc = " ".join(p["descripcion"])
    w = consultas.palabras(desc)
    r.append(_req("C1.1", "C1", "Descripción del proyecto de 150 palabras como máximo", w <= 150, f"{w} palabras", "/proyecto"))
    faltan = [k for k, v in (("empresa", p["empresa"]), ("cliente", p["cliente"]), ("producto", p["producto"]),
                              ("objetivo", p["objetivo_producto"])) if not v or v.split()[0] not in desc]
    r.append(_req("C1.2", "C1", "Incluye empresa, cliente, producto y objetivo", not faltan,
                  f"{p['empresa']} · {p['cliente']} · {p['producto']}" if not faltan else f"Falta: {', '.join(faltan)}", "/proyecto"))

    # Roles
    roles = {g["rol_scrum"] for g in gente}
    devs = sum(1 for g in gente if g["rol_scrum"] == "developer" or "desarrollador" in g["rol"].lower())
    r.append(_req("R.1", "Roles", "Product owner, Scrum master y al menos dos desarrolladores",
                  {"product_owner", "scrum_master"} <= roles and devs >= 2,
                  f"PO, SM y {devs} personas con rol de desarrollo", "/equipo"))
    r.append(_req("R.2", "Roles", "Cada integrante tiene un rol", all(g["rol"] for g in gente),
                  f"{len(gente)} de {len(gente)} con rol asignado", "/equipo"))

    # C2 · Product backlog
    r.append(_req("C2.1", "C2", "Product backlog con al menos cinco ítems", len(hs) >= 5, f"{len(hs)} historias de usuario", "/product-backlog"))
    mal_formato = [h["id"] for h in hs if not FORMATO_HU.match(h["texto"])]
    r.append(_req("C2.2", "C2", "Historias redactadas como «Como… quiero… para…»", not mal_formato,
                  f"las {len(hs)}" if not mal_formato else
                  f"{len(hs) - len(mal_formato)} de {len(hs)}; sin la parte «para…»: {', '.join(mal_formato)}",
                  "/product-backlog", aviso=bool(mal_formato)))
    r.append(_req("C2.3", "C2", "Cada historia tiene prioridad (alta, media o baja)",
                  all(h["prioridad"] in ("Alta", "Media", "Baja") for h in hs),
                  " · ".join(f"{k} {sum(1 for h in hs if h['prioridad'] == k)}" for k in ("Alta", "Media", "Baja")), "/product-backlog"))
    r.append(_req("C2.4", "C2", "Cada historia tiene una estimación numérica del esfuerzo",
                  all(h["puntos"] in FIBONACCI for h in hs),
                  f"{sum(h['puntos'] for h in hs)} puntos de historia (Fibonacci)", "/product-backlog"))

    # C3 · Sprint backlog
    sprint = [h for h in hs if h["en_sprint"]]
    r.append(_req("C3.1", "C3", "Tres historias seleccionadas para el sprint", len(sprint) == 3,
                  ", ".join(h["id"] for h in sprint), "/sprint-backlog"))
    sin_tareas = [h["id"] for h in sprint if not any(t["historia_id"] == h["id"] for t in ts)]
    r.append(_req("C3.2", "C3", "Cada historia del sprint está desglosada en tareas", not sin_tareas,
                  f"{len(ts)} tareas" if not sin_tareas else f"Sin tareas: {', '.join(sin_tareas)}", "/sprint-backlog"))
    completas = all(t["nombre"] and t["responsable"] and t["horas"] > 0 for t in ts)
    r.append(_req("C3.3", "C3", "Cada tarea tiene nombre, responsable y tiempo estimado", completas,
                  f"{sum(t['horas'] for t in ts):g} h repartidas entre {len({t['responsable_id'] for t in ts})} personas", "/sprint-backlog"))

    # C4 · Reflexiones
    fuera = [f"{x['nombre'].split()[0]} ({x['palabras']})" for x in refl if not 150 <= x["palabras"] <= 200]
    r.append(_req("C4.1", "C4", "Una reflexión individual por integrante", len(refl) == len(gente),
                  f"{len(refl)} de {len(gente)}", "/reflexiones"))
    r.append(_req("C4.2", "C4", "Cada reflexión tiene entre 150 y 200 palabras", not fuera,
                  " · ".join(f"{x['palabras']}" for x in refl) if not fuera else "Fuera de rango: " + ", ".join(fuera), "/reflexiones"))
    temas = {"tareas": ("tarea", "encargar", "construir", "facilitar", "presentar"), "retos": ("reto",),
             "contribución": ("contribu",)}
    sin_tema = [f"{x['nombre'].split()[0]}: {t}" for x in refl for t, claves in temas.items()
                if not any(c in x["texto"].lower() for c in claves)]
    r.append(_req("C4.3", "C4", "Cada reflexión responde tareas, retos y contribución al equipo", not sin_tema,
                  "las tres preguntas en las cuatro reflexiones" if not sin_tema else "; ".join(sin_tema), "/reflexiones"))

    # C5 · Conclusión
    wc = consultas.palabras(p["conclusion"])
    r.append(_req("C5.1", "C5", "Conclusión grupal de 200 palabras como máximo", wc <= 200, f"{wc} palabras", "/conclusion"))

    # Formato del documento
    f = _formato_docx()
    if f:
        r.append(_req("F.1", "Formato", "Calibri 12 e interlineado 1,5",
                      f["fuente"] == "Calibri" and f["puntos"] == 12 and abs(f["interlineado"] - 1.5) < 0.01,
                      f"{f['fuente']} {f['puntos']:g} pt · interlineado {f['interlineado']:g} ({f['archivo']})", "/entregables"))
    total = consultas.palabras(desc) + wc + sum(x["palabras"] for x in refl)
    r.append(_req("F.2", "Formato", "Extensión máxima de 500 palabras (1 página)", total <= 500,
                  f"Solo descripción, reflexiones y conclusión suman {total} palabras: el límite contradice lo obligatorio "
                  "(cuatro reflexiones de 150–200). Pendiente de confirmar con la profesora en el foro.", "/cumplimiento", aviso=total > 500))
    return r
