import "../config/dotenv";
import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../config/logger";

const DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_AUTH_RATE_LIMIT_MAX = process.env.NODE_ENV === "test" ? 100 : 10;
const DEFAULT_API_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_API_RATE_LIMIT_MAX = 200;

const parseEnvInteger = (name: string, fallback: number) => {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const AUTH_RATE_LIMIT_WINDOW_MS =
  process.env.NODE_ENV === "test"
    ? DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS
    : parseEnvInteger("AUTH_RATE_LIMIT_WINDOW_MS", DEFAULT_AUTH_RATE_LIMIT_WINDOW_MS);
export const AUTH_RATE_LIMIT_MAX = process.env.NODE_ENV === "test" ? 100 : parseEnvInteger("AUTH_RATE_LIMIT_MAX", DEFAULT_AUTH_RATE_LIMIT_MAX);
export const API_RATE_LIMIT_WINDOW_MS = parseEnvInteger(
  "API_RATE_LIMIT_WINDOW_MS",
  DEFAULT_API_RATE_LIMIT_WINDOW_MS,
);
export const API_RATE_LIMIT_MAX =
  process.env.NODE_ENV === "test" ? DEFAULT_API_RATE_LIMIT_MAX : parseEnvInteger("API_RATE_LIMIT_MAX", DEFAULT_API_RATE_LIMIT_MAX);

type RequestWithId = Request & { requestId?: string };

const getRequestId = (request: Request) => (request as RequestWithId).requestId ?? null;

const getEndpoint = (request: Request) => request.originalUrl || request.path || request.url || "";

const isHealthEndpoint = (request: Request) => getEndpoint(request).split("?")[0] === "/health";

const isAuthEndpoint = (request: Request) => getEndpoint(request).startsWith("/api/auth");

const createRateLimitHandler =
  (tier: "auth" | "api", detail: string, windowMs: number, max: number) =>
  (request: Request, response: Response) => {
    const retryAfterSeconds = Math.ceil(windowMs / 1000);
    const requestId = getRequestId(request);

    if (typeof response.hasHeader !== "function" || !response.hasHeader("Retry-After")) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
    }
    response.setHeader("Content-Type", "application/problem+json");

    logger.warn("rate_limit:breach", {
      timestamp: new Date().toISOString(),
      requestId,
      correlationId: requestId,
      ip: request.ip,
      endpoint: getEndpoint(request),
      method: request.method,
      tier,
      limit: max,
      windowMs,
    });

    return response.status(429).json({
      type: "https://nati-nest.local/problems/rate-limit-exceeded",
      title: "Too Many Requests",
      status: 429,
      detail,
      instance: getEndpoint(request),
      success: false,
      message: detail,
    });
  };

export const securityHeaders = (_request: Request, response: Response, next: NextFunction) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return next();
};

export const authRateLimit = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isHealthEndpoint,
  handler: createRateLimitHandler(
    "auth",
    "Too many authentication attempts from this network. Try again later.",
    AUTH_RATE_LIMIT_WINDOW_MS,
    AUTH_RATE_LIMIT_MAX,
  ),
});

export const apiRateLimit = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (request) => isHealthEndpoint(request) || isAuthEndpoint(request),
  handler: createRateLimitHandler(
    "api",
    "Too many requests. Please slow down.",
    API_RATE_LIMIT_WINDOW_MS,
    API_RATE_LIMIT_MAX,
  ),
});
