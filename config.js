import dotenv from "dotenv";
import path from "path";
import { promises as fs } from "fs";

dotenv.config();

export const EXPORT_PATH = process.env.EXPORT_PATH || "/usr/src/app/export/";
export const BASE_URL = "https://breitbandmessung.de";
export const MQTT_TOPIC = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";
export const EXECUTABLE_PATH = process.env.CHROME_PATH || undefined;
export const CONFIG_PATH = process.env.CONFIG_PATH || "./config.json";

export async function readConfig() {
    const configPath = CONFIG_PATH.endsWith(".json") ? CONFIG_PATH : path.join(CONFIG_PATH, "config.json");
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

export async function checkExportWritable() {
    // Try to write and remove a small temporary file inside EXPORT_PATH to verify write permissions.
    const testFile = path.join(EXPORT_PATH, `.export_write_test_${Date.now()}.tmp`);
    try {
        await fs.writeFile(testFile, "ok");
        await fs.unlink(testFile);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message || String(err) };
    }
}