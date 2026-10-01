import { addDays, type TokenPurpose } from "./classifieds-types.ts";

type TokenPayload = {
  v: 1;
  p: TokenPurpose;
  l: string;
  e: number;
  g?: number;
  x?: string;
};

const PURPOSE_DAYS: Record<TokenPurpose, number> = {
  verify: 7,
  manage: 21,
  keep: 14,
  relist: 90,
  draft: 14,
};

function runtimeEnv() {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
}

export function classifiedsTokenSecretFromEnv() {
  return runtimeEnv()?.OLDSEADOGS_CLASSIFIEDS_TOKEN_SECRET?.trim() || "";
}

export async function classifiedsTokenSecret() {
  const configured = classifiedsTokenSecretFromEnv();
  if (configured) return configured;
  const { path } = await nodeModules();
  const fs = await nodeFs();
  const { classifiedsDataDir } = await import("./classifieds-store.ts");
  const filePath = path.join(await classifiedsDataDir(), "classifieds-token-secret");
  try {
    const existing = (await fs.readFile(filePath, "utf8")).trim();
    if (existing) return existing;
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = base64Url(bytes);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, secret, { encoding: "utf8", mode: 0o600 });
  return secret;
}

export async function signClassifiedsToken(
  purpose: TokenPurpose,
  listingId: string,
  now = new Date(),
  extra: { generation?: number; expiresAt?: string } = {},
) {
  const payload: TokenPayload = {
    v: 1,
    p: purpose,
    l: listingId,
    e: Math.floor(addDays(now, PURPOSE_DAYS[purpose]).getTime() / 1000),
  };
  if (extra.generation !== undefined) payload.g = extra.generation;
  if (extra.expiresAt) payload.x = extra.expiresAt;
  const body = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(await classifiedsTokenSecret(), body);
  return `${body}.${signature}`;
}

export async function readClassifiedsToken(token: string, expected?: TokenPurpose, now = new Date()) {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  const expectedSignature = await hmac(await classifiedsTokenSecret(), body);
  if (!constantTimeEqual(signature, expectedSignature)) return null;
  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as TokenPayload;
  } catch {
    return null;
  }
  if (payload?.v !== 1 || !payload.l || !payload.p || !Number.isFinite(payload.e)) return null;
  if (expected && payload.p !== expected) return null;
  if (payload.e * 1000 <= now.getTime()) return null;
  return payload;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }
  return mismatch === 0;
}

async function nodeFs() {
  return import(/* @vite-ignore */ "node:fs/promises") as Promise<{
    mkdir(path: string, options: { recursive: boolean }): Promise<void>;
    readFile(path: string, encoding: "utf8"): Promise<string>;
    writeFile(path: string, data: string, options: { encoding: "utf8"; mode: number }): Promise<void>;
  }>;
}

async function nodeModules() {
  const path = await import(/* @vite-ignore */ "node:path") as {
    dirname(value: string): string;
    join(...parts: string[]): string;
  };
  return { path };
}
