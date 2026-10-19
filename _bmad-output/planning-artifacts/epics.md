---
status: final
stepsCompleted: [requirements-inventory, epic-list, stories]
inputDocuments:
  - ../../specs/001-portal-sprintscrum/spec.md
  - ../../specs/001-portal-sprintscrum/tasks.md
  - prd.md
  - architecture.md
---

# SprintScrum · AgendaFácil - Epic Breakdown

## Overview

Épicas e historias del **portal** (capa B). Siguen las historias de usuario de spec-kit (US1–US7) más una
épica de plataforma y una de despliegue. Los requisitos no se copian: se citan por id (FR-/SC-) y las
tareas detalladas están en `tasks.md` (T001–T075).

> No confundir con el sprint de **AgendaFácil** (capa A: HU-01…HU-08, tareas 1–15, planeado y no
> ejecutado). Esas historias son *contenido* que el portal muestra, no trabajo de estas épicas.

## Requirements Inventory

### Functional Requirements

FR-001…FR-030 de `spec.md`.

### NonFunctional Requirements

SC-001…SC-010 de `spec.md`; principios I–VII de la constitución.

### Additional Requirements

Datos en Supabase maestría con prefijo `SprintScrum_`; despliegue en `sprintscrum.iagentek.com.mx`.

### UX Design Requirements

Forest DS de iAgentek, WCAG 2.1 AA, 360 px (FR-023).

### FR Coverage Map

| Épica | Requisitos | Tareas spec-kit |
|---|---|---|
| 1 · Plataforma y datos | FR-001, FR-021, FR-022, FR-024, SC-007 | T001–T017 |
| 2 · Contenido calificable (US1) | FR-001–FR-004, FR-007, FR-008, FR-011, SC-001 | T018–T026 |
| 3 · Resumen y cumplimiento (US2) | FR-009, FR-010, FR-012, SC-002, SC-003 | T027–T033 |
| 4 · Sprint backlog explorable (US3) | FR-005, FR-006, FR-010 | T034–T041 |
| 5 · Simulación (US4) | FR-013–FR-016, SC-004 | T042–T047 |
| 6 · Entregables y metodología (US5, US6) | FR-017–FR-019 | T048–T054 |
| 7 · Despliegue y calidad | FR-020, FR-021, FR-023, SC-005, SC-006, SC-008 | T055–T062 |
| 8 · Experiencia interactiva y figuras (US7) | FR-025–FR-030, SC-009, SC-010 | T063–T075 |

## Epic List

1. Plataforma y datos
2. Contenido calificable
3. Resumen y cumplimiento
4. Sprint backlog explorable
5. Simulación del sprint
6. Entregables y metodología
7. Despliegue y calidad
8. Experiencia interactiva y figuras explicativas

## Epic 1: Plataforma y datos

Base segura con el contenido cargado y la API y el shell en pie.

### Story 1.1: Esquema y seguridad

As a integrante del equipo, I want las 9 tablas con RLS forzado, So that el contenido no quede expuesto por la API de Supabase.

**Given** `db/migraciones/` **When** se aplican **Then** existen 9 tablas `SprintScrum_*` con RLS forzado **And** `anon` no lee filas.

### Story 1.2: Cargador de contenido

As a integrante, I want cargar `contenido.py` con un comando, So that el portal diga lo mismo que el .pdf.

**Given** `../fuente/contenido.py` y `scripts/plan_sprint.py` **When** corre `scripts/generar_semilla.py` y se aplica `003_contenido.sql` **Then** hay 8 historias, 15 tareas, 4 integrantes, 4 reflexiones y 7 eventos **And** si una validación falla no se carga nada.

### Story 1.3: API base y shell del portal

**Given** la base cargada **When** se abre el portal **Then** `/api/health` responde con db y redis **And** las 11 páginas son navegables con teclado.

## Epic 2: Contenido calificable

### Story 2.1: Apartados C1–C5 y roles

As a profesora evaluadora, I want leer cada apartado en su página, So that califique sin abrir el documento.

**Given** la base cargada **When** se abre Proyecto, Equipo, Product backlog, Reflexiones o Conclusión **Then** el texto coincide con el .pdf **And** se ve el conteo de palabras calculado (125, 172/164/167/166, 183).

### Story 2.2: Complementos rotulados

**Given** criterios de aceptación y calendario **When** se muestran **Then** llevan el rótulo «complemento del portal».

## Epic 3: Resumen y cumplimiento

### Story 3.1: KPI calculados

**Given** el sprint planeado **When** se abre Resumen **Then** se ven 50/16 puntos, 15 tareas, 51 h, 5 días, 7 eventos y el burndown planeado **And** el aviso «planeado, no ejecutado».

### Story 3.2: Cumplimiento de la rúbrica

As a integrante, I want ver cada requisito comprobado, So that corrija antes del cierre.

**Given** los datos **When** se abre Cumplimiento **Then** 16 de los 17 requisitos cumplen y solo F.2 (500 palabras) es aviso (C2.2 cumple desde que HU-08 incluye «para…») **And** si una tarea pierde su responsable el requisito C3.3 pasa a rojo.

