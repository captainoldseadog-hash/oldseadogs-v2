"use client";

import { useEffect, useState } from "react";
import { oldSeaDogsSocialLinks } from "../content/social-links";
import { trackSocialEvent } from "./social-tracking";

const profileUrl = oldSeaDogsSocialLinks.tiktok;
const uniqueId = "oldseadogs8";
const embedScriptUrl = "https://www.tiktok.com/embed.js";

type TikTokEmbedWindow = Window & {
  tiktokEmbed?: {
    lib?: {
      render?: () => void;
    };
  };
};

export function TikTokProfileEmbed() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const existing = document.querySelector(`script[src="${embedScriptUrl}"]`);
    if (existing) {
      (window as TikTokEmbedWindow).tiktokEmbed?.lib?.render?.();
      return;
    }
    const script = document.createElement("script");
    script.src = embedScriptUrl;
    script.async = true;
    document.body.appendChild(script);
  }, [loaded]);

  function loadProfile() {
    setLoaded(true);
    void trackSocialEvent({
      type: "social_click",
      platform: "TikTok",
      target: profileUrl,
    });
  }

  return (
    <article className="tiktok-profile-card">
      {loaded ? (
        <blockquote
          className="tiktok-embed"
          cite={profileUrl}
          data-embed-type="creator"
          data-unique-id={uniqueId}
          style={{ maxWidth: 780, minWidth: 288 }}
        >
          <section>
            <a href={`${profileUrl}?refer=creator_embed`} rel="noopener noreferrer" target="_blank">
              @{uniqueId}
            </a>
          </section>
        </blockquote>
      ) : (
        <div className="tiktok-profile-facade">
          <span aria-hidden="true">♪</span>
          <strong>TikTok</strong>
          <p>The @{uniqueId} profile stays unloaded until you choose to open it. Loading it lets TikTok receive this visit.</p>
        </div>
      )}
      <div className="social-video-actions tiktok-profile-actions">
        {loaded ? null : (
          <button type="button" onClick={loadProfile}>
            Load TikTok profile
          </button>
        )}
        <a
          href={profileUrl}
          rel="noopener noreferrer"
          target="_blank"
          onClick={() =>
            void trackSocialEvent({
              type: "outbound_click",
              platform: "TikTok",
              target: profileUrl,
            })
          }
        >
          Open @{uniqueId} on TikTok
        </a>
      </div>
    </article>
  );
}
