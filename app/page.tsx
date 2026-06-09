import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "../content/stories";
import { getActiveAds, getPublishedStories, getSiteSettings, type Advert } from "../lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.brandName,
    description: settings.siteDescription,
  };
}

const sections = [
  { label: "News", href: "#latest" },
  { label: "Boat Reviews", href: "#reviews" },
  { label: "Cruising", href: "#latest" },
  { label: "Press Watch", href: "#press-watch" },
];

const watchItems = [
  {
    source: "Press releases",
    detail: "Manufacturer launches, yard news, race notices",
    count: "18",
  },
  {
    source: "Yachting feeds",
    detail: "Brokerage, regattas, superyacht movements",
    count: "42",
  },
  {
    source: "Practical alerts",
    detail: "Safety, maintenance, navigation, club updates",
    count: "9",
  },
];

function AdCard({ ad }: { ad: Advert }) {
  if (ad.kind === "network" && ad.code) {
    return (
      <aside
        className="ad-card network-ad"
        aria-label={ad.label}
        dangerouslySetInnerHTML={{ __html: ad.code }}
      />
    );
  }

  return (
    <aside className="ad-card" aria-label={ad.label}>
      {ad.imageUrl ? (
        <span
          className="ad-image"
          role="img"
          aria-label={ad.title || ad.label}
          style={{ backgroundImage: `url(${ad.imageUrl})` }}
        />
      ) : null}
      <div>
        <p>{ad.label}</p>
        {ad.title ? <h3>{ad.title}</h3> : null}
        {ad.body ? <span>{ad.body}</span> : null}
        {ad.linkUrl ? <a href={ad.linkUrl}>Visit advertiser</a> : null}
      </div>
    </aside>
  );
}

export default async function Home() {
  const [stories, settings, ads] = await Promise.all([
    getPublishedStories(),
    getSiteSettings(),
    getActiveAds(),
  ]);
  const featuredStory = stories.find((story) => story.isFeatured) ?? stories[0];
  const latestStories = stories
    .filter((story) => story.slug !== featuredStory.slug)
    .slice(0, 4);
  const reviewStories = stories.filter((story) => story.category === "Boat Reviews");
  const practicalStories = stories.filter((story) => story.category === "Maintenance");
  const bannerAd = ads.find((ad) => ad.placement === "banner");
  const sidebarAds = ads.filter((ad) => ad.placement === "sidebar").slice(0, 2);

  return (
    <main className="site-shell">
      <header className="hero">
        <div
          className="hero-image"
          aria-hidden="true"
          style={{ backgroundImage: `url(${featuredStory.imageUrl})` }}
        />
        <div className="hero-scrim" />
        <nav className="topbar" aria-label="Primary navigation">
          <Link href="/" className="brand-lockup" aria-label="Old Sea Dogs home">
            <span className="brand-mark" aria-hidden="true" />
            <span>Old Sea Dogs</span>
          </Link>
          <div className="nav-links">
            {sections.map((section) => (
              <a key={section.label} href={section.href}>
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <section className="hero-content" aria-labelledby="site-title">
          <p className="eyebrow">{settings.kicker}</p>
          <h1 id="site-title">{settings.brandName}</h1>
          <p className="hero-summary">{featuredStory.summary}</p>
          <div className="hero-actions">
            <Link href={`/stories/${featuredStory.slug}`} className="button-primary">
              Read the lead story
            </Link>
            <a href="#latest" className="button-secondary">
              Latest dispatches
            </a>
          </div>
        </section>
      </header>

      <section className="ticker-band" aria-label="Current editorial watch">
        <p>On watch today</p>
        <span>Cowes 200</span>
        <span>Flybridge launches</span>
        <span>Refit yards</span>
        <span>Practical maintenance</span>
      </section>

      {bannerAd ? (
        <section className="ad-band" aria-label="Advertisement">
          <AdCard ad={bannerAd} />
        </section>
      ) : null}

      <section className="section-grid lead-section" id="latest">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Latest</p>
            <h2>Fresh from the waterline</h2>
          </div>
          <div className="story-grid">
            {latestStories.map((story) => (
              <article className="story-card" key={story.slug}>
                <Link href={`/stories/${story.slug}`} className="image-link">
                  <span
                    className="story-image"
                    role="img"
                    aria-label={story.imageAlt}
                    style={{ backgroundImage: `url(${story.imageUrl})` }}
                  />
                </Link>
                <div className="story-card-body">
                  <div className="story-meta">
                    <span>{story.category}</span>
                    <span>{formatDate(story.date)}</span>
                  </div>
                  <h3>
                    <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                  </h3>
                  <p>{story.summary}</p>
                  <div className="source-row">
                    <span>{story.sourceType}</span>
                    <span>{story.readMinutes} min read</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="watch-panel" id="press-watch" aria-label="Press and source watch">
          <p className="eyebrow">Press Watch</p>
          <h2>Incoming story signals</h2>
          <div className="watch-list">
            {watchItems.map((item) => (
              <div className="watch-item" key={item.source}>
                <strong>{item.count}</strong>
                <div>
                  <h3>{item.source}</h3>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          {sidebarAds.map((ad) => (
            <AdCard ad={ad} key={ad.id} />
          ))}
        </aside>
      </section>

      <section className="feature-band" id="reviews">
        <div className="feature-copy">
          <p className="eyebrow">Boat Reviews</p>
          <h2>Launches, sea trials, and owner-minded notes</h2>
          <p>
            Reviews are written around the questions buyers and skippers actually ask:
            handling, access, storage, maintenance, and whether the layout works once
            the weather turns.
          </p>
        </div>
        <div className="feature-cards">
          {[...reviewStories, ...practicalStories].slice(0, 2).map((story) => (
            <article key={story.slug} className="compact-card">
              <span
                className="compact-image"
                role="img"
                aria-label={story.imageAlt}
                style={{ backgroundImage: `url(${story.imageUrl})` }}
              />
              <div>
                <span>{story.category}</span>
                <h3>
                  <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <p className="brand-footer">
            <span className="brand-mark footer-mark" aria-hidden="true" />
            <span>{settings.brandName}</span>
          </p>
          <p>{settings.footerText}</p>
        </div>
        <div className="footer-links">
          <a href="#latest">Latest</a>
          <a href="#reviews">Reviews</a>
          <a href="#press-watch">Press Watch</a>
        </div>
      </footer>
    </main>
  );
}
