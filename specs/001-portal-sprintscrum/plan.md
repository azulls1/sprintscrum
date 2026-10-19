# Implementation Plan: Portal SprintScrum · AgendaFácil

**Branch**: `001-portal-sprintscrum` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-portal-sprintscrum/spec.md`

## Summary

Portal de lectura pública que presenta la planeación (no ejecutada) del sprint de AgendaFácil.
`scripts/generar_semilla.py` convierte `fuente/contenido.py` y el plan de `scripts/plan_sprint.py`
(calendario, dependencias explícitas, eventos y criterios) en `db/migraciones/003_contenido.sql`, que
llena 9 tablas `SprintScrum_*` en Supabase maestría; una API FastAPI calcula todos los totales, el
cumplimiento de la rúbrica (17 comprobaciones) y el burndown; un worker Celery (broker Redis) corre la
simulación Monte Carlo y arma el ZIP de entregables; un frontend Angular 22 + Tailwind 4 con Forest DS muestra 11 páginas. Todo en Docker
Swarm detrás de Traefik en `sprintscrum.iagentek.com.mx`.

## Technical Context

**Language/Version**: Python 3.11 (API, worker, scripts) · TypeScript 5.x (Angular 22)

**Primary Dependencies**: FastAPI, Uvicorn, psycopg 3 + `psycopg_pool`, Pydantic 2, Celery 5.6, `redis`
(la simulación usa solo la biblioteca estándar) · Angular 22 (standalone, signals, `httpResource`), Tailwind CSS 4

**Storage**: PostgreSQL 15 de Supabase maestría (servicio `supabase-maestria_db`), esquema `public`,
prefijo `SprintScrum_`, rol `sprintscrum_app`, DSN en el secreto Swarm `sprintscrum_db_dsn_v1`. Redis 7
solo como broker y backend de resultados de Celery, direccionado como `sprintscrum_redis` (en una red overlay
compartida el nombre corto `redis` puede resolver al servicio de otro stack). Volumen `sprintscrum_paquetes` compartido entre
`api` y `worker` para los ZIP.

**Testing**: `pytest` (`backend/tests/test_simulacion.py`: límites de capacidad, plan determinista,
dependencias, reproducibilidad con semilla fija y persona crítica) · `ng build` · prueba de humo en
navegador y verificación de `/api/health` en `deploy.sh`.

**Target Platform**: VPS iaGentek (Linux x86-64, Docker Swarm de un nodo), Traefik v3 + Let's Encrypt,
red `iagenteknet`, Portainer para operación.

**Project Type**: web-service + SPA + worker de cola.

**Performance Goals**: simulación de 2000 iteraciones < 5 s de punta a punta (SC-004); lecturas < 100 ms
en la API; primera carga del SPA < 2 s en 4G (SC-005).

**Constraints**: sin autenticación de usuarios; contenido de solo lectura para el rol de la app;
límite de cuerpo 8 KB (8192 bytes); `api` y `worker` ≤ 384 MiB, `worker` con concurrencia 2.

**Scale/Scope**: 9 tablas, ~40 filas de contenido, 11 páginas, uso de demostración (decenas de visitas).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo lo cumple el plan | Estado |
|---|---|---|
| Dos capas | Capa A solo en tablas y páginas; capa B solo en `specs/` y `_bmad-output/`; aviso «planeado, no ejecutado» (FR-009) | ✅ |
| I. Contenido fiel | `scripts/generar_semilla.py` importa `fuente/contenido.py`; ningún texto académico en el frontend; complementos rotulados (FR-008) | ✅ |
| II. Datos calculados | `backend/app/consultas.py` deriva KPI, carga, burndown y palabras; `cumplimiento.py`, los requisitos; el frontend solo pinta | ✅ |
| III. Seguridad | `002_seguridad.sql` (RLS forzado, revocar `anon`/`authenticated`, una política), secreto Swarm, middlewares Traefik, cabecera anti-CSRF, usuario no root | ✅ |
| IV. Accesibilidad / Forest DS | Tokens Forest en `styles.css` (`@theme`) sobre `src/forest/`, componentes con foco y ARIA, tablas alternativas a las gráficas | ✅ |
| V. Despliegue reproducible | `deploy/deploy.sh` regenera semilla y entregables, etiqueta `:<sha>` y verifica servicio, réplicas, imagen, salud y HTTPS | ✅ |
| VI. Español | UI, errores (`{"detail": "…"}`), rutas y esquema en español | ✅ |
| VII. Simplicidad | 4 servicios; Celery solo para lo que no debe bloquear la API | ✅ |

Re-evaluado tras la Fase 1: sin violaciones; no hace falta *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/001-portal-sprintscrum/
├── plan.md              # este archivo
├── research.md          # Fase 0: decisiones R1–R6
├── data-model.md        # Fase 1: 9 tablas SprintScrum_*
├── quickstart.md        # Fase 1: desarrollo local y despliegue
├── contracts/api.md     # Fase 1: contrato REST /api
├── checklists/requisitos.md
└── tasks.md             # Fase 2: T001–T062
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py            # FastAPI: todos los endpoints, CORS, dependencia anti-CSRF, PeticionSimulacion
│   ├── config.py          # lee el DSN de /run/secrets/sprintscrum_db_dsn (DATABASE_URL_FILE)
│   ├── db.py              # pool psycopg 3
│   ├── consultas.py       # SQL, KPI, carga, burndown del plan, palabras, simulaciones y paquetes
│   ├── cumplimiento.py    # 17 requisitos comprobados contra la base y el .docx
│   ├── simulacion.py      # Monte Carlo (biblioteca estándar, función pura)
│   ├── celery_app.py      # Celery + Redis
│   └── tareas.py          # sprintscrum.simular_sprint · sprintscrum.generar_entregable
├── tests/                 # test_simulacion.py + datos_sprint.py (pytest)
├── requirements.txt
└── Dockerfile

frontend/
├── src/app/
│   ├── paginas/           # resumen, proyecto, equipo, backlog, sprint, simulacion,
│   │                      # reflexiones, conclusion, cumplimiento, metodologia, entregables
│   ├── componentes/       # avatar, burndown, encabezado, estado, icono, kpi, paginador,
│   │                      # planning-poker, confeti, revelar, figura, diagrama (US7)
│   ├── core/              # modelos.ts, formato.ts, movimiento.ts (View Transitions + reduced motion)
│   ├── app.routes.ts      # 11 rutas con carga diferida
│   └── app.config.ts      # HttpClient + interceptor X-Requested-With + withViewTransitions
├── src/forest/            # Forest Design System
├── src/styles.css         # Tailwind 4 + tokens Forest DS
├── nginx.conf
└── Dockerfile

db/migraciones/
├── 001_esquema.sql        # 9 tablas, restricciones (tareas.depende_de smallint[])
├── 002_seguridad.sql      # rol, RLS forzado, políticas, grants (se reaplica al final)
└── 003_contenido.sql      # GENERADO por scripts/generar_semilla.py
db/catalogo_entregables.sql  # GENERADO por scripts/preparar_entregables.py

scripts/
├── plan_sprint.py         # calendario, DEPENDENCIAS, eventos, criterios; copia contenido.py a fuente/
├── generar_semilla.py     # contenido.py + plan_sprint.py → 003_contenido.sql
└── preparar_entregables.py  # entregables/ (docx, pdf, ZIP Moodle, CSV, figuras, specs, BMAD) + catálogo SHA-256

deploy/
├── stack.yml              # web, api, worker, redis; labels y middlewares Traefik; secreto; volumen
└── deploy.sh              # semilla + entregables, rsync, migraciones, build :<sha>, stack deploy, verificación

docs/
├── DISENO.md
└── figuras/               # anatomia/, anatomia-backlog/, anatomia-galton/ y diagramas/ (indice.json)
```

