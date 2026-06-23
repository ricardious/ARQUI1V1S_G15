import { useQuery } from "@tanstack/react-query";
import { readingsApi } from "./api";
import { readingKeys } from "./keys";

export function useLatestReading() {
  return useQuery({
    queryKey: readingKeys.latest(),
    queryFn: readingsApi.latest,
    refetchInterval: 10_000,
    retry: 2,
  });
}

export function useReadingsHistory(limit = 30) {
  return useQuery({
    queryKey: readingKeys.history(limit),
    queryFn: () => readingsApi.history(limit),
    refetchInterval: 30_000,
    retry: 2,
  });
}
