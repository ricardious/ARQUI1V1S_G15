import { apiFetch } from "@/services/http-client";
import type { SystemStatus } from "@/lib/types/types";

export const statusApi = {
  get: () => apiFetch<SystemStatus>("/api/status"),
};
