import { useQuery } from "@tanstack/react-query";
import { statusApi } from "./api";
import { statusKeys } from "./keys";

export function useSystemStatus() {
  return useQuery({
    queryKey: statusKeys.current(),
    queryFn: statusApi.get,
    refetchInterval: 10_000,
    retry: 2,
  });
}
