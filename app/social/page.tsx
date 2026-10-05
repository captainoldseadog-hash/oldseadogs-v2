import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { SiteFooter } from "../../components/SiteFooter";
import { SocialIconLinks } from "../../components/SocialIconLinks";
import { SocialVideoEmbed } from "../../components/SocialVideoEmbed";
import { TikTokVideoGrid } from "../../components/TikTokVideoGrid";
import { TrackedExternalLink } from "../../components/TrackedExternalLink";
import {
  oldSeaDogsLatestVideos,
  oldSeaDogsSocialPlatforms,
} from "../../content/social-links";

import { isGalleryPublicRolloutEnabled } from "../../lib/gallery-public.js";
import { createPageMetadata } from "../../lib/seo";
import { getSiteSettings } from "../../lib/site-content";
import { SiteHeader } from "../../components/SiteHeader";

const galleryIsPublic = cache(async () => {
  const settings = await getSiteSettings();
  return isGalleryPublicRolloutEnabled(settings.galleryPublicRollout);
});

export const metadata: Metadata = createPageMetadata({
  title: "Social Media",
  description:
    "Follow Old Sea Dogs across TikTok, Instagram, Facebook, X, YouTube Shorts, Threads, LinkedIn and Substack.",
  path: "/social",
});

export default async function SocialPage() {
  const galleryLive = await galleryIsPublic();
  const channelVideos = oldSeaDogsLatestVideos.filter((video) => video.platform !== "TikTok");

  return (
    <main className="article-shell social-hub-shell">
      <SiteHeader />

      <header className="social-hero">
        <p className="eyebrow">Social Hub</p>
        <h1>Follow Old Sea Dogs</h1>
        <p>
          The website is the harbour wall. These are the signal flags: quick
          videos, fresh story links, race notes, show updates and photographs
          from the Old Sea Dogs channels.
        </p>
        <SocialIconLinks links={oldSeaDogsSocialPlatforms} />
        {galleryLive ? (
          <p>
            <Link href="/through-the-lens">See Through the Lens</Link> for photographs from the waterfront.
          </p>
        ) : null}
      </header>

      <section className="social-channel-grid" aria-label="Old Sea Dogs social channels">
        {oldSeaDogsSocialPlatforms.map((platform) => (
          <article className="social-channel-card" key={platform.key}>
            <div className="social-channel-icon" aria-hidden="true">
              {platform.icon}
            </div>
            <div>
              <p className="eyebrow">{platform.label}</p>
              <h2>{platform.handle}</h2>
              <p>{platform.description}</p>
              <TrackedExternalLink href={platform.href} platform={platform.label} rel="me noopener noreferrer">
                Open {platform.label}
              </TrackedExternalLink>
            </div>
          </article>
        ))}
      </section>

      <section className="latest-video-section" aria-label="Latest Old Sea Dogs videos">
        <div className="section-heading">
          <p className="eyebrow">Latest Videos</p>
          <h2>TikTok and YouTube Shorts</h2>
          <p>
            Video embeds are lazy-loaded only after a visitor chooses to load
            them, keeping the first page view light and privacy friendly.
          </p>
        </div>
        <TikTokVideoGrid />
        <div className="social-video-grid">
          {channelVideos.map((video) => (
            <SocialVideoEmbed key={video.id} video={video} />
          ))}
        </div>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact" },
        ]}
      />
    </main>
  );
}
