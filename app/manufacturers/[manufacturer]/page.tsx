import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getManufacturerBySlug,
  storyMatchesManufacturer,
} from "../../../content/manufacturers";
import { oldSeaDogsSections } from "../../../content/sections";
import { formatDate } from "../../../content/stories";
import { SiteFooter } from "../../../components/SiteFooter";
import { getPublishedStories, hasStoryPhoto } from "../../../lib/site-content";
import { createPageMetadata } from "../../../lib/seo";

export const dynamic = "force-dynamic";

type ManufacturerPageProps = {
  params: Promise<{
    manufacturer: string;
  }>;
};

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { manufacturer: manufacturerSlug } = await params;
  const manufacturer = getManufacturerBySlug(manufacturerSlug);

  if (!manufacturer) {
    return {
      title: "Manufacturer not found | Old Sea Dogs",
    };
  }

  return createPageMetadata({
    title: `${manufacturer.name} Stories`,
    description: `Old Sea Dogs stories, reviews, launches, and news involving ${manufacturer.name}.`,
    path: `/manufacturers/${manufacturer.slug}`,
  });
}

export default async function ManufacturerPage({ params }: ManufacturerPageProps) {
  const { manufacturer: manufacturerSlug } = await params;
  const manufacturer = getManufacturerBySlug(manufacturerSlug);

  if (!manufacturer) {
    notFound();
  }

  const stories = (await getPublishedStories()).filter((story) =>
    storyMatchesManufacturer(story, manufacturer)
  );

  return (
    <main className="article-shell section-shell">
      <nav className="article-nav" aria-label="Manufacturer navigation">
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
          <Link href="/search">Search</Link>
        </div>
      </nav>

      <header className="section-page-hero section-page-hero-text">
        <div className="section-page-copy">
          <p className="eyebrow">Manufacturer</p>
          <h1>{manufacturer.name}</h1>
          <p>
            Reviews, launches, market notes, and Old Sea Dogs stories involving
            {` ${manufacturer.name}`}.
          </p>
          <span>{stories.length.toLocaleString("en-GB")} stories</span>
        </div>
      </header>

      <section className="section-grid-page" aria-label={`${manufacturer.name} stories`}>
        <div className="section-heading archive-list-heading">
          <div>
            <p className="eyebrow">{manufacturer.name}</p>
            <h2>Manufacturer stories</h2>
          </div>
          <p>{stories.length.toLocaleString("en-GB")} results</p>
        </div>

        {stories.length > 0 ? (
          <div className="story-grid section-story-grid">
            {stories.map((story) => {
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
            <h2>No manufacturer stories yet</h2>
            <p>Stories involving {manufacturer.name} will appear here.</p>
          </div>
        )}
      </section>

      <SiteFooter
        extraLinks={[
          { href: "/reviews", label: "Reviews" },
          { href: "/search", label: "Search" },
        ]}
      />
    </main>
  );
}
