export const readingKeys = {
  all:     () => ["readings"] as const,
  latest:  () => ["readings", "latest"] as const,
  history: (limit: number) => ["readings", "history", limit] as const,
};
