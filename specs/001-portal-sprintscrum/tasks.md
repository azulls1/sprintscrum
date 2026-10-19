---

description: "Lista de tareas — Portal SprintScrum · AgendaFácil"
---

# Tasks: Portal SprintScrum · AgendaFácil

**Input**: `specs/001-portal-sprintscrum/` (plan, spec, research, data-model, contracts)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: simulación del backend (`backend/tests/test_simulacion.py`, pytest), `ng build`, prueba de humo y axe en navegador; el contenido y los cálculos se comprueban en `/api/cumplimiento`.

**Organization**: por historia de usuario del **portal** (US1–US6). Estas tareas son de la capa B; no
confundir con las 15 tareas del sprint de AgendaFácil (capa A), que son contenido.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ir en paralelo (archivos distintos, sin dependencias)
- **[Story]**: historia del portal (US1…US6)

## Path Conventions

`backend/app/`, `frontend/src/app/{paginas,componentes,core}/` (un archivo `.ts` por página o componente), `db/migraciones/`, `scripts/`, `deploy/`.

---

## Phase 1: Setup

- [X] T001 Inicializar repo git en `sprintscrum/` (rama `main`, remoto `github.com/azulls1/sprintscrum`) con `.gitignore` (`.venv/`, `node_modules/`, `dist/`, `*.env`)
- [X] T002 Preparar GitHub spec-kit (`.specify/`: constitución → spec → plan → tareas) y el método BMAD v6 (`_bmad/`: brief, PRD, arquitectura, épicas, estado del sprint)
- [X] T003 Redactar `docs/DISENO.md` como fuente única de diseño
- [X] T004 [P] Esqueleto de `backend/` (FastAPI, `requirements.txt`, `Dockerfile` no root)
- [X] T005 [P] Esqueleto de `frontend/` (Angular 22 standalone, Tailwind 4, `nginx.conf` sin privilegios en :8080, `Dockerfile`)
- [X] T006 [P] Forest DS en `frontend/src/forest/` y tokens (colores y tipografías Sora / DM Sans / JetBrains Mono) en `frontend/src/styles.css`

---

## Phase 2: Foundational

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

- [X] T007 `db/migraciones/001_esquema.sql`: 9 tablas `SprintScrum_*` con restricciones, incluida `tareas.depende_de smallint[]` (data-model.md)
- [X] T008 `db/migraciones/002_seguridad.sql`: rol `sprintscrum_app`, RLS habilitado y forzado, revocar `anon`/`authenticated`, una política por tabla, grants a `sprintscrum_app`
- [X] T009 Aplicar migraciones en `supabase-maestria_db` y verificar `\dt "SprintScrum_*"` y `relforcerowsecurity`
- [X] T010 `scripts/plan_sprint.py` (calendario, `DEPENDENCIAS`, eventos, criterios; copia `../fuente/contenido.py` a `fuente/`) y `scripts/generar_semilla.py` → `db/migraciones/003_contenido.sql`; `scripts/preparar_entregables.py` → `entregables/` y `db/catalogo_entregables.sql` con SHA-256; validaciones y transacción única
- [X] T011 [P] `backend/app/config.py` (DSN desde `DATABASE_URL` o el archivo `/run/secrets/sprintscrum_db_dsn`) y `backend/app/db.py` (pool psycopg 3)
- [X] T012 [P] `backend/app/main.py`: CORS, dependencia anti-CSRF `desde_el_portal` (`X-Requested-With`), errores `{"detail": …}` en español, sin `/docs` en producción
- [X] T013 [P] `backend/app/celery_app.py`: Celery 5.6 + Redis, `acks_late`, `time_limit=60`
- [X] T014 `GET /api/health` en `backend/app/main.py` con db y redis (FR-024)
- [X] T015 [P] `httpResource` en cada página, `frontend/src/app/core/modelos.ts` e interceptor de cabecera en `app.config.ts`
- [X] T016 [P] `frontend/src/app/componentes/estado.ts` (carga, vacío, error con reintento) y rótulos de «ampliación del portal» en las páginas (FR-008, FR-022)
- [X] T017 Shell del portal: navegación de 11 páginas, `lang="es-MX"`, enlace «saltar al contenido», menú móvil

**Checkpoint**: base cargada, API en pie, shell navegable.

---

## Phase 3: User Story 1 — Leer los cinco apartados calificables (P1) 🎯 MVP

**Goal**: C1–C5 y roles con el texto exacto del documento. **Independent Test**: comparación con el .pdf.

