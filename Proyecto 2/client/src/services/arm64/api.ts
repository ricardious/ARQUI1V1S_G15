import { apiFetch } from "@/services/http-client";
import type { Arm64Result } from "@/lib/types/types";

export const arm64Api = {
  results:     (limit = 10) => apiFetch<Arm64Result[]>(`/api/arm64/results?limit=${limit}`),
  generateCsv: () => apiFetch<{ message: string; path: string; rows: number }>("/api/arm64/generate-csv", { method: "POST" }),
  run:         () => apiFetch<{ message: string; results: Record<string, string> }>("/api/arm64/run", { method: "POST" }),
};
