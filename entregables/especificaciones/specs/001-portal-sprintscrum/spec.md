# Feature Specification: Portal SprintScrum · AgendaFácil

**Feature Branch**: `001-portal-sprintscrum`

**Created**: 2026-10-18

**Status**: Implementado

**Input**: User description: "Portal web en sprintscrum.iagentek.com.mx que presente de forma interactiva y
verificable la Actividad 1 grupal de MDGP (planeación de un sprint Scrum de una semana del producto
AgendaFácil, Equipo 2073 F): los cinco apartados calificables, el sprint backlog como tabla, tablero,
calendario y carga, una simulación Monte Carlo del sprint, la comprobación del enunciado y la rúbrica,
la metodología con la que se construyó y la descarga de los entregables."

> **Dos capas.** Esta especificación describe el **portal** (capa B). El sprint de AgendaFácil
> (capa A: `HU-01…HU-08`, tareas 1–15) es el **contenido** que el portal presenta y está
> **planeado, no ejecutado**. Ver `.specify/memory/constitution.md`.

## User Scenarios & Testing *(mandatory)*

Actores: **la profesora evaluadora** (Adriana Cervantes Castillo, califica con la rúbrica de 5 criterios),
**los integrantes del equipo 2073 F** (revisan su contenido antes de entregar) y **el visitante**
(consulta el portal sin cuenta).

### User Story 1 - Leer los cinco apartados calificables (Priority: P1)

La profesora abre el portal y recorre, en páginas separadas, la descripción del proyecto (C1), los roles
Scrum, el product backlog (C2), el sprint backlog (C3), las reflexiones individuales (C4) y la conclusión
grupal (C5), con el mismo texto del documento entregado.

**Why this priority**: es el contenido que se califica; sin él el portal no tiene razón de ser.

**Independent Test**: comparar, apartado por apartado, el texto de cada página con el .pdf entregado:
debe coincidir carácter por carácter.

**Acceptance Scenarios**:

1. **Given** la base cargada desde `fuente/contenido.py` (vía `scripts/generar_semilla.py`), **When** se abre *Proyecto*, **Then** se ven
   empresa (Nexo Digital Solutions), cliente (Clínica Dental Sonrisa Plena), producto, objetivo del
   producto, objetivo del sprint y el conteo de palabras (125 / 150).
2. **Given** *Equipo y roles*, **When** se abre, **Then** aparecen los 4 integrantes con su rol, su
   responsabilidad, sus horas y sus tareas asignadas en el sprint.
3. **Given** *Product backlog*, **When** se abre, **Then** se listan HU-01…HU-08 en orden de prioridad con
   texto «Como… quiero… para…», prioridad, puntos Fibonacci y marca de las 3 que entran al sprint
   (total 50 puntos).
4. **Given** *Reflexiones*, **When** se abre, **Then** se ven las 4 reflexiones con autor, rol y conteo de
   palabras dentro de 150–200.
5. **Given** *Conclusión*, **When** se abre, **Then** se ve la conclusión con su conteo (183 / 200).

---

### User Story 2 - Verificar el cumplimiento del enunciado y la rúbrica (Priority: P1)

La profesora o un integrante abre *Resumen* y *Cumplimiento* y ve, calculado contra los datos, si cada
requisito del enunciado se cumple: límites de palabras, número mínimo de historias, prioridades y
estimaciones, tres historias desglosadas con responsable y horas, un rol por persona.

**Why this priority**: convierte la rúbrica en una lista comprobable y detecta errores antes de la entrega
(cierre: lunes 26-oct-2026, 23:59).

**Independent Test**: alterar un dato de prueba (p. ej. quitar el responsable de una tarea) en una base
local y comprobar que el requisito correspondiente pasa a rojo.

**Acceptance Scenarios**:

1. **Given** los datos cargados, **When** se abre *Resumen*, **Then** se muestran los KPI calculados:
   8 historias / 50 puntos, 3 historias / 16 puntos en el sprint, 15 tareas / 51 h, 5 días,
   7 eventos y el burndown planeado.
2. **Given** *Cumplimiento*, **When** se abre, **Then** cada uno de los 17 requisitos muestra criterio de
   la rúbrica, la evidencia medida y su estado (cumple / aviso / no cumple).
