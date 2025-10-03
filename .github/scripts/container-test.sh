#!/usr/bin/env bash
set -euo pipefail

# Usage: container-test.sh <image>
# Requires GITHUB_WORKSPACE env in GitHub Actions
IMAGE=${1:-${IMAGE:-local/breitband:ci}}

WORKDIR=${GITHUB_WORKSPACE:-$(pwd)}
LOGFILE="$WORKDIR/container.log"
CONFIG_JSON="$WORKDIR/config-ci.json"

# ensure a CI config exists
if [ ! -f "$CONFIG_JSON" ]; then
  cat > "$CONFIG_JSON" <<'JSON'
{
  "mailer": { "enabled": false, "sendStatus": false },
  "mqtt": { "enabled": false }
}
JSON
fi

echo "Running container test for image: $IMAGE"

docker run --rm \
  -e INTERVAL_MINUTES=0 \
  -e CONFIG_PATH=/usr/src/app/config.json \
  -v "$CONFIG_JSON":/usr/src/app/config.json:ro \
  "$IMAGE" 2>&1 | tee "$LOGFILE" || true

# Run consolidated log checks
SCRIPT_DIR=$(dirname "$0")
chmod +x "$SCRIPT_DIR/log-check.sh"
"$SCRIPT_DIR/log-check.sh" "$LOGFILE"

echo "Container test passed: CSVs created and no fatal errors detected."
exit 0
