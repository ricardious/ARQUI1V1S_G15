import { useQuery } from "@tanstack/react-query";
import { commandsApi } from "./api";
import { commandKeys } from "./keys";

export function useCommands(limit = 20) {
  return useQuery({
    queryKey: commandKeys.list(limit),
    queryFn:  () => commandsApi.list(limit),
    refetchInterval: 15_000,
    retry: 2,
  });
}
