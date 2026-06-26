export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  MQTT_WSS_URL:
    process.env.NEXT_PUBLIC_MQTT_WSS_URL ?? "wss://broker.emqx.io:8084/mqtt",
  MQTT_TOPIC_PREFIX: process.env.NEXT_PUBLIC_MQTT_TOPIC_PREFIX ?? "",
} as const;