3. **Given** el límite «máximo 500 palabras / 1 página» del enunciado, **When** se evalúa, **Then**
   aparece como **advertencia** con la explicación de la contradicción (solo las 4 reflexiones superan
   las 500 palabras), no como incumplimiento. Lo mismo para C2.2 si alguna historia no tiene la parte
   «para…» (HU-08 ya la incluye, así que hoy C2.2 cumple: 16 de 17 cumplen y solo F.2 queda como aviso).

---

### User Story 3 - Explorar el sprint backlog (Priority: P2)

El visitante abre *Sprint backlog* y alterna cuatro vistas del mismo plan: tabla (historia, tarea,
responsable, horas, días), tablero Kanban que recorre la semana, calendario personas × días con los
eventos Scrum, y carga por persona y día con el burndown ideal y el planeado.

**Why this priority**: es el criterio C3 visto desde varios ángulos; aporta comprensión, no contenido nuevo.

**Independent Test**: sumar a mano las horas de la tabla (51 h) y por persona (23/16/8/4) y comparar con
las cuatro vistas.

**Acceptance Scenarios**:

1. **Given** el sprint, **When** se elige la vista *Tabla*, **Then** se ven las 15 tareas con su historia,
   responsable, horas y días, y los totales por historia y generales.
2. **Given** la vista *Tablero*, **When** se mueve el control del momento (o se pulsa *Reproducir*),
   **Then** cada tarea pasa por «Por hacer», «En curso» y «Hecho» según su `dia_inicio`/`dia_fin` del
   plan, rotulado como plan (el sprint no se ejecutó).
3. **Given** la vista *Calendario*, **When** se abre, **Then** cada día muestra sus tareas y eventos
   (planning lunes 9:00, dailies 9:00 mar–vie, review viernes 15:00, retrospectiva viernes 16:30).
4. **Given** la vista *Carga y burndown*, **When** se abre, **Then** cada persona muestra horas asignadas frente a su
   capacidad semanal (26 h) y el burndown ideal frente al planeado.

---

### User Story 4 - Simular el sprint (Priority: P2)

El visitante ajusta iteraciones, variabilidad y capacidad diaria, lanza una simulación Monte Carlo y,
en segundos, ve la probabilidad de tener todo listo para la sprint review del viernes, la distribución del día
de término, el burndown P10/P50/P90 frente al ideal, el término de cada persona y la persona crítica.

**Why this priority**: añade análisis de riesgo del plan; depende de US3 y no es requisito de la rúbrica.

**Independent Test**: lanzar con σ = 0.05 y comprobar probabilidad cercana a 100 %; con los valores por
defecto (σ = 0.25, 6 h) el plan termina el viernes al 75 % de la jornada, la probabilidad ronda el 50 % y
Cesar (pruebas, al final de la cadena de dependencias) aparece como persona crítica; con σ = 0.6 y
capacidad 4 h, comprobar que la probabilidad cae.

**Acceptance Scenarios**:

1. **Given** parámetros válidos, **When** se pulsa *Simular*, **Then** la petición se acepta (202) y la
   página muestra el estado hasta «completada» sin recargar.
2. **Given** una simulación completada, **When** se ve el resultado, **Then** aparecen probabilidad,
   histograma del día de término, burndown P10/P50/P90 + ideal, tabla de carga y término por persona y
   persona crítica.
3. **Given** parámetros fuera de rango, **When** se envían a la API, **Then** responde 422; la página
   no los permite (controles deslizantes acotados a los mismos rangos).
4. **Given** una visita nueva, **When** se abre *Simulación*, **Then** se muestra la última simulación
   completada.

---

### User Story 5 - Descargar los entregables (Priority: P3)

Un integrante descarga el .docx, el .pdf y las figuras, o un ZIP generado por el worker con un
manifiesto SHA-256 para comprobar que lo descargado es lo entregado.

**Why this priority**: comodidad y trazabilidad; la entrega oficial se hace en Moodle.

**Independent Test**: descargar el ZIP, recalcular `sha256sum` de cada archivo y compararlo con el
manifiesto y con el catálogo de la página.

**Acceptance Scenarios**:

1. **Given** el catálogo, **When** se abre *Entregables*, **Then** cada archivo muestra nombre, tamaño,
   tipo y SHA-256, con enlace de descarga (y de vista en línea con `ver=1` para PDF y figuras).
2. **Given** *Generar ZIP*, **When** se pulsa, **Then** se encola un trabajo (o se reutiliza el ZIP vigente)
   y al terminar aparece el enlace al ZIP con `MANIFIESTO_SHA256.txt` dentro.

