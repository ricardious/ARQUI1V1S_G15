export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((v) => String(v).padStart(2, "0"))
      .join(":");
  } catch {
    return iso;
  }
}

export function parseFloat2(val: string | number | null | undefined): number | null {
  if (val == null || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 10) / 10;
}

export function estadoToEstadoKey(raw: string): "NORMAL" | "ADVERTENCIA" | "RIEGO_ACTIVO" | "EMERGENCIA" {
  const map: Record<string, "NORMAL" | "ADVERTENCIA" | "RIEGO_ACTIVO" | "EMERGENCIA"> = {
    NORMAL:       "NORMAL",
    ADVERTENCIA:  "ADVERTENCIA",
    RIEGO_ACTIVO: "RIEGO_ACTIVO",
    EMERGENCIA:   "EMERGENCIA",
  };
  return map[raw.toUpperCase()] ?? "NORMAL";
}

export function estadoRelacionadoToColor(
  estado: string,
): "white" | "warn" | "info" | "danger" | "dim" {
  switch (estado) {
    case "NORMAL":       return "white";
    case "ADVERTENCIA":  return "warn";
    case "RIEGO_ACTIVO": return "info";
    case "EMERGENCIA":   return "danger";
    case "MODO_MANUAL":  return "info";
    default:             return "dim";
  }
}
