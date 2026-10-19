"""Instancia de Celery: Redis como broker y como backend de resultados."""
from celery import Celery

from .config import config

celery = Celery("sprintscrum", broker=config().redis_url, backend=config().redis_resultados,
                include=["app.tareas"])
celery.conf.update(
    task_serializer="json", result_serializer="json", accept_content=["json"],
    task_acks_late=True, worker_prefetch_multiplier=1,
    task_time_limit=60, result_expires=3600, broker_connection_retry_on_startup=True,
)
