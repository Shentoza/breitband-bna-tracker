# Breitbandmessung.de automated

A script to enable customers of lazy ISPs to perform measurement campaigns of the connection speed as described [here](https://breitbandmessung.de/desktop-app) in an automated way.

## Usage

This repository automates repeated speedtests against breitbandmessung.de, saves results as CSV files and can publish results via MQTT or send short status emails.

Quick start (single run)
1. Create a folder for results:
   mkdir messprotokolle

2. Run with the official image and mount the folder:
   docker pull shentoza/breitbandmessung-mqtt:latest
   docker run --rm -v "$PWD/messprotokolle:/export" --env-file .env shentoza/breitbandmessung-mqtt:latest

Important environment variables
- START_HEADLESS (true|false) — Puppeteer headless mode.
- EXPORT_PATH — directory for CSV files inside container (default: /export).
- INTERVAL_MINUTES — run interval in minutes (0 = one-off).
- MQTT_SERVER, MQTT_USER, MQTT_PASSWORD, MQTT_TOPIC — MQTT connection and topic.
- CONFIG_PATH — optional path to external config.json inside the container.
- CHROME_PATH — optional path to system Chromium binary if used.

Note about SMTP configuration
- SMTP must be provided via an external config.json mounted into the container. SMTP is not configured via environment variables.
- Place a file (host) config.json and mount it as /usr/src/app/config.json (or set CONFIG_PATH) so the app can read mailer settings.

Example config.json (minimal)
```json
{
  "mailer": {
    "smtp": {
      "host": "smtp.example.com",
      "port": 465,
      "secure": true,
      "auth": { "user": "noreply@example.com", "pass": "secret" }
    },
    "enabled": true,
    "sendStatus": true, 
    "sendTo": "you@example.com",
    "sendFrom": "\"Breitbandmessung\" <noreply@example.com>"
  }
}
```

`SendStatus` - if true, it will also send "successful" test reports. In the future, it will only send failing ones, or ones that might be relevant to your campaign


Docker examples
- Persist CSVs and provide external config:
```bash
  docker run --rm \
    -v "$PWD/messprotokolle:/export" \
    -v "$PWD/config.json:/usr/src/app/config.json:ro" \
    --env-file .env \
    shentoza/breitband-bna-tracker:latest
```

Important environment variables
- START_HEADLESS (true|false) — Puppeteer headless mode.
- EXPORT_PATH — directory for CSV files inside container (default: /export).
- INTERVAL_MINUTES — run interval in minutes (0 = one-off).
- MQTT_SERVER, MQTT_USER, MQTT_PASSWORD, MQTT_TOPIC — MQTT connection and topic.
- CONFIG_PATH — optional path to external config.json inside the container.

Note about SMTP configuration
- SMTP must be provided via an external config.json mounted into the container. SMTP is not configured via environment variables.
- Place a file (host) config.json and mount it as /usr/src/app/config.json (or set CONFIG_PATH) so the app can read mailer settings.