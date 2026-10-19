# -*- coding: utf-8 -*-
"""Genera db/migraciones/003_contenido.sql a partir de ../fuente/contenido.py (la misma fuente del .docx y el .pdf
entregados) y de scripts/plan_sprint.py. Así el portal nunca dice algo distinto del documento.

Uso:  python3 scripts/generar_semilla.py
"""
import importlib.util
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ / "db" / "migraciones" / "003_contenido.sql"

sys.path.insert(0, str(Path(__file__).parent))
import plan_sprint as plan  # noqa: E402

FUENTE = plan.ruta_contenido()


def cargar_contenido():
    spec = importlib.util.spec_from_file_location("contenido", FUENTE)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


class ArregloEnteros(tuple):
    """Arreglo de Postgres smallint[] (las listas normales se escriben como jsonb)."""


def q(v) -> str:
    """Literal SQL seguro (dollar-quoting no hace falta: se duplican las comillas simples)."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, ArregloEnteros):
        return "'{" + ",".join(map(str, v)) + "}'::smallint[]"
    if isinstance(v, (list, dict)):
        return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def valores(filas) -> str:
    return ",\n".join("    (" + ", ".join(q(v) for v in f) + ")" for f in filas)


def main() -> None:
    c = cargar_contenido()
    assert len(plan.CALENDARIO_TAREAS) == len(c.SPRINT_BACKLOG), "plan_sprint no cubre todas las tareas"
    assert len(plan.ROL_SCRUM) == len(c.ROLES)

    integrantes = []
    corto_a_id = {}
    for i, (rol, nombre, resp) in enumerate(c.ROLES, start=1):
        partes = nombre.split()
        # «Adonai Samael Hernández Mata» → «Adonai Hernández»: primer nombre + primer apellido (penúltima palabra)
        corto = f"{partes[0]} {partes[-2]}"
        corto_a_id[corto] = i
        integrantes.append((i, nombre, corto, rol, plan.ROL_SCRUM[i - 1], resp, i))
    for _, _, resp, _ in c.SPRINT_BACKLOG:
        assert resp in corto_a_id, f"Responsable desconocido: {resp}"

    en_sprint = {h for h, *_ in c.SPRINT_BACKLOG}
    historias = [(hid, n, texto, prio, pts, hid in en_sprint, plan.CRITERIOS.get(hid, []))
                 for n, (hid, texto, prio, pts) in enumerate(c.PRODUCT_BACKLOG, start=1)]

    tareas = [(n, hid, nombre, corto_a_id[resp], horas, *plan.CALENDARIO_TAREAS[n - 1], ArregloEnteros(plan.DEPENDENCIAS[n]))
              for n, (hid, nombre, resp, horas) in enumerate(c.SPRINT_BACKLOG, start=1)]

    eventos = [(n, nombre, dia, hora, mins, corto_a_id[fac], desc)
               for n, (nombre, dia, hora, mins, fac, desc) in enumerate(plan.EVENTOS, start=1)]

    nombre_a_id = {nombre: i for i, nombre, *_ in integrantes}
    reflexiones = []
    for titulo, texto in c.REFLEXIONES:
        nombre = titulo.split(" — ")[0].strip()
        reflexiones.append((nombre_a_id[nombre], titulo, texto))

    d = c.DESCRIPCION
    proyecto = ("agendafacil", d[0].split(",")[0].replace("Empresa: ", ""), "Clínica Dental Sonrisa Plena", "AgendaFácil",
                d[2].replace("Objetivo del producto: ", ""), d[3].split(": ", 1)[1], d, c.PORTADA, 5,
                c.NOTA_BACKLOG, c.NOTA_SPRINT, c.CONCLUSION)

    sql = f"""-- ════════════════════════════════════════════════════════════════════════════
-- SprintScrum · contenido. GENERADO por scripts/generar_semilla.py desde fuente/contenido.py: no editar a mano.
-- Idempotente: reemplaza el contenido académico; no toca simulaciones, entregables ni paquetes.
-- ════════════════════════════════════════════════════════════════════════════
begin;

delete from public."SprintScrum_reflexiones";
delete from public."SprintScrum_eventos";
delete from public."SprintScrum_tareas";
delete from public."SprintScrum_historias";
delete from public."SprintScrum_integrantes";
delete from public."SprintScrum_proyecto";

insert into public."SprintScrum_proyecto"
    (id, empresa, cliente, producto, objetivo_producto, objetivo_sprint, descripcion, portada, duracion_dias,
     nota_backlog, nota_sprint, conclusion)
values
{valores([proyecto])};

insert into public."SprintScrum_integrantes" (id, nombre, nombre_corto, rol, rol_scrum, responsabilidad, orden)
values
{valores(integrantes)};

insert into public."SprintScrum_historias" (id, orden, texto, prioridad, puntos, en_sprint, criterios)
values
{valores(historias)};

insert into public."SprintScrum_tareas" (id, historia_id, nombre, responsable_id, horas, dia_inicio, dia_fin, tipo, depende_de)
values
{valores(tareas)};

insert into public."SprintScrum_eventos" (id, nombre, dia, hora, duracion_min, facilitador_id, descripcion)
values
{valores(eventos)};

insert into public."SprintScrum_reflexiones" (integrante_id, titulo, texto)
values
{valores(reflexiones)};

commit;
"""
    DESTINO.write_text(sql, encoding="utf-8")
    print(f"✓ {DESTINO.relative_to(RAIZ)}: {len(integrantes)} integrantes · {len(historias)} historias · "
          f"{len(tareas)} tareas ({sum(t[4] for t in tareas)} h) · {len(eventos)} eventos · {len(reflexiones)} reflexiones")


if __name__ == "__main__":
    main()
