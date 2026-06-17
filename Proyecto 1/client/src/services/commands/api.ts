import { apiFetch } from "@/services/http-client";
import type { CommandRecord } from "@/lib/types/types";

export const commandsApi = {
  list: (limit = 20) =>
    apiFetch<CommandRecord[]>(`/api/commands?limit=${limit}`),
};
