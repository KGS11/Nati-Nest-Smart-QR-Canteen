export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        name: string;
      };
      session?: {
        sessionId: string;
        tableId: string;
        tableNumber: string;
      };
    }
  }
}
