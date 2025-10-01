# Breitbandmessung.de automated

A script to enable customers of lazy ISPs to perform measurement campaigns of the connection speed as described [here](https://breitbandmessung.de/desktop-app) in an automated way.

## Usage

This repository automates repeated speedtests against breitbandmessung.de, saves results as CSV files and can publish results via MQTT or send short status emails.

Quick start (single run)
1. Create a folder for results:
   mkdir messprotokolle

2. Run with the official image and mount the folder:
  ```bash
   docker pull shentoza/breitband-bna-tracker:latest
   docker run --rm -v "$PWD/messprotokolle:/export" --env-file .env shentoza/breitband-bna-tracker:latest
  ```

Important environment variables
- START_HEADLESS (true|false) — Puppeteer headless mode.
- EXPORT_PATH — directory for CSV files inside container (default: /export).
- INTERVAL_MINUTES — run interval in minutes (0 = one-off).

- CONFIG_PATH — optional path to external config.json inside the container.
- CHROME_PATH — optional path to system Chromium binary if used.

## MQTT Configuration
- You can configure via ENV variables
  - `MQTT_SERVER` - in the form of `protocol://<hostname/ip>:<port>`
  - `MQTT_USER`
  - `MQTT_PASSWORD`
  - `MQTT_TOPIC`  - your topic. defaults to `mqtt-breitbandmessung`
It will publish the results on this topic, containing download, upload and ping.

### MQTT Json Configuration 
You can also provide them via config.json.
If both json and env variables are configured, the json config is preferred. A merging does not happen.

```json
{
  "mqtt": {
        "brokerConfig" : {
            "server": "https://your.mqtt.broker:port",
            "username": "yourusername",
            "password": "yourpassword",
            "topic": "mqtt-breitbandmessung"
        },
        "enabled": false,
        "sendStatus": true
    }
}
```
You can disable the `sendStatus` flag. In a later patch I want to make it possible, so it will check the results against your ISP contract, and give you a message if it violates it.

## SMTP Configuration
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