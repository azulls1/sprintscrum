"""Consultas SQL a las tablas SprintScrum_* de Supabase maestría."""
import re

from .db import todos, uno

DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"]


def palabras(texto: str) -> int:
    """Mismo conteo que fuente/construir.py, que valida los límites del documento entregado."""
    return len(re.findall(r"\b[\wÁÉÍÓÚÑáéíóúñü%-]+\b", texto))


# ── Contenido académico ─────────────────────────────────────────────────────
def proyecto() -> dict | None:
    return uno('select * from "SprintScrum_proyecto" limit 1')


def integrantes() -> list[dict]:
    return todos('select * from "SprintScrum_integrantes" order by orden')


def historias() -> list[dict]:
    return todos('select * from "SprintScrum_historias" order by orden')


def tareas() -> list[dict]:
    filas = todos('''
        select t.id, t.historia_id, t.nombre, t.responsable_id, i.nombre_corto as responsable, t.horas::float as horas,
               t.dia_inicio, t.dia_fin, t.tipo, t.depende_de
        from "SprintScrum_tareas" t join "SprintScrum_integrantes" i on i.id = t.responsable_id
        order by t.id''')
    for f in filas:
        f["depende_de"] = list(f["depende_de"] or [])
    return filas


def eventos() -> list[dict]:
    filas = todos('''
        select e.id, e.nombre, e.dia, to_char(e.hora, 'HH24:MI') as hora, e.duracion_min, e.descripcion,
               i.nombre_corto as facilitador
        from "SprintScrum_eventos" e join "SprintScrum_integrantes" i on i.id = e.facilitador_id
        order by e.dia, e.hora''')
    for f in filas:
        f["dia_nombre"] = DIAS[f["dia"] - 1]
    return filas


def reflexiones() -> list[dict]:
    filas = todos('''
        select r.integrante_id, r.titulo, r.texto, i.nombre, i.rol, i.rol_scrum
        from "SprintScrum_reflexiones" r join "SprintScrum_integrantes" i on i.id = r.integrante_id
        order by i.orden''')
    for f in filas:
        f["palabras"] = palabras(f["texto"])
    return filas


# ── Derivados ───────────────────────────────────────────────────────────────
def carga_por_persona(ts: list[dict], gente: list[dict]) -> list[dict]:
    """Horas por persona y por día (las horas de una tarea de varios días se reparten por igual)."""
    r = []
    for p in gente:
        propias = [t for t in ts if t["responsable_id"] == p["id"]]
        por_dia = [0.0] * 5
        for t in propias:
            n = t["dia_fin"] - t["dia_inicio"] + 1
            for d in range(t["dia_inicio"], t["dia_fin"] + 1):
                por_dia[d - 1] += t["horas"] / n
        r.append({"integrante_id": p["id"], "nombre": p["nombre_corto"], "rol": p["rol"],
                  "horas": sum(t["horas"] for t in propias), "tareas": len(propias),
                  "por_dia": [round(h, 2) for h in por_dia]})
    return r


def burndown_plan(ts: list[dict]) -> list[dict]:
    """Horas estimadas pendientes al cierre de cada día según el calendario del plan, frente a la línea ideal."""
    total = sum(t["horas"] for t in ts)
    hecho = [0.0] * 6
    for t in ts:
        n = t["dia_fin"] - t["dia_inicio"] + 1
        for d in range(t["dia_inicio"], t["dia_fin"] + 1):
            hecho[d] += t["horas"] / n
    puntos, acumulado = [], 0.0
    for k in range(6):
        acumulado += hecho[k]
        puntos.append({"dia": "Inicio" if k == 0 else DIAS[k - 1], "ideal": round(total * (1 - k / 5), 2),
                       "plan": round(total - acumulado, 2)})
    return puntos


def resumen() -> dict:
    p = proyecto()
    hs, ts, gente = historias(), tareas(), integrantes()
    sprint = [h for h in hs if h["en_sprint"]]
    return {
        "proyecto": p,
        "kpis": {
            "historias": len(hs), "puntos_backlog": sum(h["puntos"] for h in hs),
            "historias_sprint": len(sprint), "puntos_sprint": sum(h["puntos"] for h in sprint),
            "tareas": len(ts), "horas": sum(t["horas"] for t in ts), "integrantes": len(gente),
            "dias": p["duracion_dias"] if p else 5, "eventos": len(eventos()),
        },
        "integrantes": gente,
    }


