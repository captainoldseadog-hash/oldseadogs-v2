export type ConsentChoice = {
  version: 1;
  analytics: boolean;
  ads: boolean;
  decidedAt: string;
};

export const consentSchemaVersion: number;
export const consentLifetimeSeconds: number;
export const consentCookieName: string;
export const legacyConsentCookieName: string;
export const consentMaxAgeSeconds: number;
export const consentStorageKey: string;
export const legacyConsentStorageKey: string;
export function createConsentChoice(
  choice: Pick<ConsentChoice, "analytics" | "ads">,
  now?: number,
): ConsentChoice;
export function parseConsentChoice(raw: string | null | undefined, now?: number): ConsentChoice | null;
export function consentCookieAttributes(
  location: Pick<Location, "hostname" | "protocol">,
  maxAge?: number,
): string;
