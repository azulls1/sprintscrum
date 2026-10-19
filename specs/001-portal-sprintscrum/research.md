# Research — Fase 0

Cada decisión resuelve una incógnita del contexto técnico. Formato: Decisión · Justificación · Alternativas.

## R1. Modelo de la simulación del sprint

- **Decisión**: Monte Carlo con duración real de cada tarea = `horas_estimadas × LogNormal(μ = 0, σ)`.
  Reglas de cada iteración:
  1. Cada persona trabaja sus tareas en orden (`dia_inicio`, luego número de tarea), una a la vez.
  2. Capacidad diaria `c` (parámetro, 4–8 h); lunes y viernes `c − 2` por los eventos
     (planning 2 h; review + retrospectiva 2 h).
  3. Las dependencias son **explícitas por tarea** (columna `depende_de smallint[]`, definida en
     `DEPENDENCIAS` de `scripts/plan_sprint.py`), no se infieren por tipo: p. ej. la prueba de punta a
     punta (14) espera a 5, 10, 11 y 13; la validación (15) espera al correo (12) y a la prueba 14.
  4. La tarea 15 (validar con la clínica) ocurre dentro de la sprint review: no consume capacidad de
     trabajo; solo marca el instante en que todo lo que necesita está terminado.
  5. «A tiempo» = todo el trabajo termina dentro de la capacidad acumulada hasta el cierre del viernes
     (26 h por persona con `c` = 6).
  Salidas (`simulacion.simular()`): `prob_a_tiempo`, `termino` P10/P50/P90 y `termino_plan_dia`,
  histograma del día de término en medios días (incluye «Después del viernes»), burndown
  P10/P50/P90 al cierre de cada día frente al ideal y al plan, probabilidad por historia, puntos
  esperados, carga y término P50/P90 por persona y persona crítica (la de menor probabilidad de terminar
  su propio trabajo a tiempo). Parámetros por defecto: 2000 iteraciones, σ = 0.25, `c` = 6; la semilla
  (opcional) se guarda en `parametros` para poder repetir la corrida. Con esos valores el plan
  determinista termina el viernes al 75 % de la jornada, P(a tiempo) ≈ 50 % y la persona crítica es
  Cesar (pruebas, al final de la cadena).
- **Justificación**: la lognormal con μ = 0 deja la **mediana** igual a la estimación y una cola larga a la
  derecha (media `e^{σ²/2}` > 1), que es como se desvían las estimaciones reales: se atrasan más de lo
  que se adelantan y nunca duran menos de cero. σ = 0.25 equivale a ±25 % típico; 0.6 modela un equipo
  sin historial. En Python puro (`random.lognormvariate`, sin NumPy), 5000 iteraciones × 15 tareas tardan
  menos de un segundo.
- **Alternativas**: PERT/triangular (pide tres estimaciones que el documento no tiene); normal (admite
  duraciones negativas y es simétrica); simulación de eventos discretos con SimPy (dependencia extra para
  14 tareas).

## R2. Trabajos asíncronos: Celery + Redis

- **Decisión**: Celery 5.6 con Redis 7 como broker y backend de resultados; dos tareas
  (`sprintscrum.simular_sprint`, `sprintscrum.generar_entregable`). La API inserta la fila
  (`estado = pendiente`), encola con el id y responde 202; el worker actualiza la fila. El frontend
  consulta `/simulacion/{id}` cada 600 ms (el paquete, cada 700 ms) hasta `completada` o `error`, con un
  tope de 60 s. `acks_late`, `time_limit = 60 s`, concurrencia 2.
- **Justificación**: la simulación y el ZIP son CPU/E-S que no deben bloquear Uvicorn; la fila en Postgres
  es la fuente de verdad del estado (sobrevive a reinicios de Redis) y permite «última simulación».
  Mismo patrón ya operado en el VPS en otros portales.
- **Lección del despliegue**: en una red overlay compartida el nombre corto `redis` puede resolver al
  servicio de otro stack; por eso la API y el worker usan el nombre calificado `sprintscrum_redis`
  (`redis://sprintscrum_redis:6379`), nunca `redis` a secas.
- **Alternativas**: `BackgroundTasks` de FastAPI (muere con el proceso, sin límite de concurrencia); RQ /
  Dramatiq (otra herramienta que operar); WebSocket para el estado (innecesario para < 5 s).

## R3. Base de datos: Supabase maestría frente a Postgres propio

- **Decisión**: usar el Postgres 15 del stack existente `supabase-maestria` (esquema `public`, tablas con
  prefijo `SprintScrum_`), con rol propio `sprintscrum_app`, RLS forzado y DSN como secreto Swarm
  `sprintscrum_db_dsn_v1`. El servicio `api`/`worker` se une a la red interna de ese stack.
- **Justificación**: ya respaldado y monitoreado; un Postgres más en un VPS de un nodo es memoria y
  operación extra para ~40 filas. El prefijo y el rol aíslan los datos de otros proyectos de la maestría;
  RLS forzado impide que la API REST de Supabase (`anon`) los exponga.
