"""Gunicorn settings for production.

Gunicorn is the process manager: it starts several Uvicorn worker processes (each running
the async FastAPI app) and restarts any worker that crashes.
"""

import os

bind = "0.0.0.0:8000"
# Number of worker processes; override with the WEB_CONCURRENCY environment variable.
workers = int(os.getenv("WEB_CONCURRENCY", "2"))
worker_class = "uvicorn_worker.UvicornWorker"
# Give slow requests time to finish during a graceful restart / shutdown.
graceful_timeout = 30
timeout = 60
keepalive = 5
# Trust X-Forwarded-* headers from the nginx reverse proxy in front of us.
forwarded_allow_ips = "*"
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
