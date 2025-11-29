import { connectMqtt, publishViolation, publishResult } from "./mqttClient";
import dotenv from "dotenv";
import { createMailer, sendStatusEmail, sendViolatedEmail } from "./nodemailer";
import { getResultFromFile } from "./csv";
import { checkExportWritable, EXPORT_PATH, getISPDetails } from "./config";
import { rateResult } from "./contractChecker";
import { RunSpeedtest } from "./websitehandling.js";

dotenv.config();

function getTimestamp() {
  const d = new Date();
  return `${d.toLocaleDateString("de-DE")} ${d.toLocaleTimeString("de-DE")}`;
}
const mqtt = await connectMqtt();
const mailer = await createMailer();
const ISPDetails = await getISPDetails();

// Check if export path is writable early to catch permission issues.
const exportCheck = await checkExportWritable();
if (!exportCheck.ok) {
  console.error(
    `EXPORT_PATH ${EXPORT_PATH} is not writable: ${exportCheck.error}`
  );
}

const onFinished = async (filePath: string) => {
  console.log(`${getTimestamp()} - Speedtest finished, CSV: ${filePath}`);
  try {
    const result = await getResultFromFile(filePath);
    if (result) {
      console.log(
        `Results -  Download: ${result["Download (Mbit/s)"]} Mbit/s | Upload: ${result["Upload (Mbit/s)"]} Mbit/s | Ping: ${result["Laufzeit (ms)"]} ms`
      );
      if (mqtt?.config?.enabled === true && mqtt?.config?.sendStatus === true) {
        publishResult(mqtt, result);
      }
      if (ISPDetails) {
        const ratedResult = rateResult(result, ISPDetails);
        if (ratedResult.isViolated) {
          if (mailer?.config?.enabled === true) {
            sendViolatedEmail(mailer, ratedResult);
          }
          if (mqtt?.config?.enabled === true) {
            publishViolation(mqtt, ratedResult);
          }
        }
      } else {
        if (
          mailer?.config?.enabled === true &&
          mailer?.config?.sendStatus === true
        ) {
          sendStatusEmail(mailer, result);
        }
      }
    }
  } catch (err) {
    console.error("Error processing speedtest result:", err);
  }
};

const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES ?? 60);

const sleep = (seconds: number) =>
  new Promise((res) => setTimeout(res, seconds * 1000));
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
} finally {
  if (mqtt?.client) {
    mqtt?.client.end();
  }
}
