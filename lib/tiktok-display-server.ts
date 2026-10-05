import { isOfficialCoverUrl, isTikTokVideoId, toPublicTikTokCatalog } from "./tiktok-display.js";
import { assembleTikTokCatalog, refreshTikTokAccessToken } from "./tiktok-display-api.js";
import type { PublicTikTokVideo } from "./tiktok-display.js";
import type { TikTokCatalog, TikTokTokenRefresh } from "./tiktok-display-api.js";

const CACHE_MS = 30 * 60 * 1000;
const FAILURE_CACHE_MS = 60 * 1000;

type SavedTokens = {
  accessToken: string;
  refreshToken: string;
  openId: string;
  expiresAt: string;
};

type TikTokRuntimeCredentials = SavedTokens & {
  clientKey: string;
  clientSecret: string;
};

type CatalogCache = {
  at: number;
  ttl: number;
  catalog: TikTokCatalog;
  publicVideos: PublicTikTokVideo[];
  available: boolean;
  complete: boolean;
};

let cache: CatalogCache | null = null;
let pending: Promise<CatalogCache> | null = null;
let memoryTokens: Partial<SavedTokens> | null = null;

function nodeProcess() {
  return (globalThis as typeof globalThis & {
    process?: { cwd?: () => string; versions?: { node?: string }; env?: Record<string, string | undefined> };
  }).process;
}

function environmentTokens(): TikTokRuntimeCredentials {
  const env = nodeProcess()?.env || {};
  return {
    clientKey: env.TIKTOK_CLIENT_KEY?.trim() || "",
    clientSecret: env.TIKTOK_CLIENT_SECRET?.trim() || "",
    accessToken: env.TIKTOK_ACCESS_TOKEN?.trim() || "",
    refreshToken: env.TIKTOK_REFRESH_TOKEN?.trim() || "",
    openId: env.TIKTOK_OPEN_ID?.trim() || "",
    expiresAt: env.TIKTOK_TOKEN_EXPIRES_AT?.trim() || "",
  };
}

function prefer(saved: string | undefined, fallback: string) {
  const value = saved?.trim();
  return value || fallback;
}

async function credentialPath() {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd) return "";
  const path = await import(/* @vite-ignore */ "node:path") as { join(...parts: string[]): string };
  const dataDir = process.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  return path.join(dataDir, "tiktok-credentials.json");
}

async function readSavedTokens(): Promise<Partial<SavedTokens>> {
  const file = await credentialPath();
  if (!file) return {};
  try {
    const fs = await import(/* @vite-ignore */ "node:fs/promises") as { readFile(path: string, encoding: "utf8"): Promise<string> };
    const saved = JSON.parse(await fs.readFile(file, "utf8")) as Partial<SavedTokens>;
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

export async function readTikTokCredentials(): Promise<TikTokRuntimeCredentials> {
  const env = environmentTokens();
  const saved = await readSavedTokens();
  const memory = memoryTokens || {};
  return {
    clientKey: env.clientKey,
    clientSecret: env.clientSecret,
    accessToken: prefer(memory.accessToken, prefer(saved.accessToken, env.accessToken)),
    refreshToken: prefer(memory.refreshToken, prefer(saved.refreshToken, env.refreshToken)),
    openId: prefer(memory.openId, prefer(saved.openId, env.openId)),
    expiresAt: prefer(memory.expiresAt, prefer(saved.expiresAt, env.expiresAt)),
  };
}

async function writeTikTokCredentials(tokens: SavedTokens) {
  memoryTokens = tokens;
  const file = await credentialPath();
  if (!file) return;
  const fs = await import(/* @vite-ignore */ "node:fs/promises") as {
    mkdir(path: string, options: { recursive: boolean; mode: number }): Promise<void>;
    writeFile(path: string, data: string, options: { mode: number }): Promise<void>;
    rename(from: string, to: string): Promise<void>;
    chmod(path: string, mode: number): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ "node:path") as { dirname(value: string): string };
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${Date.now()}.tmp`;
  const record: SavedTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    openId: tokens.openId,
    expiresAt: tokens.expiresAt,
  };
  await fs.writeFile(temporary, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  await fs.rename(temporary, file);
  await fs.chmod(file, 0o600);
}

function tokenExpired(expiresAt: string, now = Date.now()) {
  if (!expiresAt) return false;
  const time = Date.parse(expiresAt);
  return Number.isFinite(time) && time <= now + 60_000;
}

function applyRefresh(credentials: TikTokRuntimeCredentials, refresh: TikTokTokenRefresh | null): TikTokRuntimeCredentials {
  if (!refresh?.accessToken) return credentials;
  return {
    ...credentials,
    accessToken: refresh.accessToken,
    refreshToken: refresh.refreshToken || credentials.refreshToken,
    openId: refresh.openId || credentials.openId,
    expiresAt: refresh.expiresAt || credentials.expiresAt,
  };
}

async function persistRefresh(credentials: TikTokRuntimeCredentials, refresh: TikTokTokenRefresh | null) {
  if (!refresh?.accessToken) return credentials;
  const next = applyRefresh(credentials, refresh);
  try {
    await writeTikTokCredentials(next);
  } catch (error) {
    memoryTokens = next;
    console.error("TikTok token refresh could not be stored.", error instanceof Error ? error.name : "Error");
  }
  return next;
}

function snapshotFromCatalog(catalog: TikTokCatalog, now: number): CatalogCache {
  const published = toPublicTikTokCatalog(catalog);
  return {
    at: now,
    ttl: published.available ? CACHE_MS : FAILURE_CACHE_MS,
    catalog,
    publicVideos: published.videos,
    available: published.available,
    complete: published.complete,
  };
}

async function populateCatalog(now: number) {
  let credentials = await readTikTokCredentials();
  if (!credentials.accessToken && !(credentials.refreshToken && credentials.clientKey && credentials.clientSecret)) {
    return snapshotFromCatalog({ available: false, complete: false, videos: [], covers: {}, refresh: null }, now);
  }
  if ((!credentials.accessToken || tokenExpired(credentials.expiresAt, now)) && credentials.refreshToken && credentials.clientKey && credentials.clientSecret) {
    try {
      const refresh = await refreshTikTokAccessToken({
        clientKey: credentials.clientKey,
        clientSecret: credentials.clientSecret,
        refreshToken: credentials.refreshToken,
      });
      credentials = await persistRefresh(credentials, refresh);
    } catch {
      console.error("TikTok token refresh failed.");
    }
  }
  const catalog = await assembleTikTokCatalog({ credentials });
  if (catalog.refresh) await persistRefresh(credentials, catalog.refresh);
  return snapshotFromCatalog(catalog, now);
}

export async function loadPublicTikTokCatalog() {
  const now = Date.now();
  if (cache && now - cache.at < cache.ttl) {
    return { available: cache.available, complete: cache.complete, videos: cache.publicVideos };
  }
  if (!pending) {
    pending = populateCatalog(now).finally(() => {
      pending = null;
    });
  }
  cache = await pending;
  return { available: cache.available, complete: cache.complete, videos: cache.publicVideos };
}

export async function readTikTokCoverUrl(videoId: string) {
  if (!isTikTokVideoId(videoId)) return "";
  await loadPublicTikTokCatalog();
  const coverUrl = cache?.catalog.covers?.[videoId] || "";
  return isOfficialCoverUrl(coverUrl) ? coverUrl : "";
}

export function clearTikTokDisplayCache() {
  cache = null;
  pending = null;
}
