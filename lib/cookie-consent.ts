export type ConsentChoice = {
  analytics: boolean;
  ads: boolean;
  decidedAt: string;
  version: 1;
};

export const consentStorageKey = "oldseadogs_cookie_consent_v1";
export const consentCookieName = "oldseadogs_cookie_consent";
export const consentMaxAgeSeconds = 31_536_000;

export function parseConsentChoice(raw: string | null | undefined, now = Date.now()): ConsentChoice | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentChoice>;
    const decidedAt = typeof value.decidedAt === "string" ? Date.parse(value.decidedAt) : Number.NaN;
    const isCurrentVersion = value.version === undefined || value.version === 1;
    if (
      typeof value.analytics !== "boolean" ||
      typeof value.ads !== "boolean" ||
      !Number.isFinite(decidedAt) ||
      decidedAt > now + 300_000 ||
      now - decidedAt > consentMaxAgeSeconds * 1000 ||
      !isCurrentVersion
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
