#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LAUNCH_ENV_FILE="${ROOT_DIR}/config/dev-launch.env"
LAUNCH_ENV_EXAMPLE="${ROOT_DIR}/config/dev-launch.example.env"
RUNTIME_ENV_FILE="${ROOT_DIR}/config/env.local"
RUNTIME_ENV_EXAMPLE="${ROOT_DIR}/config/env.example"
SOCKET_DIR="${ROOT_DIR}/.tmp/ssh-sockets"

load_launch_env() {
  if [[ -f "${LAUNCH_ENV_FILE}" ]]; then
    # shellcheck disable=SC1090
    source "${LAUNCH_ENV_FILE}"
  elif [[ -f "${LAUNCH_ENV_EXAMPLE}" ]]; then
    # shellcheck disable=SC1090
    source "${LAUNCH_ENV_EXAMPLE}"
  else
    echo "Missing launch env file: ${LAUNCH_ENV_FILE}" >&2
    exit 1
  fi
}

ensure_socket_dir() {
  mkdir -p "${SOCKET_DIR}"
}

require_command() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "Required command not found: ${name}" >&2
    exit 1
  fi
}

wait_for_http_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-20}"
  local delay_seconds="${4:-1}"
  local i

  require_command curl

  for ((i = 1; i <= attempts; i += 1)); do
    if curl --silent --show-error --location --insecure --max-time 3 "${url}" >/dev/null 2>&1; then
      echo "${label} responded at ${url}"
      return 0
    fi
    sleep "${delay_seconds}"
  done

  echo "${label} did not respond at ${url} after ${attempts} checks" >&2
  return 1
}

socket_path() {
  local key="$1"
  echo "${SOCKET_DIR}/${key}.sock"
}

run_remote_command() {
  local user="$1"
  local host="$2"
  local command_text="$3"

  require_command ssh
  ssh "${user}@${host}" "${command_text}"
}

ensure_remote_docker_container_running() {
  local label="$1"
  local user="$2"
  local host="$3"
  local container_name="$4"

  if [[ -z "${container_name}" ]]; then
    return 0
  fi

  echo "Checking ${label} container '${container_name}' on ${user}@${host}"

  if run_remote_command "${user}" "${host}" "docker inspect -f '{{.State.Running}}' '${container_name}' 2>/dev/null" | grep -q "^true$"; then
    echo "${label} container '${container_name}' is already running"
    return 0
  fi

  echo "Starting ${label} container '${container_name}'"
  run_remote_command "${user}" "${host}" "docker start '${container_name}' >/dev/null"
}

ensure_tunnel() {
  local key="$1"
  local user="$2"
  local host="$3"
  local local_port="$4"
  local remote_host="$5"
  local remote_port="$6"
  local socket
  socket="$(socket_path "${key}")"

  require_command ssh
  ensure_socket_dir

  if ssh -S "${socket}" -O check "${user}@${host}" >/dev/null 2>&1; then
    echo "${key} tunnel already running on localhost:${local_port}"
    return 0
  fi

  echo "Starting ${key} tunnel on localhost:${local_port} -> ${remote_host}:${remote_port} via ${user}@${host}"
  ssh -f -N \
    -M \
    -S "${socket}" \
    -o ExitOnForwardFailure=yes \
    -L "${local_port}:${remote_host}:${remote_port}" \
    "${user}@${host}"
}

stop_tunnel() {
  local key="$1"
  local user="$2"
  local host="$3"
  local socket
  socket="$(socket_path "${key}")"

  if ssh -S "${socket}" -O check "${user}@${host}" >/dev/null 2>&1; then
    ssh -S "${socket}" -O exit "${user}@${host}" >/dev/null 2>&1 || true
    echo "Stopped ${key} tunnel"
  else
    echo "${key} tunnel is not running"
  fi
}

open_url() {
  local url="$1"
  require_command open
  open "${url}"
}

open_terminal_command() {
  local command_text="$1"
  local escaped_command
  require_command osascript
  escaped_command="${command_text//\\/\\\\}"
  escaped_command="${escaped_command//\"/\\\"}"
  osascript <<EOF
tell application "Terminal"
  activate
  do script "cd \"${ROOT_DIR}\"; ${escaped_command}"
end tell
EOF
}

runtime_env_command_prefix() {
  if [[ -f "${RUNTIME_ENV_FILE}" ]]; then
    printf 'set -a; source "%s"; set +a; ' "${RUNTIME_ENV_FILE}"
  elif [[ -f "${RUNTIME_ENV_EXAMPLE}" ]]; then
    printf 'set -a; source "%s"; set +a; ' "${RUNTIME_ENV_EXAMPLE}"
  else
    printf ''
  fi
}

start_nodered_terminal() {
  open_terminal_command "$(runtime_env_command_prefix)npm run nodered"
}

show_links() {
  echo "Node-RED: ${NODERED_URL}"
  echo "Baserow:  ${BASEROW_URL}"
  echo "OpenELIS: ${OPENELIS_URL}"
}
