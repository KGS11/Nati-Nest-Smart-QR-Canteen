import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const originalEnv = { ...process.env };

const productionEnv = {
  NODE_ENV: "production",
  PORT: "5000",
  DATABASE_URL: "postgresql://user:password@example.com:5432/neondb?sslmode=require",
  JWT_SECRET: "a".repeat(64),
  SESSION_JWT_SECRET: "b".repeat(64),
  JWT_EXPIRES_IN: "15m",
  SESSION_JWT_EXPIRES_IN: "12h",
  CLIENT_URL: "https://nati-nest-smart-qr-canteen.vercel.app",
  BACKEND_URL: "https://nati-nest-smart-qr-canteen-production.up.railway.app",
  CORS_ORIGINS: "https://nati-nest-smart-qr-canteen.vercel.app",
};

describe("environment validation", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, ...productionEnv };
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("rejects production startup without Cloudinary credentials", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
    const { validateEnv } = await import("../src/config/env");

    expect(() => validateEnv()).toThrow("process.exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production"),
    );
  });

  it("allows production startup with Cloudinary credentials", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "demo-key";
    process.env.CLOUDINARY_API_SECRET = "demo-secret";
    const { validateEnv } = await import("../src/config/env");

    expect(validateEnv()).toMatchObject({
      CLOUDINARY_CLOUD_NAME: "demo-cloud",
      CLOUDINARY_API_KEY: "demo-key",
      CLOUDINARY_API_SECRET: "demo-secret",
    });
  });
});
