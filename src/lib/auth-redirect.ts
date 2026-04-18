export function getSafeAuthRedirect(
  next: string | null | undefined,
  origin: string,
  fallback = "/app",
) {
  const trimmed = next?.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.origin === new URL(origin).origin) {
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
