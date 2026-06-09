import { apiFetch } from "@/services/http-client";
import type { SensorRecord } from "@/lib/types/types";

export const readingsApi = {
  latest: () => apiFetch<SensorRecord | null>("/api/readings/latest"),
  history: (limit = 30) =>
    apiFetch<SensorRecord[]>(`/api/readings/history?limit=${limit}`),
};
