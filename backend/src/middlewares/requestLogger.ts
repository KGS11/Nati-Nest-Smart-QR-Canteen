import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { generateRequestId } from "../utils/requestId";

type RequestWithId = Request & { requestId: string };

const parseThreshold = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseContentLength = (value: number | string | string[] | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = generateRequestId();
  const startedAt = Date.now();
  (req as RequestWithId).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = ((...args: Parameters<Response["writeHead"]>) => {
    if (!res.headersSent && !res.hasHeader("X-Response-Time")) {
      res.setHeader("X-Response-Time", `${Date.now() - startedAt}ms`);
    }
    return originalWriteHead(...args);
  }) as Response["writeHead"];

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const slowThreshold = parseThreshold(process.env.LOG_SLOW_REQUEST_MS, 1000);
    const slow = durationMs >= slowThreshold;
    const logPayload = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      contentLength: parseContentLength(res.getHeader("Content-Length")),
      userAgent: req.get("User-Agent") ?? null,
      ip: req.ip,
      slow,
    };

    if (slow) {
      logger.warn("request", logPayload);
    } else {
      logger.info("request", logPayload);
    }
  });

  next();
};

export default requestLogger;
