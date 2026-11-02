import {
  accountMatchesChannel,
  isOfficialCoverUrl,
  toPublicTikTokVideo,
} from "./tiktok-display.js";

export const TIKTOK_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";
export const TIKTOK_USER_URL = "https://open.tiktokapis.com/v2/user/info/";
export const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const TIKTOK_VIDEO_FIELDS = "id,title,video_description,cover_image_url,share_url,embed_link,view_count";
export const TIKTOK_PAGE_SIZE = 20;
export const TIKTOK_MAX_PAGES = 30;

function tokenError(code) {
  const error = new Error("TikTok rejected the access token.");
  error.code = String(code || "access_token_invalid");
  return error;
}

export function isTikTokTokenError(error) {
  const code = String(error?.code || "");
  return code === "access_token_invalid" || code === "access_token_expired" || code === "401";
}

function errorCode(payload, status) {
  const code = payload?.error && typeof payload.error === "object" ? payload.error.code : "";
  if (code && code !== "ok") return String(code);
  if (status === 401) return "401";
  return "";
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function emptyTikTokCatalog() {
  return { available: false, complete: false, videos: [], covers: {}, refresh: null };
}

export async function refreshTikTokAccessToken({ clientKey, clientSecret, refreshToken, fetchImpl = fetch }) {
  const body = new URLSearchParams({
    client_key: String(clientKey || ""),
    client_secret: String(clientSecret || ""),
    grant_type: "refresh_token",
    refresh_token: String(refreshToken || ""),
  });
  const response = await fetchImpl(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  });
  const payload = await readJson(response);
  const accessToken = String(payload.access_token || payload.data?.access_token || "");
  if (!response.ok || !accessToken) {
    throw tokenError(errorCode(payload, response.status) || "refresh_failed");
  }
  const expiresIn = Number(payload.expires_in || payload.data?.expires_in || 0);
  return {
    accessToken,
    refreshToken: String(payload.refresh_token || payload.data?.refresh_token || refreshToken || ""),
    expiresAt: Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : "",
    openId: String(payload.open_id || payload.data?.open_id || ""),
  };
}

export async function fetchTikTokUsername({ accessToken, fetchImpl = fetch }) {
  const url = new URL(TIKTOK_USER_URL);
  url.searchParams.set("fields", "username");
  const response = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8000),
  });
  const payload = await readJson(response);
  const code = errorCode(payload, response.status);
  if (code) {
    if (isTikTokTokenError({ code })) throw tokenError(code);
    return "";
  }
  return String(payload?.data?.user?.username || "");
}

export async function listAuthorizedTikTokVideos({ accessToken, fetchImpl = fetch, maxPages = TIKTOK_MAX_PAGES }) {
  const videos = [];
  const covers = {};
  const seenIds = new Set();
  const seenCursors = new Set();
  let cursor;
  let complete = false;
  const pages = Math.max(1, Math.min(Number(maxPages) || TIKTOK_MAX_PAGES, TIKTOK_MAX_PAGES));

  for (let page = 0; page < pages; page += 1) {
    const url = new URL(TIKTOK_LIST_URL);
    url.searchParams.set("fields", TIKTOK_VIDEO_FIELDS);
    const body = { max_count: TIKTOK_PAGE_SIZE };
    if (cursor !== undefined) body.cursor = cursor;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const payload = await readJson(response);
    const code = errorCode(payload, response.status);
    if (!response.ok || code) {
      if (isTikTokTokenError({ code }) || response.status === 401) throw tokenError(code || "401");
      const error = new Error("TikTok video list failed.");
      error.code = code || String(response.status || "list_failed");
      throw error;
    }
    const batch = Array.isArray(payload?.data?.videos) ? payload.data.videos : [];
    for (const item of batch) {
      const video = toPublicTikTokVideo(item);
      if (!video || seenIds.has(video.id)) continue;
      seenIds.add(video.id);
      videos.push(video);
      if (isOfficialCoverUrl(item?.cover_image_url)) covers[video.id] = String(item.cover_image_url);
    }
    const hasMore = Boolean(payload?.data?.has_more);
    const nextCursor = payload?.data?.cursor;
    if (!hasMore) {
      complete = true;
      break;
    }
    if (nextCursor === undefined || nextCursor === null || seenCursors.has(String(nextCursor)) || String(nextCursor) === String(cursor ?? "")) {
      complete = false;
      break;
    }
    seenCursors.add(String(nextCursor));
    cursor = nextCursor;
    complete = false;
  }

  return { videos, covers, complete };
}

export async function assembleTikTokCatalog({ credentials, fetchImpl = fetch, maxPages = TIKTOK_MAX_PAGES } = {}) {
  if (!credentials?.accessToken) return emptyTikTokCatalog();
  let accessToken = String(credentials.accessToken);
  let refreshed = null;

  async function refreshOnce(error) {
    if (!isTikTokTokenError(error)) throw error;
    if (refreshed || !credentials.clientKey || !credentials.clientSecret || !credentials.refreshToken) throw error;
    refreshed = await refreshTikTokAccessToken({
      clientKey: credentials.clientKey,
      clientSecret: credentials.clientSecret,
      refreshToken: credentials.refreshToken,
      fetchImpl,
    });
    accessToken = refreshed.accessToken;
  }

  try {
    let username = "";
    try {
      username = await fetchTikTokUsername({ accessToken, fetchImpl });
    } catch (error) {
      await refreshOnce(error);
      username = await fetchTikTokUsername({ accessToken, fetchImpl });
    }
    if (!accountMatchesChannel(username)) return { ...emptyTikTokCatalog(), refresh: refreshed };

    let listed;
    try {
      listed = await listAuthorizedTikTokVideos({ accessToken, fetchImpl, maxPages });
    } catch (error) {
      await refreshOnce(error);
      listed = await listAuthorizedTikTokVideos({ accessToken, fetchImpl, maxPages });
    }
    return {
      available: true,
      complete: listed.complete,
      videos: listed.videos,
      covers: listed.covers,
      refresh: refreshed,
    };
  } catch {
    return { ...emptyTikTokCatalog(), refresh: refreshed };
  }
}

export function listRequestUsesOnlyDisplayApi(url) {
  try {
    const parsed = new URL(String(url));
    return parsed.protocol === "https:" && parsed.hostname === "open.tiktokapis.com";
  } catch {
    return false;
  }
}

