import type { Metadata } from "next";
import Link from "next/link";
import { AdBlock, pickAdvertForPlacement } from "../components/AdBlock";
import { ResponsiveStoryImage } from "../components/ResponsiveStoryImage";
import { SiteFooter } from "../components/SiteFooter";
import { SocialFollowBlock } from "../components/SocialFollowBlock";
import { getClubProfileExcerpt } from "../content/club-profiles";
import {
  categoryMatchesLabel,
  displayCategoryLabel,
  marinaGuideNavigationLink,
  oldSeaDogsSections,
} from "../content/sections";
import { formatDate } from "../content/stories";
import { isLogoLikeStoryImage } from "../content/story-images";
import { HomepageContentProvider } from "../lib/homepage-content-provider";
import { guidePublicPath } from "../lib/guides";
import { publicMediaVariantUrl } from "../lib/public-media";
import {
  getActiveAds,
  getHomepageGuides,
  getPublishedStories,
  getSiteSettings,
  hasStoryPhoto,
} from "../lib/site-content";
import {
  createPageMetadata,
} from "../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return createPageMetadata({
    title: settings.brandName,
    description: settings.siteDescription,
    path: "/",
    image: { url: settings.homepageSocialImageUrl || settings.defaultSocialImageUrl, alt: settings.brandName },
  });
}

// Keep the magazine homepage navigation aligned with the live site. Guides
// enter through the single editorial promotion below rather than expanding
// this already dense masthead.
const sections = oldSeaDogsSections.map((section) => ({
  href: `/${section.slug}`,
  label: section.label,
})).concat(marinaGuideNavigationLink);

