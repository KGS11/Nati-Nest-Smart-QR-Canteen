export const ROOMS = {
  admin: "admin",
  kitchen: "kitchen",
  server: "server",
  session: (sessionId: string) => `session:${sessionId}`,
  table: (tableId: string) => `table:${tableId}`,
  waiter: (waiterId: string) => `waiter:${waiterId}`,
} as const;
