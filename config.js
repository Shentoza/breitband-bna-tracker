import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";

dotenv.config();


export const START_HEADLESS = process.env.START_HEADLESS || true;
export const EXPORT_PATH = process.env.EXPORT_PATH || "/export/";
export const BASE_URL = "https://breitbandmessung.de";
export const MQTT_TOPIC = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";

export async function readConfig() {
    const cfgEnv = process.env.CONFIG_PATH || "./config.json";
    const configPath = cfgEnv.endsWith(".json") ? cfgEnv : path.join(cfgEnv, "config.json");
    try {
        const content = await fs.readFile(configPath, "utf-8");
        return JSON.parse(content);
    } catch (err) {
        // file missing or invalid -> return null
        return null;
    }
}

export async function getMailerConfig() {
    const cfg = await readConfig();
    if (cfg?.mailer?.enabled === true) {
        return cfg.mailer;
    } else {
        return null;
    }
}

export async function getMqttConfig() {
    const cfg = await readConfig();
    if (cfg?.mqtt?.enabled === true) {
        return cfg.mqtt;
    }
    return null;
}