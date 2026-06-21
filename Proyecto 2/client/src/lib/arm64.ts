import type { Shape } from "@/lib/types/types";

/** Columnas del CSV que los módulos ARM64 pueden analizar (argv = índice). */
export const ARM64_COLUMNS = [
  { key: "temp", label: "Temperatura" },
  { key: "hum_aire", label: "Humedad aire" },
  { key: "hum_suelo_1", label: "Humedad suelo 1" },
  { key: "hum_suelo_2", label: "Humedad suelo 2" },
  { key: "luz", label: "Luz" },
  { key: "gas", label: "Gas" },
] as const;

export type Arm64ColumnKey = (typeof ARM64_COLUMNS)[number]["key"];
export type Arm64ModuleKey =
  | "media"
  | "varianza"
  | "anomalias"
  | "prediccion"
  | "tendencia";

type Fields = Record<string, string>;

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
    key: "anomalias",
    label: "Anomalías",
    file: "modulo_3_anomalias.s",
    shape: "tetra",
    headline: (f) => f.TOTAL,
    stats: () => [],
    danger: (f) => Number(f.TOTAL) > 2,
  },
  {
    key: "prediccion",
    label: "Predicción",
    file: "modulo_4_prediccion.s",
    shape: "torus",
    headline: (f) => f.NEXT_VALUE,
    stats: (f) => [
      { k: "init", v: f.INITIAL_VALUE },
      { k: "fin", v: f.FINAL_VALUE },
    ],
  },
  {
    key: "tendencia",
    label: "Tendencia",
    file: "modulo_5_tendencia.s",
    shape: "box",
    headline: (f) =>
      f.TREND
        ? `${f.TREND} ${f.TREND === "UP" ? "↑" : f.TREND === "DOWN" ? "↓" : "→"}`
        : undefined,
    stats: (f) => [
      { k: "+", v: f.INCREMENTS },
      { k: "−", v: f.DECREMENTS },
      { k: "acc", v: f.ACCUM_DIFF },
    ],
  },
];

/** Etiqueta legible de una columna a partir de su clave. */
export function columnLabel(key?: string | null): string {
  return ARM64_COLUMNS.find((c) => c.key === key)?.label ?? "—";
}
