const editorEmails = new Set(["michael@onlineblockchain.io"]);

export function getRequestEmail(request: Request) {
  return (
    request.headers.get("oai-authenticated-user-email") ||
    request.headers.get("x-openai-authenticated-user-email") ||
    ""
  ).toLowerCase();
}

export function isLocalRequest(request: Request) {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function canEditSite(request: Request) {
  return isLocalRequest(request) || editorEmails.has(getRequestEmail(request));
}

export function forbiddenResponse() {
  return Response.json(
    {
      error:
        "This editor is private. Sign in with an approved Old Sea Dogs editor account.",
    },
    { status: 403 }
  );
}
