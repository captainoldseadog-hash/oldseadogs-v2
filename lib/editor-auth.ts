const defaultEditorEmails = [
  "michael@onlineblockchain.io",
  "captainoldseadog@gmail.com",
];

const runtimeProcess = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process;

export const stagingEditorCookieName = "oldseadogs_editor_staging";
export const stagingEditorCookieMaxAge = 60 * 60 * 24 * 7;

function configuredEditorEmails() {
  const rawEmails = runtimeProcess?.env?.OLDSEADOGS_EDITOR_EMAILS;
  const emails = rawEmails
    ? rawEmails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
    : defaultEditorEmails;

  return new Set(emails.length > 0 ? emails : defaultEditorEmails);
}

const editorEmails = configuredEditorEmails();

export const privateEditorRobotsHeader = "noindex, nofollow, noarchive, nosnippet";

type HeaderReader = {
  get(name: string): string | null;
};

const defaultStagingEditorHosts = ["161.35.168.184", "staging.oldseadogs.com"];

function stagingEditorSecret() {
  return runtimeProcess?.env?.OLDSEADOGS_EDITOR_STAGING_SECRET?.trim() || "";
}

function configuredStagingEditorHosts() {
  const rawHosts = runtimeProcess?.env?.OLDSEADOGS_EDITOR_STAGING_HOSTS;
  const hosts = rawHosts
    ? rawHosts.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean)
    : defaultStagingEditorHosts;

  return new Set(hosts.length > 0 ? hosts : defaultStagingEditorHosts);
}

function hostNameFromHost(host: string) {
  const value = host.trim().toLowerCase();
  if (!value) return "";
  if (value.startsWith("[")) return value.slice(1, value.indexOf("]"));
  if (value === "::1") return value;
  return value.split(":")[0];
}

function getForwardedHost(headers: HeaderReader) {
  return headers.get("x-forwarded-host") || headers.get("host") || "";
}

function parseCookies(cookieHeader: string) {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name) continue;
    cookies.set(name, decodeURIComponent(valueParts.join("=")));
  }
  return cookies;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

export async function makeStagingEditorCookieValue(secret = stagingEditorSecret()) {
  if (!secret) return "";
  const payload = new TextEncoder().encode(`oldseadogs-editor-staging-v1:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return `v1.${base64Url(new Uint8Array(digest))}`;
}

export async function verifyStagingEditorPassword(password: string) {
  const secret = stagingEditorSecret();
  return Boolean(secret) && constantTimeEqual(password, secret);
}

export function isStagingEditorHost(host: string) {
  return configuredStagingEditorHosts().has(hostNameFromHost(host));
}

export function canUseStagingLoginHeaders(headers: HeaderReader) {
  return Boolean(stagingEditorSecret()) && isStagingEditorHost(getForwardedHost(headers));
}

export function canUseStagingLoginRequest(request: Request) {
  return Boolean(stagingEditorSecret()) && isStagingEditorHost(request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host);
}

async function hasValidStagingCookie(headers: HeaderReader) {
  if (!canUseStagingLoginHeaders(headers)) return false;
  const cookieValue = parseCookies(headers.get("cookie") || "").get(stagingEditorCookieName);
  if (!cookieValue) return false;
  const expected = await makeStagingEditorCookieValue();
  return Boolean(expected) && constantTimeEqual(cookieValue, expected);
}

async function hasValidStagingCookieRequest(request: Request) {
  if (!canUseStagingLoginRequest(request)) return false;
  const cookieValue = parseCookies(request.headers.get("cookie") || "").get(stagingEditorCookieName);
  if (!cookieValue) return false;
  const expected = await makeStagingEditorCookieValue();
  return Boolean(expected) && constantTimeEqual(cookieValue, expected);
}

export function privateEditorHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Robots-Tag": privateEditorRobotsHeader,
  };
}

export function getRequestEmail(request: Request) {
  return (
    request.headers.get("oai-authenticated-user-email") ||
    request.headers.get("x-openai-authenticated-user-email") ||
    ""
  ).toLowerCase();
}

export function isLocalHost(host: string) {
  const hostname = hostNameFromHost(host);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function isLocalRequest(request: Request) {
  const host = new URL(request.url).hostname;
  return isLocalHost(host);
}

export function getRequestEmailFromHeaders(headers: HeaderReader) {
  return (
    headers.get("oai-authenticated-user-email") ||
    headers.get("x-openai-authenticated-user-email") ||
    ""
  ).toLowerCase();
}

export async function canEditRequestHeaders(headers: HeaderReader) {
  const host = getForwardedHost(headers);
  const email = getRequestEmailFromHeaders(headers);
  return isLocalHost(host) || editorEmails.has(email) || await hasValidStagingCookie(headers);
}

export async function canEditSite(request: Request) {
  return isLocalRequest(request) || editorEmails.has(getRequestEmail(request)) || await hasValidStagingCookieRequest(request);
}

export function forbiddenResponse() {
  return Response.json(
    {
      error:
        "This editor is private. Sign in with an approved Old Sea Dogs editor account.",
    },
    { status: 403, headers: privateEditorHeaders() }
  );
}
