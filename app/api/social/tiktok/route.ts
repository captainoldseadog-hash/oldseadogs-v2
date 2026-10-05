import { loadPublicTikTokCatalog } from "../../../../lib/tiktok-display-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await loadPublicTikTokCatalog();
    return Response.json(
      {
        available: catalog.available,
        complete: catalog.complete,
        videos: catalog.videos,
      },
      { headers: { "cache-control": "private, max-age=300" } },
    );
  } catch {
    console.error("TikTok video list unavailable.");
    return Response.json(
      { available: false, complete: false, videos: [] },
      { headers: { "cache-control": "private, max-age=60" } },
    );
  }
}
