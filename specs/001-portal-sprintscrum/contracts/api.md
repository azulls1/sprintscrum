# Contrato REST — `https://sprintscrum.iagentek.com.mx/api`

JSON UTF-8. Errores con forma `{"detail": "<mensaje en español>"}` y el código HTTP correspondiente.
Días: `1 = lunes … 5 = viernes`. Todas las cifras de totales se **calculan** en cada respuesta.
Implementación: `backend/app/main.py` (sin `/docs` ni `/openapi.json` en producción).

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/health` | 200 | 503 si falta db o redis |
| GET | `/resumen` | 200 | 404 si el contenido no está cargado |
| GET | `/proyecto` | 200 | 404 |
| GET | `/equipo` | 200 | |
| GET | `/backlog` | 200 | |
| GET | `/sprint` | 200 | |
| GET | `/reflexiones` | 200 | |
| GET | `/conclusion` | 200 | |
| GET | `/cumplimiento` | 200 | |
| POST | `/simulacion` | **202** `{id, estado}` | 403 sin cabecera · 422 rango · 429 límite · 503 cola |
| GET | `/simulacion/{id}` | 200 | 404 |
| GET | `/simulacion/ultima` | 200 | 404 si nunca hubo una completada |
| GET | `/entregables` | 200 | |
| GET | `/entregables/archivo?ruta=…[&ver=1]` | 200 binario | 404 si la ruta no está en el catálogo |
| POST | `/entregables/generar` | **202** `{paquete_id}` o `{paquete_id, reutilizado: true}` | 403 · 429 · 503 |
| GET | `/entregables/paquete/{id}` | 200 | 404 |
| GET | `/entregables/paquete/{id}/descargar` | 200 `application/zip` | 404 si no existe o no está listo · 410 si el ZIP ya no está |

**Cabeceras**: toda petición `POST` exige `X-Requested-With: portal-sprintscrum` (si falta → 403); el
frontend la añade a toda llamada a `/api/`. CORS solo para el propio dominio (en desarrollo, también
`http://localhost:4200`). En Traefik: límite de cuerpo 8192 bytes; tasa por IP de 20/s (ráfaga 60) en
lecturas y de 20/min (ráfaga 10) en `POST`. Las descargas usan `Content-Disposition: attachment`;
con `ver=1`, `inline` (el PDF o la figura se abren en el navegador).

---

## GET `/health`

```json
{ "status": "ok", "db": true, "redis": true }
```

Con algún componente caído: `"status": "degradado"` y código 503.

## GET `/resumen`

```json
{
  "proyecto": { "id": "agendafacil", "producto": "AgendaFácil", "empresa": "Nexo Digital Solutions",
                "cliente": "Clínica Dental Sonrisa Plena", "…": "fila completa de SprintScrum_proyecto" },
  "kpis": {
    "historias": 8, "puntos_backlog": 50,
    "historias_sprint": 3, "puntos_sprint": 16,
    "tareas": 15, "horas": 51.0,
    "integrantes": 4, "dias": 5, "eventos": 7,
    "simulaciones": 12
  },
  "integrantes": [ { "id": 1, "nombre": "Adonai Samael Hernández Mata", "nombre_corto": "Adonai Hernández", "…": "…" } ]
}
```

`kpis.simulaciones` cuenta las simulaciones completadas guardadas.

## GET `/proyecto`

```json
{
  "id": "agendafacil",
  "empresa": "Nexo Digital Solutions",
  "cliente": "Clínica Dental Sonrisa Plena",
  "producto": "AgendaFácil",
  "objetivo_producto": "bajar las inasistencias del 25 % a menos del 10 % …",
  "objetivo_sprint": "entregar un primer incremento funcional …",
  "descripcion": ["Empresa: Nexo Digital Solutions, …", "Producto: AgendaFácil, …", "…", "…"],
  "portada": { "asignatura": "Metodología de Diseño y Gestión de Proyectos", "equipo": "Equipo 2073 F",
               "profesora": "Adriana Cervantes Castillo", "fecha": "Octubre de 2026", "…": "…" },
  "duracion_dias": 5, "nota_backlog": "…", "nota_sprint": "…", "conclusion": "…",
  "actualizado_en": "2026-10-18T19:00:00Z",
  "palabras": 125
}
```

