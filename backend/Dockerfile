# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- build stage
# Install dependencies into a virtual env in a throwaway image, so build tools
# never end up in the final image.
FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install -r requirements.txt

# ---------------------------------------------------------------- runtime stage
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    WEB_CONCURRENCY=2

# Run as an unprivileged user: if the app were compromised, the attacker would not be root.
RUN groupadd --system app && useradd --system --gid app --home-dir /app app

WORKDIR /app
# gunicorn writes a small control socket into its working directory.
RUN chown app:app /app
COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app alembic.ini ./
COPY --chown=app:app alembic ./alembic
COPY --chown=app:app app ./app
COPY --chown=app:app scripts ./scripts
COPY --chown=app:app docker-entrypoint.sh gunicorn.conf.py ./
RUN chmod +x docker-entrypoint.sh

USER app
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"

# The entrypoint applies database migrations, then starts gunicorn.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["gunicorn", "app.main:app", "-c", "gunicorn.conf.py"]
