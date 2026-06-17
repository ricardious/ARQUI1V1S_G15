export const arm64Keys = {
  all:     () => ["arm64"] as const,
  results: (limit: number) => ["arm64", "results", limit] as const,
};