## GET `/equipo`

```json
{
  "integrantes": [
    { "id": 1, "nombre": "Adonai Samael Hernández Mata", "nombre_corto": "Adonai Hernández",
      "rol": "Product owner", "rol_scrum": "product_owner", "orden": 1,
      "responsabilidad": "Define y prioriza el product backlog, …",
      "carga": { "integrante_id": 1, "nombre": "Adonai Hernández", "rol": "Product owner",
                 "horas": 4.0, "tareas": 3, "por_dia": [1.0, 2.0, 0.0, 0.0, 1.0] },
      "tareas": [ { "id": 1, "…": "…" }, { "id": 9, "…": "…" }, { "id": 15, "…": "…" } ] },
    { "id": 2, "nombre": "Cesar Ivan Martinez Perez", "nombre_corto": "Cesar Martinez",
      "rol": "Scrum master y desarrollador (pruebas)", "rol_scrum": "scrum_master", "…": "…" }
  ],
  "eventos": [ { "id": 1, "nombre": "Sprint planning", "dia": 1, "dia_nombre": "Lun", "hora": "09:00",
                 "duracion_min": 120, "facilitador": "Cesar Martinez", "descripcion": "…" } ],
  "proyecto": { "…": "fila de SprintScrum_proyecto" }
}
```

(4 integrantes; Cesar 8 h, Mauricio 23 h, Diego 16 h.)

## GET `/backlog`

```json
{
  "nota": "Estimación en puntos de historia (serie de Fibonacci: 1, 2, 3, 5, 8, 13). …",
  "historias": [
    { "id": "HU-01", "orden": 1,
      "texto": "Como paciente quiero registrarme con mi nombre, teléfono y correo para poder agendar citas.",
      "prioridad": "Alta", "puntos": 3, "en_sprint": true,
      "criterios": ["…"] }
  ]
}
```

## GET `/sprint`

```json
{
  "objetivo_sprint": "entregar un primer incremento funcional …",
  "nota": "Sprint de cinco días hábiles. Eventos: …",
  "dias": ["Lun", "Mar", "Mié", "Jue", "Vie"],
  "historias": [ { "id": "HU-01", "puntos": 3, "horas": 13.0, "n_tareas": 5, "…": "…" },
                 { "id": "HU-02", "puntos": 5, "horas": 18.0, "n_tareas": 5, "…": "…" },
                 { "id": "HU-03", "puntos": 8, "horas": 20.0, "n_tareas": 5, "…": "…" } ],
  "tareas": [
    { "id": 3, "historia_id": "HU-01",
      "nombre": "Programar la API de registro con validación de teléfono y correo",
      "responsable_id": 3, "responsable": "Mauricio Alvarez", "horas": 4.0, "tipo": "backend",
      "dia_inicio": 1, "dia_fin": 2, "depende_de": [1, 2] }
  ],
  "eventos": [
    { "id": 1, "nombre": "Sprint planning", "dia": 1, "dia_nombre": "Lun", "hora": "09:00",
      "duracion_min": 120, "facilitador": "Cesar Martinez", "descripcion": "…" },
    { "id": 6, "nombre": "Sprint review", "dia": 5, "dia_nombre": "Vie", "hora": "15:00",
      "duracion_min": 60, "facilitador": "Adonai Hernández", "descripcion": "…" }
  ],
  "carga": [ { "integrante_id": 3, "nombre": "Mauricio Alvarez", "rol": "Desarrollador (backend)",
               "horas": 23.0, "tareas": 6, "por_dia": [4.0, 5.0, 5.0, 6.0, 3.0] } ],
  "burndown": [
    { "dia": "Inicio", "ideal": 51.0, "plan": 51.0 },
    { "dia": "Lun", "ideal": 40.8, "plan": 42.0 },
    { "dia": "Mar", "ideal": 30.6, "plan": 30.0 },
    { "dia": "Mié", "ideal": 20.4, "plan": 19.0 },
    { "dia": "Jue", "ideal": 10.2, "plan": 8.0 },
    { "dia": "Vie", "ideal": 0.0, "plan": 0.0 }
  ]
}
```

