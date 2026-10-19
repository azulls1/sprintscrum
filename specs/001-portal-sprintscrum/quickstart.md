# Quickstart — Portal SprintScrum

Rutas relativas a la raíz del repositorio `sprintscrum/` (remoto `github.com/azulls1/sprintscrum`).
El contenido académico está un nivel arriba, en `../fuente/contenido.py`; `scripts/plan_sprint.py` lo copia
a `fuente/contenido.py` del repo para que un clon se pueda reproducir solo.

## Requisitos

Python 3.11 · Node 22+ (la imagen usa Node 24) + npm · Docker · `psql` · acceso SSH al servidor (solo para desplegar; host y llave en `deploy/.env.deploy`, fuera del repositorio).

## 1. Desarrollo local

```bash
# Redis
docker run -d --name sprintscrum-redis -p 6379:6379 redis:7-alpine

# Postgres local (o un túnel al de Supabase maestría)
docker run -d --name sprintscrum-pg -p 5432:5432 -e POSTGRES_PASSWORD=local postgres:15-alpine
export DATABASE_URL="postgresql://postgres:local@localhost:5432/postgres"
export REDIS_URL="redis://localhost:6379/0" REDIS_RESULT_URL="redis://localhost:6379/1"
export ENTREGABLES_DIR="$PWD/entregables" PAQUETES_DIR="/tmp/sprintscrum-paquetes"

# Generar la semilla (contenido.py + plan_sprint.py) y el catálogo de entregables
python3 scripts/generar_semilla.py          # → db/migraciones/003_contenido.sql
python3 scripts/preparar_entregables.py     # → entregables/ y db/catalogo_entregables.sql

# Esquema, contenido, catálogo y seguridad (en local, crear antes los roles anon/authenticated)
psql "$DATABASE_URL" -f db/migraciones/001_esquema.sql
psql "$DATABASE_URL" -f db/migraciones/003_contenido.sql
psql "$DATABASE_URL" -f db/catalogo_entregables.sql
psql "$DATABASE_URL" -v app_password="'local'" -f db/migraciones/002_seguridad.sql

# Backend
cd backend && uv venv .venv -p 3.11 && uv pip install -p .venv -r requirements.txt pytest

# API y worker (dos terminales, desde backend/)
.venv/bin/uvicorn app.main:app --reload --port 8000
.venv/bin/celery -A app.celery_app worker -l info --concurrency 2

# Frontend (proxy.conf.json manda /api a la API de producción; cámbialo a http://localhost:8000 para usar la local)
cd frontend && npm ci && npx ng serve    # http://localhost:4200
```

En local el DSN se toma de `DATABASE_URL`; en Swarm, del archivo `DATABASE_URL_FILE=/run/secrets/sprintscrum_db_dsn`
(secreto `sprintscrum_db_dsn_v1`).

## 2. Comprobaciones antes de desplegar

```bash
cd backend && .venv/bin/python -m pytest -q    # simulación: capacidad, dependencias, semilla, persona crítica
cd frontend && npx ng build                   # sin errores ni advertencias de presupuesto
curl -s localhost:8000/api/cumplimiento | jq 'map(select(.cumplido | not)) | map({id, aviso})'
# → solo un aviso: F.2 (límite de 500 palabras); 16 de 17 cumplen
curl -s localhost:8000/api/resumen | jq '.kpis | {puntos_backlog, puntos_sprint, horas}'
# → 50, 16, 51.0
curl -s -X POST localhost:8000/api/simulacion -H 'X-Requested-With: portal-sprintscrum' \
     -H 'Content-Type: application/json' -d '{"iteraciones":2000,"variabilidad":0.25,"capacidad_horas_dia":6}'
```

## 3. Cambiar el contenido académico

1. Editar **solo** `../fuente/contenido.py`.
2. `python3 ../fuente/construir.py` (regenera el .docx en Calibri 12 / 1,5, exporta el .pdf con Microsoft
   Word y valida palabras).
3. `deploy/deploy.sh` (corre `scripts/generar_semilla.py` y `scripts/preparar_entregables.py` y aplica
   `003_contenido.sql` y el catálogo en Supabase maestría).
4. Revisar la página *Cumplimiento*.

## 4. Despliegue en producción

Una sola vez en el servidor (configurado en `deploy/.env.deploy`, fuera del repositorio): guardar
`SPRINTSCRUM_DB_PASSWORD` en un archivo de secretos en el servidor (nunca en el repo). El rol, las migraciones y el secreto `sprintscrum_db_dsn_v1` los crea `deploy.sh` si faltan.

Cada despliegue, desde la raíz del repo:

```bash
deploy/deploy.sh
```

`deploy.sh`:

1. Toma `TAG=$(git rev-parse --short=12 HEAD)` y le añade `-dirty` si hay cambios sin commit en
   `backend`, `frontend`, `deploy`, `db` o `docs`.
2. Regenera la semilla y los entregables (`generar_semilla.py`, `preparar_entregables.py`).
3. Sincroniza el repo con `rsync` al directorio del stack en el servidor.
4. En el servidor aplica `001_esquema.sql`, `003_contenido.sql`, `catalogo_entregables.sql` y, al final,
   `002_seguridad.sql`.
5. Construye `sprintscrum-backend:$TAG` (la usan `api` y `worker`) y `sprintscrum-frontend:$TAG`; crea el
   secreto del DSN si falta.
6. `docker stack deploy -c deploy/stack.yml sprintscrum` y fuerza la imagen nueva con `docker service update`.
7. Muestra réplicas e imagen de `sprintscrum_api`, `_worker`, `_web` y `_redis`, el estado de los
   contenedores, el código HTTP de la portada y `https://sprintscrum.iagentek.com.mx/api/health`.

Rollback: `git checkout <sha-anterior> && deploy/deploy.sh` (los servicios con `update_config` usan
`failure_action: rollback`).

Redis: la API y el worker usan `redis://sprintscrum_redis:6379`. En una red overlay compartida el nombre
corto `redis` puede resolver al servicio de otro stack; por eso se usa el nombre calificado `sprintscrum_redis`.

## 5. Verificación de seguridad

```bash
# anon de Supabase no ve filas (SC-007)
curl -s "https://<supabase-maestria>/rest/v1/SprintScrum_historias" -H "apikey: $ANON_KEY" # → [] o 401/403
# escritura sin cabecera → 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://sprintscrum.iagentek.com.mx/api/simulacion
# cabeceras
curl -sI https://sprintscrum.iagentek.com.mx | grep -iE 'strict-transport|content-security|x-content-type'
# cuerpo mayor a 8192 bytes en un POST → 413
```
