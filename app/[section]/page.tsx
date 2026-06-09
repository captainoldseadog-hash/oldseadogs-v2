import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getOldSeaDogsSection,
  oldSeaDogsSections,
  storyMatchesSection,
} from "../../content/sections";
import { formatDate } from "../../content/stories";
import { getPublishedStories, hasStoryPhoto } from "../../lib/site-content";

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
    title: `${section.label} | Old Sea Dogs`,
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
        </div>
      </nav>

      <header className="section-page-hero">
        <p className="eyebrow">{section.label}</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
        <span>{stories.length.toLocaleString("en-GB")} stories</span>
      </header>

      <section className="section-grid-page" aria-label={`${section.label} stories`}>
        <div className="section-heading archive-list-heading">
          <div>
            <p className="eyebrow">{section.label}</p>
            <h2>Stories in this section</h2>
          </div>
          <p>
            Showing {pageStart.toLocaleString("en-GB")}-
            {pageEnd.toLocaleString("en-GB")} of{" "}
            {stories.length.toLocaleString("en-GB")}
          </p>
        </div>

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
                      <span>{story.sourceType}</span>
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
    </main>
  );
}