- **Alternativas**: Postgres propio en el stack (aislamiento total, pero más mantenimiento); SQLite en
  volumen (no compartible de forma segura entre `api` y `worker`); JSON estático (contradice «datos
  calculados» y no guarda simulaciones).

## R4. Datos en el frontend: `httpResource` de Angular

- **Decisión**: cada página declara `httpResource()` sobre su endpoint; la plantilla usa `isLoading()`,
  `error()`, `value()` y `reload()` para los estados de carga, error y reintento (FR-022). La simulación y el
  paquete de entregables usan `HttpClient.post` y un sondeo con `HttpClient.get` + `setTimeout`. Un
  interceptor (en `app.config.ts`) añade `X-Requested-With: portal-sprintscrum` a toda petición a `/api/`.
- **Justificación**: integra la petición con signals sin `subscribe` manual; los estados quedan uniformes
  en las 11 páginas con un único componente `estado` (`componentes/estado.ts`).
- **Alternativas**: servicios con `HttpClient` + `toSignal` (más código repetido); NgRx (excesivo para
  lectura).

## R5. Middlewares de Traefik

- **Decisión**: middlewares propios por labels en `deploy/stack.yml` (sin tocar la configuración global):
  - `sprintscrum-hsts` (headers): HSTS 1 año, sin subdominios.
  - `sprintscrum-cabeceras-api` (headers): `contentTypeNosniff`, `frameDeny`, `referrerPolicy: no-referrer`.
  - `sprintscrum-limite` (rateLimit): 20 peticiones/s promedio, ráfaga 60, por IP, en `web` y en lecturas
    de la API.
  - `sprintscrum-limite-escritura` (rateLimit): 20 peticiones/min, ráfaga 10, en el router de escrituras
    (`PathPrefix(/api) && Method(POST)`, prioridad 110).
  - `sprintscrum-cuerpo` (buffering): `maxRequestBodyBytes = 8192`.
  Routers: `Host(sprintscrum.iagentek.com.mx)` → `web` (prioridad 10); `… && PathPrefix(/api)` → `api`
  (prioridad 100). La CSP, `Permissions-Policy`, `X-Frame-Options` y gzip del SPA los pone nginx
  (`frontend/seguridad-headers.conf`, `nginx.conf`).
- **Justificación**: la seguridad se aplica en el borde y es igual para todos los servicios; la API solo
  valida rangos y la cabecera.
- **Alternativas**: límites en la app con `slowapi` (estado por réplica, duplica lógica); nginx como
  proxy intermedio (otra capa).

## R6. Conteo de palabras

- **Decisión**: `consultas.palabras()` replica el criterio de `fuente/construir.py`:
  `len(re.findall(r"\b[\wÁÉÍÓÚÑáéíóúñü%-]+\b", texto))`. Ambos dan las mismas cifras sobre los textos de
  `contenido.py`: descripción 125, reflexiones 172 / 164 / 167 / 166 (Adonai, Cesar, Mauricio, Diego),
  conclusión 183, documento ≈ 1238.
- **Justificación**: la rúbrica y el portal deben dar la misma cifra; si difieren, manda el script que
  genera el documento entregado.
- **Alternativas**: guardar el conteo en la base (dato escrito a mano, viola el principio II).

## R7. Movimiento, figuras incrustadas y accesibilidad (ampliación US7)

- **Decisión**: animar con la **View Transitions API** (transición entre páginas con
  `withViewTransitions({ skipInitialTransition: true })` y tarjetas del Kanban con `view-transition-name`
  vía `conTransicion()` en `core/movimiento.ts`) y con CSS propio en `styles.css` (aparición al desplazar,
  volteo de cartas, anillo); el confeti es un `<canvas>` temporal escrito a mano. Sin biblioteca de
  animación.
- **Accesibilidad**: `prefers-reduced-motion: reduce` desactiva todo (reglas CSS y `sinMovimiento()`, que
  también salta las View Transitions y el confeti); sin soporte de View Transitions el cambio ocurre sin
  animación. El canvas del confeti es `aria-hidden` y no captura eventos.
- **Figuras**: iframes del mismo origen (`componentes/figura.ts`); la carpeta debe cumplir
  `^[a-z][a-z-]*$` y la ruta se construye como `/figuras/<carpeta>/index.html` (si no, `about:blank`)
  antes de `bypassSecurityTrustResourceUrl`, así que nunca se incrusta una URL arbitraria. `postMessage`
  usa `location.origin` como destino y la figura de Galton solo acepta mensajes de su mismo origen. La
  CSP (`script-src 'self'`) se mantiene: las figuras no usan scripts en línea.
- **Justificación**: cero dependencias nuevas y menos peso en el bundle; la API es nativa y degrada sola.
- **Alternativas**: Angular Animations o GSAP (más peso y sin ventaja para estos casos); figuras como
  componentes Angular (perderían la independencia de las páginas `index.html` de las figuras isométricas).
