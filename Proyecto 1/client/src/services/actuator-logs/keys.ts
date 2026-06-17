export const actuatorLogKeys = {
  all:  () => ["actuator-logs"] as const,
  list: (limit: number) => ["actuator-logs", "list", limit] as const,
};
