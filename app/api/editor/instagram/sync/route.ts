import { canEditSite, privateEditorHeaders } from "../../../../../lib/editor-auth";
import { syncInstagramGallery } from "../../../../../lib/instagram-gallery";

function privateJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(privateEditorHeaders())) headers.set(key, value);
  return Response.json(body, { ...init, headers });
}

async function authorized(request: Request) {
  if (await canEditSite(request)) return true;
  const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const expected = env?.INSTAGRAM_SYNC_SECRET?.trim() || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  return Boolean(expected && supplied && supplied === expected);
}

async function sync(request: Request) {
  if (!await authorized(request)) return privateJson({ error: "Forbidden" }, { status: 403 });
  try {
    return privateJson({ ok: true, result: await syncInstagramGallery(request) });
  } catch (error) {
    return privateJson({ ok: false, error: error instanceof Error ? error.message : "Instagram sync failed." }, { status: 500 });
  }
}

export const GET = sync;
export const POST = sync;
