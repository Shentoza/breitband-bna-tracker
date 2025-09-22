import dotenv from "dotenv";
dotenv.config();

export const START_HEADLESS = process.env.START_HEADLESS || true;
export const EXPORT_PATH = process.env.EXPORT_PATH || "/export/";
export const BASE_URL = "https://breitbandmessung.de";
export const MQTT_TOPIC = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";