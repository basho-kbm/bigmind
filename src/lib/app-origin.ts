const DEFAULT_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isInternalHost(host: string) {
  return ["0.0.0.0", "127.0.0.1", "localhost"].some((value) => host.includes(value));
}

export function getAppOrigin(headerSource: Pick<Headers, "get">) {
  const requestOrigin = normalizeOrigin(headerSource.get("origin"));
  if (requestOrigin) {
    return requestOrigin;
  }

  const forwardedHost = headerSource.get("x-forwarded-host");
  if (forwardedHost && !isInternalHost(forwardedHost)) {
    const forwardedProto = headerSource.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = headerSource.get("host");
  if (host && !isInternalHost(host)) {
    const forwardedProto = headerSource.get("x-forwarded-proto");
    const proto = forwardedProto ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  return (
    normalizeOrigin(process.env.APP_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    DEFAULT_ORIGIN
  );
}
