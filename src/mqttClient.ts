import mqtt from "mqtt";
import { getMqttConfig, MqttConfig } from "./config.js";
import { ParsedResult } from "./csv.js";
import { RatedResult } from "./contractChecker.js";

export async function connectMqtt() : Promise<mqttClient | null> {
  const mqttJsonConfig = await getMqttConfig();
  let mqttInfo = tryLoadFromJson(mqttJsonConfig);
  if (mqttInfo == null) {
    mqttInfo = tryLoadFromEnv();
  }
  if (mqttInfo == null) {
    console.log("MQTT not configured");
    return null;
  }

  try {
    console.log("Connecting to MQTT Broker...");
    mqttInfo.client.on("connect", () => {
      console.log("Connected to MQTT Broker");
    });
    mqttInfo.client.on("error", (err) => {
      console.error("Connection error: ", err);
    });
    return mqttInfo;
  } catch (err) {
    console.error("MQTT connection error: ", err);
    return null;
  }
}

function tryLoadFromJson(mqttJsonConfig: MqttConfig | null) {
  if (mqttJsonConfig?.enabled === true) {
    try {
      const client = mqtt.connect(mqttJsonConfig.brokerConfig.server, {
        clientId:
          "breitbandmessung_client_" + Math.random().toString(16).slice(3),
        keepalive: 10,
        username: mqttJsonConfig.brokerConfig.username,
        password: mqttJsonConfig.brokerConfig.password,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
      });
      const { brokerConfig: _, ...rest } = mqttJsonConfig;
      return { client, config: rest };
    } catch (err) {
      console.error("Error loading MQTT config from JSON:", err);
      return null;
    }
  }
  return null;
}

function tryLoadFromEnv(): mqttClient | null {
  if (!process.env.MQTT_SERVER) {
    return null;
  }
  try {
    const client = mqtt.connect(process.env.MQTT_SERVER, {
      clientId:
        "breitbandmessung_client_" + Math.random().toString(16).slice(3),
      keepalive: 10,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    });
    const topic = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";
    const config = { enabled: true, sendStatus: true, topic };
    return { client, config };
  } catch (err) {
    console.error("Error loading MQTT config from ENV:", err);
    return null;
  }
}

export async function publishResult(
  mqttClient: mqttClient,
  result: ParsedResult
) {
  const { client, config } = mqttClient;

  console.log(JSON.stringify(result));
  client.publishAsync(config.topic, JSON.stringify(result));
  console.log(`Published result to MQTT in topic ${config.topic}`);
}

export async function publishFailure(mqttClient: mqttClient, result: RatedResult) {
  const { client, config } = mqttClient;

  const failurePackage = {
    upload: result.DownloadStatus,
    download: result.UploadStatus
  }

  client.publishAsync(`${config.topic}/failure`, JSON.stringify(failurePackage));
  console.log(`Published failure to MQTT in topic ${config.topic}/failure`);
}

type mqttClient = {
  client: mqtt.MqttClient;
  config: Omit<MqttConfig, "brokerConfig">;
};
