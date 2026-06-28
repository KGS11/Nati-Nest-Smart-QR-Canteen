import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import {
  getSessionJwtSecret,
  sessionSignOptions,
  sessionVerifyOptions,
} from "./jwt.utils";

export type SessionPayload = {
  sessionId: string;
  tableId: string;
  tableNumber: string;
};

export const generateSessionToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const createSessionJWT = (payload: SessionPayload): string => {
  const secret = getSessionJwtSecret();

  return jwt.sign(payload, secret, {
    ...sessionSignOptions((process.env.SESSION_JWT_EXPIRES_IN ?? "12h") as SignOptions["expiresIn"]),
    jwtid: generateSessionToken(),
  });
};

export const verifySessionJWT = (token: string): SessionPayload | null => {
  try {
    const secret = getSessionJwtSecret();

    const payload = jwt.verify(token, secret, sessionVerifyOptions) as SessionPayload;
    return {
      sessionId: payload.sessionId,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
    };
  } catch {
    return null;
  }
};
