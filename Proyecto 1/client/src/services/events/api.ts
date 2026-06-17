import { apiFetch } from "@/services/http-client";
import type { EventRecord } from "@/lib/types/types";

export const eventsApi = {
  list: (limit = 20) =>
    apiFetch<EventRecord[]>(`/api/events?limit=${limit}`),
};
