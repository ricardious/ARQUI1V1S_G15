export function parsePlainFloat(payload: string): number | null {
  const n = parseFloat(payload.trim());
  return isNaN(n) ? null : n;
}

export function parsePlainBool(payload: string): boolean {
  return payload.trim().toUpperCase() === "ON";
}

export function buildClientId(): string {
  return `greenpi-dash-${Math.random().toString(16).slice(2, 8)}`;
}