- [X] T018 [P] [US1] `backend/app/consultas.py`: `palabras()` con el criterio de `fuente/construir.py` (FR-011)
- [X] T019 [P] [US1] Verificar conteos contra `fuente/construir.py`: 125 · 172/164/167/166 · 183 (C1.1, C4.2, C5.1 en `/api/cumplimiento`)
- [X] T020 [US1] Rutas `GET /proyecto`, `/equipo`, `/backlog`, `/reflexiones`, `/conclusion` en `backend/app/main.py` (FR-002–FR-004, FR-007)
- [X] T021 [P] [US1] Página `paginas/proyecto.ts` (empresa, cliente, producto, objetivos, conteo 125/150)
- [X] T022 [P] [US1] Página `paginas/equipo.ts` (4 tarjetas con rol, responsabilidad, horas y tareas)
- [X] T023 [P] [US1] Página `paginas/backlog.ts` (8 historias, prioridad, puntos, marca de sprint, criterios como complemento)
- [X] T024 [P] [US1] Página `paginas/reflexiones.ts` (4 reflexiones con conteo dentro de 150–200)
- [X] T025 [P] [US1] Página `paginas/conclusion.ts` (texto y conteo 183/200)
- [X] T026 [US1] Comprobar que los textos son idénticos a `contenido.py`: la semilla se genera de ese archivo en cada despliegue (SC-001)

**Checkpoint**: los cinco apartados son revisables en el portal.

---

## Phase 4: User Story 2 — Verificar el cumplimiento (P1)

**Goal**: rúbrica comprobada contra los datos. **Independent Test**: alterar un dato en local → rojo.

- [X] T027 [US2] `consultas.resumen()`: historias, puntos, tareas, horas, integrantes, días, eventos y simulaciones (FR-010)
- [X] T028 [US2] `backend/app/cumplimiento.py`: 17 requisitos (C1–C5, roles, formato leído del .docx; C2.2 y F.2 como aviso) (FR-012)
- [X] T029 [US2] Rutas `GET /resumen` y `GET /cumplimiento`
- [X] T030 [P] [US2] Verificar `/api/cumplimiento` en producción: 16 cumplidos y 1 aviso (F.2 por el límite de 500 palabras), ningún fallo; C2.2 cumple desde que HU-08 incluye «para…» en `../fuente/contenido.py`
- [X] T031 [P] [US2] Componente `componentes/kpi.ts`
- [X] T032 [US2] Página `paginas/resumen.ts` con KPI calculados y aviso «planeado, no ejecutado» (FR-009)
- [X] T033 [US2] Página `paginas/cumplimiento.ts` (criterio, requisito, evidencia, estado; nota de la contradicción de 500 palabras)

**Checkpoint**: SC-002 y SC-003 verificables.

---

## Phase 5: User Story 3 — Explorar el sprint backlog (P2)

**Goal**: tabla, tablero, calendario y carga del mismo plan. **Independent Test**: sumas manuales.

- [X] T034 [US3] `consultas.carga_por_persona()` y `burndown_plan()` (reparto en partes iguales entre días)
- [X] T035 [US3] Ruta `GET /sprint` (historias, tareas, eventos, carga, burndown ideal y plan) (FR-005, FR-006)
- [X] T036 [P] [US3] Verificar `/api/sprint`: 51 h; 23/16/8/4 h; burndown plan `[51,42,30,19,8,0]` frente al ideal
- [X] T037 [P] [US3] Vista *Tabla* en `paginas/sprint.ts`, accesible, con totales y desplazamiento propio en móvil
- [X] T038 [P] [US3] Vista *Tablero* en `paginas/sprint.ts`: Kanban Por hacer / En curso / Hecho que recorre la semana del plan
- [X] T039 [P] [US3] Vista *Calendario* en `paginas/sprint.ts`: personas × lunes–viernes con tareas y eventos
- [X] T040 [P] [US3] Vista *Carga y burndown* y componente `componentes/burndown.ts` (SVG con tabla alternativa)
- [X] T041 [US3] Página `paginas/sprint.ts` con pestañas Tabla · Tablero · Calendario · Carga y burndown

**Checkpoint**: C3 visible desde cuatro vistas.

---

## Phase 6: User Story 4 — Simular el sprint (P2)

**Goal**: Monte Carlo asíncrono. **Independent Test**: σ = 0.05 → ≈ 100 %; σ = 0.25, 6 h → ≈ 50 % y Cesar crítico; σ = 0.6, 4 h → baja.

