import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");
const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  SESSION_JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  SESSION_JWT_EXPIRES_IN: z.string().default("12h"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().optional(),
  BACKEND_URL: optionalUrlSchema,
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
  LOG_SLOW_QUERY_MS: z.coerce.number().int().positive().default(500),
  LOG_SLOW_REQUEST_MS: z.coerce.number().int().positive().default(1000),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
  SOCKET_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  SOCKET_RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
  SENTRY_DSN: optionalUrlSchema,
});

const validateDatabaseUrl = (databaseUrl: string, nodeEnv: z.infer<typeof nodeEnvSchema>) => {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return "DATABASE_URL must be a valid URL";
  }

  if (!["postgresql:", "postgres:"].includes(parsed.protocol)) {
    return "DATABASE_URL must use postgresql:// or postgres://";
  }

  if (nodeEnv === "production" && parsed.searchParams.get("sslmode") !== "require") {
    return "DATABASE_URL must include sslmode=require in production";
  }

  return null;
};

const validateJwtExpiry = (value: string) => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return false;

  const amount = Number(match[1]);
  const unit = match[2];
  const seconds =
    unit === "s" ? amount : unit === "m" ? amount * 60 : unit === "h" ? amount * 3600 : amount * 86400;

  return seconds <= 15 * 60;
};

export type AppEnv = z.infer<typeof baseEnvSchema>;

export const validateEnv = (): AppEnv => {
  const parsed = baseEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    console.error("Environment validation failed:\n" + issues.join("\n"));
    process.exit(1);
  }

  const env = parsed.data;
  const errors: string[] = [];

  if (env.NODE_ENV !== "test") {
    if (!env.DATABASE_URL) {
      errors.push("DATABASE_URL is required");
    } else {
      const databaseError = validateDatabaseUrl(env.DATABASE_URL, env.NODE_ENV);
      if (databaseError) errors.push(databaseError);
    }

    if (!env.JWT_SECRET || env.JWT_SECRET.length < 64) {
      errors.push("JWT_SECRET must be at least 64 characters");
    }

    if (!env.SESSION_JWT_SECRET || env.SESSION_JWT_SECRET.length < 64) {
      errors.push("SESSION_JWT_SECRET must be at least 64 characters");
    }
  }

  if (env.NODE_ENV !== "test" && !validateJwtExpiry(env.JWT_EXPIRES_IN)) {
    errors.push("JWT_EXPIRES_IN must be 15 minutes or less, for example 15m");
  }

  if (errors.length) {
    console.error("Environment validation failed:\n" + errors.join("\n"));
    process.exit(1);
  }

  return env;
};
