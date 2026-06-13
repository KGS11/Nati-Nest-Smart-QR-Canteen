import { logger } from "../config/logger";

type MonitoringContext = Record<string, string | number | boolean | undefined>;

export const captureException = (error: unknown, context: MonitoringContext = {}) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  if (process.env.SENTRY_DSN) {
    // Hook point for a Sentry transport. Kept dependency-free until DSN rollout is approved.
  }

  if (process.env.NODE_ENV !== "test") {
    logger.error(message, {
      stack: process.env.NODE_ENV === "production" ? undefined : stack,
      context,
    });
  }
};
