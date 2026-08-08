"use client";

import { useState } from "react";
import type { OldSeaDogsVideoItem } from "../content/social-links";
import { trackSocialEvent } from "./social-tracking";

type SocialVideoEmbedProps = {
  video: OldSeaDogsVideoItem;
};

export function SocialVideoEmbed({ video }: SocialVideoEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const hasEmbed = Boolean(video.embedUrl.trim());

  return (
    <article className="social-video-card">
      <div className="social-video-frame">
        {loaded && hasEmbed ? (
          <iframe
            src={video.embedUrl}
            title={video.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="social-video-placeholder">
            <span>{video.platform === "YouTube" ? "▶" : "♪"}</span>
            <strong>{video.platform}</strong>
          </div>
        )}
      </div>
      <div className="social-video-copy">
        <p className="eyebrow">{video.platform}</p>
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <div className="social-video-actions">
          {hasEmbed ? (
            <button type="button" onClick={() => setLoaded(true)}>
              Load video
            </button>
          ) : null}
          <a
            href={video.watchUrl}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() =>
              void trackSocialEvent({
                type: "outbound_click",
                platform: video.platform,
                target: video.watchUrl,
              })
            }
          >
            Open channel
          </a>
        </div>
      </div>
    </article>
  );
}
