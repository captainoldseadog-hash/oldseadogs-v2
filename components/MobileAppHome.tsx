import Link from "next/link";
import type { ReactNode } from "react";
import { AdBlock } from "./AdBlock";
import { NewsletterSignup } from "./NewsletterSignup";
import { ResponsiveStoryImage } from "./ResponsiveStoryImage";
import { SocialIconLinks } from "./SocialIconLinks";
import { TrackedExternalLink } from "./TrackedExternalLink";
import { oldSeaDogsSocialPlatforms } from "../content/social-links";
import { categoryMatchesLabel, displayCategoryLabel, oldSeaDogsSections } from "../content/sections";
import { formatDate } from "../content/stories";
import { isLogoLikeStoryImage } from "../content/story-images";
import { TradeBadge } from "./boats/TradeBadge";
import { boatsHomepageIntro } from "../lib/classifieds-copy";
import { listPublicBoatListings } from "../lib/classifieds-service.ts";
import { guideAreaCountLabel, guidePublicPath, homepageGuideHighlights } from "../lib/guides";
import type { HomepageContent } from "../lib/homepage-content-provider";
import { publicMediaVariantUrl } from "../lib/public-media";
import { derivativeImageUrl, derivativeSrcSet, mobileSourceSrcSet, resizedPublicImageUrl } from "../lib/responsive-image";
import {
  getApprovedPublicGalleryPhotos,
  hasStoryPhoto,
  type Advert,
  type EditableGuide,
  type EditableStory,
} from "../lib/site-content";
import { loadPublicTikTokCatalog } from "../lib/tiktok-display-server";
import type { PublicTikTokVideo } from "../lib/tiktok-display.js";

type MobileAppHomeProps = {
  content: HomepageContent;
  guides: EditableGuide[];
  galleryPublic: boolean;
  heroSize: { width: number; height: number } | null;
  bannerAd: Advert | null;
  bottomAd: Advert | null;
};

const quickLinks = [
  { href: "/guides", label: "Guides", icon: "guides" },
  { href: "/boats-for-sale", label: "Boats for Sale", icon: "boats", hot: true },
  { href: "/through-the-lens", label: "Through the Lens", icon: "lens" },
  { href: "/news", label: "Stories", icon: "stories" },
  { href: "/search", label: "Search", icon: "search" },
] as const;

