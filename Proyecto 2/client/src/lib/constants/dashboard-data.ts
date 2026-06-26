import type {
  EstadoKey,
  EstadoInfo,
  LogEntry,
  Shape,
  StateColor,
} from "@/lib/types/types";

export const NAV_ITEMS = [
  { label: "Dashboard", id: "dashboard" },
  { label: "Áreas de cultivo", id: "areas" },
  { label: "Sensores", id: "sensores" },
  { label: "Actuadores", id: "actuadores" },
  { label: "Historial", id: "historial" },
  { label: "Análisis ARM64", id: "arm64" },
];

export const KPIS = [
  {
    key: "temp",
    label: "Temperatura",
    unit: "°C",
    base: 28,
    spread: 2,
    trend: "▲ 1.2°",
    trendColor: "text-warn",
  },
  {
    key: "hum",
    label: "Humedad ambiental",
    unit: "%",
    base: 66,
    spread: 4,
    trend: "— 0.0%",
    trendColor: "text-dim",
  },
  {
    key: "luz",
    label: "Nivel de luz (LDR)",
    unit: "lx",
    base: 260,
    spread: 30,
    trend: "▼ 14",
    trendColor: "text-danger",
  },
  {
    key: "gas",
    label: "Nivel de gas (MQ-2)",
    unit: "ppm",
    base: 150,
    spread: 25,
    trend: "normal",
    trendColor: "text-dim",
  },
];

export const ESTADOS: Record<EstadoKey, EstadoInfo> = {
  NORMAL: {
    label: "NORMAL",
    sub: "todo en rango",
    hex: "#FFFFFF",
    rgb: "255,255,255",
  },
  ADVERTENCIA: {
    label: "ADVERTENCIA",
    sub: "revisar condiciones",
    hex: "#FFC400",
    rgb: "255,196,0",
  },
  RIEGO_ACTIVO: {
    label: "RIEGO ACTIVO",
    sub: "bomba en marcha",
    hex: "#2D9BFF",
    rgb: "45,155,255",
  },
  EMERGENCIA: {
    label: "EMERGENCIA",
    sub: "gas sobre el umbral",
    hex: "#FF2D2D",
    rgb: "255,45,45",
  },
  MODO_MANUAL: {
    label: "MODO MANUAL",
    sub: "control remoto habilitado",
    hex: "#2D9BFF",
    rgb: "45,155,255",
  },
  SIN_DATOS: {
    label: "SIN DATOS",
    sub: "sin estado real recibido",
    hex: "#5A5A62",
    rgb: "90,90,98",
  },
};

export const ESTADO_COLOR: Record<EstadoKey, StateColor> = {
  NORMAL: "white",
  ADVERTENCIA: "warn",
  RIEGO_ACTIVO: "info",
  EMERGENCIA: "danger",
  MODO_MANUAL: "info",
  SIN_DATOS: "dim",
};

export const ARM64_CARDS: {
  file: string;
  label: string;
  value: string;
  foot: string;
  shape: Shape;
  color: string;
  danger: boolean;
}[] = [
  {
    file: "modulo_1_media.s",
    label: "Media ponderada",
    value: "31.0",
    foot: "ΣX=920 · ΣW=465",
    shape: "ico",
    color: "#ffffff",
    danger: false,
  },
  {
    file: "modulo_2_varianza.s",
    label: "Desv. estándar",
    value: "4.0",
    foot: "var=18 · media=31",
    shape: "octa",
    color: "#ffffff",
    danger: false,
  },
  {
    file: "modulo_3_anomalias.s",
    label: "Anomalías",
    value: "4",
    foot: "RIESGO: HIGH",
    shape: "tetra",
    color: "#FF2D2D",
    danger: true,
  },
  {
    file: "modulo_4_prediccion.s",
    label: "Predicción",
    value: "34.2",
    foot: "Δ=+6 · prom=0.20",
    shape: "torus",
    color: "#ffffff",
    danger: false,
  },
  {
    file: "modulo_5_tendencia.s",
    label: "Tendencia",
    value: "UP ▲",
    foot: "↑18 ↓10 · racha 5",
    shape: "box",
    color: "#ffffff",
    danger: false,
  },
];

export const CONTROLS = [
  { key: "riego", label: "Riego" },
  { key: "vent", label: "Ventilación" },
  { key: "luz", label: "Iluminación" },
  { key: "alarma", label: "Alarma / Buzzer" },
];

