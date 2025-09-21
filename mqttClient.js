import mqtt from "mqtt";

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

export async function publishResult(client, result) {
  client.publishAsync(
    "testtopic",
    JSON.stringify(result),
    { qos: 0, retain: false },
    (error) => {}
  );
}
