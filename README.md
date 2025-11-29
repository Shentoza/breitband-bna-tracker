# Breitbandmessung.de automated

Automates repeated connection speed measurements as described on the official desktop app page: [breitbandmessung.de/desktop-app](https://breitbandmessung.de/desktop-app).

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
You can disable `sendStatus` so only violation messages (when `contractChecking.enabled` is true and a minimum threshold is missed) are published. If `contractChecking` is disabled and `sendStatus` is false nothing is sent.

## Contract Checking Configuration
The `contractChecking` section (optional) lets the tool compare measured speeds against your ISP plan thresholds. When enabled, each result is rated for download and upload and a violation can be published (MQTT) or mailed.

Fields:
- `enabled`: Set to `true` to activate contract comparisons.
- `ispDetails.provider`: Free text name of your ISP.
- `ispDetails.postcode`: Optional postcode (purely informational in output).
- `ispDetails.planName`: Descriptive plan label (e.g. "250 Mbit/s Glasfaser").
- `ispDetails.download` / `upload`: Objects with numeric `max`, `avg`, `min` values in Mbit/s representing the advertised or contractual speeds:
  - `max`: The theoretical or marketed upper bound.
  - `avg`: The expected average performance promised.
  - `min`: The minimum guaranteed (critical threshold). Falling below this typically triggers a violation status.

Example:
```json
{
  "contractChecking": {
    "enabled": true,
    "ispDetails": {
      "provider": "Your ISP Name",
      "postcode": "12345",
      "planName": "100 Mbit/s VDSL",
      "download": { "max": 100, "avg": 80, "min": 50 },
      "upload":   { "max": 10,  "avg": 8,  "min": 5 }
    }
  }
}
```

How it is used:
1. Each test result is compared against `min` and `avg` for both directions.
2. Status levels (internally) distinguish below minimum, below average, or OK.
3. A combined violation flag (`isViolated`) is raised if either direction is below its `min`.
4. When violations occur and MQTT/email are enabled, a notification can be sent.

If `contractChecking.enabled` is `false`, no rating logic is applied and only raw results / status mails (if configured) are emitted.

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

`sendStatus` – when true normal successful measurements generate mails; when false only violation mails are sent (provided `contractChecking.enabled` is true and a minimum value is missed).