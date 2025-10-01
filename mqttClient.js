import mqtt from "mqtt";
import { getMqttConfig } from "./config.js";

export async function connectMqtt() {
  const mqttJsonConfig = await getMqttConfig();
  let mqttInfo = {};
  if (mqttJsonConfig) {
    mqttInfo = loadFromJson(mqttJsonConfig);
  } else {
    mqttInfo = tryLoadFromEnv();
  }
  if (mqttInfo.enabled !== true) {
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
  }
  catch (err) {
    console.error("MQTT connection error: ", err);
    return null;
  }

}

function loadFromJson(mqttJsonConfig) {
  const client = mqtt.connect(mqttJsonConfig.brokerConfig.server, {
    clientId: "breitbandmessung_client_" + Math.random().toString(16).slice(3),
    keepalive: 10,
    username: mqttJsonConfig.brokerConfig.username,
    password: mqttJsonConfig.brokerConfig.password,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  });
  const topic = mqttJsonConfig.brokerConfig.topic;
  return { client, topic };
}

function tryLoadFromEnv() {
  if (!process.env.MQTT_SERVER) {
    console.log("MQTT not configured");
    return { client: null, topic: null, isEnabled: false };
  }
  const client = mqtt.connect(process.env.MQTT_SERVER, {
    clientId: "breitbandmessung_client_" + Math.random().toString(16).slice(3),
    keepalive: 10,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  });
  const topic = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";
  return { client, topic };
}

export async function publishResult(mqttSender, result) {
  const { client, topic } = mqttSender;
  if (result) {
    console.log(JSON.stringify(result));
    client.publishAsync(
      topic,
      JSON.stringify(result),
      { qos: 0, retain: false },
      (error) => {
        console.error("Publish error: ", error);
      }
    );
    console.log(`Published result to MQTT in topic ${topic}`);
  }
}
