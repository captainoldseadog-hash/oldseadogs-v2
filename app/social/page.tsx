import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { SocialIconLinks } from "../../components/SocialIconLinks";
import { SocialVideoEmbed } from "../../components/SocialVideoEmbed";
import { TrackedExternalLink } from "../../components/TrackedExternalLink";
import {
  oldSeaDogsLatestVideos,
  oldSeaDogsSocialPlatforms,
} from "../../content/social-links";
import { marinaGuideNavigationLink, oldSeaDogsSections } from "../../content/sections";
import { createPageMetadata } from "../../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Social Media",
  description:
    "Follow Old Sea Dogs across TikTok, Instagram, Facebook, X, YouTube Shorts, Threads and LinkedIn.",
  path: "/social",
});

export default function SocialPage() {
  return (
    <main className="article-shell social-hub-shell">
      <nav className="article-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="nav-links section-nav-links">
          {oldSeaDogsSections.map((section) => (
            <Link href={`/${section.slug}`} key={section.slug}>
              {section.label}
            </Link>
          ))}
          <Link href={marinaGuideNavigationLink.href}>{marinaGuideNavigationLink.label}</Link>
        </div>
      </nav>

      <header className="social-hero">
        <p className="eyebrow">Social Hub</p>
        <h1>Follow Old Sea Dogs</h1>
        <p>
          The website is the harbour wall. These are the signal flags: quick
          videos, fresh story links, race notes, show updates and photographs
          from the Old Sea Dogs channels.
        </p>
        <SocialIconLinks links={oldSeaDogsSocialPlatforms} />
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
        <div className="social-video-grid">
          {oldSeaDogsLatestVideos.map((video) => (
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
