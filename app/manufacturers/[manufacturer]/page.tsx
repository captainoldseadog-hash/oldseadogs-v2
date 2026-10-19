import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getManufacturerBySlug,
  storyMatchesManufacturer,
} from "../../../content/manufacturers";
import { displayCategoryLabel } from "../../../content/sections";
import { formatDate } from "../../../content/stories";
import { ResponsiveStoryImage } from "../../../components/ResponsiveStoryImage";
import { SiteFooter } from "../../../components/SiteFooter";
import { dedupeCredit } from "../../../lib/image-fit";
import { presentationForStories } from "../../../lib/image-presentation";
import { getPublishedStories, hasStoryPhoto } from "../../../lib/site-content";
import { createPageMetadata } from "../../../lib/seo";
import { SiteHeader } from "../../../components/SiteHeader";

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
    description: `Stories, reviews, launches and news from Old Sea Dogs involving ${manufacturer.name}, from new boats to the events around the yard.`,
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
  const storyFrames = await presentationForStories(stories, "story-card");

  return (
    <main className="article-shell section-shell">
      <SiteHeader label="Manufacturer navigation" />

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
            {stories.map((story, index) => {
              const storyHasPhoto = hasStoryPhoto(story);
              const frame = storyFrames[index];
              return (
                <article
                  className={`story-card ${storyHasPhoto ? "" : "text-only-story"}`}
                  key={story.id}
                >
                  {storyHasPhoto ? (
                    <Link href={`/stories/${story.slug}`} className="image-link">
                      <ResponsiveStoryImage
                        alt={story.imageAlt || story.title}
                        className="story-image"
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
