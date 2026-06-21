import { useQuery } from "@tanstack/react-query";
import { eventsApi } from "./api";
import { eventKeys } from "./keys";

export function useEvents(limit = 20) {
  return useQuery({
    queryKey: eventKeys.list(limit),
    queryFn: () => eventsApi.list(limit),
    refetchInterval: 15_000,
    retry: 2,
  });
}
