#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/maestro-ios.sh 'exp://127.0.0.1:8081'
#
# Start Metro first (clear CI so file watching works):
#   env -u CI npx expo start --port 8081
#
# Simulator can use 127.0.0.1; physical device needs your Mac LAN IP.

if [[ -z "${1:-}" ]]; then
  echo "Usage: $0 'exp://HOST:PORT'" >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro is not installed. Install: curl -Ls \"https://get.maestro.mobile.dev\" | bash" >&2
  exit 1
fi

exec maestro test maestro/app.yaml -e EXPO_DEV_URL="$1"