def sprint() -> dict:
    hs, ts, gente = historias(), tareas(), integrantes()
    en_sprint = [h for h in hs if h["en_sprint"]]
    for h in en_sprint:
        propias = [t for t in ts if t["historia_id"] == h["id"]]
        h["horas"] = sum(t["horas"] for t in propias)
        h["n_tareas"] = len(propias)
    return {"historias": en_sprint, "tareas": ts, "eventos": eventos(), "carga": carga_por_persona(ts, gente),
            "burndown": burndown_plan(ts), "dias": DIAS, "nota": (proyecto() or {}).get("nota_sprint", "")}


# ── Simulaciones ────────────────────────────────────────────────────────────
def crear_simulacion(parametros: dict) -> dict:
    from psycopg.types.json import Jsonb
    return uno('insert into "SprintScrum_simulaciones" (parametros) values (%s) returning id::text, estado',
               (Jsonb(parametros),))


def asignar_tarea_simulacion(sid: str, task_id: str) -> None:
    uno('update "SprintScrum_simulaciones" set task_id = %s where id = %s returning id', (task_id, sid))


def completar_simulacion(sid: str, resultado: dict) -> None:
    from psycopg.types.json import Jsonb
    uno('''update "SprintScrum_simulaciones" set estado = 'completada', resultado = %s, duracion_ms = %s,
           completado_en = now() where id = %s returning id''', (Jsonb(resultado), resultado["duracion_ms"], sid))


def fallar_simulacion(sid: str, error: str) -> None:
    uno('''update "SprintScrum_simulaciones" set estado = 'error', error = %s, completado_en = now()
           where id = %s returning id''', (error, sid))


def simulacion(sid: str) -> dict | None:
    return uno('''select id::text, estado, parametros, resultado, error, duracion_ms, creado_en, completado_en
                  from "SprintScrum_simulaciones" where id = %s''', (sid,))


def ultima_simulacion() -> dict | None:
    return uno('''select id::text, estado, parametros, resultado, error, duracion_ms, creado_en, completado_en
                  from "SprintScrum_simulaciones" where estado = 'completada' order by creado_en desc limit 1''')


def total_simulaciones() -> int:
    return uno('''select count(*) as n from "SprintScrum_simulaciones" where estado = 'completada' ''')["n"]


def purgar_simulaciones(conservar: int = 200) -> None:
    uno('''with viejas as (select id from "SprintScrum_simulaciones" order by creado_en desc offset %s)
           delete from "SprintScrum_simulaciones" where id in (select id from viejas) returning 1''', (conservar,))


# ── Entregables y paquetes ──────────────────────────────────────────────────
def entregables() -> list[dict]:
    return todos('select ruta, nombre, tipo, criterio, detalle, bytes, sha256 from "SprintScrum_entregables" order by orden, ruta')


def entregable_por_ruta(ruta: str) -> dict | None:
    return uno('select ruta from "SprintScrum_entregables" where ruta = %s', (ruta,))


def crear_paquete() -> dict:
    return uno('insert into "SprintScrum_paquetes" default values returning id::text, estado')


def asignar_tarea_paquete(pid: str, task_id: str) -> None:
    uno('update "SprintScrum_paquetes" set task_id = %s where id = %s returning id', (task_id, pid))


def completar_paquete(pid: str, archivo: str, n: int, bytes_: int, sha: str) -> None:
    uno('''update "SprintScrum_paquetes" set estado = 'completada', archivo = %s, n_archivos = %s, bytes = %s,
           sha256 = %s, completado_en = now() where id = %s returning id''', (archivo, n, bytes_, sha, pid))


def fallar_paquete(pid: str, error: str) -> None:
    uno('''update "SprintScrum_paquetes" set estado = 'error', error = %s, completado_en = now()
           where id = %s returning id''', (error, pid))


_COLS_PAQUETE = 'id::text, estado, archivo, n_archivos, bytes, sha256, error, creado_en, completado_en'


def paquete(pid: str) -> dict | None:
    return uno(f'select {_COLS_PAQUETE} from "SprintScrum_paquetes" where id = %s', (pid,))


def paquete_en_curso() -> dict | None:
    return uno(f'''select {_COLS_PAQUETE} from "SprintScrum_paquetes"
                   where estado = 'pendiente' and creado_en > now() - interval '2 minutes'
                   order by creado_en desc limit 1''')


def ultimo_paquete() -> dict | None:
    return uno(f'''select {_COLS_PAQUETE} from "SprintScrum_paquetes" where estado = 'completada'
                   order by completado_en desc limit 1''')


def paquetes_recientes(n: int = 5) -> list[dict]:
    return todos(f'select {_COLS_PAQUETE} from "SprintScrum_paquetes" order by creado_en desc limit %s', (n,))


def purgar_paquetes(conservar: int) -> None:
    uno('''with viejos as (select id from "SprintScrum_paquetes" order by creado_en desc offset %s)
           delete from "SprintScrum_paquetes" where id in (select id from viejos) returning 1''', (conservar,))
