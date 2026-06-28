import winston from "winston";

const sensitiveFields = new Set([
  "password",
  "passwordHash",
  "hashedPassword",
  "token",
  "accessToken",
  "refreshToken",
  "resetToken",
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
  "cookies",
  "apiKey",
  "api_key",
  "cloudinarySecret",
  "secret",
  "JWT_SECRET",
  "DATABASE_URL",
  "creditCard",
  "cardNumber",
  "cvv",
]);

const sensitiveKeyPattern = /(secret|password|token|key|authorization|cookie|card|cvv|database_url)/i;

const shouldRedactKey = (key: string) => sensitiveFields.has(key) || sensitiveKeyPattern.test(key);

const redactValue = (key: string, value: unknown, seen: WeakSet<object>): unknown => {
  if (shouldRedactKey(key) && value !== null && value !== undefined) {
    return "[REDACTED]";
  }

  if (value === null || value === undefined || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue("", item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    return redactSensitiveFields(value as Record<string, unknown>, seen);
  }

  return value;
};

export const redactSensitiveFields = (
  obj: Record<string, unknown>,
  seen = new WeakSet<object>(),
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, redactValue(key, value, seen)]),
  );

const redactionFormat = winston.format((info) => {
  const mutableInfo = info as Record<string, unknown>;
  const redactedInfo = redactSensitiveFields(mutableInfo);

  Object.keys(mutableInfo).forEach((key) => {
    mutableInfo[key] = redactedInfo[key];
  });

  return info;
});

const transports: winston.transport[] = [new winston.transports.Console()];

if (process.env.NODE_ENV !== "test") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    redactionFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: process.env.NODE_ENV !== "production" }),
    winston.format.json(),
  ),
  transports,
});

export const createChildLogger = (context: Record<string, unknown>) =>
  logger.child(context);
