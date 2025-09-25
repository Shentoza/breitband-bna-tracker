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