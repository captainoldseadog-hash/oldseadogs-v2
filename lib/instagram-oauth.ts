import { randomBytes } from "node:crypto";
import { hashOAuthState, normalizeConnectorMode, tokenExpiryStatus } from "./instagram-connector-core.js";
import { clearInstagramCredentials, readInstagramCredentials, writeInstagramCredentials, type InstagramConnectorMode } from "./instagram-credentials";

function env() {
  return (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env || {};
}

function config() {
  const values = env();
  return {
    mode: normalizeConnectorMode(values.INSTAGRAM_CONNECTOR_MODE) as InstagramConnectorMode,
    appId: values.INSTAGRAM_APP_ID?.trim() || "",
    appSecret: values.INSTAGRAM_APP_SECRET?.trim() || "",
    redirectUri: values.INSTAGRAM_REDIRECT_URI?.trim() || "",
    pageId: values.INSTAGRAM_FACEBOOK_PAGE_ID?.trim() || "",
    graphVersion: values.INSTAGRAM_GRAPH_VERSION?.trim() || "v23.0",
  };
}

function requireConfig() {
  const values = config();
  const missing = [!values.appId && "INSTAGRAM_APP_ID", !values.appSecret && "INSTAGRAM_APP_SECRET", !values.redirectUri && "INSTAGRAM_REDIRECT_URI"].filter(Boolean);
  if (missing.length) throw new Error(`Add ${missing.join(", ")} to the private server environment.`);
  return values;
}

async function json<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { error?: { message?: string }; error_message?: string };
  if (!response.ok) throw new Error(payload.error?.message || payload.error_message || `Meta authentication failed (${response.status}).`);
  return payload;
}

export function createInstagramAuthorization() {
  const values = requireConfig();
  const state = randomBytes(32).toString("base64url");
  const authorize = values.mode === "facebook-page"
    ? new URL(`https://www.facebook.com/${values.graphVersion}/dialog/oauth`)
    : new URL("https://www.instagram.com/oauth/authorize");
  authorize.searchParams.set("client_id", values.appId);
  authorize.searchParams.set("redirect_uri", values.redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("scope", values.mode === "facebook-page" ? "instagram_basic,pages_show_list" : "instagram_business_basic");
  if (values.mode === "instagram-login") {
    authorize.searchParams.set("enable_fb_login", "0");
    authorize.searchParams.set("force_authentication", "1");
  }
  return { url: authorize.toString(), state, stateHash: hashOAuthState(state), mode: values.mode };
}

async function exchangeInstagramCode(code: string) {
  const values = requireConfig();
  const form = new URLSearchParams({ client_id: values.appId, client_secret: values.appSecret, grant_type: "authorization_code", redirect_uri: values.redirectUri, code });
  const short = await json<{ access_token: string; user_id: number }>(await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: form }));
  const exchange = new URL("https://graph.instagram.com/access_token");
  exchange.searchParams.set("grant_type", "ig_exchange_token");
  exchange.searchParams.set("client_secret", values.appSecret);
  exchange.searchParams.set("access_token", short.access_token);
  const long = await json<{ access_token: string; token_type?: string; expires_in?: number }>(await fetch(exchange));
  return { accessToken: long.access_token, accountId: String(short.user_id), expiresIn: Number(long.expires_in || 5_184_000) };
}

async function exchangeFacebookCode(code: string) {
  const values = requireConfig();
  const token = new URL(`https://graph.facebook.com/${values.graphVersion}/oauth/access_token`);
  token.searchParams.set("client_id", values.appId); token.searchParams.set("client_secret", values.appSecret);
  token.searchParams.set("redirect_uri", values.redirectUri); token.searchParams.set("code", code);
  const short = await json<{ access_token: string; expires_in?: number }>(await fetch(token));
  const longUrl = new URL(`https://graph.facebook.com/${values.graphVersion}/oauth/access_token`);
  longUrl.searchParams.set("grant_type", "fb_exchange_token"); longUrl.searchParams.set("client_id", values.appId);
  longUrl.searchParams.set("client_secret", values.appSecret); longUrl.searchParams.set("fb_exchange_token", short.access_token);
  const long = await json<{ access_token: string; expires_in?: number }>(await fetch(longUrl));
  const pages = new URL(`https://graph.facebook.com/${values.graphVersion}/me/accounts`);
  pages.searchParams.set("fields", "id,name,instagram_business_account"); pages.searchParams.set("access_token", long.access_token);
  const pagePayload = await json<{ data?: Array<{ id: string; instagram_business_account?: { id: string } }> }>(await fetch(pages));
  const page = values.pageId ? pagePayload.data?.find((item) => item.id === values.pageId) : pagePayload.data?.find((item) => item.instagram_business_account?.id);
  if (!page?.instagram_business_account?.id) throw new Error("No linked Instagram professional account was found on the selected Facebook Page.");
  return { accessToken: long.access_token, accountId: page.instagram_business_account.id, expiresIn: Number(long.expires_in || 5_184_000) };
}

export async function completeInstagramAuthorization(code: string, mode: InstagramConnectorMode) {
  const exchanged = mode === "facebook-page" ? await exchangeFacebookCode(code) : await exchangeInstagramCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + exchanged.expiresIn * 1000).toISOString();
  const host = mode === "facebook-page" ? "graph.facebook.com" : "graph.instagram.com";
  const profile = new URL(`https://${host}/${config().graphVersion}/${encodeURIComponent(exchanged.accountId)}`);
  profile.searchParams.set("fields", "id,username"); profile.searchParams.set("access_token", exchanged.accessToken);
  const account = await json<{ id?: string; username?: string }>(await fetch(profile));
  await writeInstagramCredentials({ mode, accessToken: exchanged.accessToken, accountId: account.id || exchanged.accountId, username: account.username || "", connectedAt: now.toISOString(), expiresAt, lastRefreshAt: now.toISOString(), lastConnectionTestAt: now.toISOString(), connectionError: "" });
  return { accountId: account.id || exchanged.accountId, username: account.username || "", mode, expiresAt };
}

export async function refreshInstagramToken() {
  const current = await readInstagramCredentials();
  if (!current.accessToken) throw new Error("Connect an Instagram account first.");
  if (tokenExpiryStatus(current.expiresAt).state === "expired") throw new Error("The token is already expired. Reconnect the account instead.");
  if (current.mode === "facebook-page") throw new Error("Facebook/Page tokens must be renewed through Reconnect Account.");
  const refresh = new URL("https://graph.instagram.com/refresh_access_token");
  refresh.searchParams.set("grant_type", "ig_refresh_token"); refresh.searchParams.set("access_token", current.accessToken);
  const payload = await json<{ access_token: string; expires_in?: number }>(await fetch(refresh));
  const now = new Date();
  const updated = { ...current, accessToken: payload.access_token, expiresAt: new Date(now.getTime() + Number(payload.expires_in || 5_184_000) * 1000).toISOString(), lastRefreshAt: now.toISOString(), connectionError: "" };
  await writeInstagramCredentials(updated);
  return { ok: true, expiresAt: updated.expiresAt, lastRefreshAt: updated.lastRefreshAt };
}

export async function disconnectInstagram() {
  await clearInstagramCredentials();
  return { ok: true };
}