- [X] T042 [US4] `backend/app/simulacion.py`: función pura con la biblioteca estándar (lognormal, capacidad con lunes/viernes −2 h, dependencias explícitas `depende_de`, validación dentro de la review, semilla) (FR-015, FR-016)
- [X] T043 [P] [US4] Prueba `backend/tests/test_simulacion.py` (datos de `tests/datos_sprint.py`): límites de capacidad, plan determinista, dependencias, reproducibilidad con semilla y persona crítica
- [X] T044 [US4] Tarea `sprintscrum.simular_sprint` en `backend/app/tareas.py` (actualiza `SprintScrum_simulaciones`)
- [X] T045 [US4] Rutas `POST /simulacion` (202, 422, 503), `GET /simulacion/{id}`, `GET /simulacion/ultima` (FR-013, FR-014)
- [X] T046 [P] [US4] Histograma del día de término en `paginas/simulacion.ts` y bandas P10/P50/P90 en `componentes/burndown.ts`
- [X] T047 [US4] Página `paginas/simulacion.ts`: controles con rangos, sondeo cada 600 ms (tope 60 s), resultado, última simulación, mensajes 429/503

**Checkpoint**: SC-004 medido.

---

## Phase 7: User Story 5 — Descargar los entregables (P3)

- [X] T048 [US5] Rutas `GET /entregables` y `GET /entregables/archivo?ruta=…` (solo rutas del catálogo; `ver=1` en línea) (FR-017)
- [X] T049 [US5] Tarea `sprintscrum.generar_entregable`: ZIP + `MANIFIESTO_SHA256.txt` en el volumen `sprintscrum_paquetes`, conserva los 3 últimos (FR-018)
- [X] T050 [US5] Rutas `POST /entregables/generar` (`{paquete_id}`, reutiliza el vigente), `GET /entregables/paquete/{id}` y `/descargar` (404, 410)
- [X] T051 [US5] Página `paginas/entregables.ts` (catálogo con SHA-256 y botón «Generar ZIP»)

---

## Phase 8: User Story 6 — Conocer cómo se construyó (P3)

- [X] T052 [P] [US6] Página `paginas/metodologia.ts`: flujo spec-kit y BMAD, tabla capa A / capa B, enlaces al repo (FR-019)
- [X] T053 [P] [US6] Integrar figuras de `docs/figuras/anatomia/` y `docs/figuras/diagramas/` con texto alternativo
- [X] T054 [P] [US6] Artefactos: `.specify/memory/constitution.md`, `specs/001-portal-sprintscrum/*`, `_bmad-output/*`

---

## Phase 9: User Story 7 — Experiencia interactiva y figuras explicativas (P3)

**Goal**: aprender jugando y viendo, sin perder accesibilidad. **Independent Test**: partida completa de planning poker, semana completa en el Tablero, todas las figuras y diagramas abiertos; repetir con `prefers-reduced-motion: reduce`.

