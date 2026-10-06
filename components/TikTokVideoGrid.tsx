import { connection } from "next/server";
import { TIKTOK_PROFILE_URL, TIKTOK_UNIQUE_ID } from "../lib/tiktok-display.js";
import type { PublicTikTokVideo } from "../lib/tiktok-display.js";
import { loadPublicTikTokCatalog } from "../lib/tiktok-display-server";
import { TikTokProfileEmbed } from "./TikTokProfileEmbed";
import { TikTokVideoTiles } from "./TikTokVideoTiles";
import { TrackedExternalLink } from "./TrackedExternalLink";

export function TikTokVideoGridFallback() {
  return <p className="tiktok-grid-note">Loading TikTok videos…</p>;
}

export async function TikTokVideoGrid() {
  await connection();
  let available = false;
  let complete = false;
  let videos: PublicTikTokVideo[] = [];
  try {
    const catalog = await loadPublicTikTokCatalog();
    available = catalog.available;
    complete = catalog.complete;
    videos = catalog.videos;
  } catch {
    available = false;
  }

  if (available && videos.length > 0) {
    return (
      <div className="tiktok-video-block">
        <TikTokVideoTiles complete={complete} videos={videos} />
      </div>
    );
  }

  if (available) {
    return (
      <div className="tiktok-video-block">
        <article className="tiktok-profile-card">
          <div className="tiktok-profile-facade">
            <strong>TikTok</strong>
            <p>No videos to show yet.</p>
          </div>
          <div className="social-video-actions tiktok-profile-actions">
            <TrackedExternalLink href={TIKTOK_PROFILE_URL} platform="TikTok">
              Open @{TIKTOK_UNIQUE_ID} on TikTok
            </TrackedExternalLink>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="tiktok-video-block">
      <TikTokProfileEmbed />
    </div>
  );
}
