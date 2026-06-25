import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "./logger";

type QueryEventPrismaClient = PrismaClient<Prisma.PrismaClientOptions, "query">;

const globalForPrisma = globalThis as unknown as {
  prisma?: QueryEventPrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  (new PrismaClient({
    log:
      process.env.NODE_ENV !== "test"
        ? [{ emit: "event", level: "query" }, "error"]
        : ["error"],
  }) as QueryEventPrismaClient);

if (process.env.NODE_ENV !== "test") {
  prisma.$on("query", (event) => {
    const threshold = Number.parseInt(process.env.LOG_SLOW_QUERY_MS ?? "", 10);
    const slowQueryThreshold = Number.isFinite(threshold) ? threshold : 500;

    if (event.duration >= slowQueryThreshold) {
      logger.warn("prisma:slow_query", {
        event: "slow_query",
        durationMs: event.duration,
        query: event.query,
        target: event.target,
      });
    }
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
