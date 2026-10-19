# Imagen única para la API (uvicorn) y el worker (celery); cambia solo el comando.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/app ./app
# Archivos entregables (documento, ZIP para Moodle, figuras, datos, specs, BMAD): deploy.sh ejecuta scripts/preparar_entregables.py
COPY entregables ./entregables
RUN mkdir -p /data/paquetes

RUN useradd --uid 10001 --no-create-home app && chown -R app /app /data
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--no-server-header"]
