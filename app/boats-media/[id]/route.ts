import { canEditSite } from "../../../lib/editor-auth.ts";
import { readClassifiedsToken } from "../../../lib/classifieds-tokens.ts";
import { findPhotoOwner } from "../../../lib/classifieds-service.ts";
import { listingIsPublic } from "../../../lib/classifieds-types.ts";
import { readClassifiedPhotoFile } from "../../../lib/classifieds-photos.ts";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const owner = await findPhotoOwner(id);
  if (!owner) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") === "thumb" ? "thumb" : "full";
  const token = url.searchParams.get("token") || "";
  const isPublic = listingIsPublic(owner.listing);
  const editor = await canEditSite(request);
  let allowed = isPublic || editor;
  if (!allowed && token) {
    const payload = await readClassifiedsToken(token);
    allowed = Boolean(payload && payload.l === owner.listing.id);
  }
  if (!allowed) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const bytes = await readClassifiedPhotoFile(owner.listing.id, owner.photo.id, variant);
  if (!bytes) return new Response("Not found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const headers = new Headers({
    "Content-Type": "image/webp",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": isPublic && !token
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "private, no-store",
  });
  return new Response(Buffer.from(bytes), { headers });
}
