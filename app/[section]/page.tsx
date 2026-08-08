import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortsInteractiveMap } from "../../components/PortsInteractiveMap";
import { SiteFooter } from "../../components/SiteFooter";
import { getClubProfileExcerpt } from "../../content/club-profiles";
import { getPortMapMarkers } from "../../content/port-map";
import {
  getOldSeaDogsSection,
  displayCategoryLabel,
  getSectionHeroArtwork,
  oldSeaDogsSections,
  storyMatchesSection,
} from "../../content/sections";
import { formatDate } from "../../content/stories";
import { isLogoLikeStoryImage } from "../../content/story-images";
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
  const heroPhoto = getSectionHeroArtwork(section.slug);
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

      <header
        className={`section-page-hero ${
          heroPhoto
            ? `section-page-hero-art section-hero-supplied-v1 section-hero-overlay-${heroPhoto.overlayStrength}`
            : "section-page-hero-text"
        }`}
        data-section-hero-style={heroPhoto ? "section-hero-supplied-v1" : undefined}
      >
        {heroPhoto ? (
          <figure className="section-hero-artwork">
            <img
              src={heroPhoto.imageUrl}
              alt={heroPhoto.imageAlt}
              loading="eager"
              decoding="async"
              style={{ objectPosition: heroPhoto.focalPoint }}
            />
          </figure>
        ) : null}
        <div className="section-page-copy">
          <p className="eyebrow">{section.label}</p>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
          <span>{stories.length.toLocaleString("en-GB")} stories</span>
        </div>
        {heroPhoto ? (
          <div className="section-hero-credit">
            <span>{heroPhoto.imageCaption}</span>
            {heroPhoto.imageCredit ? <small>{heroPhoto.imageCredit}</small> : null}
          </div>
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

        {portMapMarkers.length > 0 ? <PortsInteractiveMap markers={portMapMarkers} /> : null}

        {pageStories.length > 0 ? (
          <div className="story-grid section-story-grid">
            {pageStories.map((story) => {
              const storyHasPhoto = hasStoryPhoto(story);
              const storyImageLooksLikeLogo = isLogoLikeStoryImage(story);
              return (
                <article
                  className={`story-card ${storyHasPhoto ? "" : "text-only-story"}`}
                  key={story.id}
                >
                  {storyHasPhoto ? (
                    <Link href={`/stories/${story.slug}`} className="image-link">
                      <span
                        className={`story-image ${storyImageLooksLikeLogo ? "club-logo-image" : ""}`}
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
                      <span>{displayCategoryLabel(story.category)}</span>
                    </div>
                    <h3>
                      <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                    </h3>
                    <Link href={`/stories/${story.slug}`} className="story-summary-link">
                      {getClubProfileExcerpt(story)}
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
