export const INSTAGRAM_MODES: Readonly<{ instagram: "instagram-login"; facebook: "facebook-page" }>;
export function normalizeConnectorMode(value?: string): "instagram-login" | "facebook-page";
export function redactSecret(value?: string): string;
export function hashOAuthState(value: string): string;
export function validOAuthState(expectedHash: string, supplied: string): boolean;
export function tokenExpiryStatus(expiresAt: string, now?: number): { state: "unknown" | "expired" | "warning-7" | "warning-14" | "valid"; daysRemaining: number | null };
export function mediaChildren(media: object): Array<Record<string, unknown>>;
export function normalizeMediaForImport(media: object): { id: string; caption: string; mediaType: string; mediaUrl: string; thumbnailUrl: string; permalink: string; timestamp: string; children: Array<{ id: string; mediaType: string; mediaUrl: string; thumbnailUrl: string }> };
export function shouldRefreshToken(expiresAt: string, lastRefreshAt?: string, now?: number): boolean;
