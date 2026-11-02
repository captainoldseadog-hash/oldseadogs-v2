import { readTikTokCoverUrl } from "../../../../../../lib/tiktok-display-server";

export const dynamic = "force-dynamic";

const COVER_BYTES_LIMIT = 2_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type CoverRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: CoverRouteProps) {
  const { id } = await params;
  const coverUrl = await readTikTokCoverUrl(id);
  if (!coverUrl) return new Response("Not found", { status: 404 });

  try {
    const response = await fetch(coverUrl, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    if (!response.ok || (response.status >= 300 && response.status < 400)) return new Response("Not found", { status: 404 });
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
    if (!ALLOWED_IMAGE_TYPES.has(type)) return new Response("Not found", { status: 404 });
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > COVER_BYTES_LIMIT) return new Response("Not found", { status: 404 });
    return new Response(bytes, {
      headers: {
        "cache-control": "private, max-age=1800",
        "content-type": type,
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