**Structure Decision**: aplicación web (backend + frontend) más migraciones, generadores y despliegue en
carpetas propias. El contenido académico vive fuera del repo del portal (`../fuente/`), se copia a
`fuente/` del repo (para que un clon se pueda reproducir) y entra solo por `scripts/generar_semilla.py`.

## Fases

- **Fase 0** — `research.md`: R1 simulación lognormal, R2 Celery + Redis, R3 Supabase maestría,
  R4 `httpResource`, R5 middlewares Traefik, R6 conteo de palabras, R7 movimiento y figuras (US7).
- **Fase 1** — `data-model.md`, `contracts/api.md`, `quickstart.md`.
- **Fase 2** — `tasks.md` por historia de usuario (US1–US7).

## Ampliación: experiencia interactiva (US7)

Añadida después del plan original (ver R7). Movimiento con la **View Transitions API** y CSS propio, sin
biblioteca de animación: `withViewTransitions()` en el router y `core/movimiento.ts` (`conTransicion()`)
para el Kanban. Toda animación se anula con `prefers-reduced-motion: reduce` (CSS y `sinMovimiento()`).
Las figuras isométricas interactivas se incrustan como iframes del mismo origen con ruta saneada a
`/figuras/<carpeta>/`; nginx sirve `/figuras/` con `frame-ancestors 'self'` y `X-Frame-Options:
SAMEORIGIN` (el resto del sitio sigue en `DENY`). El .docx usa Calibri 12 / 1,5 en todo el documento y el
.pdf lo exporta Microsoft Word (`../fuente/construir.py`).

## Complexity Tracking

Sin violaciones.
