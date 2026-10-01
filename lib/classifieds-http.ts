import { canEditSite, forbiddenResponse, privateEditorHeaders } from "./editor-auth.ts";
import { ClassifiedsError } from "./classifieds-service.ts";

export function boatsPrivateHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "CDN-Cache-Control": "no-store",
    "Cloudflare-CDN-Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  };
}

export function boatsPrivateJson(body: unknown, status = 200) {
  const headers = new Headers(boatsPrivateHeaders());
  for (const [key, value] of Object.entries(privateEditorHeaders())) headers.set(key, value);
  return Response.json(body, { status, headers });
}

export function boatsErrorResponse(error: unknown) {
  if (error instanceof ClassifiedsError) {
    return boatsPrivateJson({ error: error.message, errors: error.errors }, error.status);
  }
  console.error("[OldSeaDogs classifieds]", error);
  return boatsPrivateJson({ error: "The boats desk could not complete that request." }, 500);
}

export async function requireBoatsEditor(request: Request) {
  if (!(await canEditSite(request))) return forbiddenResponse();
  return null;
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  return forwarded.split(",")[0]?.trim() || "local";
}

export async function readRequestRecord(request: Request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return await request.json() as Record<string, unknown>;
  }
  const form = await request.formData();
  return Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]));
}

export function wantsJson(request: Request) {
  const type = request.headers.get("content-type") || "";
  return type.includes("application/json") || (request.headers.get("accept") || "").includes("application/json");
}

export function boatsRedirect(request: Request, path: string) {
  return new Response(null, {
    status: 303,
    headers: {
      ...boatsPrivateHeaders(),
      Location: new URL(path, request.url).toString(),
    },
  });
}
