import type { Shape } from "@/lib/types/types";

/** Columnas del CSV que los módulos ARM64 pueden analizar (argv = índice). */
export const ARM64_COLUMNS = [
  { key: "temp", label: "Temperatura" },
  { key: "hum_aire", label: "Humedad aire" },
  { key: "soil1", label: "Suelo 1" },
  { key: "soil2", label: "Suelo 2" },
  { key: "luz", label: "Luz" },
  { key: "gas", label: "Gas" },
] as const;

export type Arm64ColumnKey = (typeof ARM64_COLUMNS)[number]["key"];
export type Arm64ModuleKey =
  | "media"
  | "rmse"
  | "varianza"
  | "regresion"
  | "anomalias"
  | "prediccion_reg"
  | "prediccion"
  | "integral"
  | "derivada"
  | "tendencia";

type Fields = Record<string, string>;

/** Las pendientes vienen como entero x100 (ARM64 no usa flotantes). */
function slopeX100(v: string | undefined): string | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? v : (n / 100).toFixed(2);
}

/** La predicción reporta PREDICTED_<K> (el nombre varía con K). */
function predicted(f: Fields): string | undefined {
  return Object.entries(f).find(([k]) => k.startsWith("PREDICTED_"))?.[1];
}

const TREND_ARROW: Record<string, string> = {
  ASCENDING: "↑",
  DESCENDING: "↓",
  STABLE: "→",
  UP: "↑",
  DOWN: "↓",
};

export interface Arm64ModuleMeta {
  key: Arm64ModuleKey;
  label: string;
  file: string;
  shape: Shape;
  /** Valor principal a mostrar, derivado de los campos parseados. */
  headline: (f: Fields) => string | undefined;
  /** Métricas secundarias para la fila inferior de la tarjeta. */
  stats: (f: Fields) => { k: string; v: string | undefined }[];
  /** Marca la tarjeta en rojo (p. ej. demasiadas anomalías). */
  danger?: (f: Fields) => boolean;
}

export const ARM64_MODULES: Arm64ModuleMeta[] = [
  {
    key: "media",
    label: "Media ponderada",
    file: "modulo_1_media.s",
    shape: "ico",
    headline: (f) => f.WEIGHTED_MEAN,
    stats: (f) => [
      { k: "Σx", v: f.SUM_X },
      { k: "Σw", v: f.WEIGHT_SUM },
    ],
  },
  {
    key: "rmse",
    label: "RMSE vs ideal",
    file: "modulo_1_rmse.s",
    shape: "octa",
    headline: (f) => f.RMSE,
    stats: (f) => [
      { k: "ideal", v: f.IDEAL },
      { k: "n", v: f.COUNT },
    ],
  },
  {
    key: "varianza",
    label: "Desv. estándar",
    file: "modulo_2_varianza.s",
    shape: "octa",
    headline: (f) => f.STD_DEV,
    stats: (f) => [
      { k: "var", v: f.VARIANCE },
      { k: "media", v: f.MEAN },
    ],
  },
  {
    key: "regresion",
    label: "Regresión lineal",
    file: "modulo_2_regresion.s",
    shape: "torus",
    headline: (f) =>
      f.TREND
        ? `${slopeX100(f.SLOPE_X100) ?? "—"} ${TREND_ARROW[f.TREND] ?? ""}`
        : slopeX100(f.SLOPE_X100),
    stats: (f) => [
      { k: "pend", v: slopeX100(f.SLOPE_X100) },
      { k: "tend", v: f.TREND },
      { k: "n", v: f.COUNT },
    ],
  },
  {
    key: "anomalias",
    label: "Anomalías",
    file: "modulo_3_anomalias.s",
    shape: "tetra",
    headline: (f) => f.ANOMALIES ?? f.TOTAL,
    stats: (f) => [
      { k: "media", v: f.MEAN },
      { k: "std", v: f.STD_DEV },
      { k: "riesgo", v: f.SYSTEM_RISK },
      { k: "n", v: f.TOTAL_VALUES },
    ],
    danger: (f) => Number(f.ANOMALIES ?? f.TOTAL) > 2 || f.SYSTEM_RISK === "HIGH",
  },
  {
    key: "prediccion_reg",
    label: "Predicción (regresión)",
    file: "modulo_3_prediccion.s",
    shape: "torus",
    headline: (f) => predicted(f),
    stats: (f) => [
      { k: "K", v: f.K },
      { k: "pend", v: slopeX100(f.SLOPE_X100) },
      { k: "b", v: slopeX100(f.INTERCEPT_X100) },
    ],
  },
  {
    key: "prediccion",
    label: "Predicción simple",
    file: "modulo_4_prediccion.s",
    shape: "torus",
    headline: (f) => f.NEXT_VALUE,
    stats: (f) => [
      { k: "init", v: f.INITIAL_VALUE },
      { k: "fin", v: f.FINAL_VALUE },
    ],
  },
  {
    key: "integral",
    label: "Integral del error",
    file: "modulo_4_integral_error.s",
    shape: "tetra",
    headline: (f) => f.ERROR_INTEGRAL,
    stats: (f) => [
      { k: "ideal", v: f.IDEAL },
      { k: "n", v: f.COUNT },
    ],
  },
  {
    key: "derivada",
    label: "Derivada local",
    file: "modulo_5_derivada_local.s",
    shape: "octa",
    headline: (f) => slopeX100(f.MAX_LOCAL_SLOPE_X100),
    stats: (f) => [
      { k: "ventana", v: f.WINDOW_SIZE },
      { k: "n", v: f.COUNT },
    ],
  },
  {
    key: "tendencia",
    label: "Tendencia",
    file: "modulo_5_tendencia.s",
    shape: "box",
    headline: (f) =>
      f.TREND ? `${f.TREND} ${TREND_ARROW[f.TREND] ?? "→"}` : undefined,
    stats: (f) => [
      { k: "+", v: f.INCREMENTS },
      { k: "−", v: f.DECREMENTS },
      { k: "acc", v: f.ACCUM_DIFF },
    ],
  },
];

/** Etiqueta legible de una columna a partir de su clave. */
export function columnLabel(key?: string | null): string {
  const aliases: Record<string, Arm64ColumnKey> = {
    hum_suelo_1: "soil1",
    hum_suelo_2: "soil2",
  };
  const normalized = key ? (aliases[key] ?? key) : key;
  return ARM64_COLUMNS.find((c) => c.key === normalized)?.label ?? "—";
}
