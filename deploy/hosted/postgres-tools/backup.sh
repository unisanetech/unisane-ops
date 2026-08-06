#!/bin/sh
set -eu
. /opt/unisane-ops/lib.sh

: "${OPS_HOSTED_POSTGRES_URL_FILE:?Set OPS_HOSTED_POSTGRES_URL_FILE}"
: "${OPS_HOSTED_BACKUP_PATH:?Set OPS_HOSTED_BACKUP_PATH}"

service_file="$(mktemp)"
trap 'rm -f "$service_file"' EXIT HUP INT TERM
secret_service_file "$OPS_HOSTED_POSTGRES_URL_FILE" source "$service_file"

umask 077
PGSERVICEFILE="$service_file" pg_dump \
  --dbname=service=source \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$OPS_HOSTED_BACKUP_PATH"
test -s "$OPS_HOSTED_BACKUP_PATH"
