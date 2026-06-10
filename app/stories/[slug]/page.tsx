import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../components/SiteFooter";
import { SocialShare } from "../../../components/SocialShare";
import { formatDate } from "../../../content/stories";
import {
  getVenueDetails,
  googleMapEmbedUrl,
  googleMapLinkUrl,
  type VenueDetails,
} from "../../../content/venue-details";
import { JsonLd } from "../../../components/JsonLd";
import { getInternalLinkGroups, type InternalLinkGroup } from "../../../lib/internal-links";
import { getPublishedStories, getStoryBySlug, hasStoryPhoto } from "../../../lib/site-content";
import { absoluteUrl, createPageMetadata } from "../../../lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "../../../lib/structured-data";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function sectionPathForCategory(category: string) {
  if (category === "Boat Reviews" || category === "Reviews") return "/reviews";
  if (category === "Racing" || category === "Races" || category === "Regatta") {
    return "/races";
  }
  if (category === "Maintenance") return "/masterclass";
  if (category === "Cruising") return "/destinations";
  return `/${category.toLowerCase()}`;
}

function VenuePracticalPanel({ details }: { details: VenueDetails }) {
  const hasContact =
    details.website || details.email || details.telephone || details.vhf;

  return (
    <section className="venue-panel" aria-label={`${details.name} practical information`}>
      <div className="venue-panel-heading">
        <p className="eyebrow">Practical Information</p>
        <h2>{details.kind} details</h2>
      </div>

      <div className="venue-detail-grid">
        {hasContact ? (
          <aside className="venue-contact-card">
            <h3>Contact Details</h3>
            <dl>
              {details.website ? (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a href={details.website.url} rel="noreferrer" target="_blank">
                      {details.website.label}
                    </a>
                    {details.website.host ? <span>{details.website.host}</span> : null}
                  </dd>
                </div>
              ) : null}
              {details.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${details.email}`}>{details.email}</a>
                  </dd>
                </div>
              ) : null}
              {details.telephone ? (
                <div>
                  <dt>Telephone</dt>
                  <dd>
                    <a href={`tel:${details.telephone.replace(/[^+0-9]/g, "")}`}>
                      {details.telephone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {details.vhf ? (
                <div>
                  <dt>VHF Radio Channel</dt>
                  <dd>{details.vhf}</dd>
                </div>
              ) : null}
            </dl>
          </aside>
        ) : (
          <aside className="venue-contact-card">
            <h3>Contact Details</h3>
            <p>
              Contact details are being restored for this entry. Use the map
              tools below to check the venue location.
            </p>
          </aside>
        )}

        <div className="venue-map-card">
          <div>
            <h3>Google Map</h3>
            <a href={googleMapLinkUrl(details.mapQuery)} rel="noreferrer" target="_blank">
              Open in Google Maps
            </a>
          </div>
          <iframe
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={googleMapEmbedUrl(details.mapQuery)}
            title={`Google map for ${details.name}`}
          />
        </div>

        <div className="venue-map-card">
          <div>
            <h3>Aerial View</h3>
            <a href={googleMapLinkUrl(details.mapQuery, true)} rel="noreferrer" target="_blank">
              Open larger view
            </a>
          </div>
          <iframe
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={googleMapEmbedUrl(details.mapQuery, true)}
            title={`Google satellite view for ${details.name}`}
          />
        </div>
      </div>
    </section>
  );
}

function InternalLinksPanel({ groups }: { groups: InternalLinkGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section className="internal-links-band" aria-labelledby="internal-links-title">
      <div className="section-heading">
        <p className="eyebrow">Connected reading</p>
        <h2 id="internal-links-title">Useful Old Sea Dogs links</h2>
      </div>
      <div className="internal-link-groups">
        {groups.map((group) => (
          <article className="internal-link-group" key={group.title}>
            <div>
              <h3>{group.title}</h3>
              {group.href ? <Link href={group.href}>View all</Link> : null}
            </div>
            <div className="internal-link-list">
              {group.items.map((item) => (
                <Link href={`/stories/${item.slug}`} key={item.slug}>
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                  <small>{item.reason}</small>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

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

  return createPageMetadata({
    title: story.title,
    description: story.summary,
    path: `/stories/${story.slug}`,
    image: hasStoryPhoto(story)
      ? {
          url: story.imageUrl,
          alt: story.imageAlt || story.title,
        }
      : undefined,
    type: "article",
  });
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const allStories = await getPublishedStories();
  const internalLinkGroups = getInternalLinkGroups(story, allStories);
  const storyHasPhoto = hasStoryPhoto(story);
  const venueDetails = getVenueDetails(story);
  const storyUrl = absoluteUrl(`/stories/${story.slug}`);

  return (
    <main className="article-shell">
      <JsonLd
        data={[
          articleJsonLd(story, storyHasPhoto),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: story.category, path: sectionPathForCategory(story.category) },
            { name: story.title, path: `/stories/${story.slug}` },
          ]),
        ]}
      />
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
          <SocialShare title={story.title} summary={story.summary} url={storyUrl} />
        </header>

        {storyHasPhoto ? (
          <figure className="article-figure">
            <div className="article-image" role="img" aria-label={story.imageAlt} style={{ backgroundImage: `url(${story.imageUrl})` }} />
            <figcaption>
              {story.imageCaption ? <span>{story.imageCaption}</span> : null}
              {story.imageCredit ? <span className="photo-credit">{story.imageCredit}</span> : null}
            </figcaption>
          </figure>
        ) : null}

        {venueDetails ? <VenuePracticalPanel details={venueDetails} /> : null}

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

      <InternalLinksPanel groups={internalLinkGroups} />

      <SiteFooter
        extraLinks={[
          { href: "/", label: "Home" },
          { href: sectionPathForCategory(story.category), label: "More Stories" },
          { href: "/search", label: "Search" },
        ]}
      />
    </main>
  );
}