export const SENSORS = [
  {
    key: "temp",
    label: "Temperatura (DHT22)",
    unit: "°C",
    base: 28,
    spread: 2,
    trend: "▲ 1.2°",
    trendColor: "text-warn",
  },
  {
    key: "hum_amb",
    label: "Humedad ambiental",
    unit: "%",
    base: 66,
    spread: 4,
    trend: "— 0.0%",
    trendColor: "text-dim",
  },
  {
    key: "suelo_1",
    label: "Humedad suelo · Z1",
    unit: "%",
    base: 45,
    spread: 3,
    trend: "▲ 2%",
    trendColor: "text-info",
  },
  {
    key: "suelo_2",
    label: "Humedad suelo · Z2",
    unit: "%",
    base: 28,
    spread: 3,
    trend: "▼ 5%",
    trendColor: "text-warn",
  },
  {
    key: "luz",
    label: "Nivel de luz (LDR)",
    unit: "lx",
    base: 260,
    spread: 30,
    trend: "▼ 14",
    trendColor: "text-danger",
  },
  {
    key: "gas",
    label: "Gas MQ-2",
    unit: "ppm",
    base: 150,
    spread: 25,
    trend: "normal",
    trendColor: "text-dim",
  },
];

export const SEED_LOG_FULL: LogEntry[] = [
  { hora: "12:42:08", origen: "MQ-2", evento: "Nivel de gas estable", valor: "150 ppm", color: "white", estado: "NORMAL" },
  { hora: "12:41:55", origen: "suelo_2", evento: "Suelo seco detectado", valor: "28%", color: "warn", estado: "SECO" },
  { hora: "12:40:30", origen: "DHT22", evento: "Temperatura alta", valor: "33°C", color: "warn", estado: "ADVERT." },
  { hora: "12:38:12", origen: "bomba", evento: "Riego zona 2 ejecutado", valor: "4 s", color: "info", estado: "RIEGO" },
  { hora: "12:35:01", origen: "LDR", evento: "Luz baja · luces ON", valor: "220 lx", color: "white", estado: "AUTO" },
  { hora: "12:32:44", origen: "suelo_1", evento: "Humedad zona 1 OK", valor: "45%", color: "white", estado: "NORMAL" },
  { hora: "12:29:17", origen: "DHT22", evento: "Temperatura normalizada", valor: "28°C", color: "white", estado: "OK" },
  { hora: "12:25:50", origen: "ventilador", evento: "Ventilación activada", valor: "ON", color: "info", estado: "ACTIVO" },
  { hora: "12:22:33", origen: "MQ-2", evento: "Gas sobre umbral", valor: "420 ppm", color: "danger", estado: "ALERTA" },
  { hora: "12:18:04", origen: "buzzer", evento: "Alarma disparada", valor: "5 s", color: "danger", estado: "EMERG." },
  { hora: "12:15:22", origen: "bomba", evento: "Riego zona 1 ejecutado", valor: "3 s", color: "info", estado: "RIEGO" },
  { hora: "12:11:09", origen: "LDR", evento: "Luz normalizada", valor: "310 lx", color: "white", estado: "NORMAL" },
  { hora: "12:07:45", origen: "suelo_2", evento: "Suelo seco · umbral 30%", valor: "26%", color: "warn", estado: "SECO" },
  { hora: "12:03:18", origen: "sistema", evento: "Modo automático activado", valor: "AUTO", color: "white", estado: "INFO" },
  { hora: "11:58:01", origen: "DHT22", evento: "Humedad amb. baja", valor: "52%", color: "warn", estado: "ADVERT." },
];

export const SEED_LOG: LogEntry[] = [
  {
    hora: "12:42:08",
    origen: "MQ-2",
    evento: "Nivel de gas estable",
    valor: "150 ppm",
    color: "white",
    estado: "NORMAL",
  },
  {
    hora: "12:41:55",
    origen: "suelo_2",
    evento: "Suelo seco detectado",
    valor: "28%",
    color: "warn",
    estado: "SECO",
  },
  {
    hora: "12:40:30",
    origen: "DHT22",
    evento: "Temperatura alta",
    valor: "33°C",
    color: "warn",
    estado: "ADVERT.",
  },
  {
    hora: "12:38:12",
    origen: "bomba",
    evento: "Riego zona 2 ejecutado",
    valor: "4 s",
    color: "info",
    estado: "RIEGO",
  },
  {
    hora: "12:35:01",
    origen: "LDR",
    evento: "Luz baja · luces ON",
    valor: "220 lx",
    color: "white",
    estado: "AUTO",
  },
];