## Epic 4: Sprint backlog explorable

### Story 4.1: Endpoint `/sprint` con plan por día y burndown

**Given** las 15 tareas **When** se pide `/api/sprint` **Then** el burndown planeado es `[51,42,30,19,8,0]` (9, 12, 11, 11 y 8 h por día) y la carga 23/16/8/4 h.

### Story 4.2: Cuatro vistas

**Given** la página Sprint backlog **When** se alterna Tabla, Tablero, Calendario y Carga y burndown **Then** las cuatro muestran el mismo plan y los mismos totales.

## Epic 5: Simulación del sprint

### Story 5.1: Modelo Monte Carlo y worker

**Given** parámetros válidos **When** el worker ejecuta `sprintscrum.simular_sprint` **Then** respeta las dependencias explícitas (`depende_de`) y guarda probabilidad, día de término, burndown P10/P50/P90, término por persona y persona crítica (Cesar con los valores por defecto) **And** con la misma semilla el resultado es idéntico.

### Story 5.2: Página Simulación

As a visitante, I want ajustar parámetros y ver el riesgo, So that entienda si el plan cabe en la semana.

**Given** el formulario **When** se envía **Then** en < 5 s aparece el resultado **And** los controles no permiten valores fuera de rango (la API respondería 422).

## Epic 6: Entregables y metodología

### Story 6.1: Catálogo y ZIP con manifiesto

**Given** el catálogo **When** se genera el ZIP **Then** contiene `MANIFIESTO_SHA256.txt` y cada hash coincide con el catálogo.

### Story 6.2: Página Metodología

**Given** la página **When** se abre **Then** muestra spec-kit, BMAD, figuras y la tabla capa A / capa B con enlaces que existen en el repo.

## Epic 7: Despliegue y calidad

### Story 7.1: Stack y Traefik

**Given** `deploy/stack.yml` **When** se despliega **Then** los 4 servicios están 1/1 **And** las cabeceras, el límite de tasa y el de cuerpo están activos.

### Story 7.2: `deploy.sh` reproducible

**Given** un commit limpio **When** se ejecuta `deploy/deploy.sh` **Then** cada servicio usa `:<sha>` **And** `/api/health` responde `ok` con TLS válido.

### Story 7.3: Accesibilidad y responsive

**Given** las 11 páginas **When** se auditan con axe y a 360 px **Then** no hay errores críticos ni desbordamiento horizontal.

## Epic 8: Experiencia interactiva y figuras explicativas

Ampliación posterior a la primera versión: aprender jugando y viendo, sin perder accesibilidad (US7).

### Story 8.1: Movimiento accesible

As a visitante, I want transiciones suaves que no me mareen, So that la navegación se entienda sin distraer.

**Given** el router con `withViewTransitions()` y `core/movimiento.ts` **When** se cambia de página o de pestaña **Then** hay transición **And** con `prefers-reduced-motion: reduce` o sin soporte de View Transitions el cambio es inmediato, sin aparición al desplazar ni confeti (FR-029, SC-009).

### Story 8.2: Planning poker

As a visitante, I want estimar las historias contra el equipo, So that entienda la estimación relativa.

**Given** *Product backlog* **When** elijo una carta **Then** votan Mauricio, Diego y Cesar (el PO no), las cartas se voltean y sumo 2/1/0 puntos **And** la mejor marca queda en `localStorage` (FR-025).

### Story 8.3: Sprint backlog animado

**Given** la vista *Tablero* **When** avanzo la semana **Then** las tarjetas vuelan de columna, la barra muestra el % de horas hechas y al cerrar el viernes hay confeti **And** existen la pestaña *La máquina* y el Gantt en *Calendario* (FR-026).

### Story 8.4: Figuras y diagramas incrustados

**Given** `componentes/figura.ts` y `componentes/diagrama.ts` **When** una página pide una figura o un diagrama **Then** solo se incrusta `/figuras/<carpeta>/index.html` del mismo origen **And** los diagramas salen de `indice.json` y se amplían en un diálogo (FR-027, FR-028, SC-010).

### Story 8.5: Figuras nuevas en las páginas

**Given** las figuras `anatomia-backlog` y `anatomia-galton` y los diagramas `recorrido-paciente` y `estados-cita` **When** se abren Resumen, Proyecto, Equipo, Simulación, Cumplimiento y Metodología **Then** cada una muestra sus figuras, la de Galton recibe por `postMessage` el resultado real **And** Resumen muestra la cuenta regresiva al 26-oct-2026 23:59 (FR-030).

### Story 8.6: Documento final

**Given** `../fuente/construir.py` **When** se regenera el documento **Then** el .docx queda en Calibri 12 e interlineado 1,5 en todo el texto y el .pdf lo exporta Microsoft Word **And** HU-08 incluye «para…», así que Cumplimiento marca 16 de 17 (solo F.2 como aviso).
