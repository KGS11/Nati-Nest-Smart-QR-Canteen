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

  if (trimmed.startsWith("/uploads/")) {
    return normalizeUploadPath(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/uploads/")) {
      return normalizeUploadPath(parsed.pathname);
    }

    const isCloudinary = parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
    const isLocalApi =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      parsed.port === "5000";

    if (isCloudinary || isLocalApi) {
      return parsed.toString();
    }
  } catch (_error) {
    return null;
  }

  return null;
}
