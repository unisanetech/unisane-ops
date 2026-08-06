#!/bin/sh
set -eu
. /opt/unisane-ops/lib.sh

: "${OPS_HOSTED_POSTGRES_URL_FILE:?Set OPS_HOSTED_POSTGRES_URL_FILE}"
: "${OPS_HOSTED_RECOVERY_ADMIN_URL_FILE:?Set OPS_HOSTED_RECOVERY_ADMIN_URL_FILE}"
: "${OPS_HOSTED_RECOVERY_DATABASE:?Set OPS_HOSTED_RECOVERY_DATABASE}"

service_file="$(mktemp)"
source_state="$(mktemp)"
recovery_state="$(mktemp)"
trap 'rm -f "$service_file" "$source_state" "$recovery_state"' EXIT HUP INT TERM
node /opt/unisane-ops/connection-service.mjs "$service_file" \
  source "$OPS_HOSTED_POSTGRES_URL_FILE" \
  admin "$OPS_HOSTED_RECOVERY_ADMIN_URL_FILE"

snapshot_sql="SELECT jsonb_build_object(
  'migrations', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM ops_hosted_schema_migration t), '[]'::jsonb),
  'jobs', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY job_id) FROM ops_hosted_read_job t), '[]'::jsonb),
  'dispatch', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM ops_hosted_read_dispatch t), '[]'::jsonb),
  'audit', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY occurred_at, id) FROM ops_hosted_read_audit t), '[]'::jsonb),
  'results', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY artifact_id) FROM ops_hosted_read_result t), '[]'::jsonb),
  'schedules', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY schedule_id) FROM ops_hosted_read_schedule t), '[]'::jsonb),
  'scheduleOccurrences', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY occurrence_id) FROM ops_hosted_read_schedule_occurrence t), '[]'::jsonb),
  'credentials', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY credential_id) FROM ops_hosted_credential t), '[]'::jsonb),
  'credentialVersions', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY credential_id, version) FROM ops_hosted_credential_version t), '[]'::jsonb)
)::text"

PGSERVICEFILE="$service_file" psql --no-psqlrc --tuples-only --no-align \
  --dbname=service=source --command="$snapshot_sql" > "$source_state"
PGSERVICEFILE="$service_file" psql --no-psqlrc --tuples-only --no-align \
  --dbname="service=admin dbname=$OPS_HOSTED_RECOVERY_DATABASE" \
  --command="$snapshot_sql" > "$recovery_state"
cmp -s "$source_state" "$recovery_state"