export async function MobileAppHome({
  content,
  guides,
  galleryPublic,
  heroSize,
  bannerAd,
  bottomAd,
}: MobileAppHomeProps) {
  const { featuredStory, latestReviewedOrFallback, editorPicks, reviewStories, practicalStories, featuredPortClub } = content;
  const featuredHasPhoto = hasStoryPhoto(featuredStory);
  const listing = (await loadBoatPreview())[0] ?? null;
  const lens = await loadLensTiles(galleryPublic);
  const reviews = uniqueStories([...reviewStories, ...practicalStories]).slice(0, 6);
  const guideHighlights = homepageGuideHighlights(guides);

  return (
    <div className="mobile-app-home">
      <nav aria-label="Quick links" className="app-quick-links">
        {quickLinks.map((link) => (
          <Link className={"hot" in link && link.hot ? "is-hot" : undefined} href={link.href} key={link.href}>
            <span aria-hidden="true">{quickIcon(link.icon)}</span>
            <b>{link.label}</b>
          </Link>
        ))}
      </nav>

      <article className="app-lead">
        <Link className="app-lead-card" href={`/stories/${featuredStory.slug}`} prefetch={true}>
          {featuredHasPhoto ? (
            <picture className="app-lead-photo">
              <source
                media="(max-width: 1023px)"
                sizes="(max-width: 1023px) calc(100vw - 32px), 1px"
                srcSet={mobileSourceSrcSet(featuredStory.imageUrl, publicMediaVariantUrl(featuredStory.imageUrl, "mobile"))}
              />
              <img
                alt={featuredStory.imageAlt || featuredStory.title}
                decoding="async"
                fetchPriority="high"
                height={heroSize?.height}
                loading="eager"
                sizes="(max-width: 1023px) calc(100vw - 32px), 1px"
                src={derivativeImageUrl(featuredStory.imageUrl, 768)}
                srcSet={derivativeSrcSet(featuredStory.imageUrl, [480, 768, 1200]) || undefined}
                width={heroSize?.width}
              />
            </picture>
          ) : null}
          <span aria-hidden="true" className="app-lead-shade" />
          <span className="app-lead-copy">
            <span className="app-tag">{displayCategoryLabel(featuredStory.category)}</span>
            <h2>{featuredStory.title}</h2>
            <span className="app-lead-meta">
              {formatDate(featuredStory.date)} · {featuredStory.readMinutes} min read
            </span>
          </span>
        </Link>
        {featuredHasPhoto && featuredStory.imageCredit ? (
          <p className="app-lead-credit">{creditLine(featuredStory.imageCredit)}</p>
        ) : null}
      </article>

      {bannerAd ? (
        <div className="app-ad">
          <AdBlock ad={bannerAd} />
        </div>
      ) : null}

      <BoatsCard listing={listing} />

      <AppHeading action="See all" href="/news" id="app-latest-title" title="Latest from the Watch" />
      <Carousel label="Latest from the Watch">
        {latestReviewedOrFallback.map((story) => (
          <StoryCard key={story.slug} story={story} />
        ))}
      </Carousel>

      <AppHeading action="Browse all guides" href="/guides" id="app-guides-title" title="Guides" />
      <Carousel label="Guides">
        {guideHighlights.areas.map((area) => {
          const imageSrc = resizedPublicImageUrl(area.guide.imageUrl, 768);
          return (
            <Link className="app-card app-card-guide" href={area.path} key={area.key}>
              {imageSrc ? (
                <span className="app-card-media">
                  <img
                    alt={area.guide.imageAlt || area.name}
                    decoding="async"
                    loading="lazy"
                    sizes="250px"
                    src={imageSrc}
                    srcSet={imageSrc.startsWith("/img/") ? derivativeSrcSet(area.guide.imageUrl, [480, 768]) || undefined : undefined}
                  />
                </span>
              ) : null}
              <span className="app-card-body">
                <small>{guideAreaCountLabel(area.guideCount)}</small>
                <h3>{area.name}</h3>
                <span className="app-card-go">View area</span>
              </span>
            </Link>
          );
        })}
        {guideHighlights.recent.map((guide) => {
          const imageSrc = resizedPublicImageUrl(guide.imageUrl, 768);
          return (
            <Link className="app-card app-card-guide" href={guidePublicPath(guide)} key={guide.slug}>
              {imageSrc ? (
                <span className="app-card-media">
                  <img
                    alt={guide.imageAlt || guide.title}
                    decoding="async"
                    loading="lazy"
                    sizes="250px"
                    src={imageSrc}
                    srcSet={imageSrc.startsWith("/img/") ? derivativeSrcSet(guide.imageUrl, [480, 768]) || undefined : undefined}
                  />
                </span>
              ) : null}
              <span className="app-card-body">
                <small>Recently added</small>
                <h3>{guide.title}</h3>
                <span className="app-card-go">View guide</span>
              </span>
            </Link>
          );
        })}
      </Carousel>

      <AppHeading action="Gallery" href={lens.href} id="app-lens-title" title="Through the Lens" />
      <Carousel label="Through the Lens">
        {lens.photos.map((photo) => (
          <Link className="app-lens-tile" href={lens.href} key={photo.id}>
            <img
              alt={photo.alt || photo.title || "Through the Lens photograph"}
              decoding="async"
              loading="lazy"
              sizes="150px"
              src={derivativeImageUrl(photo.imageUrl, 480)}
            />
          </Link>
        ))}
        {lens.videos.map((video) => (
          <TrackedExternalLink className="app-lens-tile" href={video.watchUrl} key={video.id} platform="TikTok">
            <img alt={video.title || "TikTok video"} decoding="async" loading="lazy" sizes="150px" src={video.coverPath} />
          </TrackedExternalLink>
        ))}
        <Link className="app-lens-more" href={lens.href}>See the full gallery</Link>
      </Carousel>

      <div className="app-section-heading">
        <h2 id="app-sections-title">Browse sections</h2>
      </div>
      <nav aria-labelledby="app-sections-title" className="app-chips">
        {oldSeaDogsSections.map((section) => (
          <Link href={`/${section.slug}`} key={section.slug}>{section.label}</Link>
        ))}
      </nav>

      {editorPicks.length > 0 ? (
        <>
          <AppHeading action="More" href="/news" id="app-editors-title" title="Editor's choice" />
          <Carousel label="Editor's choice">
            {editorPicks.slice(0, 6).map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </Carousel>
        </>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <AppHeading action="All reviews" href="/reviews" id="app-reviews-title" title="Boat reviews" />
          <Carousel label="Boat reviews">
            {reviews.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </Carousel>
        </>
      ) : null}

      <section aria-labelledby="app-club-title" className="app-panel">
        <p className="app-kicker">{featuredPortClub ? featuredPortClub.label : "Ports and Clubs"}</p>
        {featuredPortClub ? (
          <Link className="app-club" href={featuredPortClub.href}>
            <span className={`app-club-mark ${isLogoLikeStoryImage(featuredPortClub.story) ? "is-logo" : ""}`}>
              <ResponsiveStoryImage
                alt={featuredPortClub.imageAlt}
                sizes="88px"
                src={featuredPortClub.imageUrl}
              />
            </span>
            <span>
              <h2 id="app-club-title">{featuredPortClub.story.title}</h2>
              <span className="app-card-go">
                Open {categoryMatchesLabel(featuredPortClub.story.category, "Ports") ? "port" : "club"} page
              </span>
            </span>
          </Link>
        ) : (
          <Link className="app-club" href="/ports">
            <span>
              <h2 id="app-club-title">Harbour notes for the next passage</h2>
              <span className="app-card-go">Explore ports and clubs</span>
            </span>
          </Link>
        )}
      </section>

      <section aria-labelledby="app-editor-title" className="app-panel">
        <p className="app-kicker">Edited by Michael Hodges</p>
        <h2 id="app-editor-title">For people who love boats, sailing and life on the water</h2>
        <p>
          <strong>
            Old Sea Dogs is an independent boating and sailing magazine for everyone
            who enjoys being on, around or simply dreaming about the water.
          </strong>
        </p>
        <details className="app-more">
          <summary>Read more</summary>
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
        </details>
        <div className="app-text-links">
          <Link href="/about">About Michael</Link>
          <Link href="/authors/michael-hodges">Author profile</Link>
          <Link href="/editorial-standards">Editorial standards</Link>
        </div>
      </section>

      <section aria-label="Follow Old Sea Dogs" className="app-panel">
        <p className="app-kicker">Social</p>
        <h2>Follow Old Sea Dogs</h2>
        <SocialIconLinks className="app-social-grid" links={oldSeaDogsSocialPlatforms} />
      </section>

      <div className="app-newsletter">
        <NewsletterSignup headingId="app-home-newsletter-title" placement="homepage" />
      </div>

      {bottomAd ? (
        <div className="app-ad">
          <p className="app-kicker">Advertisement</p>
          <AdBlock ad={bottomAd} showSponsor />
        </div>
      ) : null}
    </div>
  );
}

function AppHeading({
  action,
  href,
  id,
  title,
}: {
  action: string;
  href: string;
  id: string;
  title: string;
}) {
  return (
    <div className="app-section-heading">
      <h2 id={id}>{title}</h2>
      <Link href={href}>{action}</Link>
    </div>
  );
}

function Carousel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div aria-label={label} className="app-carousel" role="region" tabIndex={0}>
      {children}
    </div>
  );
}

