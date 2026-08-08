import {
  canUseStagingLoginRequest,
  makeStagingEditorCookieValue,
  privateEditorHeaders,
  stagingEditorCookieMaxAge,
  stagingEditorCookieName,
  verifyStagingEditorPassword,
} from "../../../../lib/editor-auth";

export const dynamic = "force-dynamic";

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

function loginRedirect(request: Request, failed = false) {
  const url = new URL("/editor", request.url);
  if (failed) url.searchParams.set("editorLogin", "failed");
  return new Response(null, {
    status: 303,
    headers: {
      ...privateEditorHeaders(),
      Location: url.toString(),
    },
  });
}

function cookieHeader(value: string, request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secure = forwardedProto === "https" || new URL(request.url).protocol === "https:";
  const parts = [
    `${stagingEditorCookieName}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${stagingEditorCookieMaxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

async function readPassword(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => ({})) as { password?: unknown };
    return String(payload.password || "");
  }

  const form = await request.formData().catch(() => null);
  return String(form?.get("password") || "");
}

export async function POST(request: Request) {
  if (!canUseStagingLoginRequest(request)) {
    const body = { error: "Staging editor login is not available for this host." };
    return wantsJson(request)
      ? Response.json(body, { status: 403, headers: privateEditorHeaders() })
      : loginRedirect(request, true);
  }

  const password = await readPassword(request);
  if (!await verifyStagingEditorPassword(password)) {
    const body = { error: "Incorrect staging editor password." };
    return wantsJson(request)
      ? Response.json(body, { status: 401, headers: privateEditorHeaders() })
      : loginRedirect(request, true);
  }

  const headers = new Headers(privateEditorHeaders());
  headers.set("Set-Cookie", cookieHeader(await makeStagingEditorCookieValue(), request));

  if (wantsJson(request)) {
    return Response.json({ ok: true }, { headers });
  }

  headers.set("Location", new URL("/editor", request.url).toString());
  return new Response(null, { status: 303, headers });
}
