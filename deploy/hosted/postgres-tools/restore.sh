#!/bin/sh
set -eu
. /opt/unisane-ops/lib.sh

: "${OPS_HOSTED_RECOVERY_ADMIN_URL_FILE:?Set OPS_HOSTED_RECOVERY_ADMIN_URL_FILE}"
: "${OPS_HOSTED_BACKUP_PATH:?Set OPS_HOSTED_BACKUP_PATH}"
: "${OPS_HOSTED_RECOVERY_DATABASE:?Set OPS_HOSTED_RECOVERY_DATABASE}"

case "$OPS_HOSTED_RECOVERY_DATABASE" in
  *[!a-z0-9_]*|'') echo "Recovery database name is invalid." >&2; exit 1 ;;
esac

service_file="$(mktemp)"
trap 'rm -f "$service_file"' EXIT HUP INT TERM
secret_service_file "$OPS_HOSTED_RECOVERY_ADMIN_URL_FILE" admin "$service_file"

exists="$(PGSERVICEFILE="$service_file" psql --no-psqlrc --tuples-only --no-align \
  --dbname=service=admin \
  --command="SELECT 1 FROM pg_database WHERE datname = '$OPS_HOSTED_RECOVERY_DATABASE'")"
if [ -n "$exists" ]; then
  echo "Recovery database must not already exist." >&2
  exit 1
fi

PGSERVICEFILE="$service_file" createdb \
  --maintenance-db=service=admin "$OPS_HOSTED_RECOVERY_DATABASE"
PGSERVICEFILE="$service_file" pg_restore \
  --dbname="service=admin dbname=$OPS_HOSTED_RECOVERY_DATABASE" \
  --exit-on-error \
  --single-transaction \
  --no-owner \
  --no-privileges \
  "$OPS_HOSTED_BACKUP_PATH"