function StoryCard({ story }: { story: EditableStory }) {
  const photo = hasStoryPhoto(story);
  const logo = photo && isLogoLikeStoryImage(story);
  return (
    <article className={`app-card ${photo ? "" : "is-text"}`}>
      <Link href={`/stories/${story.slug}`}>
        {photo ? (
          <ResponsiveStoryImage
            alt={story.imageAlt || story.title}
            className={`app-card-media ${logo ? "is-logo" : ""}`}
            sizes="290px"
            src={story.imageUrl}
          />
        ) : null}
        <span className="app-card-body">
          <small>{displayCategoryLabel(story.category)} · {cardDate(story.date)}</small>
          <h3>{story.title}</h3>
          {photo ? null : <span className="app-card-go">Read</span>}
        </span>
      </Link>
    </article>
  );
}

function BoatsCard({
  listing,
}: {
  listing: Awaited<ReturnType<typeof listPublicBoatListings>>[number] | null;
}) {
  const photo = listing?.photos[0];
  return (
    <section aria-labelledby="app-boats-title" className="app-boats">
      {photo ? (
        <Link className="app-boats-photo" href={`/boats-for-sale/${listing.slug}`}>
          <img
            alt={photo.alt || listing.title}
            decoding="async"
            height={photo.height || undefined}
            loading="lazy"
            sizes="(max-width: 1023px) calc(100vw - 32px), 1px"
            src={photo.src}
            width={photo.width || undefined}
          />
        </Link>
      ) : null}
      <div className="app-boats-copy">
        <p className="app-kicker">Classifieds</p>
        <h2 id="app-boats-title">Boats for Sale</h2>
        <p>{boatsHomepageIntro}</p>
        <div className="app-boats-actions">
          <Link className="app-btn app-btn-primary" href="/boats-for-sale">Browse boats</Link>
          <Link className="app-btn app-btn-ghost" href="/boats-for-sale/list-your-boat">List your boat free</Link>
        </div>
        {listing ? (
          <Link className="app-boats-listing" href={`/boats-for-sale/${listing.slug}`}>
            <span>
              <strong>{listing.title} <TradeBadge sellerType={listing.sellerType} /></strong>
              <span>{listing.publicNumber} · {listing.cruisingGroundLabel}</span>
            </span>
            <em>{listing.priceLabel}</em>
          </Link>
        ) : (
          <p className="app-boats-listing">Be the first to list your boat free.</p>
        )}
      </div>
    </section>
  );
}

