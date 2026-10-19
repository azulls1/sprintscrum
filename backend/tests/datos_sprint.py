"""Datos del sprint para las pruebas, leídos de la misma fuente que la semilla de la base."""
import importlib.util
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "scripts"))
import plan_sprint  # noqa: E402

_spec = importlib.util.spec_from_file_location("contenido", plan_sprint.ruta_contenido())
contenido = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(contenido)

INTEGRANTES = [{"id": i, "nombre_corto": f"{n.split()[0]} {n.split()[-2]}"} for i, (_, n, _) in enumerate(contenido.ROLES, 1)]
_ID = {x["nombre_corto"]: x["id"] for x in INTEGRANTES}
_EN_SPRINT = {h for h, *_ in contenido.SPRINT_BACKLOG}
HISTORIAS = [{"id": h, "puntos": p, "en_sprint": h in _EN_SPRINT} for h, _, _, p in contenido.PRODUCT_BACKLOG]
TAREAS = [{"id": n, "historia_id": h, "nombre": nom, "responsable_id": _ID[r], "horas": hs,
           "dia_inicio": plan_sprint.CALENDARIO_TAREAS[n - 1][0], "dia_fin": plan_sprint.CALENDARIO_TAREAS[n - 1][1],
           "tipo": plan_sprint.CALENDARIO_TAREAS[n - 1][2], "depende_de": plan_sprint.DEPENDENCIAS[n]}
          for n, (h, nom, r, hs) in enumerate(contenido.SPRINT_BACKLOG, 1)]
