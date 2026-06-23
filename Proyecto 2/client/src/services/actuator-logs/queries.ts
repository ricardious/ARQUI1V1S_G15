import { useQuery } from "@tanstack/react-query";
import { actuatorLogsApi } from "./api";
import { actuatorLogKeys } from "./keys";

export function useActuatorLogs(limit = 20) {
  return useQuery({
    queryKey: actuatorLogKeys.list(limit),
    queryFn: () => actuatorLogsApi.list(limit),
    refetchInterval: 15_000,
    retry: 2,
  });
}
