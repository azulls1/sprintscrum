# SprintScrum · AgendaFácil — documento de diseño (fuente única)

Portal web que presenta, de forma interactiva y verificable, la **Actividad 1 grupal** de *Metodología de Diseño y
Gestión de Proyectos* (UNIR México, Maestría en Inteligencia Artificial): la planeación de un sprint Scrum de una semana del producto
**AgendaFácil** (Nexo Digital Solutions → Clínica Dental Sonrisa Plena). Equipo 2073 F.

- Producción: **https://sprintscrum.iagentek.com.mx** (VPS iaGentek, Docker Swarm + Traefik + Portainer)
- Repositorio: **github.com/azulls1/sprintscrum**
- Base de datos: **Supabase maestría** (`supabase-maestria_db`, esquema `public`, tablas `SprintScrum_*`, rol `sprintscrum_app`)
- Fuente del contenido: `../fuente/contenido.py` (el mismo archivo que genera el .docx y el .pdf entregados)

## 1. Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (standalone, signals, `httpResource`) + Tailwind CSS 4 + Forest Design System de iAgentek |
| API | Python 3.11 · FastAPI · psycopg 3 (pool) |
| Trabajos asíncronos | Celery 5.6 con Redis 7 como broker y backend de resultados |
| Datos | PostgreSQL 15 de Supabase maestría (secreto Swarm `sprintscrum_db_dsn_v1`) |
| Despliegue | Docker Swarm (stack `sprintscrum`), Traefik v3 con Let's Encrypt, red `iagenteknet` |

Servicios del stack: `web` (nginx sin privilegios :8080), `api` (uvicorn :8000), `worker` (celery), `redis`.
Traefik: `Host(sprintscrum.iagentek.com.mx)` → web; `… && PathPrefix(/api)` → api (prioridad mayor).

## 2. Trabajos de Celery

1. **`sprintscrum.simular_sprint`** — simulación Monte Carlo del sprint. Cada tarea del sprint backlog dura
   `horas_estimadas × LogNormal(0, σ)`; cada persona trabaja sus tareas en orden con una capacidad diaria
   (lunes y viernes con 2 h menos por los eventos); las pruebas de una historia no empiezan antes de que acabe su
   desarrollo. Resultado: probabilidad de terminar antes de la sprint review del viernes, distribución del día de
   término, burndown P10/P50/P90 frente al ideal, carga y holgura por persona, persona crítica.
   Parámetros: `iteraciones` (500–5000), `variabilidad` σ (0.05–0.6), `capacidad_horas_dia` (4–8).
2. **`sprintscrum.generar_entregable`** — empaqueta el catálogo de entregables en un ZIP con manifiesto SHA-256.

## 3. Modelo de datos (Supabase maestría, `public`)

| Tabla | Contenido |
|---|---|
| `SprintScrum_proyecto` | una fila: empresa, cliente, producto, objetivos, párrafos de la descripción, notas, conclusión |
| `SprintScrum_integrantes` | los 4 integrantes con rol Scrum y responsabilidad |
| `SprintScrum_historias` | las 8 historias (HU-01…HU-08): texto, prioridad, puntos Fibonacci, `en_sprint`, criterios de aceptación |
| `SprintScrum_tareas` | las 15 tareas del sprint backlog: historia, responsable, horas, día de inicio y de fin (1 = lunes … 5 = viernes) |
| `SprintScrum_eventos` | planning, dailies, review y retrospectiva con día, hora y facilitador |
| `SprintScrum_reflexiones` | las 4 reflexiones individuales |
| `SprintScrum_simulaciones` | cada simulación pedida: parámetros, estado, resultado (jsonb) |
| `SprintScrum_entregables` | catálogo de archivos entregables con SHA-256 |
| `SprintScrum_paquetes` | ZIP generados por el worker |

Seguridad: RLS forzado en todas las tablas, `anon`/`authenticated` sin privilegios, política única para `sprintscrum_app`.

## 4. Datos del sprint (calendario del plan)

Sprint de 5 días hábiles. Capacidad de referencia 6 h/día por persona (4 h el lunes y el viernes por los eventos).

