import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AppError } from "./AppError";

export const JWT_ALGORITHM = "HS256" as const;
export const STAFF_TOKEN_ISSUER = "nati-nest-api";
export const STAFF_TOKEN_AUDIENCE = "nati-nest-staff";
export const SESSION_TOKEN_ISSUER = "nati-nest-api";
export const SESSION_TOKEN_AUDIENCE = "nati-nest-customer-session";

const MIN_SECRET_LENGTH = 64;

export const getRequiredSecret = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new AppError(`${name} is not configured`, 500);
  }

  if (process.env.NODE_ENV !== "test" && value.length < MIN_SECRET_LENGTH) {
    // Security: HS256 depends on a high-entropy shared secret.
    throw new AppError(`${name} must be at least ${MIN_SECRET_LENGTH} characters`, 500);
  }

  return value;
};

export const getStaffJwtSecret = () => getRequiredSecret("JWT_SECRET");

export const getSessionJwtSecret = () =>
  process.env.SESSION_JWT_SECRET
    ? getRequiredSecret("SESSION_JWT_SECRET")
    : getStaffJwtSecret();

export const staffSignOptions = (expiresIn: SignOptions["expiresIn"]): SignOptions => ({
  algorithm: JWT_ALGORITHM,
  expiresIn,
  issuer: STAFF_TOKEN_ISSUER,
  audience: STAFF_TOKEN_AUDIENCE,
});

export const staffVerifyOptions: jwt.VerifyOptions = {
  algorithms: [JWT_ALGORITHM],
  issuer: STAFF_TOKEN_ISSUER,
  audience: STAFF_TOKEN_AUDIENCE,
};

export const sessionSignOptions = (expiresIn: SignOptions["expiresIn"]): SignOptions => ({
  algorithm: JWT_ALGORITHM,
  expiresIn,
  issuer: SESSION_TOKEN_ISSUER,
  audience: SESSION_TOKEN_AUDIENCE,
});

export const sessionVerifyOptions: jwt.VerifyOptions = {
  algorithms: [JWT_ALGORITHM],
  issuer: SESSION_TOKEN_ISSUER,
  audience: SESSION_TOKEN_AUDIENCE,
};

export type VerifiedJwtPayload = JwtPayload & Record<string, unknown>;
