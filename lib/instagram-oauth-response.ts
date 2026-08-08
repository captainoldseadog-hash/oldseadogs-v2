const stateCookieName = "oldseadogs_instagram_state";
const stateCookiePath = "/api/editor/instagram/callback";

type InstagramRedirectOptions = {
  clearStateCookie?: boolean;
  headers?: HeadersInit;
  stateCookieValue?: string;
};

function stateCookie(value: string, maxAge: number) {
  return `${stateCookieName}=${value}; Path=${stateCookiePath}; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
}

export function instagramOAuthRedirect(location: string | URL, options: InstagramRedirectOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Location", location.toString());

  if (options.stateCookieValue) {
    headers.append("Set-Cookie", stateCookie(options.stateCookieValue, 600));
  } else if (options.clearStateCookie) {
    headers.append("Set-Cookie", stateCookie("", 0));
  }

  return new Response(null, { status: 302, headers });
}

export function redactInstagramOAuthError(value: unknown, fallback = "Instagram connection failed.") {
  let message = value instanceof Error ? value.message : String(value || fallback);
  message = message.replace(/[\r\n\t]+/g, " ").trim();

  const runtimeEnv = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env || {};

  for (const secret of [runtimeEnv.INSTAGRAM_APP_SECRET, runtimeEnv.INSTAGRAM_SYNC_SECRET]) {
    const trimmed = secret?.trim();
    if (trimmed) message = message.split(trimmed).join("[redacted]");
  }

  message = message.replace(/\b(client_secret|access_token|code)=([^\s&]+)/gi, "$1=[redacted]");
  return (message || fallback).slice(0, 300);
}
