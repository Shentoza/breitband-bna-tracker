import {
  RunSpeedtest,
} from "./websitehandling.js";
import { EXPORT_PATH } from "./config.js";
import { promises as fs } from "fs";
import { connectMqtt, publishResult } from "./mqttClient.js";
import dotenv from "dotenv";

dotenv.config();

function getTimestamp() {
  const d = new Date();
  return `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE')}`;
}

await fs.chmod(EXPORT_PATH, "777");
const mqtt = connectMqtt();

const onSuccess = (filePath) => {
  console.log(`${getTimestamp()} - Speedtest finished, CSV: ${filePath}`);
  publishResult(mqtt, filePath);
}

const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES ?? 60);

const sleep = (seconds) => new Promise((res) => setTimeout(res, seconds * 1000));
try {
  if (INTERVAL_MINUTES > 0) {
    console.log(`Running speedtest every ${INTERVAL_MINUTES} minutes`);
    while (true) {
      console.log(`${getTimestamp()} - Starting new speedtest...`);
      await RunSpeedtest(onSuccess);
      await sleep(INTERVAL_MINUTES * 60);
    }
  } else {
    // single run
    console.log(`${getTimestamp()} - Starting one-off speedtest...`);
    await RunSpeedtest(onSuccess);
  }
}
finally {
  mqtt.end();
}