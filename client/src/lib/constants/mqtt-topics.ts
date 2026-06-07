import { ENV } from "./env";

function topic(path: string): string {
  const prefix = ENV.MQTT_TOPIC_PREFIX;
  return prefix ? `${prefix}/${path}` : path;
}

export const TOPICS = {
  TEMP:          topic("invernadero/sensores/temperatura"),
  HUM_AMBIENTE:  topic("invernadero/sensores/humedad_ambiente"),
  HUM_SUELO_1:   topic("invernadero/sensores/humedad_suelo_area1"),
  HUM_SUELO_2:   topic("invernadero/sensores/humedad_suelo_area2"),
  LUZ:           topic("invernadero/sensores/luz"),
  GAS:           topic("invernadero/sensores/gas"),
  ESTADO_GLOBAL: topic("invernadero/estado/global"),
  RIEGO:         topic("invernadero/actuadores/riego"),
  RIEGO_AREA1:   topic("invernadero/actuadores/riego_area1"),
  RIEGO_AREA2:   topic("invernadero/actuadores/riego_area2"),
  VENTILADOR:    topic("invernadero/actuadores/ventilador"),
  LUCES:         topic("invernadero/actuadores/luces"),
  ALARMA:        topic("invernadero/actuadores/alarma"),
  CONTROL:       topic("invernadero/control/remoto"),
} as const;

export const ALL_SENSOR_TOPICS = [
  TOPICS.TEMP,
  TOPICS.HUM_AMBIENTE,
  TOPICS.HUM_SUELO_1,
  TOPICS.HUM_SUELO_2,
  TOPICS.LUZ,
  TOPICS.GAS,
  TOPICS.ESTADO_GLOBAL,
  TOPICS.RIEGO,
  TOPICS.RIEGO_AREA1,
  TOPICS.RIEGO_AREA2,
  TOPICS.VENTILADOR,
  TOPICS.LUCES,
  TOPICS.ALARMA,
] as const;
