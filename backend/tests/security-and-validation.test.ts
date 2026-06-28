import { Role, SessionStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextFunction, Request, Response } from "express";
import { createOrderSchema, orderIdParamSchema } from "../src/validators/order.validators";
import { apiRateLimit, authRateLimit, securityHeaders } from "../src/middlewares/security";
import { sessionSignOptions, staffSignOptions } from "../src/utils/jwt.utils";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  tableSession: {
    findUnique: vi.fn(),
  },
}));

vi.mock("../src/config/db", () => ({ prisma: mockPrisma }));

const { authenticateSocket } = await import("../src/sockets/auth");

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
  ip: string,
) => {
  const { response } = createResponse();
  const next = vi.fn();
  const request = {
    ip,
    app: { get: vi.fn(() => false) },
    headers: {},
    socket: { remoteAddress: ip },
  } as unknown as Request;

  await limiter(request, response, next);
  return { response, next };
};

describe("security middleware and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.SESSION_JWT_SECRET = "test-session-secret";
  });

  it("sets security headers", () => {
    const { response, headers } = createResponse();
    const next = vi.fn();

    securityHeaders({} as Request, response, next);

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(next).toHaveBeenCalledOnce();
  });

  it("rate limits auth and API callers independently", async () => {
    for (let i = 0; i < 100; i += 1) {
      expect((await runLimiter(authRateLimit, "10.0.0.10")).next).toHaveBeenCalledOnce();
    }

    const authBlocked = await runLimiter(authRateLimit, "10.0.0.10");
    expect(authBlocked.response.status).toHaveBeenCalledWith(429);

    for (let i = 0; i < 200; i += 1) {
      expect((await runLimiter(apiRateLimit, "10.0.0.20")).next).toHaveBeenCalledOnce();
    }

    const apiBlocked = await runLimiter(apiRateLimit, "10.0.0.20");
    expect(apiBlocked.response.status).toHaveBeenCalledWith(429);
  });

  it("validates order payloads and UUID route params", () => {
    expect(() =>
      createOrderSchema.parse({
        items: [{ menuItemId: "not-a-uuid", quantity: 0 }],
      }),
    ).toThrow();

    expect(
      createOrderSchema.parse({
        items: [
          {
            menuItemId: "11111111-1111-4111-8111-111111111111",
            quantity: 2,
            specialInstructions: "Less spicy",
          },
        ],
      }),
    ).toMatchObject({ items: [{ quantity: 2 }] });

    expect(() => orderIdParamSchema.parse({ orderId: "bad-id" })).toThrow();
  });
});

describe("socket authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.SESSION_JWT_SECRET = "test-session-secret";
  });

  it("rejects sockets without handshake auth", async () => {
    const next = vi.fn();
    await authenticateSocket({ handshake: { auth: {} }, data: {} } as never, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("accepts active staff socket tokens", async () => {
    const token = jwt.sign(
      { userId: "staff-id", role: Role.KITCHEN },
      process.env.JWT_SECRET!,
      staffSignOptions("15m"),
    );
    const socket = { handshake: { auth: { token, type: "staff" } }, data: {} };
    const next = vi.fn();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "staff-id",
      name: "Kitchen",
      role: Role.KITCHEN,
      isActive: true,
    });

    await authenticateSocket(socket as never, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.auth).toMatchObject({ type: "staff", userId: "staff-id" });
  });

  it("accepts active customer session socket tokens", async () => {
    const token = jwt.sign(
      {
        sessionId: "11111111-1111-4111-8111-111111111111",
        tableId: "22222222-2222-4222-8222-222222222222",
        tableNumber: "5",
      },
      process.env.SESSION_JWT_SECRET!,
      sessionSignOptions("12h"),
    );
    const socket = { handshake: { auth: { token, type: "customer" } }, data: {} };
    const next = vi.fn();
    mockPrisma.tableSession.findUnique.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      tableId: "22222222-2222-4222-8222-222222222222",
      status: SessionStatus.ACTIVE,
    });

    await authenticateSocket(socket as never, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.auth).toMatchObject({
      type: "customer",
      sessionId: "11111111-1111-4111-8111-111111111111",
    });
  });
});
