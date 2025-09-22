import mqtt from "mqtt";
import { promises as fs } from "fs";
import { parse } from "csv-parse/sync";

export function connectMqtt() {
  const client = mqtt.connect(process.env.MQTT_SERVER, {
    clientId: "breitbandmessung_client_" + Math.random().toString(16).slice(3),
    keepalive: 10,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  });
  console.log("Connecting to MQTT Broker...");
  client.on("connect", () => {
    console.log("Connected to MQTT Broker");
  });
  client.on("error", (err) => {
    console.error("Connection error: ", err);
  });
  return client;
}

export async function publishResult(client, file) {
  const result = await readResultCsv(file);
  const topic = process.env.MQTT_TOPIC || "mqtt-breitbandmessung";
  if (result) {
    console.log(JSON.stringify(result));
    client.publishAsync(
      process.env.MQTT_TOPIC || "mqtt-breitbandmessung",
      JSON.stringify(result),
      { qos: 0, retain: false },
      (error) => {
        console.error("Publish error: ", error);
      }
    );
    console.log(`Published result to MQTT in topic ${topic} - Download: ${result['Download (Mbit/s)']} Mbit/s | Upload: ${result['Upload (Mbit/s)']} Mbit/s | Ping: ${result['Laufzeit (ms)']} ms`);
  }
}

async function readResultCsv(file) {
  try {
    const content = await fs.readFile(file);
    return parse(content, {
      bom: true,
      delimiter: ";",
      columns: true,
      skip_empty_lines: true,
    })[0];
  } catch (err) {
    console.error("Error reading CSV file:", err);
    return null;
  }
}