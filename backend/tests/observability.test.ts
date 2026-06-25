import express, { Express } from "express";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../src/middlewares/errorHandler";
import requestLogger from "../src/middlewares/requestLogger";
import { logger, redactSensitiveFields } from "../src/config/logger";

interface QueryEvent {
  duration: number;
  query: string;
  target: string;
}

type QueryCallback = (event: QueryEvent) => void;

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  queryRaw: vi.fn(),
  on: vi.fn(),
  queryCallback: undefined as QueryCallback | undefined,
}));

vi.mock("@prisma/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@prisma/client")>();

  class MockPrismaClient {
    $connect = mocks.connect;
    $disconnect = mocks.disconnect;
    $queryRaw = mocks.queryRaw;
    $on(event: string, callback: QueryCallback) {
      mocks.on(event, callback);
      if (event === "query") {
        mocks.queryCallback = callback;
      }
    }
  }

  return { ...actual, PrismaClient: MockPrismaClient };
});

let app: Express;

beforeAll(async () => {
  mocks.queryRaw.mockResolvedValue([{ result: 1 }]);
  const imported = await import("../src/index");
  app = imported.app;
});

describe("observability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockResolvedValue([{ result: 1 }]);
  });

  afterEach(() => {
    delete process.env.LOG_SLOW_REQUEST_MS;
    delete process.env.LOG_SLOW_QUERY_MS;
  });

  it("enhances health checks with uptime memory and database latency", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toEqual(expect.any(String));
    expect(response.body.database).toBe("connected");
    expect(response.body.message).toBe("Nati Nest API running");
    expect(response.body.uptime).toEqual(expect.any(Number));
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    expect(response.body.memoryMB).toEqual(expect.any(Number));
    expect(response.body.memoryMB).toBeGreaterThan(0);
    expect(response.body.dbLatencyMs).toEqual(expect.any(Number));
    expect(response.body.dbLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it("adds unique request and response timing headers to HTTP responses", async () => {
    const first = await request(app).get("/ready");
    const second = await request(app).get("/ready");
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(first.headers["x-request-id"]).toMatch(uuidPattern);
    expect(second.headers["x-request-id"]).toMatch(uuidPattern);
    expect(first.headers["x-request-id"]).not.toBe(second.headers["x-request-id"]);
    expect(first.headers["x-response-time"]).toMatch(/^\d+ms$/);
    expect(second.headers["x-response-time"]).toMatch(/^\d+ms$/);
  });

  it("redacts sensitive fields recursively without mutating safe fields", () => {
    expect(redactSensitiveFields({ password: "secret", name: "test" })).toEqual({
      password: "[REDACTED]",
      name: "test",
    });
    expect(redactSensitiveFields({ nested: { token: "abc", value: 1 } })).toEqual({
      nested: { token: "[REDACTED]", value: 1 },
    });
    expect(redactSensitiveFields({ name: "test", count: 2 })).toEqual({ name: "test", count: 2 });
    expect(redactSensitiveFields({ password: null })).toEqual({ password: null });
  });

  it("logs slow requests at warn level with correlation metadata", async () => {
    process.env.LOG_SLOW_REQUEST_MS = "0";
    const warnSpy = vi.spyOn(logger, "warn");

    await request(app).get("/ready");

    expect(warnSpy).toHaveBeenCalledWith(
      "request",
      expect.objectContaining({
        method: "GET",
        path: "/ready",
        statusCode: 200,
        slow: true,
      }),
    );
  });

  it("includes the request ID in error handler logs", async () => {
    const localApp = express();
    const errorSpy = vi.spyOn(logger, "error");
    localApp.use(requestLogger);
    localApp.get("/boom", (_request, _response, next) => {
      next(new Error("boom"));
    });
    localApp.use(errorHandler);

    const response = await request(localApp).get("/boom");

    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith(
      "Request failed",
      expect.objectContaining({
        requestId: response.headers["x-request-id"],
        path: "/boom",
        statusCode: 500,
      }),
    );
  });

  it("logs slow Prisma query events without query parameters", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.env.LOG_SLOW_QUERY_MS = "10";
    delete (globalThis as { prisma?: unknown }).prisma;
    vi.resetModules();
    mocks.queryCallback = undefined;
    const importedLogger = await import("../src/config/logger");
    const warnSpy = vi.spyOn(importedLogger.logger, "warn");

    await import("../src/config/db");
    mocks.queryCallback?.({ duration: 25, query: "SELECT 1", target: "postgresql" });

    expect(mocks.on).toHaveBeenCalledWith("query", expect.any(Function));
    expect(warnSpy).toHaveBeenCalledWith("prisma:slow_query", {
      event: "slow_query",
      durationMs: 25,
      query: "SELECT 1",
      target: "postgresql",
    });

    process.env.NODE_ENV = originalNodeEnv;
    delete (globalThis as { prisma?: unknown }).prisma;
  });
});