| # | HU | Tarea | Responsable | h | Días |
|---|---|---|---|---|---|
| 1 | HU-01 | Definir los criterios de aceptación y los datos obligatorios del registro | Adonai | 1 | Lun |
| 2 | HU-01 | Diseñar la tabla de pacientes | Mauricio | 2 | Lun |
| 3 | HU-01 | API de registro con validación de teléfono y correo | Mauricio | 4 | Lun–Mar |
| 4 | HU-01 | Pantalla de registro responsive | Diego | 4 | Lun |
| 5 | HU-01 | Probar el registro | Cesar | 2 | Mar |
| 6 | HU-02 | Modelar horarios por dentista y consultorio | Mauricio | 3 | Mar |
| 7 | HU-02 | API de consulta de disponibilidad | Mauricio | 5 | Mié |
| 8 | HU-02 | Calendario de disponibilidad en la interfaz | Diego | 6 | Mar–Mié |
| 9 | HU-02 | Cargar horarios de prueba de la clínica | Adonai | 2 | Mar |
| 10 | HU-02 | Probar la disponibilidad | Cesar | 2 | Jue |
| 11 | HU-03 | API de reserva que impida la doble reserva | Mauricio | 6 | Jue |
| 12 | HU-03 | Correo de confirmación de la cita | Mauricio | 3 | Vie |
| 13 | HU-03 | Flujo de reserva y pantalla de confirmación | Diego | 6 | Mié–Jue |
| 14 | HU-03 | Prueba de punta a punta | Cesar | 4 | Vie |
| 15 | HU-03 | Validar el incremento con la clínica en la review | Adonai | 1 | Vie |

Totales: 51 h · Mauricio 23 h · Diego 16 h · Cesar 8 h · Adonai 4 h · 16 puntos (HU-01 3 + HU-02 5 + HU-03 8).
Product backlog: 8 historias, 50 puntos (3+5+8+5+8+5+3+13).

Eventos: sprint planning lunes 9:00 (2 h); daily 9:00 de martes a viernes (15 min); sprint review viernes 15:00 (1 h);
retrospectiva viernes 16:30 (1 h). Facilita el Scrum master (Cesar); la review la conduce el product owner (Adonai).

## 5. API (`/api`)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | estado de db y redis |
| GET | `/resumen` | proyecto + KPIs calculados |
| GET | `/proyecto` | descripción, empresa, cliente, objetivos |
| GET | `/equipo` | integrantes con horas y tareas asignadas |
| GET | `/backlog` | 8 historias |
| GET | `/sprint` | historias del sprint, tareas, eventos, carga por persona, plan por día, burndown ideal |
| GET | `/reflexiones` | 4 reflexiones con conteo de palabras |
| GET | `/conclusion` | conclusión con conteo de palabras |
| GET | `/cumplimiento` | requisitos del enunciado y la rúbrica, comprobados contra los datos |
| POST | `/simulacion` | encola una simulación → 202 `{id}` |
| GET | `/simulacion/{id}` · `/simulacion/ultima` | estado y resultado |
| GET/POST | `/entregables…` | catálogo, descarga, generación del ZIP |

Las escrituras exigen la cabecera `X-Requested-With: portal-sprintscrum` (anti-CSRF) y tienen límite por IP en Traefik.

## 6. Páginas del portal

Resumen · Proyecto (C1) · Equipo y roles · Product backlog (C2) · Sprint backlog (C3: tabla, tablero Kanban,
calendario y carga) · Simulación (Celery) · Reflexiones (C4) · Conclusión (C5) · Cumplimiento · Metodología
(spec-kit, BMAD, figuras) · Entregables.

## 7. Identidad visual (Forest DS de iAgentek)

Modo claro. Fondo `#F7F8F7`, primario forest `#04202C`, evergreen `#304040`, pine/moss `#5B7065`, sage `#9EADA3`,
fog `#DFE4E0`, blanco. Éxito `#059669`, aviso `#D97706`, error `#DC2626`.
Tipografías: **Sora** (títulos), **DM Sans** (texto), **JetBrains Mono** (datos y etiquetas).

## 8. Cómo se construyó (metodología)

- **GitHub spec-kit** (desarrollo guiado por especificaciones): constitución → `spec.md` → `plan.md` → `tasks.md` en `specs/001-portal-sprintscrum/`.
- **Método BMAD v6** (planeación y entrega ágil): product brief, PRD, arquitectura, épicas e historias y `sprint-status.yaml` en `_bmad-output/`.
- **Figuras isométricas interactivas**: la del sprint en `docs/figuras/anatomia/`.
- **Diagramas con la marca Forest**: arquitectura, Gantt del sprint, mapa del backlog, equipo y secuencia en `docs/figuras/diagramas/`.
