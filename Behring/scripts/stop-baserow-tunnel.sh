#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/dev-launch.sh"

load_launch_env
stop_tunnel "baserow" "${BASEROW_SSH_USER}" "${BASEROW_SSH_HOST}"
