import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
import { ISPDetails } from "./contractChecker";

dotenv.config();

export const EXPORT_PATH = process.env.EXPORT_PATH || "/usr/src/app/export/";
export const BASE_URL = "https://breitbandmessung.de";
export const MQTT_TOPIC = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";
export const EXECUTABLE_PATH = process.env.CHROME_PATH || undefined;
export const CONFIG_PATH = process.env.CONFIG_PATH || "./config.json";

export async function readConfig(): Promise<Config | null> {
  const configPath = CONFIG_PATH.endsWith(".json")
    ? CONFIG_PATH
    : path.join(CONFIG_PATH, "config.json");
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    // file missing or invalid -> return null
    return null;
  }
}

export async function getMailerConfig(): Promise<MailerConfig | null> {
  const cfg = await readConfig();
  if (cfg?.mailer?.enabled === true) {
    return cfg.mailer;
  } else {
    return null;
  }
}

export async function getMqttConfig(): Promise<MqttConfig | null> {
  const cfg = await readConfig();
  if (cfg?.mqtt?.enabled === true) {
    return cfg.mqtt;
  }
  return null;
}

export async function getISPDetails(): Promise<ISPDetails | null> {
  const cfg = await readConfig();
  if (cfg?.contractChecking?.enabled === true) {
    return cfg.contractChecking.ispDetails;
  }
  return null;
}

export async function checkExportWritable() {
  // Try to write and remove a small temporary file inside EXPORT_PATH to verify write permissions.
  const testFile = path.join(
    EXPORT_PATH,
    `.export_write_test_${Date.now()}.tmp`
  );
  try {
    await fs.writeFile(testFile, "ok");
    await fs.unlink(testFile);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

type Config = {
  mailer: MailerConfig;
  mqtt: MqttConfig;
  contractChecking: ContractConfig;
};

export type MailerConfig = {
  enabled: boolean;
  sendStatus: boolean;
  sendTo: string | string[];
  sendFrom: string;
  smtp: MailerSmtpConfig;
};

type MailerSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type MqttConfig = {
  enabled: boolean;
  brokerConfig: MqttBrokerConfig;
  topic: string;
  sendStatus: boolean;
};

type MqttBrokerConfig = {
  server: string;
  username: string;
  password: string;
};

type ContractConfig = {
  enabled: boolean;
  ispDetails: ISPDetails;
};
