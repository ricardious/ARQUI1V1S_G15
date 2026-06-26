import { useMutation, useQueryClient } from "@tanstack/react-query";
import { arm64Api, type Arm64RunOptions } from "./api";
import { arm64Keys } from "./keys";

export function useGenerateCsv() {
  return useMutation({
    mutationFn: arm64Api.generateCsv,
  });
}

export function useRunArm64() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: Arm64RunOptions = {}) => arm64Api.run(opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: arm64Keys.all() });
    },
  });
}
