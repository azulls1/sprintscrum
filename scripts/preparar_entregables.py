# -*- coding: utf-8 -*-
"""Arma la carpeta entregables/ (lo que se hornea en la imagen del backend) y su catálogo:
- el .docx y el .pdf entregados (../entregable/), y el ZIP para Moodle con un LEEME que mapea la rúbrica;
- los datos del sprint en CSV, generados de ../fuente/contenido.py;
- las figuras y diagramas, las especificaciones (spec-kit) y los artefactos BMAD.
Escribe entregables/catalogo.sql (upsert de SprintScrum_entregables) que deploy.sh aplica en Supabase maestría.

Uso:  python3 scripts/preparar_entregables.py
"""
import csv
import hashlib
import importlib.util
import io
import shutil
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ACTIVIDAD = RAIZ.parent
DESTINO = RAIZ / "entregables"
NOMBRE_DOC = "Actividad1_Grupal_Equipo2073F"
URL = "https://sprintscrum.iagentek.com.mx"

sys.path.insert(0, str(Path(__file__).parent))
import plan_sprint as plan  # noqa: E402


def contenido():
    spec = importlib.util.spec_from_file_location("contenido", plan.ruta_contenido())
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def csv_texto(encabezado: list[str], filas: list[tuple]) -> str:
    b = io.StringIO()
    w = csv.writer(b)
    w.writerow(encabezado)
    w.writerows(filas)
    return "﻿" + b.getvalue()  # BOM: Excel abre los acentos bien


def leeme(c) -> str:
    return f"""# Actividad 1 grupal — Planeación de un sprint en Scrum

**Equipo 2073 F** — {' · '.join(c.PORTADA['integrantes'])}
**Asignatura:** {c.PORTADA['asignatura']} · {c.PORTADA['programa']}
**Profesora:** {c.PORTADA['profesora']}

## Archivos

| Archivo | Qué es |
|---|---|
| `{NOMBRE_DOC}.docx` | El documento de la actividad (Calibri 12, interlineado 1,5) |
| `{NOMBRE_DOC}.pdf` | El mismo documento en PDF |

## Dónde está cada criterio de la rúbrica

| Criterio | Apartado del documento | En el portal |
|---|---|---|
| 1. Descripción del proyecto | 1. Descripción del proyecto | {URL}/proyecto |
| — Asignación de roles | 2. Roles Scrum | {URL}/equipo |
| 2. Product backlog | 3. Product backlog ({len(c.PRODUCT_BACKLOG)} historias) | {URL}/product-backlog |
| 3. Sprint backlog | 4. Sprint backlog ({len(c.SPRINT_BACKLOG)} tareas, {sum(t[3] for t in c.SPRINT_BACKLOG)} h) | {URL}/sprint-backlog |
| 4. Reflexión individual | 5. Reflexiones ({len(c.REFLEXIONES)}) | {URL}/reflexiones |
| 5. Conclusión grupal | 6. Conclusión | {URL}/conclusion |

Portal interactivo con el tablero del sprint, la simulación del sprint y la comprobación de cada requisito:
**{URL}** · código: https://github.com/azulls1/sprintscrum
"""