Regla de reparto: una tarea de varios días reparte sus horas en partes iguales entre ellos.

## GET `/reflexiones`

```json
[ { "integrante_id": 1, "nombre": "Adonai Samael Hernández Mata", "rol": "Product owner",
    "rol_scrum": "product_owner", "titulo": "Adonai Samael Hernández Mata — Product owner",
    "texto": "Como product owner, mi trabajo durante el sprint empieza …", "palabras": 172 } ]
```

## GET `/conclusion`

```json
{ "texto": "Planear este sprint nos mostró que Scrum no consiste en hacer más rápido, …",
  "palabras": 183, "equipo": "Equipo 2073 F" }
```

## GET `/cumplimiento`

Lista de 17 requisitos (`backend/app/cumplimiento.py`): C1.1, C1.2, R.1, R.2, C2.1–C2.4, C3.1–C3.3,
C4.1–C4.3, C5.1, F.1 (fuente e interlineado leídos del .docx) y F.2. C2.2 y F.2 se marcan como **aviso**
cuando no se cumplen (`aviso: true`), no como fallo del sistema. Con el contenido actual cumplen 16 de 17:
solo F.2 queda como aviso.

```json
[
  { "id": "C1.1", "criterio": "C1", "texto": "Descripción del proyecto de 150 palabras como máximo",
    "cumplido": true, "aviso": false, "evidencia": "125 palabras", "ruta": "/proyecto" },
  { "id": "R.1", "criterio": "Roles", "texto": "Product owner, Scrum master y al menos dos desarrolladores",
    "cumplido": true, "aviso": false, "evidencia": "PO, SM y 3 personas con rol de desarrollo", "ruta": "/equipo" },
  { "id": "C2.2", "criterio": "C2", "texto": "Historias redactadas como «Como… quiero… para…»",
    "cumplido": true, "aviso": false, "evidencia": "las 8", "ruta": "/product-backlog" },
  { "id": "F.1", "criterio": "Formato", "texto": "Calibri 12 e interlineado 1,5", "cumplido": true,
    "aviso": false, "evidencia": "Calibri 12 pt · interlineado 1.5 (Actividad1_Grupal_Equipo2073F.docx)",
    "ruta": "/entregables" },
  { "id": "F.2", "criterio": "Formato", "texto": "Extensión máxima de 500 palabras (1 página)",
    "cumplido": false, "aviso": true,
    "evidencia": "Solo descripción, reflexiones y conclusión suman 977 palabras: el límite contradice lo obligatorio (cuatro reflexiones de 150–200). Pendiente de confirmar con la profesora en el foro.",
    "ruta": "/cumplimiento" }
]
```

## POST `/simulacion`

Petición (todos opcionales; por defecto 2000 / 0.25 / 6 / sin semilla):

```json
{ "iteraciones": 2000, "variabilidad": 0.25, "capacidad_horas_dia": 6, "semilla": null }
```

Rangos: `iteraciones` 500–5000, `variabilidad` 0.05–0.6, `capacidad_horas_dia` 4–8, `semilla` 0–2³¹−1.

Respuesta **202**: `{ "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "estado": "pendiente" }`

422: error de validación estándar de FastAPI/Pydantic (`{"detail": [ … ]}`).

## GET `/simulacion/{id}` · `/simulacion/ultima`

Valores **ilustrativos** (dependen de los parámetros y de la semilla); los nombres de campo son los de
`simulacion.simular()`:

