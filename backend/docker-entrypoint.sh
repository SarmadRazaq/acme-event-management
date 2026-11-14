#!/bin/sh
# Container entrypoint: bring the database schema up to date, then run the given command.
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Starting: $*"
exec "$@"
