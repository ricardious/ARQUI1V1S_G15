import { apiFetch } from "@/services/http-client";
import type { Arm64Result } from "@/lib/types/types";

export interface Arm64RunOptions {
  col?: string;
  module?: string;
}

export const arm64Api = {
  results:     (limit = 10) => apiFetch<Arm64Result[]>(`/api/arm64/results?limit=${limit}`),
  generateCsv: () => apiFetch<{ message: string; path: string; rows: number }>("/api/arm64/generate-csv", { method: "POST" }),
  run:         ({ col, module }: Arm64RunOptions = {}) => {
    const params = new URLSearchParams();
    if (col) params.set("col", col);
    if (module) params.set("module", module);
    const qs = params.toString();
    return apiFetch<{ message: string; results: Arm64Result["valor"] }>(
      `/api/arm64/run${qs ? `?${qs}` : ""}`,
      { method: "POST" },
    );
  },
};