def main() -> None:
    c = contenido()
    catalogo: list[tuple] = []  # (ruta, nombre, tipo, criterio, detalle)

    def agregar(origen: Path | None, ruta: str, nombre: str, tipo: str, criterio: str, detalle: str, texto: str | None = None):
        d = DESTINO / ruta
        d.parent.mkdir(parents=True, exist_ok=True)
        if texto is not None:
            d.write_text(texto, encoding="utf-8")
        else:
            shutil.copy2(origen, d)
        catalogo.append((ruta, nombre, tipo, criterio, detalle))

    # 1) Documento entregado y paquete para Moodle
    doc = ACTIVIDAD / "entregable"
    if not doc.exists():  # clon del repositorio sin la carpeta de la actividad: se reutiliza lo ya preparado
        print("Sin ../entregable: se conserva entregables/ tal como está en el repositorio")
        return
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir()
    agregar(doc / f"{NOMBRE_DOC}.docx", f"documento/{NOMBRE_DOC}.docx", "Documento de la actividad (Word)", "Documento",
            "Entrega", "Los seis apartados que pide el enunciado · Calibri 12 · interlineado 1,5")
    agregar(doc / f"{NOMBRE_DOC}.pdf", f"documento/{NOMBRE_DOC}.pdf", "Documento de la actividad (PDF)", "PDF",
            "Entrega", "El mismo documento en PDF, listo para leer")
    zip_ruta = DESTINO / "documento" / f"{NOMBRE_DOC}_Moodle.zip"
    # ZIP determinista: misma fecha interna (la del .docx) → mismo SHA-256 si el contenido no cambió
    import time
    fecha = time.localtime((doc / f"{NOMBRE_DOC}.docx").stat().st_mtime)[:6]
    with zipfile.ZipFile(zip_ruta, "w", zipfile.ZIP_DEFLATED) as z:
        for nombre, datos in [*((f"{NOMBRE_DOC}.{ext}", (doc / f"{NOMBRE_DOC}.{ext}").read_bytes()) for ext in ("docx", "pdf")),
                              ("LEEME.md", leeme(c).encode())]:
            info = zipfile.ZipInfo(f"{NOMBRE_DOC}/{nombre}", date_time=fecha)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, datos)
    catalogo.append((f"documento/{NOMBRE_DOC}_Moodle.zip", "Entrega para Moodle", "Paquete", "Entrega",
                     "Documento .docx + .pdf y un LEEME que ubica cada criterio de la rúbrica"))

    # 2) Datos del sprint (CSV) desde la misma fuente
    agregar(None, "datos/product_backlog.csv", "Product backlog", "Datos", "C2", "Historias con prioridad y puntos",
            csv_texto(["id", "historia", "prioridad", "puntos", "en_sprint"],
                      [(h, t, p, pts, h in {x[0] for x in c.SPRINT_BACKLOG}) for h, t, p, pts in c.PRODUCT_BACKLOG]))
    agregar(None, "datos/sprint_backlog.csv", "Sprint backlog", "Datos", "C3",
            "Tareas con responsable, horas, días del plan y dependencias",
            csv_texto(["n", "historia", "tarea", "responsable", "horas", "dia_inicio", "dia_fin", "tipo", "depende_de"],
                      [(n, h, t, r, hs, *plan.CALENDARIO_TAREAS[n - 1], " ".join(map(str, plan.DEPENDENCIAS[n])))
                       for n, (h, t, r, hs) in enumerate(c.SPRINT_BACKLOG, 1)]))
    agregar(None, "datos/roles.csv", "Roles Scrum", "Datos", "Roles", "Integrante, rol y responsabilidad",
            csv_texto(["rol", "integrante", "responsabilidad"], c.ROLES))

    # 3) Figuras
    for f in sorted((RAIZ / "docs/figuras/diagramas").glob("*.png")):
        agregar(f, f"figuras/{f.name}", f.stem.replace("-", " ").capitalize(), "Figura", "Figuras", "Diagrama · PNG 2x")
    for f in sorted((RAIZ / "docs/figuras/anatomia").glob("*.png")):
        agregar(f, f"figuras/{f.name}", "Anatomía del sprint", "Figura", "Figuras", "Figura isométrica interactiva")

    # 4) Metodología: spec-kit y BMAD
    for f in sorted((RAIZ / "specs").rglob("*.md")):
        rel = f.relative_to(RAIZ)
        agregar(f, f"especificaciones/{rel}", rel.name, "Especificación", "spec-kit", str(rel.parent))
    constitucion = RAIZ / ".specify/memory/constitution.md"
    if constitucion.exists():
        agregar(constitucion, "especificaciones/constitution.md", "constitution.md", "Especificación", "spec-kit",
                "Principios del proyecto")
    for f in sorted([*(RAIZ / "_bmad-output").rglob("*.md"), *(RAIZ / "_bmad-output").rglob("*.yaml")]):
        rel = f.relative_to(RAIZ / "_bmad-output")
        agregar(f, f"bmad/{rel}", rel.name, "BMAD", "BMAD", str(rel.parent))

    # Catálogo con SHA-256
    filas = []
    for orden, (ruta, nombre, tipo, criterio, detalle) in enumerate(catalogo):
        datos = (DESTINO / ruta).read_bytes()
        filas.append((ruta, nombre, tipo, criterio, detalle, len(datos), hashlib.sha256(datos).hexdigest(), orden))

    def q(v):
        return str(v) if isinstance(v, int) else "'" + str(v).replace("'", "''") + "'"

    sql = ["-- GENERADO por scripts/preparar_entregables.py — catálogo de entregables", "begin;",
           'delete from public."SprintScrum_entregables";',
           'insert into public."SprintScrum_entregables" (ruta, nombre, tipo, criterio, detalle, bytes, sha256, orden) values',
           ",\n".join("    (" + ", ".join(q(v) for v in f) + ")" for f in filas) + ";", "commit;", ""]
    (RAIZ / "db" / "catalogo_entregables.sql").write_text("\n".join(sql), encoding="utf-8")
    total = sum(f[5] for f in filas)
    print(f"✓ entregables/: {len(filas)} archivos · {total / 1e6:.1f} MB · catálogo en db/catalogo_entregables.sql")


if __name__ == "__main__":
    main()
