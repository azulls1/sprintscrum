<!--
Sync Impact Report
- Versión: 1.0.1 → 1.0.2 (PATCH) — US7: movimiento anulado con `prefers-reduced-motion` (IV) e iframes de
  figuras solo del mismo origen bajo `/figuras/` (III)
- Versión: 1.0.0 → 1.0.1 (PATCH) — redacción alineada con el código implementado: carga de contenido con
  `scripts/generar_semilla.py`, cabeceras repartidas entre Traefik y nginx, permisos reales del rol de la app
- Versión anterior: (plantilla) → 1.0.0 — ratificación inicial
- Principios añadidos: I–VII (todos nuevos)
- Secciones añadidas: «Dos capas de Scrum», «Restricciones técnicas», «Flujo de trabajo», «Gobernanza»
- Plantillas revisadas: plan-template.md ✅ (Constitution Check usa I–VII) · spec-template.md ✅ · tasks-template.md ✅
- Pendientes: ninguno
-->

# Constitución de SprintScrum · AgendaFácil

Portal web que presenta, de forma interactiva y verificable, la Actividad 1 grupal de *Metodología de
Diseño y Gestión de Proyectos* (UNIR México, Maestría en Inteligencia Artificial, Equipo 2073 F). Documento de diseño de
referencia: `docs/DISENO.md`.

## Dos capas de Scrum (regla de lectura)

Este repositorio contiene **dos niveles de Scrum que nunca se mezclan**:

| Capa | Qué es | Estado | Identificadores |
|---|---|---|---|
| **A · AgendaFácil** (producto académico) | Sprint de una semana de Nexo Digital Solutions para la Clínica Dental Sonrisa Plena. Es el **contenido** de la actividad. | **Planeado, no ejecutado** (lo pide el enunciado) | `HU-01…HU-08`, tareas `1…15`, días `1 = lunes … 5 = viernes` |
| **B · Portal SprintScrum** (este software) | La aplicación web que **presenta** la capa A. Se construye con spec-kit + BMAD. | Implementado y desplegado | `US1…US6`, `FR-xxx`, `SC-xxx`, `T0xx`, épicas `N.M` |

Ningún artefacto de la capa B (spec, plan, tareas, épicas, `sprint-status.yaml`) describe trabajo de
AgendaFácil, y el portal nunca presenta la capa A como si se hubiera ejecutado: la simulación es una
**proyección** del plan, no un registro de avance.

## Principios

### I. Contenido fiel al documento entregado (fuente única)

- Todo texto académico (descripción, roles, product backlog, sprint backlog, reflexiones, conclusión)
  sale **solo** de `../fuente/contenido.py`, el mismo archivo que genera el .docx y el .pdf entregados.
- El portal no reescribe, resume ni «mejora» ese texto. Un cambio de contenido se hace en
  `contenido.py`, se regenera el documento y se vuelve a cargar la base con `scripts/generar_semilla.py`
  (que produce `db/migraciones/003_contenido.sql`).
- Lo que el portal agrega y no está en el documento (calendario por día, dependencias entre tareas,
  criterios de aceptación, eventos con hora, simulación; definidos en `scripts/plan_sprint.py`) se rotula en la interfaz como **complemento del portal**.

### II. Datos verificables: calculados, no escritos a mano

- Totales, conteos de palabras, puntos, horas por persona, carga, burndown y cumplimiento de la rúbrica
  se **calculan** en la API a partir de las tablas; el frontend no contiene cifras fijas.
- El conteo de palabras usa el mismo criterio que `fuente/construir.py`; si difieren, manda el script.
- La página Cumplimiento compara cada requisito del enunciado y la rúbrica (17 comprobaciones) contra
  los datos y el .docx entregado, y muestra la evidencia medida y el resultado (cumple, aviso o no cumple).

### III. Seguridad por defecto

- RLS **habilitado y forzado** en todas las tablas `SprintScrum_*`; `anon` y `authenticated` sin
  privilegios; una sola política por tabla para el rol `sprintscrum_app`. El contenido lo escriben solo
  las migraciones del despliegue; la API únicamente lo lee y solo escribe simulaciones y paquetes.
