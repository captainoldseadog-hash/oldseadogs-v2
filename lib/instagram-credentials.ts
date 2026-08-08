import { normalizeConnectorMode, tokenExpiryStatus } from "./instagram-connector-core.js";

export type InstagramConnectorMode = "instagram-login" | "facebook-page";

export type InstagramCredentialRecord = {
  mode: InstagramConnectorMode;
  accessToken: string;
  accountId: string;
  username: string;
  connectedAt: string;
  expiresAt: string;
  lastRefreshAt: string;
  lastConnectionTestAt: string;
  connectionError: string;
};

function nodeProcess() {
  return (globalThis as typeof globalThis & { process?: { cwd?: () => string; versions?: { node?: string }; env?: Record<string, string | undefined> } }).process;
}

function environmentRecord(): InstagramCredentialRecord {
  const env = nodeProcess()?.env || {};
  return {
    mode: normalizeConnectorMode(env.INSTAGRAM_CONNECTOR_MODE) as InstagramConnectorMode,
    accessToken: env.INSTAGRAM_ACCESS_TOKEN?.trim() || "",
    accountId: env.INSTAGRAM_USER_ID?.trim() || "",
    username: env.INSTAGRAM_USERNAME?.trim() || "",
    connectedAt: env.INSTAGRAM_CONNECTED_AT?.trim() || "",
    expiresAt: env.INSTAGRAM_TOKEN_EXPIRES_AT?.trim() || env.INSTAGRAM_TOKEN_EXPIRY?.trim() || "",
    lastRefreshAt: env.INSTAGRAM_LAST_REFRESH_AT?.trim() || "",
    lastConnectionTestAt: "",
    connectionError: "",
  };
}

export async function instagramCredentialPath() {
  const process = nodeProcess();
  if (!process?.versions?.node || !process.cwd) return "";
  const path = await import(/* @vite-ignore */ "node:path") as { join(...parts: string[]): string };
  const dataDir = process.env?.OLDSEADOGS_DATA_DIR?.trim() || path.join(process.cwd(), ".oldseadogs-data");
  return path.join(dataDir, "instagram-credentials.json");
}

export async function readInstagramCredentials(): Promise<InstagramCredentialRecord> {
  const fallback = environmentRecord();
  const file = await instagramCredentialPath();
  if (!file) return fallback;
  try {
    const fs = await import(/* @vite-ignore */ "node:fs/promises") as { readFile(path: string, encoding: "utf8"): Promise<string> };
    const saved = JSON.parse(await fs.readFile(file, "utf8")) as Partial<InstagramCredentialRecord>;
    return { ...fallback, ...saved, mode: normalizeConnectorMode(saved.mode || fallback.mode) as InstagramConnectorMode };
  } catch {
    return fallback;
  }
}

export async function writeInstagramCredentials(record: InstagramCredentialRecord) {
  const file = await instagramCredentialPath();
  if (!file) throw new Error("Secure credential storage is unavailable in this runtime.");
  const fs = await import(/* @vite-ignore */ "node:fs/promises") as {
    mkdir(path: string, options: { recursive: boolean; mode: number }): Promise<void>;
    writeFile(path: string, data: string, options: { mode: number }): Promise<void>;
    rename(from: string, to: string): Promise<void>;
    chmod(path: string, mode: number): Promise<void>;
  };
  const path = await import(/* @vite-ignore */ "node:path") as { dirname(value: string): string };
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporary, file);
  await fs.chmod(file, 0o600);
}

export async function clearInstagramCredentials() {
  const current = await readInstagramCredentials();
  await writeInstagramCredentials({ ...current, accessToken: "", accountId: "", username: "", expiresAt: "", connectedAt: "", lastRefreshAt: "", lastConnectionTestAt: "", connectionError: "" });
}

export function publicCredentialStatus(record: InstagramCredentialRecord) {
  return {
    configured: Boolean(record.accessToken && record.accountId),
    connected: Boolean(record.lastConnectionTestAt && !record.connectionError),
    accountIdConfigured: Boolean(record.accountId),
    tokenConfigured: Boolean(record.accessToken),
    accountId: record.accountId,
    username: record.username,
    mode: record.mode,
    connectedAt: record.connectedAt,
    tokenExpiry: record.expiresAt,
    tokenExpiryStatus: tokenExpiryStatus(record.expiresAt),
    lastTokenRefresh: record.lastRefreshAt,
    lastConnectionTest: record.lastConnectionTestAt,
    connectionError: record.connectionError,
  };
}