---

### User Story 6 - Conocer cómo se construyó (Priority: P3)

El visitante abre *Metodología* y ve cómo se hizo el portal: GitHub spec-kit, desarrollo guiado por especificaciones
(constitución → spec → plan → tareas), el método BMAD v6 de planeación y entrega ágil (brief, PRD,
arquitectura, épicas, estado del sprint), y las figuras isométricas interactivas y los diagramas, con la separación explícita entre las dos capas de Scrum.

**Why this priority**: transparencia sobre el proceso de construcción; no se califica.

**Independent Test**: cada artefacto citado en la página existe en el repositorio en la ruta indicada.

**Acceptance Scenarios**:

1. **Given** *Metodología*, **When** se abre, **Then** se ve el flujo spec-kit y BMAD con enlaces a los
   archivos del repositorio y la tabla «capa A (planeada) / capa B (construida)».
2. **Given** las figuras de `docs/figuras/`, **When** se abre la página, **Then** la figura isométrica y los
   diagramas se ven con texto alternativo.

### User Story 7 - Experiencia interactiva y figuras explicativas (Priority: P3)

*Ampliación posterior a la primera versión de esta especificación.* El visitante aprende jugando y viendo:
en *Product backlog* juega planning poker contra el equipo; en *Sprint backlog* las tarjetas del Kanban
«vuelan» de columna mientras avanza la semana; las páginas incluyen figuras isométricas interactivas
y diagramas con la marca Forest que explican el ciclo Scrum, la arquitectura, el recorrido del
paciente y los estados de una cita.

**Why this priority**: refuerza la comprensión del contenido y hace el portal memorable; no se califica.

**Independent Test**: jugar una partida completa de planning poker, recorrer la semana en el Tablero y abrir
cada figura y diagrama; repetir con `prefers-reduced-motion: reduce` y comprobar que todo se muestra sin
animación y sin confeti.

**Acceptance Scenarios**:

1. **Given** *Product backlog*, **When** el visitante elige una carta para cada historia, **Then** las cartas
   de los tres desarrolladores (Mauricio, Diego, Cesar) se voltean, el product owner no vota, y se suman
   2 puntos si coincide con la estimación acordada, 1 si queda a una carta y 0 en otro caso; al final se
   muestra el resultado y la mejor marca guardada en el navegador (`localStorage`).
2. **Given** la vista *Tablero*, **When** se mueve el control de la semana, **Then** las tarjetas se desplazan
   a su nueva columna con View Transitions, la barra de progreso refleja el % de horas terminadas y al
   llegar al viernes hay confeti.
3. **Given** *Simulación* con un resultado, **When** se carga la figura de Galton, **Then** recibe por
   `postMessage` (mismo origen) el histograma real y sus bolas convergen a él; si `prob_a_tiempo ≥ 0,5` hay
   confeti.
4. **Given** cualquier diagrama, **When** se hace clic, **Then** se abre ampliado en un diálogo que se cierra
   con *Cerrar*, clic fuera o Escape.
5. **Given** `prefers-reduced-motion: reduce`, **When** se navega, **Then** no hay transiciones, apariciones
   al desplazar ni confeti, y el contenido se ve completo de inmediato.

---

### Edge Cases

- **Base no disponible**: `/api/health` responde 503 con `db: false`; cada página muestra error con
  reintento, nunca cifras vacías como si fueran ceros.
- **Redis o worker caídos**: las lecturas siguen funcionando; `POST /simulacion` responde 503 y la página
  explica que la simulación no está disponible. Una simulación «pendiente» más de 60 s deja de sondearse
  y la página pide intentarlo de nuevo.
- **Contenido modificado en `contenido.py` sin recargar la base**: `scripts/generar_semilla.py` (que corre
  `deploy.sh`) es la única vía de entrada;
  *Cumplimiento* refleja lo que hay en la base y el conteo se recalcula al recargar.
- **Límite de 500 palabras contradictorio**: se muestra como advertencia explicada (US2-3).
- **Ráfaga de simulaciones**: Traefik devuelve 429 por IP; la página lo explica y no reintenta sola.
- **Petición de escritura sin `X-Requested-With`**: 403.
- **Paquete ZIP inexistente o todavía no listo**: 404; **ZIP ya purgado del volumen**: 410. Mensajes en español.
- **Pantalla de 360 px**: tablas con desplazamiento horizontal propio, sin desbordar la página.

