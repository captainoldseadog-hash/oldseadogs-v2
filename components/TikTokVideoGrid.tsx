"use client";

import { useEffect, useId, useState } from "react";
import { TIKTOK_PROFILE_URL, formatTikTokViewCount, sanitizePublicTikTokVideo } from "../lib/tiktok-display.js";
import type { PublicTikTokVideo } from "../lib/tiktok-display.js";
import { TikTokProfileEmbed } from "./TikTokProfileEmbed";
import { trackSocialEvent } from "./social-tracking";

const uniqueId = "oldseadogs8";

type GridPhase = "idle" | "loading" | "grid" | "empty" | "profile";

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="tiktok-grid-play" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

export function TikTokVideoGrid() {
  const dialogTitleId = useId();
  const [phase, setPhase] = useState<GridPhase>("idle");
  const [videos, setVideos] = useState<PublicTikTokVideo[]>([]);
  const [complete, setComplete] = useState(true);
  const [active, setActive] = useState<PublicTikTokVideo | null>(null);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  async function showVideos() {
    setPhase("loading");
    void trackSocialEvent({
      type: "social_click",
      platform: "TikTok",
      target: TIKTOK_PROFILE_URL,
    });
    try {
      const response = await fetch("/api/social/tiktok");
      const payload = await response.json() as { available?: unknown; complete?: unknown; videos?: unknown[] };
      const nextVideos = Array.isArray(payload.videos) ? payload.videos.map((video) => sanitizePublicTikTokVideo(video)).filter((video): video is PublicTikTokVideo => Boolean(video)) : [];
      if (payload.available && nextVideos.length > 0) {
        setVideos(nextVideos);
        setComplete(Boolean(payload.complete));
        setPhase("grid");
        return;
      }
      if (payload.available) {
        setPhase("empty");
        return;
      }
    } catch {
      // The official creator embed is the documented fallback when the video list cannot be shown.
    }
    setPhase("profile");
  }

  function openVideo(video: PublicTikTokVideo) {
    setActive(video);
    void trackSocialEvent({
      type: "social_click",
      platform: "TikTok",
      target: video.watchUrl,
    });
  }

  return (
    <div className="tiktok-video-block">
      {phase === "idle" || phase === "loading" ? (
        <article className="tiktok-profile-card">
          <div className="tiktok-profile-facade">
            <span aria-hidden="true">♪</span>
            <strong>TikTok</strong>
            <p>Videos from @{uniqueId} stay unloaded until you choose to show them. Opening a video lets TikTok receive that visit.</p>
          </div>
          <div className="social-video-actions tiktok-profile-actions">
            <button type="button" disabled={phase === "loading"} onClick={() => void showVideos()}>
              {phase === "loading" ? "Showing videos…" : "Show TikTok videos"}
            </button>
            <a href={TIKTOK_PROFILE_URL} rel="noopener noreferrer" target="_blank" onClick={() => void trackSocialEvent({ type: "outbound_click", platform: "TikTok", target: TIKTOK_PROFILE_URL })}>
              Open @{uniqueId} on TikTok
            </a>
          </div>
        </article>
      ) : null}

      {phase === "grid" ? (
        <>
          <div className="tiktok-video-grid" aria-label={`TikTok videos from @${uniqueId}`}>
            {videos.map((video) => {
              const views = formatTikTokViewCount(video.viewCount);
              const label = video.title || "TikTok video";
              return (
                <button type="button" className="tiktok-grid-tile" key={video.id} aria-label={views ? `${label}, ${views} views` : label} onClick={() => openVideo(video)}>
                  <img alt="" src={video.coverPath} />
                  <span className="tiktok-grid-views">
                    <PlayIcon />
                    {views ? <span>{views}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          {complete ? null : <p className="tiktok-grid-note">More videos are on TikTok.</p>}
          <div className="social-video-actions tiktok-profile-actions">
            <a href={TIKTOK_PROFILE_URL} rel="noopener noreferrer" target="_blank" onClick={() => void trackSocialEvent({ type: "outbound_click", platform: "TikTok", target: TIKTOK_PROFILE_URL })}>
              Open @{uniqueId} on TikTok
            </a>
          </div>
        </>
      ) : null}

      {phase === "empty" ? (
        <article className="tiktok-profile-card">
          <div className="tiktok-profile-facade">
            <strong>TikTok</strong>
            <p>No videos to show yet.</p>
          </div>
          <div className="social-video-actions tiktok-profile-actions">
            <a href={TIKTOK_PROFILE_URL} rel="noopener noreferrer" target="_blank">
              Open @{uniqueId} on TikTok
            </a>
          </div>
        </article>
      ) : null}

      {phase === "profile" ? (
        <>
          <p className="tiktok-grid-note">Recent videos open here. The rest of the channel is on TikTok.</p>
          <TikTokProfileEmbed startLoaded />
        </>
      ) : null}

      {active ? (
        <div className="tiktok-player-backdrop" role="presentation" onClick={() => setActive(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="tiktok-player-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tiktok-player-frame">
              <iframe
                src={active.embedUrl}
                title={active.title || "TikTok video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="social-video-actions tiktok-player-actions">
              <p className="tiktok-sr-only" id={dialogTitleId}>{active.title || "TikTok video"}</p>
              <button type="button" onClick={() => setActive(null)}>Close video</button>
              <a href={active.watchUrl} rel="noopener noreferrer" target="_blank">
                Watch on TikTok
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
