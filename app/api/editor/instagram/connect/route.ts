import { canEditSite, privateEditorHeaders } from "../../../../../lib/editor-auth";
import { createInstagramAuthorization } from "../../../../../lib/instagram-oauth";
import { instagramOAuthRedirect, redactInstagramOAuthError } from "../../../../../lib/instagram-oauth-response";

export async function GET(request: Request) {
  if (!await canEditSite(request)) return new Response("Forbidden", { status: 403, headers: privateEditorHeaders() });
  try {
    const authorization = createInstagramAuthorization();
    return instagramOAuthRedirect(authorization.url, {
      headers: privateEditorHeaders(),
      stateCookieValue: `${authorization.stateHash}.${authorization.mode}`,
    });
  } catch (error) {
    const url = new URL("/editor/through-the-lens/instagram", request.url);
    url.searchParams.set("instagram_error", redactInstagramOAuthError(error, "Instagram configuration is incomplete."));
    return instagramOAuthRedirect(url, { headers: privateEditorHeaders() });
  }
}