## Requirements *(mandatory)*

### Functional Requirements

**Contenido (capa A presentada)**

- **FR-001**: El portal MUST mostrar el texto académico exactamente como está en `fuente/contenido.py`.
- **FR-002**: El portal MUST mostrar la descripción del proyecto con empresa, cliente, producto, objetivo
  del producto y objetivo del sprint.
- **FR-003**: El portal MUST mostrar los 4 integrantes con rol Scrum, responsabilidad, horas y tareas.
- **FR-004**: El portal MUST mostrar las 8 historias con texto, prioridad (Alta/Media/Baja), puntos
  Fibonacci y si están en el sprint.
- **FR-005**: El portal MUST mostrar las 15 tareas del sprint backlog con historia, responsable, horas y
  días planeados, en vistas de tabla, tablero, calendario y carga.
- **FR-006**: El portal MUST mostrar los eventos Scrum con día, hora, duración y facilitador.
- **FR-007**: El portal MUST mostrar las 4 reflexiones y la conclusión con su conteo de palabras.
- **FR-008**: Todo dato que no esté en el documento entregado (calendario por día, criterios de
  aceptación, horas de eventos, simulación) MUST rotularse como «complemento del portal».
- **FR-009**: El portal MUST indicar en el Resumen y en el sprint backlog que el sprint de AgendaFácil
  está planeado y no se ejecutó.

**Cálculo y verificación**

- **FR-010**: La API MUST calcular totales (puntos, horas, horas por persona, carga sobre capacidad,
  plan por día y burndown ideal) a partir de las tablas; el frontend MUST NOT contener cifras fijas.
- **FR-011**: La API MUST contar palabras con el mismo criterio que `fuente/construir.py`.
- **FR-012**: La API MUST evaluar cada requisito del enunciado y de la rúbrica (C1–C5, roles y formato:
  17 comprobaciones) y devolver la evidencia medida y el estado (cumplido / aviso).

**Simulación**

- **FR-013**: El visitante MUST poder lanzar una simulación con `iteraciones` 500–5000, `variabilidad`
  0.05–0.6 y `capacidad_horas_dia` 4–8; fuera de rango → 422.
- **FR-014**: La simulación MUST ejecutarse fuera del proceso de la API (cola de trabajos) y quedar
  registrada con parámetros, estado y resultado.
- **FR-015**: El resultado MUST incluir probabilidad de terminar a tiempo, distribución del día
  de término, burndown P10/P50/P90 frente al ideal, carga y término P50/P90 por persona y persona crítica.
- **FR-016**: El modelo MUST respetar la capacidad diaria por persona (lunes y viernes 2 h menos) y las
  dependencias explícitas de cada tarea (`depende_de`); la validación con la clínica (tarea 15) ocurre en
  la sprint review y no consume capacidad de trabajo.

**Entregables y metodología**

- **FR-017**: El portal MUST listar los entregables con tamaño, tipo y SHA-256 y permitir su descarga.
- **FR-018**: El visitante MUST poder pedir un ZIP de los entregables con manifiesto SHA-256, generado en
  segundo plano.
- **FR-019**: El portal MUST mostrar la página *Metodología* con los artefactos de spec-kit y BMAD y las
  figuras, separando capa A y capa B.

**Transversales**

- **FR-020**: Toda la interfaz y los mensajes de error MUST estar en español de México.
- **FR-021**: Las escrituras MUST exigir la cabecera `X-Requested-With: portal-sprintscrum` y estar
  limitadas por IP.
- **FR-022**: Cada vista MUST tener estados de carga, vacío y error con reintento.
- **FR-023**: El portal MUST cumplir WCAG 2.1 AA y ser usable desde 360 px de ancho.
- **FR-024**: El portal MUST exponer un chequeo de salud con el estado de la base y de la cola.

**Experiencia interactiva (US7)**

- **FR-025**: *Product backlog* MUST incluir un juego de planning poker (baraja 1, 2, 3, 5, 8, 13) en el
  que votan los tres desarrolladores y no el product owner, con puntaje 2/1/0 por historia y mejor marca
  en `localStorage` (si el almacenamiento no está disponible, el juego funciona sin guardarla).
