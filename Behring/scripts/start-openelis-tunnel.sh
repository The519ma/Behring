#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/dev-launch.sh"

load_launch_env
ensure_tunnel "openelis" "${OPENELIS_SSH_USER}" "${OPENELIS_SSH_HOST}" "${OPENELIS_LOCAL_PORT}" "${OPENELIS_REMOTE_HOST}" "${OPENELIS_REMOTE_PORT}"
echo "OpenELIS ready at ${OPENELIS_URL}"
