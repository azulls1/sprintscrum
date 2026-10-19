---
title: SprintScrum · AgendaFácil
created: 2026-10-18
updated: 2026-10-18
status: final
inputDocuments:
  - product-brief.md
  - ../../specs/001-portal-sprintscrum/spec.md
  - ../../docs/DISENO.md
---

# PRD: SprintScrum · AgendaFácil

## 0. Document Purpose

PRD del **portal** (capa B) para quien lo construye y lo revisa. Los requisitos funcionales **son los de
`specs/001-portal-sprintscrum/spec.md`** y se citan por su id (`FR-001…FR-024`, `SC-001…SC-008`); aquí
se agrupan por funcionalidad, se fijan el vocabulario y los recorridos, y se marcan los no-objetivos.
El diseño técnico está en `architecture.md` y en `specs/…/plan.md`.

## 1. Vision

Que la profesora y el equipo vean la planeación del sprint de AgendaFácil tal como se entregó, pero con
cada cifra calculada, la rúbrica comprobada y el riesgo del plan a la vista. El portal no agrega contenido
académico: lo presenta, lo verifica y lo hace explorable.

## 2. Target User

### 2.1 Jobs To Be Done

- Evaluar los cinco criterios de la rúbrica sin contar palabras a mano.
- Confirmar antes de entregar que nada se rompió al editar el contenido.
- Entender si el plan de una semana es realista y quién lo pone en riesgo.
- Descargar exactamente lo que se entregó.

### 2.2 Non-Users (v1)

Personal de la Clínica Dental Sonrisa Plena o pacientes: AgendaFácil no existe como software.

### 2.3 Key User Journeys

- **UJ-1. La profesora revisa la actividad en diez minutos.** Abre *Resumen* (KPI y aviso «planeado, no
  ejecutado»), recorre Proyecto → Equipo → Product backlog → Sprint backlog → Reflexiones → Conclusión y
  termina en *Cumplimiento*, donde ve los cinco criterios en verde (16 de 17 requisitos) y, como único aviso
  explicado, el límite de 500 palabras (F.2); HU-08 ya incluye la parte «para…» (C2.2 cumple).
- **UJ-2. Adonai confirma el contenido antes del cierre.** Edita `contenido.py`, regenera el documento,
  despliega con `deploy/deploy.sh` (que regenera la semilla con `scripts/generar_semilla.py`) y abre
  *Cumplimiento*. **Edge case:** si una reflexión pasa de 200 palabras, el requisito C4.2 aparece en rojo
  con la evidencia medida.
- **UJ-3. Un visitante prueba el riesgo del plan.** En *Simulación* sube la variabilidad a 0.5 y baja la
  capacidad a 5 h; en segundos ve que la probabilidad de terminar a tiempo cae y que Cesar (pruebas, al
  final de la cadena de dependencias) es la persona crítica.
- **UJ-4. Diego descarga el paquete.** En *Entregables* genera el ZIP y comprueba los SHA-256 con el
  manifiesto.

## 3. Glossary

- **Capa A** — el sprint de AgendaFácil, contenido de la actividad; planeado, no ejecutado.
- **Capa B** — el portal SprintScrum.
- **Historia (HU)** — elemento del product backlog de AgendaFácil (HU-01…HU-08).
- **Tarea** — elemento del sprint backlog de AgendaFácil (1–15), con responsable, horas y días.
- **Complemento del portal** — dato que no está en el documento entregado (calendario por día,
  dependencias entre tareas, criterios de aceptación, horas de eventos, simulación).
- **Requisito de cumplimiento** — regla del enunciado o la rúbrica evaluada contra los datos.
- **Simulación** — corrida Monte Carlo del plan con parámetros del visitante.
- **Entregable** — archivo descargable con SHA-256; **paquete** — ZIP de entregables con manifiesto.

## 4. Features

### 4.1 Contenido calificable
Páginas Proyecto, Equipo, Product backlog, Reflexiones y Conclusión con el texto de `contenido.py`.
Realizes UJ-1. **FR:** FR-001–FR-004, FR-007, FR-008.

### 4.2 Resumen y cumplimiento
KPI calculados y lista de 17 requisitos con evidencia medida y estado (cumple, aviso o no cumple). Realizes UJ-1, UJ-2.
**FR:** FR-009–FR-012.

### 4.3 Sprint backlog explorable
Tabla, tablero, calendario y carga del mismo plan, con burndown ideal y planeado. Realizes UJ-1.
**FR:** FR-005, FR-006, FR-010.

### 4.4 Simulación
Monte Carlo en segundo plano con resultado persistido. Realizes UJ-3. **FR:** FR-013–FR-016.
**NFR:** < 5 s para 2000 iteraciones (SC-004).

### 4.5 Entregables y metodología
Catálogo con SHA-256, ZIP con manifiesto, página de metodología con las dos capas. Realizes UJ-4.
**FR:** FR-017–FR-019.

## 5. Non-Goals (Explicit)

- No es AgendaFácil ni un prototipo de AgendaFácil.
- No registra avance real del sprint: el tablero solo recorre el calendario del plan, el burndown
  «planeado» no es «real».
- No edita contenido en línea ni tiene cuentas.
- No sustituye la entrega en Moodle.

## 6. MVP Scope

### 6.1 In Scope
Épicas 1–3 de `epics.md` (plataforma, contenido calificable, cumplimiento).

### 6.2 Out of Scope for MVP
Sprint backlog explorable, simulación, entregables y metodología (épicas 4–6): se agregan como
incrementos y ya están hechos. El despliegue y la calidad transversal (épica 7) acompañan cada incremento.

## 7. Success Metrics

**Primary**
- **SM-1**: texto igual al .pdf en 100 % de apartados. Validates FR-001 (SC-001).
- **SM-2**: cumplimiento 5/5 criterios en verde. Validates FR-012 (SC-002).

**Secondary**
- **SM-3**: simulación < 5 s (SC-004); páginas < 2 s en 4G (SC-005).
- **SM-4**: axe sin errores críticos (SC-006).

**Counter-metrics (do not optimize)**
- **SM-C1**: probabilidad de la simulación. No se ajustan parámetros por defecto para que «salga bien»;
  es una lectura del riesgo, no una meta. Counterbalances SM-3.

## 8. Cross-Cutting NFRs

- Seguridad: RLS forzado, secreto Swarm, cabeceras, límite por IP, cabecera anti-CSRF (FR-021, SC-007).
- Accesibilidad: WCAG 2.1 AA, 360 px (FR-023).
- Idioma: español de México (FR-020).
- Despliegue reproducible por sha de commit (SC-008).

## 9. Aesthetic and Tone

Forest DS de iAgentek en modo claro (fondo `#F7F8F7`, forest `#04202C`, pine `#5B7065`, sage `#9EADA3`);
Sora / DM Sans / JetBrains Mono. Tono sobrio y académico; los rótulos dicen «planeado» y «complemento».

## 10. Open Questions

1. ¿El límite de 500 palabras aplica a todo el documento? (consulta en el foro; el portal lo muestra como
   advertencia mientras tanto).
2. Roles y reflexiones son borradores: cada integrante debe confirmar la suya.

## 11. Assumptions Index

- Calendario por día, dependencias, criterios de aceptación y horas de eventos son complemento del portal
  (§3), definidos en `scripts/plan_sprint.py`.
- Capacidad de referencia 6 h/día, 4 h lunes y viernes (spec, Assumptions).
