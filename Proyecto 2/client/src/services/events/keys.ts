export const eventKeys = {
  all:  () => ["events"] as const,
  list: (limit: number) => ["events", "list", limit] as const,
};
