import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../components/SiteFooter";
import { getPortMapMarkers, type PortMapMarker } from "../../content/port-map";
import {
  getOldSeaDogsSection,
  oldSeaDogsSections,
  pickRandomSectionPhoto,
  storyMatchesSection,
  type SectionHeroPhoto,
} from "../../content/sections";
import { formatDate } from "../../content/stories";
import { getPublishedStories, hasStoryPhoto } from "../../lib/site-content";
import { createPageMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

type SectionPageProps = {
  params: Promise<{
    section: string;
  }>;
  searchParams?: Promise<{
    page?: string;
  }>;
};

function makeSectionHref(slug: string, page = 1) {
  return page > 1 ? `/${slug}?page=${page}` : `/${slug}`;
}

function getSectionHeroPhotos(
  stories: Array<{
    title: string;
    imageUrl: string;
    imageAlt: string;
    imageCredit: string;
    imageCaption: string;
  }>
): SectionHeroPhoto[] {
  const seen = new Set<string>();
  return stories
    .filter((story) => hasStoryPhoto(story))
    .filter((story) => {
      if (seen.has(story.imageUrl)) return false;
      seen.add(story.imageUrl);
      return true;
    })
    .slice(0, 24)
    .map((story) => ({
      imageUrl: story.imageUrl,
      imageAlt: story.imageAlt || story.title,
      imageCredit: story.imageCredit,
      imageCaption: story.imageCaption || story.title,
    }));
}

function PortsWorldMap({ markers }: { markers: PortMapMarker[] }) {
  return (
    <section className="ports-map-panel" aria-labelledby="ports-map-title">
      <div className="ports-map-heading">
        <div>
          <p className="eyebrow">Harbour map</p>
          <h3 id="ports-map-title">Ports we have covered</h3>
        </div>
        <span>{markers.length.toLocaleString("en-GB")} mapped ports</span>
      </div>
      <div className="ports-map-canvas" aria-label="World map of Old Sea Dogs ports">
        <svg className="ports-world-map" viewBox="0 0 1000 500" aria-hidden="true">
          <rect x="0" y="0" width="1000" height="500" rx="18" />
          <path d="M104 135 L156 96 L235 108 L289 151 L271 214 L306 268 L276 331 L229 329 L206 274 L154 248 L120 201 Z" />
          <path d="M268 268 L318 286 L347 351 L335 430 L292 454 L252 397 L242 330 Z" />
          <path d="M431 118 L498 82 L590 99 L633 147 L613 197 L536 212 L477 183 Z" />
          <path d="M487 208 L559 226 L603 288 L579 365 L535 421 L486 390 L459 303 Z" />
          <path d="M605 160 L699 122 L804 146 L842 209 L798 268 L694 248 L629 210 Z" />
          <path d="M756 302 L826 329 L858 396 L820 436 L747 397 L714 342 Z" />
          <path d="M842 278 L888 255 L929 280 L911 313 L861 313 Z" />
          <path d="M312 112 L345 103 L365 125 L337 148 Z" />
        </svg>
        {markers.map((marker) => (
          <Link
            aria-label={`${marker.title} port information`}
            className="port-map-marker"
            href={`/stories/${marker.slug}`}
            key={marker.slug}
            style={{
              left: `${marker.left}%`,
              top: `${marker.top}%`,
              transform: `translate(-50%, -50%) translate(${marker.offsetX ?? 0}px, ${marker.offsetY ?? 0}px)`,
            }}
            title={marker.title}
          >
            <span className="port-map-dot" aria-hidden="true" />
            <span className="port-map-label">{marker.title}</span>
          </Link>
        ))}
      </div>
      <div className="ports-map-list" aria-label="Mapped ports">
        {markers.map((marker) => (
          <Link href={`/stories/${marker.slug}`} key={marker.slug}>
            {marker.title}
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params;
  const section = getOldSeaDogsSection(sectionSlug);

  if (!section) {
    return {
      title: "Section not found | Old Sea Dogs",
    };
  }

  return {
    ...createPageMetadata({
      title: section.label,
      description: section.description,
      path: `/${section.slug}`,
    }),
    description: section.description,
  };
}

export default async function SectionPage({ params, searchParams }: SectionPageProps) {
  const [{ section: sectionSlug }, query] = await Promise.all([params, searchParams]);
  const section = getOldSeaDogsSection(sectionSlug);

  if (!section) {
    notFound();
  }

  const stories = (await getPublishedStories()).filter((story) =>
    storyMatchesSection(story, section)
  );
  const pageSize = 80;
  const pageCount = Math.max(1, Math.ceil(stories.length / pageSize));
  const requestedPage = Number.parseInt(query?.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const pageStories = stories.slice(start, start + pageSize);
  const pageStart = stories.length === 0 ? 0 : start + 1;
  const pageEnd = Math.min(start + pageSize, stories.length);
  const heroPhoto = pickRandomSectionPhoto(getSectionHeroPhotos(stories));
  const isPortsSection = section.slug === "ports";
  const portMapMarkers = isPortsSection ? getPortMapMarkers(stories) : [];
  const sectionStoryHeading = isPortsSection
    ? "Ports around the world"
    : "Stories in this section";

  return (
    <main className="article-shell section-shell">
      <nav className="article-nav" aria-label="Section navigation">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <div className="nav-links section-nav-links">
          {oldSeaDogsSections.map((item) => (
            <Link
              className={item.slug === section.slug ? "active" : ""}
              href={`/${item.slug}`}
              key={item.slug}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/search">Search</Link>
        </div>
      </nav>

      <header className={`section-page-hero ${heroPhoto ? "" : "section-page-hero-text"}`}>
        <div className="section-page-copy">
          <p className="eyebrow">{section.label}</p>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
          <span>{stories.length.toLocaleString("en-GB")} stories</span>
        </div>
        {heroPhoto ? (
          <figure className="section-hero-figure">
            <span
              className="section-hero-image"
              role="img"
              aria-label={heroPhoto.imageAlt}
              style={{ backgroundImage: `url(${heroPhoto.imageUrl})` }}
            />
            <figcaption>
              <span>{heroPhoto.imageCaption}</span>
              {heroPhoto.imageCredit ? <small>{heroPhoto.imageCredit}</small> : null}
            </figcaption>
          </figure>
        ) : null}
      </header>

      <section className="section-grid-page" aria-label={`${section.label} stories`}>
        <div className="section-heading archive-list-heading">
          <div>
            <p className="eyebrow">{section.label}</p>
            <h2>{sectionStoryHeading}</h2>
          </div>
          <p>
            Showing {pageStart.toLocaleString("en-GB")}-
            {pageEnd.toLocaleString("en-GB")} of{" "}
            {stories.length.toLocaleString("en-GB")}
          </p>
        </div>

        {portMapMarkers.length > 0 ? <PortsWorldMap markers={portMapMarkers} /> : null}

        {pageStories.length > 0 ? (
          <div className="story-grid section-story-grid">
            {pageStories.map((story) => {
              const storyHasPhoto = hasStoryPhoto(story);
              return (
                <article
                  className={`story-card ${storyHasPhoto ? "" : "text-only-story"}`}
                  key={story.id}
                >
                  {storyHasPhoto ? (
                    <Link href={`/stories/${story.slug}`} className="image-link">
                      <span
                        className="story-image"
                        role="img"
                        aria-label={story.imageAlt}
                        style={{ backgroundImage: `url(${story.imageUrl})` }}
                      >
                        {story.imageCredit ? (
                          <small className="image-credit-chip">{story.imageCredit}</small>
                        ) : null}
                      </span>
                    </Link>
                  ) : null}
                  <div className="story-card-body">
                    <div className="story-meta">
                      <span>{formatDate(story.date)}</span>
                      <span>{story.category}</span>
                    </div>
                    <h3>
                      <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                    </h3>
                    <Link href={`/stories/${story.slug}`} className="story-summary-link">
                      {story.summary}
                    </Link>
                    <div className="source-row">
                      <span>{story.readMinutes} min read</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-section">
            <h2>No stories in this section yet</h2>
            <p>When stories are added to {section.label}, they will appear here.</p>
          </div>
        )}

        <nav className="archive-pager" aria-label={`${section.label} pages`}>
          <Link
            className={currentPage === 1 ? "disabled" : ""}
            href={makeSectionHref(section.slug, currentPage === 1 ? 1 : currentPage - 1)}
          >
            Previous
          </Link>
          <span>
            Page {currentPage.toLocaleString("en-GB")} of{" "}
            {pageCount.toLocaleString("en-GB")}
          </span>
          <Link
            className={currentPage === pageCount ? "disabled" : ""}
            href={makeSectionHref(
              section.slug,
              currentPage === pageCount ? pageCount : currentPage + 1
            )}
          >
            Next
          </Link>
        </nav>
      </section>

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
