export function getValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If it's a local upload, strip the domain and return relative path
  if (url.includes("/uploads/")) {
    return "/uploads/" + url.split("/uploads/")[1];
  }
  return url;
}