async function loadBoatPreview() {
  try {
    return (await listPublicBoatListings()).slice(0, 1);
  } catch (error) {
    console.error("[OldSeaDogs classifieds] mobile homepage card skipped", error);
    return [];
  }
}

async function loadLensTiles(galleryLive: boolean) {
  try {
    const photos = galleryLive ? (await getApprovedPublicGalleryPhotos()).slice(0, 8) : [];
    if (photos.length > 0) {
      return { href: "/through-the-lens", photos, videos: [] as PublicTikTokVideo[] };
    }
    const videos = await loadTikTokCovers();
    return {
      href: galleryLive ? "/through-the-lens" : "/social",
      photos,
      videos,
    };
  } catch (error) {
    console.error("[OldSeaDogs] mobile Through the Lens row skipped", error);
    return { href: galleryLive ? "/through-the-lens" : "/social", photos: [], videos: [] as PublicTikTokVideo[] };
  }
}

async function loadTikTokCovers() {
  try {
    const catalog = await Promise.race([
      loadPublicTikTokCatalog(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 1200);
      }),
    ]);
    if (!catalog?.available) return [];
    return catalog.videos.slice(0, 8);
  } catch {
    return [];
  }
}

function uniqueStories(stories: EditableStory[]) {
  const seen = new Set<string>();
  return stories.filter((story) => {
    if (seen.has(story.slug)) return false;
    seen.add(story.slug);
    return true;
  });
}

function cardDate(date: string) {
  return formatDate(date).replace(/ \d{4}$/, "");
}

function creditLine(credit: string) {
  const trimmed = credit.trim();
  return /^photo\b/i.test(trimmed) ? trimmed : `Photo: ${trimmed}`;
}

function quickIcon(name: (typeof quickLinks)[number]["icon"]) {
  if (name === "guides") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v14M7 7h10M5 14a7 7 0 0 0 14 0M3 14h4M17 14h4" />
      </svg>
    );
  }
  if (name === "boats") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v13M12 5l6 9h-6M10 7l-5 7h5M4 18c2 2 4 2 8 0s6-2 8 0" />
      </svg>
    );
  }
  if (name === "lens") {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="13" rx="3" />
        <circle cx="12" cy="12.5" r="3.5" />
        <path d="M8 6l1.5-2h5L16 6" />
      </svg>
    );
  }
  if (name === "stories") {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.25" />
      <path d="M16 16.5 20 20.5" />
    </svg>
  );
}
