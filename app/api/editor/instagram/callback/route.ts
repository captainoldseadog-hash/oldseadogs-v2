import { completeInstagramAuthorization } from "../../../../../lib/instagram-oauth";
import { validOAuthState } from "../../../../../lib/instagram-connector-core.js";
import { privateEditorHeaders } from "../../../../../lib/editor-auth";
import { instagramOAuthRedirect, redactInstagramOAuthError } from "../../../../../lib/instagram-oauth-response";

function cookie(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

function bridgeRedirect(request: Request, key: string, message: string) {
  const url = new URL("/editor/through-the-lens/instagram", request.url);
  url.searchParams.set(key, redactInstagramOAuthError(message));
  return instagramOAuthRedirect(url, {
    clearStateCookie: true,
    headers: privateEditorHeaders(),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error_description") || url.searchParams.get("error") || url.searchParams.get("error_reason");
  if (error) return bridgeRedirect(request, "instagram_error", error);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const [expectedHash, mode] = cookie(request, "oldseadogs_instagram_state").split(".");
  if (!validOAuthState(expectedHash, state)) return bridgeRedirect(request, "instagram_error", "Instagram connection was rejected because the security state did not match. Please try again.");
  if (!code || (mode !== "instagram-login" && mode !== "facebook-page")) return bridgeRedirect(request, "instagram_error", "Meta did not return a usable authorization code.");
  try {
    const connected = await completeInstagramAuthorization(code, mode);
    return bridgeRedirect(request, "instagram_connected", connected.username ? `Connected @${connected.username}` : "Instagram account connected");
  } catch (caught) {
    return bridgeRedirect(request, "instagram_error", redactInstagramOAuthError(caught));
  }
}
