import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../../components/SiteFooter";
import { formatDate } from "../../content/stories";
import { getLegacyArchiveStats, getPublishedStories } from "../../lib/site-content";
import { createPageMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Restored Archive | Old Sea Dogs",
  description: "Browse the restored Old Sea Dogs story archive.",
  path: "/archive",
});

type ArchivePageProps = {
  searchParams?: Promise<{
    category?: string;
    page?: string;
  }>;
};

function makeArchiveHref(category: string, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const params = await searchParams;
  const [stories, archiveStats] = await Promise.all([
    getPublishedStories(),
    Promise.resolve(getLegacyArchiveStats()),
  ]);
  const archiveStories = stories.filter((story) => story.id.startsWith("legacy_"));
  const visibleStories = archiveStories.length > 0 ? archiveStories : stories;
  const categories = Array.from(
    visibleStories.reduce((map, story) => {
      map.set(story.category, (map.get(story.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);
  const categoryNames = new Set(categories.map(([category]) => category));
  const selectedCategory =
    params?.category && categoryNames.has(params.category) ? params.category : "";
  const filteredStories = selectedCategory
    ? visibleStories.filter((story) => story.category === selectedCategory)
    : visibleStories;
  const pageSize = 80;
  const pageCount = Math.max(1, Math.ceil(filteredStories.length / pageSize));
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const start = (currentPage - 1) * pageSize;
  const pageStories = filteredStories.slice(start, start + pageSize);
  const pageStart = filteredStories.length === 0 ? 0 : start + 1;
  const pageEnd = Math.min(start + pageSize, filteredStories.length);

  return (
    <main className="article-shell archive-shell">
      <nav className="article-nav" aria-label="Archive navigation">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <Link href="/">Back to home</Link>
      </nav>

      <header className="archive-hero">
        <p className="eyebrow">Restored Archive</p>
        <h1>OldSeaDogs.com stories are back onboard</h1>
        <p>
          The old site archive has been copied into this new version, including
          approved photos and visible image credits where they were available.
        </p>
        <div className="archive-stats" aria-label="Archive totals">
          <span>
            <strong>{archiveStats.storyCount.toLocaleString("en-GB")}</strong>
            stories copied
          </span>
          <span>
            <strong>{archiveStats.photoCount.toLocaleString("en-GB")}</strong>
            approved photos
          </span>
          <span>
            <strong>{categories.length.toLocaleString("en-GB")}</strong>
            sections
          </span>
        </div>
      </header>

      <section className="archive-category-strip" aria-label="Archive sections">
        <Link className={!selectedCategory ? "active" : ""} href="/archive">
          <span>All stories</span>
          <strong>{visibleStories.length.toLocaleString("en-GB")}</strong>
        </Link>
        {categories.map(([category, count]) => (
          <Link
            className={selectedCategory === category ? "active" : ""}
            href={makeArchiveHref(category)}
            key={category}
          >
            <span>{category}</span>
            <strong>{count.toLocaleString("en-GB")}</strong>
          </Link>
        ))}
      </section>

      <section className="archive-list" aria-label="Restored stories">
        <div className="archive-group">
          <div className="section-heading archive-list-heading">
            <div>
              <p className="eyebrow">{selectedCategory || "All Restored Stories"}</p>
              <h2>{filteredStories.length.toLocaleString("en-GB")} stories</h2>
            </div>
            <p>
              Showing {pageStart.toLocaleString("en-GB")}-
              {pageEnd.toLocaleString("en-GB")} of{" "}
              {filteredStories.length.toLocaleString("en-GB")}
            </p>
          </div>
          <div className="archive-rows">
            {pageStories.map((story) => (
              <article className="archive-row" key={story.id}>
                <div className="story-meta">
                  <span>{formatDate(story.date)}</span>
                  <span>{story.category}</span>
                  {story.imageCredit ? <span>{story.imageCredit}</span> : null}
                </div>
                <h3>
                  <Link href={`/stories/${story.slug}`}>{story.title}</Link>
                </h3>
                <Link href={`/stories/${story.slug}`} className="story-summary-link archive-summary-link">
                  {story.summary}
                </Link>
              </article>
            ))}
          </div>
          <nav className="archive-pager" aria-label="Archive pages">
            <Link
              className={currentPage === 1 ? "disabled" : ""}
              href={makeArchiveHref(selectedCategory, currentPage === 1 ? 1 : currentPage - 1)}
            >
              Previous
            </Link>
            <span>
              Page {currentPage.toLocaleString("en-GB")} of{" "}
              {pageCount.toLocaleString("en-GB")}
            </span>
            <Link
              className={currentPage === pageCount ? "disabled" : ""}
              href={makeArchiveHref(
                selectedCategory,
                currentPage === pageCount ? pageCount : currentPage + 1
              )}
            >
              Next
            </Link>
          </nav>
        </div>
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: "/news", label: "News" },
        ]}
      />
    </main>
  );
}
