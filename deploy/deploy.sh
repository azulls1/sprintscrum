#!/usr/bin/env bash
# Despliega SprintScrum en el Docker Swarm del VPS iaGentek.
#   1) regenera semilla y entregables   2) sincroniza el código al VPS   3) migra Supabase maestría
#   4) construye las imágenes con el sha del commit   5) crea el secreto del DSN si falta
#   6) stack deploy + fuerza la imagen nueva   7) verifica especificación, contenedores y contenido servido
set -euo pipefail

# Datos del servidor: en deploy/.env.deploy (fuera del repositorio; plantilla en deploy/.env.deploy.ejemplo)
CONFIG="$(cd "$(dirname "$0")" && pwd)/.env.deploy"
[[ -f "$CONFIG" ]] || { echo "Falta deploy/.env.deploy (copia deploy/.env.deploy.ejemplo y llénalo)"; exit 1; }
set -a; source "$CONFIG"; set +a
: "${VPS:?}" "${PUERTO:?}" "${LLAVE:?}" "${DESTINO:?}" "${ARCHIVO_SECRETOS:?}" "${DB_SUPERUSUARIO:?}" "${DB_CONTENEDOR:?}"
DOMINIO=sprintscrum.iagentek.com.mx
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -p "$PUERTO" -i "$LLAVE" "$VPS")

cd "$RAIZ"
TAG="$(git rev-parse --short=12 HEAD 2>/dev/null || date +%Y%m%d%H%M%S)"
[[ -n "$(git status --porcelain -- backend frontend deploy db docs 2>/dev/null)" ]] && TAG="${TAG}-dirty"
echo "▶ Desplegando TAG=$TAG"
# Contenido académico (desde ../fuente/contenido.py) y catálogo de entregables con SHA-256
python3 scripts/generar_semilla.py
python3 scripts/preparar_entregables.py

rsync -az --delete -e "ssh -p $PUERTO -i $LLAVE" \
  --exclude .git --exclude '.venv*' --exclude node_modules --exclude dist --exclude .angular \
  --exclude .env.deploy --exclude __pycache__ --exclude .pytest_cache \
  ./ "$VPS:$DESTINO/src/"

"${SSH[@]}" bash -s -- "$TAG" "$DESTINO" "$DOMINIO" "$ARCHIVO_SECRETOS" "$DB_SUPERUSUARIO" "$DB_CONTENEDOR" <<'REMOTO'
set -euo pipefail
TAG="$1"; DESTINO="$2"; DOMINIO="$3"; ARCHIVO_SECRETOS="$4"; DB_SUPERUSUARIO="$5"; DB_CONTENEDOR="$6"
cd "$DESTINO/src"
source "$ARCHIVO_SECRETOS"   # SPRINTSCRUM_DB_PASSWORD (solo en el servidor, nunca en el repo)

echo "── Migraciones (Supabase maestría)"
DB=$(docker ps -q --filter "name=$DB_CONTENEDOR" | head -1)
psql_() { docker exec -i "$DB" psql -v ON_ERROR_STOP=1 -q -U "$DB_SUPERUSUARIO" -d postgres "$@"; }
psql_ < db/migraciones/001_esquema.sql
psql_ < db/migraciones/003_contenido.sql
psql_ < db/catalogo_entregables.sql
# Siempre al final: reaplica RLS y revoca anon/authenticated en cualquier tabla nueva
psql_ -v app_password="'$SPRINTSCRUM_DB_PASSWORD'" < db/migraciones/002_seguridad.sql 2>&1 | grep -v NOTICE || true

echo "── Imágenes"
docker build -q -f backend/Dockerfile -t "sprintscrum-backend:$TAG" -t sprintscrum-backend:latest .
docker build -q -f frontend/Dockerfile -t "sprintscrum-frontend:$TAG" -t sprintscrum-frontend:latest .

if ! docker secret inspect sprintscrum_db_dsn_v1 >/dev/null 2>&1; then
  printf 'postgresql://sprintscrum_app:%s@supabase-maestria_db:5432/postgres' "$SPRINTSCRUM_DB_PASSWORD" \
    | docker secret create sprintscrum_db_dsn_v1 - >/dev/null
  echo "secreto sprintscrum_db_dsn_v1 creado"
fi

TAG="$TAG" docker stack deploy -c deploy/stack.yml --resolve-image=never --detach=false sprintscrum
# «converged» no garantiza la imagen nueva: se fuerza explícitamente
for s in api worker; do docker service update -q --detach=false --image "sprintscrum-backend:$TAG" "sprintscrum_$s" >/dev/null; done
docker service update -q --detach=false --image "sprintscrum-frontend:$TAG" sprintscrum_web >/dev/null

echo "── Especificación"
for s in api worker web redis; do
  printf '%-20s %s  %s\n' "sprintscrum_$s" "$(docker service ls -f name=sprintscrum_$s --format '{{.Replicas}}')" \
    "$(docker service inspect sprintscrum_$s --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' | cut -d@ -f1)"
done
echo "── Contenedores"
docker ps --filter name=sprintscrum_ --format '{{.Names}}  {{.Status}}' | sed 's/\.[a-z0-9]\{25\}//'
echo "── Contenido servido"
sleep 6
curl -s -o /dev/null -w "web  %{http_code}  %{content_type}\n" "https://$DOMINIO/"
curl -s -w "\n" "https://$DOMINIO/api/health"
REMOTO
