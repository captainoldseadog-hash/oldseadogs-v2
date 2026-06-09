import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "../../../content/stories";
import { getPublishedStories, getStoryBySlug, hasStoryPhoto } from "../../../lib/site-content";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    return {
      title: "Story not found | Old Sea Dogs",
    };
  }

  return {
    title: `${story.title} | Old Sea Dogs`,
    description: story.summary,
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const related = (await getPublishedStories())
    .filter((item) => item.slug !== story.slug && item.category === story.category)
    .slice(0, 2);
  const storyHasPhoto = hasStoryPhoto(story);

  return (
    <main className="article-shell">
      <nav className="article-nav" aria-label="Story navigation">
        <Link href="/" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>Old Sea Dogs</span>
        </Link>
        <Link href="/#latest">Latest dispatches</Link>
      </nav>

      <article className="article-layout">
        <header className="article-header">
          <p className="eyebrow">{story.category}</p>
          <h1>{story.title}</h1>
          <p className="article-summary">{story.summary}</p>
          <div className="article-meta">
            <span>{formatDate(story.date)}</span>
            <span>{story.author}</span>
            <span>{story.readMinutes} min read</span>
          </div>
        </header>

        {storyHasPhoto ? (
          <figure className="article-figure">
            <div className="article-image" role="img" aria-label={story.imageAlt} style={{ backgroundImage: `url(${story.imageUrl})` }} />
            <figcaption>
              {story.imageCaption ? <span>{story.imageCaption}</span> : null}
              {story.imageCredit ? <span className="photo-credit">{story.imageCredit}</span> : null}
              <span>{story.sourceType} · {story.sourceName}</span>
            </figcaption>
          </figure>
        ) : null}

        <div className="article-body">
          {story.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <footer className="article-tags">
          {story.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </footer>
      </article>

      {related.length > 0 ? (
        <section className="related-band" aria-labelledby="related-title">
          <div className="section-heading">
            <p className="eyebrow">More in {story.category}</p>
            <h2 id="related-title">Keep reading</h2>
          </div>
          <div className="related-grid">
            {related.map((item) => (
              <article key={item.slug} className={`compact-card ${hasStoryPhoto(item) ? "" : "text-only-story"}`}>
                {hasStoryPhoto(item) ? (
                  <span className="compact-image" role="img" aria-label={item.imageAlt} style={{ backgroundImage: `url(${item.imageUrl})` }}>
                    {item.imageCredit ? (
                      <small className="image-credit-chip">{item.imageCredit}</small>
                    ) : null}
                  </span>
                ) : null}
                <div>
                  <span>{formatDate(item.date)}</span>
                  <h3>
                    <Link href={`/stories/${item.slug}`}>{item.title}</Link>
                  </h3>
                  {!hasStoryPhoto(item) ? (
                    <Link href={`/stories/${item.slug}`} className="story-summary-link compact-summary-link">
                      {item.summary}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
