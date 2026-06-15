import { apiFetch } from "@/services/http-client";
import type { ActuatorLogRecord } from "@/lib/types/types";

export const actuatorLogsApi = {
  list: (limit = 20) =>
    apiFetch<ActuatorLogRecord[]>(`/api/actuator-logs?limit=${limit}`),
};
