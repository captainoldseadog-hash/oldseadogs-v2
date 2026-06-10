"use client";

import { useState } from "react";

type SocialShareProps = {
  title: string;
  summary: string;
  url: string;
};

export function SocialShare({ title, summary, url }: SocialShareProps) {
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(`${summary}\n\n${url}`);
  const whatsappText = encodeURIComponent(`${title} ${url}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy link"), 1800);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy link"), 1800);
    }
  }

  async function shareStory() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, text: summary, url });
    } catch {
      // The visitor may close the share sheet without choosing an app.
    }
  }

  return (
    <section className="share-panel" aria-label="Share this Old Sea Dogs story">
      <div>
        <p className="eyebrow">Share</p>
        <h2>Post this story</h2>
      </div>
      <div className="share-actions">
        <button type="button" onClick={shareStory}>
          Share
        </button>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Facebook
        </a>
        <a
          href={`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          WhatsApp
        </a>
        <a href={`mailto:?subject=${encodedTitle}&body=${encodedSummary}`}>Email</a>
        <button type="button" onClick={copyLink}>
          {copyLabel}
        </button>
      </div>
    </section>
  );
}
