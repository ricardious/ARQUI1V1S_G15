import { apiFetch } from "@/services/http-client";
import type { Arm64Result } from "@/lib/types/types";

export interface Arm64RunOptions {
  col?: string;
  module?: string;
  n?: number;
  ini?: number;
  fin?: number;
}

export const arm64Api = {
  results: (limit = 10) =>
    apiFetch<Arm64Result[]>(`/api/arm64/results?limit=${limit}`),
  generateCsv: (n = 30) => {
    const params = new URLSearchParams({ n: String(n) });
    return apiFetch<{ message: string; path: string; rows: number }>(
      `/api/arm64/generate-csv?${params.toString()}`,
      { method: "POST" },
    );
  },
  run: ({ col, module, n, ini, fin }: Arm64RunOptions = {}) => {
    const params = new URLSearchParams();
    if (col) params.set("col", col);
    if (module) params.set("module", module);
    if (n != null) params.set("n", String(n));
    if (ini != null) params.set("ini", String(ini));
    if (fin != null) params.set("fin", String(fin));
    const qs = params.toString();
    return apiFetch<{ message: string; results: Arm64Result[] }>(
      `/api/arm64/run${qs ? `?${qs}` : ""}`,
      { method: "POST" },
    );
  },
};
