export const consentSchemaVersion = 2;
export const consentLifetimeSeconds = 60 * 60 * 24 * 180;

export function createConsentChoice(choice, now = Date.now()) {
  return {
    version: consentSchemaVersion,
    analytics: choice.analytics === true,
    ads: choice.ads === true,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + consentLifetimeSeconds * 1000).toISOString(),
  };
}

export function parseConsentChoice(raw, now = Date.now()) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      !parsed ||
      parsed.version !== consentSchemaVersion ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.ads !== "boolean" ||
      typeof parsed.decidedAt !== "string" ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    const decidedAt = Date.parse(parsed.decidedAt);
    const expiresAt = Date.parse(parsed.expiresAt);
    if (!Number.isFinite(decidedAt) || !Number.isFinite(expiresAt) || expiresAt <= now || decidedAt > now) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function consentCookieAttributes(location, maxAge = consentLifetimeSeconds) {
  const hostname = location.hostname.toLowerCase().replace(/^www\./, "");
  const attributes = [`Max-Age=${Math.max(0, Math.floor(maxAge))}`, "Path=/", "SameSite=Lax"];
  if (hostname === "oldseadogs.com") attributes.push("Domain=.oldseadogs.com");
  if (location.protocol === "https:") attributes.push("Secure");
  return attributes.join("; ");
}
