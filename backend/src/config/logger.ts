import winston from "winston";

const sensitiveFields = new Set([
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
]);

const redactValue = (key: string, value: unknown): unknown => {
  if (sensitiveFields.has(key) && value !== null && value !== undefined) {
    return "[REDACTED]";
  }

  if (value === null || value === undefined || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue("", item));
  }

  if (typeof value === "object") {
    return redactSensitiveFields(value as Record<string, unknown>);
  }

  return value;
};

export const redactSensitiveFields = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, redactValue(key, value)]),
  );

const redactionFormat = winston.format((info) => {
  const mutableInfo = info as Record<string, unknown>;
  const redactedInfo = redactSensitiveFields(mutableInfo);

  Object.keys(mutableInfo).forEach((key) => {
    mutableInfo[key] = redactedInfo[key];
  });

  return info;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    redactionFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: process.env.NODE_ENV !== "production" }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export const createChildLogger = (context: Record<string, unknown>) =>
  logger.child(context);
