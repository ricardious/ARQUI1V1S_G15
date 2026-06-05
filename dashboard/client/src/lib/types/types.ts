export type StateColor = "white" | "warn" | "info" | "danger" | "dim";
export type Shape = "ico" | "octa" | "tetra" | "torus" | "box";
export type EstadoKey =
  | "NORMAL"
  | "ADVERTENCIA"
  | "RIEGO_ACTIVO"
  | "EMERGENCIA";

export interface LogEntry {
  hora: string;
  origen: string;
  evento: string;
  valor: string;
  color: StateColor;
  estado: string;
}

export interface EstadoInfo {
  label: string;
  sub: string;
  hex: string;
  rgb: string;
}
