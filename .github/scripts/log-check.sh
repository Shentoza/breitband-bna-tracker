#!/usr/bin/env bash
set -euo pipefail

# Usage: log-check.sh <logfile> [export_dir]
# If export_dir is provided, the script will also verify that a .csv exists there.

LOGFILE=${1:-}
EXPORT_DIR=${2:-}

if [ -z "$LOGFILE" ]; then
  echo "Usage: $0 <logfile> [export_dir]"
  exit 2
fi

if [ ! -f "$LOGFILE" ]; then
  echo "Logfile '$LOGFILE' does not exist"
  exit 2
fi

FATAL_PATTERNS="is not writable|EPERM: operation not permitted|EACCES: permission denied|chmod '/export'|Error starting puppeteer|Could not find Chrome|Failed to launch the browser process|UnhandledPromiseRejection|ERR_MODULE_NOT_FOUND|fatal error|uncaughtException|segmentation fault|panic|Error: Could not find Chrome|Error: Failed to launch the browser process"

if grep -iE "$FATAL_PATTERNS" "$LOGFILE" >/dev/null 2>&1; then
  echo "ERROR: Fatal issue detected in logs (matching patterns)."
  echo "---- ${LOGFILE} (tail) ----"
  tail -n 400 "$LOGFILE"
  exit 1
fi

if grep -iE "unhandled promise rejection|unhandledRejection|Unhandled promise rejection" "$LOGFILE" >/dev/null 2>&1; then
  echo "ERROR: Unhandled promise rejection detected in logs."
  tail -n 400 "$LOGFILE"
  exit 1
fi

if ! grep -q -i "Speedtest finished\|SPEEDTEST DONE\|Speedtest done\|saved results to" "$LOGFILE"; then
  echo "ERROR: Speedtest did not finish (no success marker in logs)"
  echo "---- ${LOGFILE} (tail) ----"
  tail -n 400 "$LOGFILE"
  exit 1
fi

if [ -n "$EXPORT_DIR" ]; then
  if ! ls "$EXPORT_DIR"/*.csv >/dev/null 2>&1; then
    echo "ERROR: No CSV file produced in ${EXPORT_DIR}"
    ls -la "$EXPORT_DIR" || true
    exit 1
  fi
fi

echo "Log check passed: no fatal errors and success markers present."
exit 0
