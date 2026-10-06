"use client";

import { useState } from "react";
import { TIKTOK_PROFILE_URL, TIKTOK_UNIQUE_ID, formatTikTokViewCount } from "../lib/tiktok-display.js";
import type { PublicTikTokVideo } from "../lib/tiktok-display.js";
import { TrackedExternalLink } from "./TrackedExternalLink";

export const TIKTOK_GRID_PAGE_SIZE = 12;

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="tiktok-grid-play" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function TikTokTile({ video, shown }: { video: PublicTikTokVideo; shown: boolean }) {
  const label = video.title || "TikTok video";
  const views = formatTikTokViewCount(video.viewCount);
  const name = views ? `${label}, ${views} views` : label;
  return (
    <TrackedExternalLink className="tiktok-grid-tile" hidden={!shown} href={video.watchUrl} platform="TikTok">
      {shown ? <img alt="" decoding="async" loading="lazy" src={video.coverPath} /> : null}
      <span className="tiktok-sr-only">{name}</span>
      {shown ? (
        <span aria-hidden="true" className="tiktok-grid-views">
          <PlayIcon />
          {views ? <span>{views}</span> : null}
        </span>
      ) : null}
    </TrackedExternalLink>
  );
}

export function TikTokVideoTiles({ complete, videos }: { complete: boolean; videos: PublicTikTokVideo[] }) {
  const [visibleCount, setVisibleCount] = useState(TIKTOK_GRID_PAGE_SIZE);
  const remaining = Math.max(0, videos.length - visibleCount);
  const nextCount = Math.min(TIKTOK_GRID_PAGE_SIZE, remaining);

  return (
    <>
      <div className="tiktok-video-grid" aria-label={`TikTok videos from @${TIKTOK_UNIQUE_ID}`}>
        {videos.map((video, index) => (
          <TikTokTile key={video.id} shown={index < visibleCount} video={video} />
        ))}
      </div>
      {complete ? null : <p className="tiktok-grid-note">More videos are on TikTok.</p>}
      <div className="social-video-actions tiktok-profile-actions">
        {nextCount > 0 ? (
          <button type="button" onClick={() => setVisibleCount((count) => Math.min(videos.length, count + TIKTOK_GRID_PAGE_SIZE))}>
            Show {nextCount} more videos
          </button>
        ) : null}
        <TrackedExternalLink href={TIKTOK_PROFILE_URL} platform="TikTok">
          Open @{TIKTOK_UNIQUE_ID} on TikTok
        </TrackedExternalLink>
      </div>
    </>
  );
}
