import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
  },
}));

vi.mock("../src/config/db", () => ({ prisma: mockPrisma }));
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

// We must import authService after mocking db/bcrypt
const { authService } = await import("../src/services/auth.service");

describe("Progressive Account Lockout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure";
  });

  it("increments failedAttempts on failed password", async () => {
    const mockUser = {
      id: "user-1",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 0,
      lastFailedAttempt: null,
      lockUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false); // bad password

    await expect(authService.login("8888888888", "wrong")).rejects.toThrow("Invalid credentials");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        failedAttempts: 1,
        lastFailedAttempt: expect.any(Date),
        lockUntil: null,
      },
    });
  });

  it("locks user out for 1 minute after 5 failed attempts", async () => {
    const mockUser = {
      id: "user-1",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 4,
      lastFailedAttempt: null,
      lockUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false); // bad password

    await expect(authService.login("8888888888", "wrong")).rejects.toThrow(
      "Too many failed attempts. Please try again in 1 minute."
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        failedAttempts: 5,
        lastFailedAttempt: expect.any(Date),
        lockUntil: expect.any(Date),
      },
    });

    const updateCall = mockPrisma.user.update.mock.calls[0][0];
    const lockUntilVal = updateCall.data.lockUntil;
    const diff = lockUntilVal.getTime() - Date.now();
    expect(diff).toBeGreaterThan(50 * 1000); // around 1 min
    expect(diff).toBeLessThan(65 * 1000);
  });

  it("locks user out for 5 minutes after 10 failed attempts", async () => {
    const mockUser = {
      id: "user-1",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 9,
      lastFailedAttempt: null,
      lockUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

    await expect(authService.login("8888888888", "wrong")).rejects.toThrow(
      "Too many failed attempts. Please try again in 5 minutes."
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        failedAttempts: 10,
        lastFailedAttempt: expect.any(Date),
        lockUntil: expect.any(Date),
      },
    });
  });

  it("locks user out for 15 minutes after 15 failed attempts", async () => {
    const mockUser = {
      id: "user-1",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 14,
      lastFailedAttempt: null,
      lockUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false);

    await expect(authService.login("8888888888", "wrong")).rejects.toThrow(
      "Too many failed attempts. Please try again in 15 minutes."
    );
  });

  it("rejects login attempt immediately if lockUntil is in the future", async () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000);
    const mockUser = {
      id: "user-1",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 5,
      lastFailedAttempt: new Date(),
      lockUntil: futureDate,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

    await expect(authService.login("8888888888", "any-password")).rejects.toThrow(
      "Too many failed attempts. Please try again in 5 minutes."
    );

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("allows login attempt if lockUntil is in the past, and resets on success", async () => {
    const pastDate = new Date(Date.now() - 1000);
    const mockUser = {
      id: "user-1",
      name: "Server",
      phone: "8888888888",
      passwordHash: "hash",
      role: Role.SERVER,
      isActive: true,
      failedAttempts: 5,
      lastFailedAttempt: new Date(Date.now() - 61 * 1000),
      lockUntil: pastDate,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true); // successful login

    const result = await authService.login("8888888888", "correct");

    expect(result).toBeDefined();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        failedAttempts: 0,
        lastFailedAttempt: null,
        lockUntil: null,
      },
    });
  });
});
