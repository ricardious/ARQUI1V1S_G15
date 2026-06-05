import type {
  EstadoKey,
  EstadoInfo,
  LogEntry,
  Shape,
  StateColor,
} from "@/lib/types/types";

export const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Áreas de cultivo" },
  { label: "Sensores" },
  { label: "Actuadores" },
  { label: "Historial" },
  { label: "Análisis ARM64" },
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
};

export const ESTADO_COLOR: Record<EstadoKey, StateColor> = {
  NORMAL: "white",
  ADVERTENCIA: "warn",
  RIEGO_ACTIVO: "info",
  EMERGENCIA: "danger",
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
