import {
  logEditorMediaUpload,
  makeEditorMediaUploadLogContext,
  saveEditorImageAsset,
  saveEditorVideoAsset,
} from "./editor-media-upload";
import { getEditorData, saveGalleryItem, saveInstagramImport, updateMediaAsset } from "./site-content";
import { normalizeMediaForImport, shouldRefreshToken, tokenExpiryStatus } from "./instagram-connector-core.js";
import { publicCredentialStatus, readInstagramCredentials, writeInstagramCredentials } from "./instagram-credentials";
import { refreshInstagramToken } from "./instagram-oauth";

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data?: InstagramMedia[] };
};

function env() {
  return (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env || {};
}

function graphVersion() {
  return env().INSTAGRAM_GRAPH_VERSION?.trim() || "v23.0";
}

function graphHost(mode: string) {
  return mode === "facebook-page" ? "graph.facebook.com" : "graph.instagram.com";
}

async function fetchJsonWithRetry<T>(url: URL, init: RequestInit = {}, attempts = 3): Promise<T> {
  let lastError = "Instagram request failed.";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const payload = await response.json() as T & { error?: { message?: string; code?: number } };
      if (response.ok) return payload;
      lastError = payload.error?.message || `Instagram request failed (${response.status}).`;
      const temporary = response.status === 429 || response.status >= 500;
      if (!temporary || attempt === attempts) throw new Error(lastError);
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (attempt === attempts) throw new Error(lastError);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
  }
  throw new Error(lastError);
}

type SyncLog = { at: string; ok: boolean; checked: number; imported: number; skipped: number; failed: number; error: string };

async function syncLogPath() {
  const process = (globalThis as typeof globalThis & { process?: { cwd?: () => string; versions?: { node?: string }; env?: Record<string, string | undefined> } }).process;
  if (!process?.versions?.node || !process.cwd) return "";
  const path = await import(/* @vite-ignore */ "node:path") as { join(...parts: string[]): string };
  const dataDir = process.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  return path.join(dataDir, "instagram-sync-log.json");
}

async function readSyncLog(): Promise<SyncLog[]> {
  const file = await syncLogPath();
  if (!file) return [];
  try {
    const fs = await import(/* @vite-ignore */ "node:fs/promises") as { readFile(path: string, encoding: "utf8"): Promise<string> };
    const records = JSON.parse(await fs.readFile(file, "utf8"));
    return Array.isArray(records) ? records : [];
  } catch { return []; }
}

async function appendSyncLog(entry: SyncLog) {
  const file = await syncLogPath();
  if (!file) return;
  const fs = await import(/* @vite-ignore */ "node:fs/promises") as { mkdir(path: string, options: { recursive: boolean; mode: number }): Promise<void>; writeFile(path: string, value: string, options: { mode: number }): Promise<void> };
  const path = await import(/* @vite-ignore */ "node:path") as { dirname(value: string): string };
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const records = [entry, ...(await readSyncLog())].slice(0, 200);
  await fs.writeFile(file, `${JSON.stringify(records, null, 2)}\n`, { mode: 0o600 });
}

export async function getInstagramConnectorStatus() {
  const credentials = await readInstagramCredentials();
  const logs = await readSyncLog();
  const latest = logs[0];
  const intervalMinutes = Math.max(5, Number(env().INSTAGRAM_IMPORT_INTERVAL_MINUTES || 30));
  return {
    ...publicCredentialStatus(credentials),
    intervalMinutes,
    scheduleEnabled: false,
    lastSuccessfulSync: logs.find((entry) => entry.ok)?.at || "",
    skippedCount: latest?.skipped || 0,
    failedCount: latest?.failed || 0,
    syncLog: logs.slice(0, 20),
    setup: [
      "Set INSTAGRAM_CONNECTOR_MODE to instagram-login (preferred) or facebook-page.",
      "Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and INSTAGRAM_REDIRECT_URI in the private server environment.",
      "For Instagram Login, add the Instagram use case and request instagram_business_basic.",
      "For Facebook/Page mode, configure Facebook Login and request instagram_basic plus pages_show_list.",
      "Set INSTAGRAM_SYNC_SECRET only on the server; enable a schedule only after manual sync and deduplication are proven.",
    ],
  };
}

export async function testInstagramConnection() {
  const credentials = await readInstagramCredentials();
  if (!credentials.accessToken || !credentials.accountId) throw new Error("Connect an Instagram account or add server credentials first.");
  if (tokenExpiryStatus(credentials.expiresAt).state === "expired") throw new Error("The Instagram access token has expired. Reconnect the account.");
  const url = new URL(`https://${graphHost(credentials.mode)}/${graphVersion()}/${encodeURIComponent(credentials.accountId)}`);
  url.searchParams.set("fields", "id,username");
  url.searchParams.set("access_token", credentials.accessToken);
  try {
    const payload = await fetchJsonWithRetry<{ id?: string; username?: string }>(url);
    const updated = { ...credentials, accountId: payload.id || credentials.accountId, username: payload.username || credentials.username, lastConnectionTestAt: new Date().toISOString(), connectionError: "" };
    await writeInstagramCredentials(updated);
    return { ok: true, accountId: updated.accountId, username: updated.username, mode: updated.mode };
  } catch (error) {
    await writeInstagramCredentials({ ...credentials, lastConnectionTestAt: new Date().toISOString(), connectionError: error instanceof Error ? error.message : "Connection failed." });
    throw error;
  }
}

