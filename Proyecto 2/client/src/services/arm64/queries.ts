import { useQuery } from "@tanstack/react-query";
import { arm64Api } from "./api";
import { arm64Keys } from "./keys";

export function useArm64Results(limit = 10) {
  return useQuery({
    queryKey: arm64Keys.results(limit),
    queryFn: () => arm64Api.results(limit),
    retry: 1,
  });
}