function GuidePromoBand({
  guides,
}: {
  guides: Awaited<ReturnType<typeof getHomepageGuides>>;
}) {
  const featuredSlugs = ["the-solent", "river-hamble", "hamble-point-marina"];
  const featuredGuides = featuredSlugs.flatMap((slug) => {
    const guide = guides.find((item) => item.slug === slug);
    return guide ? [guide] : [];
  });
  if (featuredGuides.length === 0) return null;

  return (
    <section className="homepage-guides-promo" aria-labelledby="homepage-guides-title">
      <div className="homepage-guides-intro">
        <p className="eyebrow">The reference library</p>
        <h2 id="homepage-guides-title">Discover Old Sea Dogs Guides</h2>
        <p>
          Practical cruising knowledge, maritime history and the stories that
          give Britain&apos;s sailing waters their character.
        </p>
        <Link className="button-primary" href="/guides">
          Explore All Guides
        </Link>
      </div>
      <div className="homepage-guides-list" aria-label="Featured Old Sea Dogs Guides">
        {featuredGuides.map((guide, index) => (
          <Link className={index === 0 ? "mobile-guide-highlight" : undefined} href={guidePublicPath(guide)} key={guide.slug}>
            <span className="homepage-guide-number">{String(index + 1).padStart(2, "0")}</span>
            <strong className="homepage-guide-title">{guide.title}</strong>
            <small className="homepage-guide-type">{guide.guideType} Guide</small>
            <span className="homepage-guide-arrow" aria-hidden="true">→</span>
            {index === 0 ? (
              <span className="mobile-guide-card-content">
                <span className="mobile-guide-image">
                  <img
                    alt={guide.imageAlt}
                    decoding="async"
                    loading="lazy"
                    src={publicMediaVariantUrl(guide.imageUrl, "thumbnail")}
                  />
                </span>
                <span className="mobile-guide-copy">
                  <span className="eyebrow">Guide highlight</span>
                  <strong>{guide.title}</strong>
                  <span>{guide.regionName}</span>
                  <span>{guide.summary}</span>
                  <span className="mobile-text-link">View Guide</span>
                </span>
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function EditorCredibilityBand() {
  return (
    <section className="editor-credibility-band" aria-labelledby="editor-credibility-title">
      <div>
        <p className="eyebrow">Edited by Michael Hodges</p>
        <h2 id="editor-credibility-title">
          For people who love boats, sailing and life on the water
        </h2>
        <p>
          <strong>
            Old Sea Dogs is an independent boating and sailing magazine for everyone
            who enjoys being on, around or simply dreaming about the water.
          </strong>
        </p>
        <p>
          From yacht racing, offshore adventures and the latest sailing news to
          motorboats, superyachts, boat reviews, marinas, destinations and practical
          seamanship, Old Sea Dogs brings together stories from across the boating
          world.
        </p>
        <p>
          We follow the great international races and regattas, visit harbours and
          marinas, explore remarkable yachts and new marine technology, and celebrate
          the sailors, designers, boatbuilders, clubs and characters who make the
          maritime world what it is.
        </p>
        <p>
          Whether you race, cruise, own a boat, are learning to sail or simply enjoy
          watching the tide come in,{" "}
          <strong>
            Old Sea Dogs is about one thing above all — a shared passion for boats and
            the sea.
          </strong>
        </p>
      </div>
      <div className="editor-credibility-links">
        <Link href="/about">About Michael</Link>
        <Link href="/authors/michael-hodges">Author profile</Link>
        <Link href="/editorial-standards">Editorial standards</Link>
      </div>
    </section>
  );
}

function EditorsPicksBand({
  stories,
}: {
  stories: Awaited<ReturnType<typeof getPublishedStories>>;
}) {
  if (stories.length === 0) return null;

  return (
    <section className="feature-band editors-picks-band" id="editors-picks">
      <div className="feature-copy">
        <p className="eyebrow">Editor&apos;s Choice</p>
        <h2>Hand-picked stories worth a proper look</h2>
        <p>
          Chosen for useful detail, clean attribution and a reason to read
          beyond the headline.
        </p>
      </div>
      <div className="feature-cards">
        {stories.slice(0, 4).map((story) => {
          const storyHasPhoto = hasStoryPhoto(story);
          return (
            <article key={story.slug} className={`compact-card ${storyHasPhoto ? "" : "text-only-story"}`}>
              <Link className="compact-card-link" href={`/stories/${story.slug}`}>
                {storyHasPhoto ? (
                  <ResponsiveStoryImage
                    alt={story.imageAlt || story.title}
                    className="compact-image"
                    sizes="(max-width: 640px) calc(100vw - 40px), 290px"
                    src={story.imageUrl}
                  />
                ) : null}
                <div>
                  <span>{displayCategoryLabel(story.category)}</span>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default async function Home() {
  const [stories, settings, ads, homepageGuides] = await Promise.all([
    getPublishedStories(),
    getSiteSettings(),
    getActiveAds(),
    getHomepageGuides(),
  ]);
  const {
    featuredStory,
    latestReviewedOrFallback,
    editorPicks,
    reviewStories,
    practicalStories,
    featuredPortClub,
    sectionCards,
  } = new HomepageContentProvider(stories, settings).getContent();
  const bannerAd = pickAdvertForPlacement(ads, "banner");
  const featuredClubAd = pickAdvertForPlacement(ads, "homepage-featured-club");
  const sidebarAds = ads
    .filter((ad) => ad.placement === "homepage-sidebar" || ad.placement === "sidebar")
    .slice(0, 2);
  const homepageBottomAd = pickAdvertForPlacement(ads, "homepage-bottom");
  const featuredHasPhoto = hasStoryPhoto(featuredStory);

  return (
    <main className="site-shell">
      <header className={`hero ${featuredHasPhoto ? "" : "no-hero-photo"}`}>
        <Link
          aria-label={`Read ${featuredStory.title}`}
          className="mobile-lead-story-link"
          href={`/stories/${featuredStory.slug}`}
          prefetch={true}
        />
        {featuredHasPhoto ? (
          <picture className="hero-image">
            <source
              media="(max-width: 1024px)"
              srcSet={publicMediaVariantUrl(featuredStory.imageUrl, "mobile")}
            />
            <img
              alt={featuredStory.imageAlt || featuredStory.title}
              decoding="async"
              fetchPriority="high"
              loading="eager"
              src={featuredStory.imageUrl}
            />
          </picture>
        ) : null}
        {featuredHasPhoto && featuredStory.imageCredit ? (
          <div className="hero-credit">{featuredStory.imageCredit}</div>
        ) : null}
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
            <Link href="/search">Search</Link>
          </div>
        </nav>

        <section className="hero-content" aria-labelledby="site-title">
          <p className="eyebrow">{settings.kicker}</p>
          <h1 id="site-title">{settings.brandName}</h1>
          <p className="hero-summary">{featuredStory.summary}</p>
          <div className="hero-actions">
            <Link href={`/stories/${featuredStory.slug}`} className="button-primary" prefetch={true}>
              Read the lead story
            </Link>
            <a href="#latest" className="button-secondary">
              Latest dispatches
            </a>
          </div>
        </section>
        <section className="mobile-hero-content" aria-labelledby="mobile-lead-title">
          <p className="eyebrow">{displayCategoryLabel(featuredStory.category)}</p>
          <h1 id="mobile-lead-title">{featuredStory.title}</h1>
          <p>{featuredStory.summary}</p>
          <div className="mobile-story-meta">
            <span>{formatDate(featuredStory.date)}</span>
            <span>{featuredStory.readMinutes} min read</span>
            <span>{featuredStory.author}</span>
          </div>
        </section>
      </header>

      <section className="ticker-band section-link-band" aria-label="Old Sea Dogs sections">
        <p>Sections</p>
        {oldSeaDogsSections.map((section) => (
          <Link href={`/${section.slug}`} key={section.slug}>
            {section.label}
          </Link>
        ))}
      </section>

      {bannerAd ? (
        <section className="ad-band" aria-label="Advertisement">
          <AdBlock ad={bannerAd} />
        </section>
      ) : null}

      <GuidePromoBand guides={homepageGuides} />

      <EditorCredibilityBand />

      <section
        className="featured-port-club-band featured-port-club-band--compact"
        aria-labelledby="featured-port-club-title"
        data-compact-version="featured-club-ad-compact-v2"
      >
        <div className="featured-port-club-layout" data-featured-club-row="compact">
          {featuredPortClub ? (
            <article className="featured-port-club-card">
              <Link
                href={featuredPortClub.href}
                className={`featured-port-club-media ${
                  isLogoLikeStoryImage(featuredPortClub.story) ? "club-logo-media" : ""
                }`}
              >
                <ResponsiveStoryImage
                  alt={featuredPortClub.imageAlt}
                  className="featured-port-club-media-image"
                  sizes="(max-width: 640px) calc(100vw - 30px), 480px"
                  src={featuredPortClub.imageUrl}
                />
                {featuredPortClub.story.imageCredit ? (
                  <small className="image-credit-chip">
                    {featuredPortClub.story.imageCredit}
                  </small>
                ) : null}
              </Link>
              <div className="featured-port-club-copy">
                <p className="eyebrow">{featuredPortClub.label}</p>
                <h2 id="featured-port-club-title">
                  <Link href={featuredPortClub.href}>{featuredPortClub.story.title}</Link>
                </h2>
                <p>{featuredPortClub.excerpt}</p>
                <Link href={featuredPortClub.href} className="button-secondary">
                  Open {categoryMatchesLabel(featuredPortClub.story.category, "Ports") ? "port" : "club"} page
                </Link>
              </div>
            </article>
          ) : (
            <div className="featured-port-club-card featured-port-club-empty">
              <div className="featured-port-club-copy">
                <p className="eyebrow">Ports and Clubs</p>
                <h2 id="featured-port-club-title">Harbour notes for the next passage</h2>
                <p>
                  Browse marina stops, clubs and practical shore-side notes from
                  the Old Sea Dogs archive.
                </p>
                <Link href="/ports" className="button-secondary">
                  Explore ports and clubs
                </Link>
              </div>
            </div>
          )}

          <AdBlock
            ad={featuredClubAd}
            className="featured-port-club-ad"
            placeholderTitle="Featured Club sponsor space"
            reserveSpace
          />
        </div>
      </section>

      <section className="section-grid lead-section" id="latest">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Latest from the Watch</p>
            <h2>Fresh sailing stories, race notes and waterfront news</h2>
          </div>
          <div className="story-grid">
            {latestReviewedOrFallback.map((story) => {
              const storyHasPhoto = hasStoryPhoto(story);
              const storyImageLooksLikeLogo = isLogoLikeStoryImage(story);
              return (
                <article className={`story-card ${storyHasPhoto ? "" : "text-only-story"}`} key={story.slug}>
                  <Link className="story-card-link" href={`/stories/${story.slug}`}>
                    {storyHasPhoto ? (
                      <ResponsiveStoryImage
                        alt={story.imageAlt || story.title}
                        className={`story-image ${storyImageLooksLikeLogo ? "club-logo-image" : ""}`}
                        sizes="(max-width: 640px) calc(100vw - 30px), 390px"
                        src={story.imageUrl}
                      >
                        {story.imageCredit ? (
                          <small className="image-credit-chip">{story.imageCredit}</small>
                        ) : null}
                      </ResponsiveStoryImage>
                    ) : null}
                    <div className="story-card-body">
                      <div className="story-meta">
                        <span>{displayCategoryLabel(story.category)}</span>
                        <span>{formatDate(story.date)}</span>
                      </div>
                      <h3>{story.title}</h3>
                      <span className="story-summary-link">
                        {getClubProfileExcerpt(story)}
                      </span>
                      <div className="source-row">
                        <span>{story.readMinutes} min read</span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="watch-panel" id="site-sections" aria-label="Old Sea Dogs sections">
          <p className="eyebrow">Sections</p>
          <h2>Explore Old Sea Dogs</h2>
          <div className="watch-list section-list">
            {sectionCards.map((section) => (
              <Link href={`/${section.slug}`} className="section-list-item" key={section.slug}>
                {section.photo ? (
                  <ResponsiveStoryImage
                    alt=""
                    className={`section-list-image ${
                      isLogoLikeStoryImage(section.photo) ? "club-logo-image" : ""
                    }`}
                    sizes="66px"
                    src={section.photo.imageUrl}
                  />
                ) : (
                  <span className="section-list-image section-list-image--placeholder" aria-hidden="true" />
                )}
                <span className="section-list-copy">
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </span>
              </Link>
            ))}
          </div>
          {sidebarAds.map((ad) => (
            <AdBlock ad={ad} key={ad.id} />
          ))}
        </aside>
      </section>

      <EditorsPicksBand stories={editorPicks} />

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
          {[...reviewStories, ...practicalStories].slice(0, 2).map((story) => {
            const storyHasPhoto = hasStoryPhoto(story);
            return (
              <article key={story.slug} className={`compact-card ${storyHasPhoto ? "" : "text-only-story"}`}>
                <Link className="compact-card-link" href={`/stories/${story.slug}`}>
                  {storyHasPhoto ? (
                    <ResponsiveStoryImage
                      alt={story.imageAlt || story.title}
                      className="compact-image"
                      sizes="(max-width: 640px) calc(100vw - 40px), 290px"
                      src={story.imageUrl}
                    >
                      {story.imageCredit ? (
                        <small className="image-credit-chip">{story.imageCredit}</small>
                      ) : null}
                    </ResponsiveStoryImage>
                  ) : null}
                  <div>
                    <span>{displayCategoryLabel(story.category)}</span>
                    <h3>{story.title}</h3>
                    {!storyHasPhoto ? (
                      <span className="story-summary-link compact-summary-link">
                        {story.summary}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <SocialFollowBlock />

      {homepageBottomAd ? (
        <section className="ad-band footer-ad-band" aria-label="Footer advertisement">
          <p className="ad-band-label">Advertisement</p>
          <AdBlock
            ad={homepageBottomAd}
            className="homepage-bottom-ad"
            ctaLabel="Visit www.aNewFN.com"
            placeholderTitle="Homepage bottom sponsor space"
            showSponsor
          />
        </section>
      ) : null}

      <SiteFooter
        brandName={settings.brandName}
        footerText={settings.footerText}
        extraLinks={[
          { href: "#latest", label: "Latest" },
          { href: "#reviews", label: "Reviews" },
          { href: "#site-sections", label: "Sections" },
        ]}
      />
    </main>
  );
}
