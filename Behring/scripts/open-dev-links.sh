#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/dev-launch.sh"

load_launch_env

open_url "${NODERED_URL}"
open_url "${BASEROW_URL}"
open_url "${OPENELIS_URL}"

show_links