- Credenciales solo como **secretos de Swarm** (`sprintscrum_db_dsn_v1`); nunca en git, imágenes ni
  variables de entorno visibles en Portainer.
- Traefik aplica HSTS, cabeceras de la API (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`), límite de tasa por IP (más estricto en los `POST`) y límite de cuerpo de 8 KB;
  nginx añade al SPA la CSP (`frame-ancestors 'none'`), `Permissions-Policy` y el resto de cabeceras;
  solo `/figuras/` admite `frame-ancestors 'self'` para incrustar figuras del mismo origen, con ruta saneada.
- Toda escritura exige `X-Requested-With: portal-sprintscrum`; parámetros validados con rangos
  cerrados; contenedores sin root; sin datos personales de visitantes (no se guardan IP).

### IV. Accesibilidad y Forest Design System

- Identidad Forest DS de iAgentek (paleta y tipografías de `DISENO.md` §7), modo claro.
- WCAG 2.1 AA: contraste ≥ 4.5:1 en texto, foco visible, navegación por teclado, `lang="es-MX"`,
  tablas con encabezados, gráficas con alternativa textual o tabla equivalente.
- Cada vista tiene estados de carga, vacío y error con reintento. Diseño usable desde 360 px.
- Toda animación (View Transitions, aparición al desplazar, confeti) se desactiva con
  `prefers-reduced-motion: reduce` y el contenido nunca depende de ella.

### V. Despliegue reproducible

- Las imágenes se etiquetan con el **sha corto del commit** (`:<sha>`); prohibido `:latest` en el stack.
- `deploy/deploy.sh` es la única vía de despliegue y verifica: imagen en servicio, réplicas 1/1,
  `/api/health` en verde y respuesta HTTPS del dominio.
- Migraciones SQL numeradas e idempotentes en `db/migraciones/`.

### VI. Español en toda la interfaz

- UI, mensajes de error de la API, rutas del portal, nombres de tablas y columnas, y documentación en
  español de México. Términos de Scrum consagrados (*product owner*, *sprint backlog*, *daily*…) se
  mantienen como en el temario.

### VII. Simplicidad

- Cuatro servicios (`web`, `api`, `worker`, `redis`) y nada más. Sin autenticación de usuarios: el
  portal es de lectura pública; las únicas escrituras son simulaciones y paquetes ZIP.

## Restricciones técnicas

Angular 22 + Tailwind CSS 4 · Python 3.11 + FastAPI + psycopg 3 · Celery 5.6 + Redis 7 ·
PostgreSQL 15 de Supabase maestría (`supabase-maestria_db`, esquema `public`, prefijo `SprintScrum_`) ·
Docker Swarm + Traefik v3 en el VPS iaGentek, red `iagenteknet`, dominio
`sprintscrum.iagentek.com.mx`, repositorio `github.com/azulls1/sprintscrum`.

## Flujo de trabajo

1. GitHub spec-kit (desarrollo guiado por especificaciones): constitución → `specs/001-portal-sprintscrum/spec.md` → `plan.md` → `tasks.md`.
2. Método BMAD v6 de planeación y entrega ágil: `_bmad-output/planning-artifacts/` (brief, PRD, arquitectura, épicas) referencia a spec-kit
   por id; no repite requisitos.
3. Cada tarea cerrada se marca en `tasks.md` y su historia en `sprint-status.yaml`.
4. Antes de desplegar: `ng build` sin errores, pruebas del backend (`pytest`) en verde y la página
   Cumplimiento sin requisitos en rojo.

## Gobernanza

Esta constitución prevalece sobre cualquier otro documento del portal. Una enmienda exige: cambio en
este archivo, nueva versión semántica (MAJOR = principio eliminado o redefinido, MINOR = principio o
sección nueva, PATCH = redacción) y revisión del *Constitution Check* de `plan.md`. Toda revisión de
código verifica los principios I–VII.

**Version**: 1.0.2 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
