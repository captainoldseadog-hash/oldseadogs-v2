export const TIKTOK_UNIQUE_ID = "oldseadogs8";
export const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@oldseadogs8";

const VIDEO_ID = /^[0-9]{8,32}$/;
const COVER_HOST = /^(?:[\w-]+\.)*(?:tiktokcdn(?:-us|-eu)?\.com)$/i;

export function isTikTokVideoId(value) {
  return VIDEO_ID.test(String(value || ""));
}

export function accountMatchesChannel(username, expected = TIKTOK_UNIQUE_ID) {
  const value = String(username || "").trim().replace(/^@/, "").toLowerCase();
  if (!value) return true;
  return value === String(expected || "").trim().toLowerCase();
}

export function formatTikTokViewCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return "";
  const rounded = Math.floor(count);
  if (rounded < 10000) return String(rounded);
  if (rounded < 1000000) return formatScaled(rounded, 1000, "K", "M");
  if (rounded < 1000000000) return formatScaled(rounded, 1000000, "M", "B");
  return `${compactCount(rounded / 1000000000)}B`;
}

function compactCount(scaled) {
  return (Math.round(scaled * 10) / 10).toFixed(1).replace(/\.0$/, "");
}

function formatScaled(value, divisor, suffix, promotedSuffix) {
  const text = compactCount(value / divisor);
  if (text === "1000") return `1${promotedSuffix}`;
  return `${text}${suffix}`;
}

export function cleanTikTokTitle(value) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
}

export function isOfficialCoverUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && COVER_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export function officialEmbedUrl(videoId, embedLink) {
  const id = String(videoId || "");
  if (!isTikTokVideoId(id)) return "";
  const fallback = `https://www.tiktok.com/embed/v2/${id}`;
  if (!embedLink) return fallback;
  try {
    const url = new URL(String(embedLink));
    if (url.protocol !== "https:" || url.hostname !== "www.tiktok.com") return fallback;
    const playerPath = url.pathname === `/embed/v2/${id}` || url.pathname === `/player/v1/${id}`;
    const profilePlayer = url.pathname === "/static/profile-video" && url.searchParams.get("id") === id;
    if (!playerPath && !profilePlayer) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function officialWatchUrl(videoId, shareUrl) {
  const id = String(videoId || "");
  if (!isTikTokVideoId(id)) return "";
  const fallback = `${TIKTOK_PROFILE_URL}/video/${id}`;
  if (!shareUrl) return fallback;
  try {
    const url = new URL(String(shareUrl));
    const host = url.hostname === "tiktok.com" || url.hostname === "www.tiktok.com" || url.hostname === "m.tiktok.com";
    if (url.protocol !== "https:" || !host || !url.pathname.includes(`/video/${id}`)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

export function coverPathForTikTokVideo(videoId) {
  const id = String(videoId || "");
  if (!isTikTokVideoId(id)) return "";
  return `/api/social/tiktok/cover/${id}`;
}

export function toPublicTikTokVideo(raw) {
  if (!raw || !isTikTokVideoId(raw.id)) return null;
  const title = cleanTikTokTitle(raw.title || raw.video_description || "");
  const viewCount = Number(raw.view_count);
  return {
    id: String(raw.id),
    title,
    viewCount: Number.isFinite(viewCount) && viewCount >= 0 ? Math.floor(viewCount) : 0,
    watchUrl: officialWatchUrl(raw.id, raw.share_url),
    embedUrl: officialEmbedUrl(raw.id, raw.embed_link),
    coverPath: coverPathForTikTokVideo(raw.id),
  };
}

export function toPublicTikTokCatalog(catalog) {
  const videos = Array.isArray(catalog?.videos) ? catalog.videos.map((video) => sanitizePublicTikTokVideo(video)).filter(Boolean) : [];
  return {
    available: Boolean(catalog?.available),
    complete: Boolean(catalog?.complete),
    videos,
  };
}

export function sanitizePublicTikTokVideo(value) {
  if (!value || typeof value !== "object" || !isTikTokVideoId(value.id)) return null;
  const viewCount = Number(value.viewCount);
  return {
    id: String(value.id),
    title: cleanTikTokTitle(value.title),
    viewCount: Number.isFinite(viewCount) && viewCount >= 0 ? Math.floor(viewCount) : 0,
    watchUrl: officialWatchUrl(value.id, value.watchUrl),
    embedUrl: officialEmbedUrl(value.id, value.embedUrl),
    coverPath: coverPathForTikTokVideo(value.id),
  };
}