async function importMediaAsset(request: Request, item: ReturnType<typeof normalizeMediaForImport>) {
  const isVideo = item.mediaType === "VIDEO" || item.mediaType === "REELS";
  const assetUrl = isVideo ? item.mediaUrl : item.mediaUrl || item.thumbnailUrl;
  if (!assetUrl) throw new Error("No downloadable media URL was returned.");
  const response = await fetch(assetUrl);
  if (!response.ok) throw new Error(`Media download failed (${response.status}).`);
  const contentType = response.headers.get("content-type")?.split(";")[0] || (isVideo ? "video/mp4" : "image/jpeg");
  const bytes = await response.arrayBuffer();
  const fileExtension = contentType.includes("webm") ? "webm" : isVideo ? "mp4" : "jpg";
  const asset = isVideo
    ? await saveEditorVideoAsset({ bytes, contentType: contentType.startsWith("video/") ? contentType : "video/mp4", fileName: `instagram-${item.id}.${fileExtension}`, size: bytes.byteLength })
    : await saveEditorImageAsset({ request, bytes, contentType: contentType.startsWith("image/") ? contentType : "image/jpeg", fileName: `instagram-${item.id}.${fileExtension}`, size: bytes.byteLength, alt: item.caption.trim() || "Old Sea Dogs Instagram photograph", logContext: makeEditorMediaUploadLogContext("instagram-gallery-sync") });
  await updateMediaAsset(asset.id, {
    sourceType: "instagram", caption: item.caption, dateTaken: item.timestamp,
    source: item.permalink, tagsJson: JSON.stringify(item.children.map((child) => `instagram-child:${child.id}`)),
    description: item.children.length ? JSON.stringify({ instagramMediaId: item.id, carouselChildren: item.children }) : "",
  });
  return asset;
}

export async function syncInstagramGallery(request: Request) {
  let credentials = await readInstagramCredentials();
  if (!credentials.accessToken || !credentials.accountId) throw new Error("Instagram is not configured. Connect an account first.");
  if (tokenExpiryStatus(credentials.expiresAt).state === "expired") throw new Error("The Instagram token has expired. Existing imports were preserved; reconnect before syncing.");
  if (credentials.mode === "instagram-login" && shouldRefreshToken(credentials.expiresAt, credentials.lastRefreshAt)) {
    await refreshInstagramToken();
    credentials = await readInstagramCredentials();
  }

  const endpoint = new URL(`https://${graphHost(credentials.mode)}/${graphVersion()}/${encodeURIComponent(credentials.accountId)}/media`);
  endpoint.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}");
  endpoint.searchParams.set("limit", "50");
  endpoint.searchParams.set("access_token", credentials.accessToken);
  let checked = 0; let imported = 0; let skipped = 0; let failed = 0;
  try {
    const payload = await fetchJsonWithRetry<{ data?: InstagramMedia[] }>(endpoint);
    checked = payload.data?.length || 0;
    const editorData = await getEditorData();
    const known = new Set(editorData.instagramImports.map((item) => item.instagramMediaId));
    for (const raw of payload.data || []) {
      const item = normalizeMediaForImport(raw);
      if (!item.id || known.has(item.id)) { skipped += 1; continue; }
      try {
        const asset = await importMediaAsset(request, item);
        const galleryItem = await saveGalleryItem({
          mediaId: asset.id, sourceType: "instagram", sourceId: item.id, sourceUrl: item.permalink,
          title: (item.caption || "Instagram media").split(/\n/)[0].slice(0, 120), caption: item.caption,
          alt: item.caption.trim() || "Old Sea Dogs Instagram media", dateTaken: item.timestamp, status: "pending",
        });
        await saveInstagramImport({ instagramMediaId: item.id, permalink: item.permalink, mediaType: item.mediaType, caption: item.caption, timestamp: item.timestamp, mediaId: asset.id, galleryItemId: galleryItem.id, status: "pending" });
        imported += 1; known.add(item.id);
      } catch (error) {
        failed += 1;
        logEditorMediaUpload(makeEditorMediaUploadLogContext("instagram-gallery-sync"), "Instagram media import failed", { instagramMediaId: item.id, error: error instanceof Error ? error.message : "Import failed" });
      }
    }
    const result = { imported, skipped, failed, checked, mode: credentials.mode, reviewStatus: "pending" as const };
    await appendSyncLog({ at: new Date().toISOString(), ok: failed === 0, ...result, error: failed ? `${failed} media item(s) failed.` : "" });
    return result;
  } catch (error) {
    await appendSyncLog({ at: new Date().toISOString(), ok: false, checked, imported, skipped, failed: Math.max(1, failed), error: error instanceof Error ? error.message : "Instagram sync failed." });
    throw error;
  }
}

export async function getInstagramSyncLog() {
  return readSyncLog();
}