- **FR-026**: *Sprint backlog* MUST animar el paso de tarjetas entre columnas con View Transitions,
  mostrar una barra de progreso de horas terminadas, y ofrecer las pestañas *La máquina* (figura
  isométrica del sprint) y, en *Calendario*, el diagrama de Gantt.
- **FR-027**: Las figuras isométricas interactivas MUST incrustarse como iframes del mismo origen cuya ruta solo puede
  ser `/figuras/<carpeta>/index.html` (carpeta en minúsculas y guiones; cualquier otro valor da
  `about:blank`); los mensajes a la figura MUST enviarse con `postMessage` restringido a `location.origin`.
- **FR-028**: Los diagramas MUST cargarse por id desde `/figuras/diagramas/indice.json` y ampliarse en un
  diálogo modal accesible.
- **FR-029**: Toda animación (transiciones de página y de tarjetas, aparición al desplazar, volteo de
  cartas, anillo de cumplimiento, confeti) MUST desactivarse con `prefers-reduced-motion: reduce` y
  degradar sin error en navegadores sin View Transitions.
- **FR-030**: *Resumen* MUST mostrar una cuenta regresiva al cierre de la entrega en Moodle (26 de octubre
  de 2026, 23:59).

### Key Entities

- **Proyecto**: datos generales de AgendaFácil (empresa, cliente, producto, objetivos, descripción,
  notas, conclusión). Una sola instancia.
- **Integrante**: persona del equipo con su rol Scrum y responsabilidad; tiene tareas y una reflexión.
- **Historia**: elemento del product backlog (HU-xx) con prioridad, puntos y si entra al sprint.
- **Tarea**: elemento del sprint backlog; pertenece a una historia y a un responsable; tiene horas y días.
- **Evento**: ceremonia Scrum del sprint con día, hora y facilitador.
- **Reflexión**: texto individual de un integrante.
- **Simulación**: corrida Monte Carlo pedida por un visitante, con parámetros y resultado.
- **Entregable**: archivo descargable con su huella SHA-256.
- **Paquete**: ZIP generado con los entregables y su manifiesto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % del texto académico del portal coincide con el .pdf entregado (comparación por
  apartado).
- **SC-002**: La página *Cumplimiento* muestra los 5 criterios de la rúbrica en verde; solo el límite de
  500 palabras (F.2) aparece como aviso (16 de 17 cumplen; C2.2 cumple desde que HU-08 incluye «para…»).
- **SC-003**: Las cifras del portal (50 puntos, 16 puntos, 51 h, 23/16/8/4 h, 125/183 palabras) coinciden
  con un recálculo manual.
- **SC-004**: Una simulación de 2000 iteraciones termina y se muestra en menos de 5 s.
- **SC-005**: Cualquier página carga su contenido en menos de 2 s en una conexión 4G.
- **SC-006**: Auditoría de accesibilidad automática sin errores críticos en todas las páginas.
- **SC-007**: Una consulta anónima con la llave `anon` de Supabase a cualquier tabla `SprintScrum_*`
  devuelve 0 filas o error de permisos.
- **SC-008**: Un despliegue con `deploy/deploy.sh` deja los 4 servicios 1/1 con la imagen del commit y el
  dominio responde con TLS válido.
- **SC-009**: Con `prefers-reduced-motion: reduce` no se ejecuta ninguna animación ni confeti, y todas las
  páginas muestran su contenido completo (US7).
- **SC-010**: Las 3 figuras isométricas interactivas y los 8 diagramas de `indice.json` cargan sin errores de CSP en
  producción y la figura de Galton reproduce el histograma de la última simulación.

## Assumptions

- El portal es público y de solo lectura; no requiere cuentas.
- El contenido académico puede cambiar hasta la entrega (roles y reflexiones son borradores a confirmar
  por el equipo); por eso se carga desde `contenido.py` y no se escribe en el código.
- El calendario por día de las tareas, los criterios de aceptación y las horas de los eventos son un
  complemento del portal definido en `scripts/plan_sprint.py` (junto con las dependencias entre tareas);
  el documento entregado no los incluye.
- Capacidad de referencia: 6 h/día por persona, 4 h lunes y viernes (26 h por semana).
- La profesora evalúa el documento en Moodle; el portal es material de apoyo.
- El .docx entregado usa Calibri 12 e interlineado 1,5 en todo el documento (también títulos y tablas) y
  el .pdf lo exporta Microsoft Word desde ese mismo .docx (`../fuente/construir.py`), así que ambos son
  idénticos.
