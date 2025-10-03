#!/usr/bin/env bash
set -euo pipefail

# Usage: node-test.sh
WORKDIR=${GITHUB_WORKSPACE:-$(pwd)}
LOGFILE="$WORKDIR/node-app.log"
CONFIG_JSON="$WORKDIR/config-ci.json"
EXPORT_DIR="$WORKDIR/export"

# prepare CI config
if [ ! -f "$CONFIG_JSON" ]; then
  cat > "$CONFIG_JSON" <<'JSON'
{
  "mailer": { "enabled": false, "sendStatus": false },
  "mqtt": { "enabled": false }
}
JSON
fi

# clean export dir
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"

echo "Running Node app test in $WORKDIR"

# install dependencies via corepack/yarn (runner has corepack)
if command -v yarn >/dev/null 2>&1; then
  echo "Using yarn to install deps"
  corepack enable || true
  corepack prepare yarn@stable --activate || true
  yarn install --immutable --immutable-cache --check-cache
else
  echo "Yarn not found, using npm"
  npm ci || npm install
fi

# run node app (single run)
INTERVAL_MINUTES=0 START_HEADLESS=true CONFIG_PATH="$CONFIG_JSON" EXPORT_PATH="$EXPORT_DIR" node index.js 2>&1 | tee "$LOGFILE" || true

# Patterns indicating fatal failures
# Run consolidated log checks (also check export dir)
SCRIPT_DIR=$(dirname "$0")
chmod +x "$SCRIPT_DIR/log-check.sh"
"$SCRIPT_DIR/log-check.sh" "$LOGFILE" "$EXPORT_DIR"

echo "Node app test passed: CSVs created and no fatal errors detected."
exit 0
