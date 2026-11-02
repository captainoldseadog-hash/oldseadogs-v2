import type { Metadata } from "next";
import Link from "next/link";
import { AdBlock, isOffTopicInvestorAdvert, pickAdvertForPlacement } from "../components/AdBlock";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { FittedImage } from "../components/FittedImage";
import { ResponsiveStoryImage } from "../components/ResponsiveStoryImage";
import { BoatsForSaleTeaser } from "../components/BoatsForSaleTeaser";
import { MobileAppHome } from "../components/MobileAppHome";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SocialFollowBlock } from "../components/SocialFollowBlock";
import { getClubProfileExcerpt } from "../content/club-profiles";
import {
  displayCategoryLabel,
  oldSeaDogsSections,
} from "../content/sections";
import { storyListingDateLabel } from "../lib/story-header-date";
import { isLogoLikeStoryImage } from "../content/story-images";
import { dedupeCredit } from "../lib/image-fit";
import { presentationForImage, presentationForStories } from "../lib/image-presentation";
import { HomepageContentProvider } from "../lib/homepage-content-provider";
import { isGalleryPublicRolloutEnabled } from "../lib/gallery-public.js";
import { guideAreaCountLabel, guidePublicPath, homepageGuideHighlights } from "../lib/guides";
import { readImageSize } from "../lib/image-derivatives";
import { publicMediaVariantUrl } from "../lib/public-media";
import { derivativeImageUrl, derivativeSrcSet, mobileSourceSrcSet, resizedPublicImageUrl } from "../lib/responsive-image";
import {
  getActiveAds,
  getPublishedGuides,
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

function GuidePromoBand({
  guideFrames,
  guides,
}: {
  guideFrames: Awaited<ReturnType<typeof presentationForStories>>;
  guides: Awaited<ReturnType<typeof getPublishedGuides>>;
}) {
  const { areas, recent } = homepageGuideHighlights(guides);

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
      <div className="homepage-guides-panel">
        {areas.length ? (
          <div className="homepage-guides-list" aria-label="Cruising areas">
            {areas.map((area, index) => (
              <Link href={area.path} key={area.key}>
                <span className="homepage-guide-number">{String(index + 1).padStart(2, "0")}</span>
                <strong className="homepage-guide-title">{area.name}</strong>
                <small className="homepage-guide-type">{guideAreaCountLabel(area.guideCount)}</small>
                <span className="homepage-guide-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {recent.length ? (
        <div className="homepage-guides-recent">
          <p className="eyebrow">Recently added</p>
          <div className="homepage-guides-recent-grid">
            {recent.map((guide, index) => {
              const imageSrc = resizedPublicImageUrl(guide.imageUrl, 768);
              const frame = guideFrames[index];
              const contain = frame?.presentation === "contain";
              return (
                <Link href={guidePublicPath(guide)} key={guide.slug}>
                  {imageSrc && contain ? (
                    <FittedImage
                      alt={guide.imageAlt || guide.title}
                      className="homepage-guide-fit"
                      focalPoint={frame?.focalPoint}
                      height={frame?.height}
                      presentation="contain"
                      sizes="(min-width: 1025px) 280px, (min-width: 640px) 46vw, 70vw"
                      slot="guide-card"
                      src={imageSrc}
                      srcSet={imageSrc.startsWith("/img/") ? derivativeSrcSet(guide.imageUrl, [480, 768]) || undefined : undefined}
                      width={frame?.width}
                    />
                  ) : imageSrc ? (
                    <img
                      alt={guide.imageAlt || guide.title}
                      decoding="async"
                      loading="lazy"
                      sizes="(min-width: 1025px) 280px, (min-width: 640px) 46vw, 70vw"
                      src={imageSrc}
                      srcSet={imageSrc.startsWith("/img/") ? derivativeSrcSet(guide.imageUrl, [480, 768]) || undefined : undefined}
                    />
                  ) : null}
                  <strong>{guide.title}</strong>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
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
          An independent magazine for everyone who loves boats, sailing and life on the water. Edited by Michael Hodges.
        </p>
        <div className="editor-credibility-links">
          <Link href="/about">About Michael</Link>
          <Link href="/authors/michael-hodges">Author profile</Link>
          <Link href="/editorial-standards">Editorial standards</Link>
        </div>
      </div>
    </section>
  );
}

function EditorsPicksBand({
  frames,
  stories,
}: {
  frames: Awaited<ReturnType<typeof presentationForStories>>;
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
        {stories.slice(0, 4).map((story, index) => {
          const storyHasPhoto = hasStoryPhoto(story);
          const frame = frames[index];
          return (
            <article key={story.slug} className={`compact-card ${storyHasPhoto ? "" : "text-only-story"}`}>
              <Link className="compact-card-link" href={`/stories/${story.slug}`}>
                {storyHasPhoto ? (
                  <ResponsiveStoryImage
                    alt={story.imageAlt || story.title}
                    className="compact-image"
                    focalPoint={frame?.focalPoint}
                    height={frame?.height}
                    presentation={frame?.presentation}
                    probe={frame?.probe}
                    sizes="(max-width: 640px) calc(100vw - 40px), 290px"
                    slot="compact"
                    src={story.imageUrl}
                    width={frame?.width}
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
  const [stories, settings, ads, publishedGuides] = await Promise.all([
    getPublishedStories(),
    getSiteSettings(),
    getActiveAds(),
    getPublishedGuides(),
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
  // Featured Club band was removed from the homepage on 29 Oct 2026. Keep the investor-ad guard so that slot cannot return.
  const visibleFeaturedClubAd = featuredClubAd && !isOffTopicInvestorAdvert(featuredClubAd) ? featuredClubAd : null;
  void visibleFeaturedClubAd;
  const sidebarAds = ads
    .filter((ad) => ad.placement === "homepage-sidebar" || ad.placement === "sidebar")
    .filter((ad) => !isOffTopicInvestorAdvert(ad))
    .slice(0, 2);
  const homepageBottomAd = pickAdvertForPlacement(ads, "homepage-bottom");
  const visibleHomepageBottomAd =
    homepageBottomAd && !isOffTopicInvestorAdvert(homepageBottomAd) ? homepageBottomAd : null;
  const featuredHasPhoto = hasStoryPhoto(featuredStory);
  const heroSize = featuredHasPhoto ? await readImageSize(featuredStory.imageUrl).catch(() => null) : null;
  const recentGuides = homepageGuideHighlights(publishedGuides).recent;
  const [heroFrame, latestFrames, pickFrames, reviewFrames, sectionFrames, recentGuideFrames] = await Promise.all([
    featuredHasPhoto
      ? presentationForImage({
          url: featuredStory.imageUrl,
          slot: "hero",
          fit: featuredStory.imageFit,
          focalPoint: featuredStory.imageFocalPoint,
          alt: featuredStory.imageAlt,
          caption: featuredStory.imageCaption,
          category: featuredStory.category,
          slug: featuredStory.slug,
        })
      : Promise.resolve(null),
    presentationForStories(latestReviewedOrFallback, "story-card"),
    presentationForStories(editorPicks.slice(0, 4), "compact"),
    presentationForStories([...reviewStories, ...practicalStories].slice(0, 2), "compact"),
    presentationForStories(sectionCards.map((section) => section.photo || { imageUrl: "" }), "section-thumb"),
    presentationForStories(recentGuides, "guide-card"),
  ]);
  const heroContain = heroFrame?.presentation === "contain";

  return (
    <main className="site-shell">
      <SiteHeader />
      <MobileAppHome
        bannerAd={bannerAd}
        bottomAd={visibleHomepageBottomAd}
        content={{
          featuredStory,
          latestReviewedOrFallback,
          editorPicks,
          reviewStories,
          practicalStories,
          featuredPortClub,
          sectionCards,
        }}
        galleryPublic={isGalleryPublicRolloutEnabled(settings.galleryPublicRollout)}
        guides={publishedGuides}
        heroSize={heroSize}
      />
      <header className={`hero ${featuredHasPhoto ? "" : "no-hero-photo"}${heroContain ? " is-contain" : ""}`}>
        <Link
          aria-label={`Read ${featuredStory.title}`}
          className="mobile-lead-story-link"
          href={`/stories/${featuredStory.slug}`}
          prefetch={true}
        />
        {heroContain && heroFrame ? (
          <FittedImage
            alt={featuredStory.imageAlt || featuredStory.title}
            className="hero-image"
            eager
            focalPoint={heroFrame.focalPoint}
            height={heroFrame.height || heroSize?.height}
            presentation="contain"
            sizes="100vw"
            slot="hero"
            src={derivativeImageUrl(featuredStory.imageUrl, 1600)}
            srcSet={derivativeSrcSet(featuredStory.imageUrl, [768, 1200, 1600]) || undefined}
            width={heroFrame.width || heroSize?.width}
          >
            {featuredStory.imageCredit ? (
              <div className="hero-credit">{dedupeCredit(featuredStory.imageCredit)}</div>
            ) : null}
          </FittedImage>
        ) : featuredHasPhoto ? (
          <picture className="hero-image">
            <source
              media="(max-width: 1024px)"
              sizes="100vw"
              srcSet={mobileSourceSrcSet(featuredStory.imageUrl, publicMediaVariantUrl(featuredStory.imageUrl, "mobile"))}
            />
            <img
              alt={featuredStory.imageAlt || featuredStory.title}
              decoding="async"
              fetchPriority="high"
              height={heroSize?.height}
              loading="eager"
              sizes="100vw"
              src={derivativeImageUrl(featuredStory.imageUrl, 1600)}
              srcSet={derivativeSrcSet(featuredStory.imageUrl, [768, 1200, 1600]) || undefined}
              width={heroSize?.width}
            />
          </picture>
        ) : null}
        {featuredHasPhoto && !heroContain && featuredStory.imageCredit ? (
          <div className="hero-credit">{dedupeCredit(featuredStory.imageCredit)}</div>
        ) : null}
        <div className="hero-scrim" />
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
          <h2 id="mobile-lead-title">{featuredStory.title}</h2>
          <p>{featuredStory.summary}</p>
          <div className="mobile-story-meta">
            <span>{storyListingDateLabel(featuredStory)}</span>
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

      <GuidePromoBand guideFrames={recentGuideFrames} guides={publishedGuides} />

      <BoatsForSaleTeaser />

      <EditorCredibilityBand />

      <section className="section-grid lead-section" id="latest">
        <div>
          <div className="section-heading">
            <p className="eyebrow">Latest from the Watch</p>
            <h2>Fresh sailing stories, race notes and waterfront news</h2>
          </div>
          <div className="story-grid">
            {latestReviewedOrFallback.map((story, index) => {
              const storyHasPhoto = hasStoryPhoto(story);
              const frame = latestFrames[index];
              const storyImageLooksLikeLogo = isLogoLikeStoryImage(story) && frame?.presentation !== "contain";
              return (
                <article className={`story-card ${storyHasPhoto ? "" : "text-only-story"}`} key={story.slug}>
                  <Link className="story-card-link" href={`/stories/${story.slug}`}>
                    {storyHasPhoto ? (
                      <ResponsiveStoryImage
                        alt={story.imageAlt || story.title}
                        className={`story-image ${storyImageLooksLikeLogo ? "club-logo-image" : ""}`}
                        focalPoint={frame?.focalPoint}
                        height={frame?.height}
                        presentation={frame?.presentation}
                        probe={frame?.probe}
                        sizes="(max-width: 640px) calc(100vw - 30px), 390px"
                        slot="story-card"
                        src={story.imageUrl}
                        width={frame?.width}
                      >
                        {story.imageCredit ? (
                          <small className="image-credit-chip">{dedupeCredit(story.imageCredit)}</small>
                        ) : null}
                      </ResponsiveStoryImage>
                    ) : null}
                    <div className="story-card-body">
                      <div className="story-meta">
                        <span>{displayCategoryLabel(story.category)}</span>
                        <span>{storyListingDateLabel(story)}</span>
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
            {sectionCards.map((section, index) => (
              <Link href={`/${section.slug}`} className="section-list-item" key={section.slug}>
                {section.photo ? (
                  <ResponsiveStoryImage
                    alt={section.label}
                    className={`section-list-image ${
                      isLogoLikeStoryImage(section.photo) && sectionFrames[index]?.presentation !== "contain" ? "club-logo-image" : ""
                    }`}
                    focalPoint={sectionFrames[index]?.focalPoint}
                    height={sectionFrames[index]?.height}
                    presentation={sectionFrames[index]?.presentation}
                    probe={sectionFrames[index]?.probe}
                    sizes="66px"
                    slot="section-thumb"
                    src={section.photo.imageUrl}
                    width={sectionFrames[index]?.width}
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

      <EditorsPicksBand frames={pickFrames} stories={editorPicks} />

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
          {[...reviewStories, ...practicalStories].slice(0, 2).map((story, index) => {
            const storyHasPhoto = hasStoryPhoto(story);
            const frame = reviewFrames[index];
            return (
              <article key={story.slug} className={`compact-card ${storyHasPhoto ? "" : "text-only-story"}`}>
                <Link className="compact-card-link" href={`/stories/${story.slug}`}>
                  {storyHasPhoto ? (
                    <ResponsiveStoryImage
                      alt={story.imageAlt || story.title}
                      className="compact-image"
                      focalPoint={frame?.focalPoint}
                      height={frame?.height}
                      presentation={frame?.presentation}
                      probe={frame?.probe}
                      sizes="(max-width: 640px) calc(100vw - 40px), 290px"
                      slot="compact"
                      src={story.imageUrl}
                      width={frame?.width}
                    >
                      {story.imageCredit ? (
                        <small className="image-credit-chip">{dedupeCredit(story.imageCredit)}</small>
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

      {visibleHomepageBottomAd ? (
        <section className="ad-band footer-ad-band" aria-label="Footer advertisement">
          <p className="ad-band-label">Advertisement</p>
          <AdBlock
            ad={visibleHomepageBottomAd}
            className="homepage-bottom-ad"
            showSponsor
          />
        </section>
      ) : null}

      <div className="newsletter-band">
        <NewsletterSignup placement="homepage" />
      </div>

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
