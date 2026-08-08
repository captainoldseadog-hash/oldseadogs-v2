import { createHash, timingSafeEqual } from "node:crypto";

export const INSTAGRAM_MODES = Object.freeze({
  instagram: "instagram-login",
  facebook: "facebook-page",
});

export function normalizeConnectorMode(value) {
  return value === INSTAGRAM_MODES.facebook ? INSTAGRAM_MODES.facebook : INSTAGRAM_MODES.instagram;
}

export function redactSecret(value = "") {
  const text = String(value);
  return text ? `••••${text.slice(-4)}` : "";
}

export function hashOAuthState(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function validOAuthState(expectedHash, supplied) {
  if (!expectedHash || !supplied) return false;
  const actual = hashOAuthState(supplied);
  const expected = Buffer.from(String(expectedHash));
  const received = Buffer.from(actual);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function tokenExpiryStatus(expiresAt, now = Date.now()) {
  if (!expiresAt) return { state: "unknown", daysRemaining: null };
  const expiry = Date.parse(expiresAt);
  if (!Number.isFinite(expiry)) return { state: "unknown", daysRemaining: null };
  const daysRemaining = Math.ceil((expiry - now) / 86_400_000);
  return {
    state: daysRemaining < 0 ? "expired" : daysRemaining <= 7 ? "warning-7" : daysRemaining <= 14 ? "warning-14" : "valid",
    daysRemaining,
  };
}

export function mediaChildren(media) {
  return media?.media_type === "CAROUSEL_ALBUM" && Array.isArray(media?.children?.data)
    ? media.children.data.filter((item) => item && item.id)
    : [];
}

export function normalizeMediaForImport(media) {
  const children = mediaChildren(media);
  return {
    id: String(media?.id || ""),
    caption: String(media?.caption || ""),
    mediaType: String(media?.media_type || "IMAGE"),
    mediaUrl: String(media?.media_url || ""),
    thumbnailUrl: String(media?.thumbnail_url || ""),
    permalink: String(media?.permalink || ""),
    timestamp: String(media?.timestamp || ""),
    children: children.map((child) => ({
      id: String(child.id),
      mediaType: String(child.media_type || "IMAGE"),
      mediaUrl: String(child.media_url || ""),
      thumbnailUrl: String(child.thumbnail_url || ""),
    })),
  };
}

export function shouldRefreshToken(expiresAt, lastRefreshAt = "", now = Date.now()) {
  const status = tokenExpiryStatus(expiresAt, now);
  if (status.state === "expired" || status.state === "unknown") return false;
  const lastRefresh = Date.parse(lastRefreshAt);
  const refreshOldEnough = !Number.isFinite(lastRefresh) || now - lastRefresh >= 86_400_000;
  return refreshOldEnough && (status.daysRemaining ?? 99) <= 14;
}
