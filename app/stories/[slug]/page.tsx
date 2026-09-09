import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticlePreviewContent } from "../../../components/ArticlePreviewContent";
import { SiteFooter } from "../../../components/SiteFooter";
import { SocialShare } from "../../../components/SocialShare";
import { ResponsiveStoryImage } from "../../../components/ResponsiveStoryImage";
import { displayCategoryLabel, sectionPathForCategory } from "../../../content/sections";
import {
  getClubProfileArticleBody,
  getClubProfileForStory,
  type ClubProfile,
} from "../../../content/club-profiles";
import {
  getVenueDetails,
  googleMapEmbedUrl,
  googleMapLinkUrl,
  type VenueDetails,
} from "../../../content/venue-details";
import { isLogoLikeStoryImage } from "../../../content/story-images";
import { JsonLd } from "../../../components/JsonLd";
import {
  findRelatedStories,
  getInternalLinkGroups,
  type InternalLinkGroup,
} from "../../../lib/internal-links";
import {
  getActiveAds,
  getMediaAsset,
  getPublishedStories,
  getStoryBySlug,
  getSiteSettings,
  hasStoryPhoto,
  isStorySearchIndexable,
} from "../../../lib/site-content";
import { publicMediaVariantUrl } from "../../../lib/public-media";
import {
  adsenseClientId,
  adsenseEnabled,
  adsenseSlots,
  absoluteUrl,
  createPageMetadata,
  isProduction,
  robotsMetadata,
} from "../../../lib/seo";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  michaelHodgesPersonJsonLd,
} from "../../../lib/structured-data";

export const dynamic = "force-dynamic";

type StoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function mediaIdFromPublicUrl(value: string) {
  return value.match(/^\/api\/media\/([^/?#]+)/)?.[1] || "";
}

async function storyImageDetails(imageUrl: string) {
  if (!imageUrl) return null;
  const mediaId = mediaIdFromPublicUrl(imageUrl);
  const media = mediaId ? await getMediaAsset(mediaId) : null;
  return {
    url: publicMediaVariantUrl(imageUrl, "original"),
    width: media && media.width > 0 ? media.width : undefined,
    height: media && media.height > 0 ? media.height : undefined,
  };
}

function VenuePracticalPanel({ details }: { details: VenueDetails }) {
  const hasContact =
    details.website ||
    details.address ||
    details.email ||
    details.telephone ||
    details.vhf ||
    details.country ||
    details.coordinates;

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
              {details.country ? (
                <div>
                  <dt>Country</dt>
                  <dd>{details.country}</dd>
                </div>
              ) : null}
              {details.coordinates ? (
                <div>
                  <dt>Latitude / Longitude</dt>
                  <dd>{details.coordinates}</dd>
                </div>
              ) : null}
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
              {details.address ? (
                <div>
                  <dt>Address</dt>
                  <dd>{details.address}</dd>
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

        {details.practicalSections.length > 0 ? (
          <div className="venue-practical-sections" aria-label={`${details.name} restored practical details`}>
            {details.practicalSections.map((section) => (
              <article className="venue-practical-card" key={section.label}>
                <h3>{section.label}</h3>
                <p>{section.value}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ClubProfilePanel({ profile }: { profile: ClubProfile }) {
  const facts = [
    { label: "Location", value: `${profile.location}, ${profile.country}` },
    { label: "Founded", value: profile.founded },
    { label: "Known for", value: profile.knownFor },
    { label: "Sailing", value: profile.sailing },
    { label: "Facilities", value: profile.facilities },
    { label: "Visitors", value: profile.visitors },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <section className="club-profile-panel" aria-label={`${profile.title} club profile`}>
      <div className="venue-panel-heading">
        <p className="eyebrow">Club Profile</p>
        <h2>{profile.title}</h2>
      </div>
      <div className="club-facts-grid">
        {facts.map((fact) => (
          <article className="club-fact-card" key={fact.label}>
            <span>{fact.label}</span>
            <p>{fact.value}</p>
          </article>
        ))}
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
                  <span>{displayCategoryLabel(item.category)}</span>
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

function RelatedArticlesPanel({
  stories,
}: {
  stories: Awaited<ReturnType<typeof getPublishedStories>>;
}) {
  if (stories.length === 0) return null;

  return (
    <section className="related-band" aria-labelledby="related-articles-title">
      <div className="feature-copy">
        <p className="eyebrow">Related reading</p>
        <h2 id="related-articles-title">More from the same waters</h2>
        <p>
          A few more Old Sea Dogs pieces from nearby sections, similar subjects,
          or recent dockside conversations.
        </p>
      </div>
      <div className="related-grid">
        {stories.map((item) => (
          <article className="compact-card" key={item.slug}>
            <Link className="compact-card-link" href={`/stories/${item.slug}`}>
              {hasStoryPhoto(item) ? (
                <ResponsiveStoryImage
                  alt={item.imageAlt || item.title}
                  className="compact-image"
                  sizes="(max-width: 640px) calc(100vw - 40px), 360px"
                  src={item.imageUrl}
                />
              ) : null}
              <div>
                <span>{displayCategoryLabel(item.category)}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </Link>
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
  const [story, settings] = await Promise.all([getStoryBySlug(slug), getSiteSettings()]);

  if (!story) {
    return {
      title: "Story not found | Old Sea Dogs",
      robots: robotsMetadata(true),
    };
  }

  const image = hasStoryPhoto(story) ? await storyImageDetails(story.imageUrl) : null;

  return createPageMetadata({
    title: story.title,
    description: story.summary,
    path: `/stories/${story.slug}`,
    noIndex: !isStorySearchIndexable(story),
    noIndexFollow: true,
    image: hasStoryPhoto(story)
      ? {
          url: image?.url || story.imageUrl,
          width: image?.width,
          height: image?.height,
          alt: story.imageAlt || story.title,
        }
      : { url: settings.defaultSocialImageUrl, alt: "Old Sea Dogs" },
    type: "article",
  });
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const [allStories, ads] = await Promise.all([getPublishedStories(), getActiveAds()]);
  const relatedStories = findRelatedStories(story, allStories, 6);
  const internalLinkGroups = getInternalLinkGroups(story, allStories, { relatedStories });
  const storyHasPhoto = hasStoryPhoto(story);
  const storyImageLooksLikeLogo = isLogoLikeStoryImage(story);
  const storyImage = storyHasPhoto ? await storyImageDetails(story.imageUrl) : null;
  const clubProfile = getClubProfileForStory(story);
  const articleBody = clubProfile ? getClubProfileArticleBody(clubProfile) : story.body;
  const venueDetails = getVenueDetails(story);
  const storyUrl = absoluteUrl(`/stories/${story.slug}`);

  return (
    <main className="article-shell">
      <JsonLd
        data={[
          articleJsonLd(story, storyImage || undefined),
          michaelHodgesPersonJsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: displayCategoryLabel(story.category), path: sectionPathForCategory(story.category) },
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

      <ArticlePreviewContent
        ads={ads}
        adsenseConfig={{
          bottomSlotId: adsenseSlots.articleBottom,
          clientId: adsenseClientId,
          enabled: adsenseEnabled,
          inlineSlotId: adsenseSlots.articleInline,
          showPlaceholder: !isProduction,
        }}
        beforeBody={
          <>
            {clubProfile ? <ClubProfilePanel profile={clubProfile} /> : null}
            {venueDetails ? <VenuePracticalPanel details={venueDetails} /> : null}
          </>
        }
        imageLooksLikeLogo={storyImageLooksLikeLogo}
        showAdditionalAds
        socialShare={<SocialShare title={story.title} summary={story.summary} url={storyUrl} />}
        story={{
          ...story,
          body: articleBody,
          imageUrl: storyHasPhoto ? story.imageUrl : "",
        }}
      />

      <RelatedArticlesPanel stories={relatedStories} />

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
