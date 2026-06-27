import request from "supertest";
import { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/config/logger";
import { apiRateLimit, authRateLimit } from "../src/middlewares/security";

const mockPrisma = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
  user: { findUnique: vi.fn() },
  tableSession: { findUnique: vi.fn() },
}));

vi.mock("../src/config/db", () => ({ prisma: mockPrisma }));

const { app } = await import("../src/index");

const createResponse = () => {
  const headers = new Map<string, string>();
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn((name: string, value: string) => headers.set(name, value)),
  };

  return { response: response as unknown as Response, headers };
};

const runLimiter = async (
  limiter: (request: Request, response: Response, next: NextFunction) => unknown,
  request: Partial<Request> & { ip: string },
) => {
  const { response, headers } = createResponse();
  const next = vi.fn();
  const limiterRequest = {
    method: "POST",
    path: request.path ?? "/api/auth/login",
    url: request.url ?? "/api/auth/login",
    originalUrl: request.originalUrl ?? request.url ?? "/api/auth/login",
    ip: request.ip,
    app: { get: vi.fn(() => false) },
    headers: {},
    socket: { remoteAddress: request.ip },
    requestId: request.requestId,
  } as unknown as Request;

  await limiter(limiterRequest, response, next);
  return { response, headers, next };
};

describe("rate limiting hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
  });

  it("keeps health checks outside API rate limiting", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["retry-after"]).toBeUndefined();
    expect(response.body.status).toBe("ok");
  });

  it("returns RFC 7807 problem details and Retry-After for auth limit breaches", async () => {
    const warnSpy = vi.spyOn(logger, "warn");
    const ip = "10.10.10.10";

    for (let index = 0; index < 100; index += 1) {
      expect((await runLimiter(authRateLimit, { ip, requestId: "request-id" })).next).toHaveBeenCalledOnce();
    }

    const blocked = await runLimiter(authRateLimit, { ip, requestId: "request-id" });

    expect(blocked.response.status).toHaveBeenCalledWith(429);
    expect(blocked.headers.get("Retry-After")).toBe("900");
    expect(blocked.headers.get("Content-Type")).toBe("application/problem+json");
    expect(blocked.response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "https://nati-nest.local/problems/rate-limit-exceeded",
        title: "Too Many Requests",
        status: 429,
        success: false,
      }),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "rate_limit:breach",
      expect.objectContaining({
        requestId: "request-id",
        correlationId: "request-id",
        ip,
        endpoint: "/api/auth/login",
        tier: "auth",
      }),
    );
  });

  it("skips auth endpoints in the general API limiter", async () => {
    const result = await runLimiter(apiRateLimit, {
      ip: "10.10.10.20",
      originalUrl: "/api/auth/refresh",
      path: "/auth/refresh",
      url: "/auth/refresh",
    });

    expect(result.next).toHaveBeenCalledOnce();
    expect(result.response.status).not.toHaveBeenCalledWith(429);
  });

  it("rate limits non-auth API callers independently", async () => {
    const ip = "10.10.10.30";

    for (let index = 0; index < 200; index += 1) {
      expect(
        (await runLimiter(apiRateLimit, { ip, originalUrl: "/api/menu-items", path: "/menu-items" })).next,
      ).toHaveBeenCalledOnce();
    }

    const blocked = await runLimiter(apiRateLimit, {
      ip,
      originalUrl: "/api/menu-items",
      path: "/menu-items",
    });

    expect(blocked.response.status).toHaveBeenCalledWith(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
  });
});
