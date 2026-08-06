set -eu

secret_service_file() {
  source_file="$1"
  service_name="$2"
  destination="$3"
  if [ ! -r "$source_file" ]; then
    echo "PostgreSQL connection secret is not readable." >&2
    exit 1
  fi
  node /opt/unisane-ops/connection-service.mjs "$destination" "$service_name" "$source_file"
}
