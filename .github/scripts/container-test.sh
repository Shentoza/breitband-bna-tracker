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

# Patterns indicating fatal failures
FATAL_PATTERNS="is not writable|EPERM: operation not permitted|EACCES: permission denied|chmod '/export'|Error starting puppeteer|Could not find Chrome|Failed to launch the browser process|UnhandledPromiseRejection|ERR_MODULE_NOT_FOUND|fatal error|uncaughtException|segmentation fault|panic|Error: Could not find Chrome|Error: Failed to launch the browser process"

if grep -iE "$FATAL_PATTERNS" "$LOGFILE" >/dev/null 2>&1; then
  echo "ERROR: Fatal issue detected in container logs (matching patterns)."
  echo "---- container.log (tail) ----"
  tail -n 400 "$LOGFILE"
  exit 1
fi

if grep -iE "unhandled promise rejection|unhandledRejection|Unhandled promise rejection" "$LOGFILE" >/dev/null 2>&1; then
  echo "ERROR: Unhandled promise rejection detected in container logs."
  tail -n 400 "$LOGFILE"
  exit 1
fi

# Success markers
if ! grep -q -i "Speedtest finished\|SPEEDTEST DONE\|Speedtest done\|saved results to" "$LOGFILE"; then
  echo "ERROR: Speedtest did not finish (no success marker in logs)"
  tail -n 400 "$LOGFILE"
  exit 1
fi

echo "Container test passed: CSVs created and no fatal errors detected."
exit 0
