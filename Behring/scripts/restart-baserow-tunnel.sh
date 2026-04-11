#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/dev-launch.sh"

load_launch_env
ensure_remote_docker_container_running "Baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}" "${BASEROW_REMOTE_CONTAINER:-}"
stop_tunnel "baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}"
ensure_tunnel "baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}" "${BASEROW_LOCAL_PORT}" "${BASEROW_REMOTE_HOST}" "${BASEROW_REMOTE_PORT}"
wait_for_http_url "${BASEROW_URL}" "Baserow"
echo "Baserow ready at ${BASEROW_URL}"
