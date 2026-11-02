export type ConsentChoice = {
  analytics: boolean;
  ads: boolean;
  decidedAt: string;
  version: 1;
};

export const consentStorageKey = "oldseadogs_cookie_consent_v1";
export const legacyConsentStorageKey = "oldseadogs_cookie_consent_v2";
export const consentCookieName = "oldseadogs_cookie_consent_v2";
export const legacyConsentCookieName = "oldseadogs_cookie_consent";
export const consentMaxAgeSeconds = 31_536_000;
export const consentSchemaVersion = 1;
export const consentLifetimeSeconds = consentMaxAgeSeconds;

export function createConsentChoice(
  choice: Pick<ConsentChoice, "analytics" | "ads">,
  now = Date.now(),
): ConsentChoice {
  return {
    analytics: choice.analytics === true,
    ads: choice.ads === true,
    decidedAt: new Date(now).toISOString(),
    version: consentSchemaVersion,
  };
}

type PersistedConsentChoice = Omit<Partial<ConsentChoice>, "version"> & {
  version?: number;
  expiresAt?: string;
};

export function parseConsentChoice(raw: string | null | undefined, now = Date.now()): ConsentChoice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as PersistedConsentChoice;
    const decidedAt = typeof value.decidedAt === "string" ? Date.parse(value.decidedAt) : Number.NaN;
    const expiresAt = typeof value.expiresAt === "string" ? Date.parse(value.expiresAt) : Number.NaN;
    const isSupportedVersion = value.version === undefined || value.version === 1 || value.version === 2;
    const hasValidLegacyExpiry = value.version !== 2 || (Number.isFinite(expiresAt) && expiresAt > now);
    if (
      typeof value.analytics !== "boolean" ||
      typeof value.ads !== "boolean" ||
      !Number.isFinite(decidedAt) ||
      decidedAt > now + 300_000 ||
      now - decidedAt > consentMaxAgeSeconds * 1000 ||
      !isSupportedVersion ||
      !hasValidLegacyExpiry
    ) {
      return null;
    }
    return {
      analytics: value.analytics,
      ads: value.ads,
      decidedAt: new Date(decidedAt).toISOString(),
      version: 1,
    };
  } catch {
    return null;
  }
}

export function consentCookieAttributes(
  location: Pick<Location, "hostname" | "protocol">,
  maxAge = consentMaxAgeSeconds,
) {
  const hostname = location.hostname.toLowerCase().replace(/^www\./, "");
  const attributes = [`Max-Age=${Math.max(0, Math.floor(maxAge))}`, "Path=/", "SameSite=Lax"];
  if (hostname === "oldseadogs.com") attributes.push("Domain=.oldseadogs.com");
  if (location.protocol === "https:") attributes.push("Secure");
  return attributes.join("; ");
}
