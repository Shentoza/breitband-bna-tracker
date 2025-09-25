import {
  RunSpeedtest,
} from "./websitehandling.js";
import { EXPORT_PATH } from "./config.js";
import { promises as fs } from "fs";
import { connectMqtt, publishResult } from "./mqttClient.js";
import dotenv from "dotenv";
import { createMailer, sendFailureEmail, sendStatusEmail } from "./nodemailer.js";
import { readResultCsv } from "./csv.js";

dotenv.config();

function getTimestamp() {
  const d = new Date();
  return `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE')}`;
}

await fs.chmod(EXPORT_PATH, "777");
const mqtt = connectMqtt();

const mailer = await createMailer();

const onFinished = async (filePath) => {
  console.log(`${getTimestamp()} - Speedtest finished, CSV: ${filePath}`);
  const result = await readResultCsv(filePath);
  publishResult(mqtt, result);
  if (mailer?.sendStatus) {
    sendStatusEmail(mailer, result);
  }
}

const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES ?? 60);

const sleep = (seconds) => new Promise((res) => setTimeout(res, seconds * 1000));
try {
  if (INTERVAL_MINUTES > 0) {
    console.log(`Running speedtest every ${INTERVAL_MINUTES} minutes`);
    while (true) {
      console.log(`${getTimestamp()} - Starting new speedtest...`);
      await RunSpeedtest(onFinished);
      await sleep(INTERVAL_MINUTES * 60);
    }
  } else {
    // single run
    console.log(`${getTimestamp()} - Starting one-off speedtest...`);
    await RunSpeedtest(onFinished);
  }
}
finally {
  mqtt.end();
}