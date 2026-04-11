#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/dev-launch.sh"

load_launch_env

ensure_remote_docker_container_running "Baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}" "${BASEROW_REMOTE_CONTAINER:-}"
ensure_tunnel "baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}" "${BASEROW_LOCAL_PORT}" "${BASEROW_REMOTE_HOST}" "${BASEROW_REMOTE_PORT}"
ensure_tunnel "openelis" "${OPENELIS_SSH_USER}" "${OPENELIS_SSH_HOST}" "${OPENELIS_LOCAL_PORT}" "${OPENELIS_REMOTE_HOST}" "${OPENELIS_REMOTE_PORT}"

start_nodered_terminal

if ! wait_for_http_url "${NODERED_URL}" "Node-RED" 20 1; then
  echo "Warning: Node-RED did not respond before opening pages" >&2
fi

if ! wait_for_http_url "${BASEROW_URL}" "Baserow" 20 1; then
  echo "Warning: Baserow did not respond before opening pages" >&2
fi

if ! wait_for_http_url "${OPENELIS_URL}" "OpenELIS" 20 1; then
  echo "Warning: OpenELIS did not respond before opening pages" >&2
fi

open_url "${NODERED_URL}"
open_url "${BASEROW_URL}"
open_url "${OPENELIS_URL}"

show_links
