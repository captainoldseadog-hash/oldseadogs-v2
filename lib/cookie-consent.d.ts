export type StoredConsentChoice = {
  version: number;
  analytics: boolean;
  ads: boolean;
  decidedAt: string;
  expiresAt: string;
};

export const consentSchemaVersion: number;
export const consentLifetimeSeconds: number;
export function createConsentChoice(
  choice: Pick<StoredConsentChoice, "analytics" | "ads">,
  now?: number,
): StoredConsentChoice;
export function parseConsentChoice(raw: string | unknown, now?: number): StoredConsentChoice | null;
export function consentCookieAttributes(
  location: Pick<Location, "hostname" | "protocol">,
  maxAge?: number,
): string;
