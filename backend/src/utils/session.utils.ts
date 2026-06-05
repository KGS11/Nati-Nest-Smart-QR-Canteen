import crypto from "crypto";
import jwt from "jsonwebtoken";

export type SessionPayload = {
  sessionId: string;
  tableId: string;
  tableNumber: string;
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const createSessionJWT = (payload: SessionPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "24h",
    jwtid: generateSessionToken(),
  });
};

export const verifySessionJWT = (token: string): SessionPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return null;
    }

    const payload = jwt.verify(token, secret) as SessionPayload;
    return {
      sessionId: payload.sessionId,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
    };
  } catch {
    return null;
  }
};
