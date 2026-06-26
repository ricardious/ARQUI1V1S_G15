export const statusKeys = {
  all: () => ["status"] as const,
  current: () => ["status", "current"] as const,
};
