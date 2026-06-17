export const commandKeys = {
  all:  () => ["commands"] as const,
  list: (limit: number) => ["commands", "list", limit] as const,
};