- [X] T063 [P] [US7] `frontend/src/app/core/movimiento.ts`: `sinMovimiento()` (prefers-reduced-motion) y `conTransicion()` (View Transitions con degradación sin soporte) (FR-029)
- [X] T064 [P] [US7] `frontend/src/app/app.config.ts`: `withViewTransitions({ skipInitialTransition: true })` en el router (FR-029)
- [X] T065 [P] [US7] `frontend/src/styles.css`: transiciones de página y de tarjetas (`::view-transition-*`), `.revelar`, volteo `.carta`, `.anillo-llena`; todo anulado bajo `prefers-reduced-motion: reduce` (FR-029)
- [X] T066 [P] [US7] `frontend/src/app/componentes/confeti.ts` (canvas temporal sin dependencias, inactivo con movimiento reducido) y `componentes/revelar.ts` (directiva `appRevelar` con IntersectionObserver)
- [X] T067 [US7] `frontend/src/app/componentes/planning-poker.ts` en `paginas/backlog.ts`: 3 desarrolladores votan, el PO no; cartas que se voltean; 2/1/0 puntos; razón de cada estimación; mejor marca en `localStorage` (`sprintscrum:poker-mejor`); confeti al acertar (FR-025)
- [X] T068 [US7] `frontend/src/app/paginas/sprint.ts`: tarjetas con `view-transition-name` que vuelan de columna, barra de progreso, confeti al cerrar el viernes, pestaña *La máquina* (figura `anatomia`) y Gantt (`gantt-sprint`) en *Calendario* (FR-026)
- [X] T069 [P] [US7] `frontend/src/app/componentes/figura.ts`: iframe del mismo origen, ruta saneada a `/figuras/<carpeta>/index.html`, `postMessage` a `location.origin` (FR-027)
- [X] T070 [P] [US7] `frontend/src/app/componentes/diagrama.ts`: diagrama por id desde `/figuras/diagramas/indice.json` con ampliación en diálogo (FR-028)
- [X] T071 [P] [US7] Figuras `docs/figuras/anatomia-backlog/` (máquina clasificadora del backlog) y `docs/figuras/anatomia-galton/` (tablero de Galton; contrato `postMessage` documentado al inicio de su `figura.js`)
- [X] T072 [P] [US7] Diagramas `recorrido-paciente` y `estados-cita` en `docs/figuras/diagramas/` (y su entrada en `indice.json`)
- [X] T073 [US7] Páginas: `paginas/resumen.ts` (cuenta regresiva al 26-oct-2026 23:59, `ciclo-scrum`, `arquitectura`, figura `anatomia`) (FR-030); `paginas/proyecto.ts` (`recorrido-paciente`, `estados-cita`); `paginas/equipo.ts` (`equipo-scrum`)
- [X] T074 [US7] `paginas/simulacion.ts` (Galton alimentado con el resultado real, `secuencia-simulacion`, confeti si `prob_a_tiempo ≥ 0,5`); `paginas/cumplimiento.ts` (anillo animado, confeti si nada bloquea); `paginas/metodologia.ts` (pestañas con las 3 figuras isométricas interactivas)
- [X] T075 [US7] Documento: `../fuente/construir.py` deja Calibri 12 e interlineado 1,5 en todo el .docx (títulos y tablas incluidos) y exporta el .pdf con Microsoft Word; HU-08 con «para…» en `../fuente/contenido.py`

---

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T055 `deploy/stack.yml`: servicios `web`, `api`, `worker`, `redis` (direccionado como `sprintscrum_redis`: en la red overlay compartida el nombre corto `redis` puede resolver a otro stack); red `interna`, `iagenteknet` + red de Supabase maestría; secreto; volumen; límites de memoria
- [X] T056 Labels Traefik: routers web/api/api-escritura, middlewares `sprintscrum-hsts`, `-cabeceras-api`, `-limite` (20/s, ráfaga 60), `-limite-escritura` (20/min, ráfaga 10), `-cuerpo` (8192 bytes) (R5)
- [X] T057 `deploy/deploy.sh`: semilla y entregables, rsync, migraciones, build `:<sha>`, stack deploy, verificación de imagen, réplicas, salud y HTTPS
- [X] T058 Primer despliegue en `sprintscrum.iagentek.com.mx` (SC-008)
- [X] T059 [P] Auditoría axe y revisión de teclado y foco en las 11 páginas (SC-006, FR-023)
- [X] T060 [P] Revisión a 360 px, 768 px y 1440 px
- [X] T061 [P] Verificación de seguridad: `anon` sin filas, 403 sin cabecera, 429 por ráfaga, cabeceras presentes (SC-007)
- [X] T062 Ejecutar `quickstart.md` de punta a punta y marcar `sprint-status.yaml`

---

## Dependencies & Execution Order

- Setup (1) → Foundational (2) → US1 y US2 (P1) → US3 → US4 (usa `/sprint` y el worker) → US5, US6 → US7 → Polish.
- US7 depende de US3 (Tablero), US4 (resultado para la figura de Galton) y US6 (figuras y diagramas).
- US1 y US2 comparten `consultas.py` pero tocan funciones distintas; el cumplimiento vive en `cumplimiento.py`.
- US4 depende de T013 (Celery) y de T034 (modelo de carga); US5 depende de T013 y T010 (catálogo).
- Dentro de cada historia: cálculo → prueba → ruta → componentes [P] → página.

## Parallel Example: User Story 1

```bash
Task: "Página paginas/proyecto.ts"
Task: "Página paginas/equipo.ts"
Task: "Página paginas/backlog.ts"
Task: "Página paginas/reflexiones.ts"
Task: "Página paginas/conclusion.ts"
```

## Implementation Strategy

MVP = Fases 1–4 (contenido + cumplimiento): basta para que la profesora revise el trabajo. Después,
incrementos US3 → US4 → US5/US6 → US7, cada uno desplegable con `deploy/deploy.sh`.