```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "estado": "completada",
  "parametros": { "iteraciones": 2000, "variabilidad": 0.25, "capacidad_horas_dia": 6, "semilla": null },
  "error": null,
  "duracion_ms": 412,
  "creado_en": "2026-10-18T19:40:02Z",
  "completado_en": "2026-10-18T19:40:03Z",
  "resultado": {
    "parametros": { "iteraciones": 2000, "variabilidad": 0.25, "capacidad_horas_dia": 6, "semilla": null },
    "plazo_horas": 26.0,
    "total_estimado_horas": 51.0,
    "prob_a_tiempo": 0.52,
    "termino": { "p10": 4.19, "p50": 4.97, "p90": 5.58 },
    "termino_plan_dia": 4.75,
    "histograma": [ { "etiqueta": "Jue PM", "n": 102, "proporcion": 0.051 },
                    { "etiqueta": "Vie AM", "n": 335, "proporcion": 0.1675 },
                    { "etiqueta": "Vie PM", "n": 602, "proporcion": 0.301 },
                    { "etiqueta": "Después del viernes", "n": 961, "proporcion": 0.4805 } ],
    "burndown": [ { "dia": "Inicio", "ideal": 51.0, "plan": 51.0, "p10": 47.5, "p50": 52.4, "p90": 57.6 },
                  { "dia": "Lun", "ideal": 40.8, "plan": 44.0, "p10": 40.5, "p50": 45.4, "p90": 50.6 } ],
    "historias": [ { "id": "HU-03", "puntos": 8, "prob_terminada": 0.52 } ],
    "puntos": { "comprometidos": 16, "esperados": 12.16, "prob_todos": 0.52 },
    "carga": [ { "integrante_id": 2, "nombre": "Cesar Martinez", "horas_estimadas": 8.0,
                 "capacidad_sprint": 26.0, "ocupacion": 0.308, "termino_p50_dia": 4.94,
                 "termino_p90_dia": 5.57, "prob_a_tiempo": 0.54 } ],
    "persona_critica": "Cesar Martinez",
    "duracion_ms": 380
  }
}
```

Días como número continuo: `4.75` = viernes al 75 % de la jornada; `> 5` = después del viernes.
Estados: `pendiente` → `completada` | `error` (con `"error": "…"`, mensaje genérico).

## GET `/entregables`

```json
{
  "archivos": [ { "ruta": "documento/Actividad1_Grupal_Equipo2073F.pdf",
                  "nombre": "Documento de la actividad (PDF)", "tipo": "PDF", "criterio": "Entrega",
                  "detalle": "El mismo documento en PDF, listo para leer", "bytes": 135661,
                  "sha256": "71aa8aa0d6299f7a6b3666d1e9e81c813450b285b88071af92f2533b8207db97" } ],
  "total_bytes": 2950000,
  "entrega": { "ruta": "documento/Actividad1_Grupal_Equipo2073F_Moodle.zip", "tipo": "Paquete", "…": "…",
               "contenido": [ { "nombre": "Actividad1_Grupal_Equipo2073F.pdf", "bytes": 135661 } ],
               "leeme": "# Actividad 1 grupal — …" },
  "ultimo_paquete": { "id": "…", "estado": "completada", "archivo": "…", "…": "…" },
  "recientes": [ { "id": "…", "estado": "completada", "…": "…" } ]
}
```

Descarga: `/api/entregables/archivo?ruta=<ruta>`; con `&ver=1` se sirve en línea.

## POST `/entregables/generar` → GET `/entregables/paquete/{id}`

Respuesta **202**: `{ "paquete_id": "…" }`, o `{ "paquete_id": "…", "reutilizado": true }` si ya hay uno
en curso o el último sigue vigente (posterior al catálogo desplegado). Consulta:

```json
{ "id": "…", "estado": "completada",
  "archivo": "SprintScrum_Actividad1_Equipo2073F_20261018-194100_7c9e6679.zip",
  "n_archivos": 28, "bytes": 2048311, "sha256": "…", "error": null,
  "creado_en": "2026-10-18T19:41:00Z", "completado_en": "2026-10-18T19:41:01Z" }
```

Descarga: `/api/entregables/paquete/{id}/descargar`. El ZIP incluye `MANIFIESTO_SHA256.txt` en formato de
`sha256sum` (`<hash>  <ruta>`). Se conservan los 3 paquetes más recientes.
