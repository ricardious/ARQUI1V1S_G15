// ── Visual / UI ────────────────────────────────────────────────────────────
export type StateColor = "white" | "warn" | "info" | "danger" | "dim";
export type Shape = "ico" | "octa" | "tetra" | "torus" | "box";
export type EstadoKey =
  | "NORMAL"
  | "ADVERTENCIA"
  | "RIEGO_ACTIVO"
  | "EMERGENCIA"
  | "MODO_MANUAL"
  | "SIN_DATOS";

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

// ── MQTT ───────────────────────────────────────────────────────────────────
export type MqttConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface SensorReadings {
  temperatura: number | null;
  humedad_ambiente: number | null;
  humedad_suelo_area1: number | null;
  humedad_suelo_area2: number | null;
  luz: number | null;
  gas: number | null;
}

export interface ActuatorStates {
  riego: boolean;
  riego_area1: boolean;
  riego_area2: boolean;
  ventilador: boolean;
  luces: boolean;
  alarma: boolean;
}

// ── Backend API ────────────────────────────────────────────────────────────
export interface SensorRecord {
  _id: string;
  timestamp: string;
  tipo_dato: string;
  valor: {
    temperatura?: number;
    humedad_ambiente?: number;
    humedad_suelo_area1?: number;
    humedad_suelo_area2?: number;
    luz?: number;
    gas?: number;
    riego_1?: number;
    riego_2?: number;
  };
  origen: string;
  estado_relacionado: string;
}

export interface EventRecord {
  _id: string;
  timestamp: string;
  tipo_dato: string;
  valor: Record<string, unknown>;
  origen: string;
  estado_relacionado: string;
}

export type CommandRecord = EventRecord;
export type ActuatorLogRecord = EventRecord;

export interface SystemStatus {
  _id?: string;
  timestamp: string;
  tipo_dato: string;
  valor: Record<string, unknown>;
  origen: string;
  estado_relacionado: string;
}

export interface Arm64ModuleResult {
  raw: string;
  fields: Record<string, string>;
  column?: string | null;
}

export interface Arm64Result {
  _id: string;
  timestamp: string;
  tipo_dato: string;
  valor: {
    column?: string;
    ran?: string[];
    media?: Arm64ModuleResult;
    varianza?: Arm64ModuleResult;
    anomalias?: Arm64ModuleResult;
    prediccion?: Arm64ModuleResult;
    tendencia?: Arm64ModuleResult;
  };
  origen: string;
  estado_relacionado: string;
}
