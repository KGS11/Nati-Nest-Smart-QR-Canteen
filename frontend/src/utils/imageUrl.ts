import { env } from "@/config/env";

export function getValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const normalizeUploadPath = (pathname: string) => {
    if (!pathname.startsWith("/uploads/") || pathname.includes("..")) {
      return null;
    }
    return pathname;
  };

  const configuredOrigins = new Set<string>();
  const addOrigin = (value: string | undefined) => {
    if (!value) return;
    try {
      configuredOrigins.add(new URL(value.replace(/\/api\/?$/, "")).origin);
    } catch (_error) {
      // Ignore malformed optional env values.
    }
  };

  addOrigin(env.apiUrl);
  addOrigin(env.socketUrl);
  addOrigin(process.env.NEXT_PUBLIC_API_URL);
  addOrigin(process.env.NEXT_PUBLIC_SOCKET_URL);

  if (typeof window !== "undefined") {
    addOrigin(window.location.origin);
  }

  if (trimmed.startsWith("/uploads/")) {
    return normalizeUploadPath(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    const isCloudinary = parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
    const isLocalApi =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      parsed.port === "5000";
    const isRailwayBackend =
      parsed.protocol === "https:" &&
      parsed.hostname === "nati-nest-smart-qr-canteen-production.up.railway.app";
    const isConfiguredOrigin = configuredOrigins.has(parsed.origin);

    if (parsed.pathname.startsWith("/uploads/")) {
      if (isLocalApi || isRailwayBackend || isConfiguredOrigin) {
        return parsed.toString();
      }
      return normalizeUploadPath(parsed.pathname);
    }

    if (isCloudinary || isLocalApi || isRailwayBackend || isConfiguredOrigin) {
      return parsed.toString();
    }
  } catch (_error) {
    return null;
  }

  return null;
}
