import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DerivativeImage } from "../../../components/DerivativeImage.tsx";
import { GuideCollectionBrowser } from "../../../components/GuideCollectionBrowser.tsx";
import { GuidePublicContent } from "../../../components/GuidePublicContent.tsx";
import { JsonLd } from "../../../components/JsonLd.tsx";
import { GuideBreadcrumbs } from "../../../components/GuideBreadcrumbs.tsx";
import { GuideGoogleMap } from "../../../components/GuideGoogleMap.tsx";
import { SiteFooter } from "../../../components/SiteFooter.tsx";

import { solentMarinaGuideGroups } from "../../../content/solent-marina-guides.ts";
import {
  guideArticleJsonLd,
  guideCollectionLead,
  guideCollectionMembers,
  guideCruisingArea,
  guideHubRelatedLinks,
  guidePlaceJsonLd,
  guideCollectionJsonLd,
  guidePublicPath,
  guideRegionRecords,
} from "../../../lib/guides.ts";
import type { EditableGuide } from "../../../lib/site-content.ts";
import { publicImageAlt } from "../../../lib/public-image-alt.ts";
import { latestStoriesForGuide } from "../../../lib/internal-links.ts";
import { guideLatestStoryLinks } from "../../../lib/public-story-href.ts";
import { getGuideBySlug, getPublishedGuides, getPublishedStories } from "../../../lib/site-content.ts";
import { createPageMetadata } from "../../../lib/seo.ts";
import { breadcrumbJsonLd } from "../../../lib/structured-data.ts";
import { SiteHeader } from "../../../components/SiteHeader";

type RegionPageProps = { params: Promise<{ region: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { region } = await params;
  const guides = guideRegionRecords(await getPublishedGuides());
  const regional = guides.filter((guide) => guide.regionKey === region);
  if (regional.length) {
    const regionName = regional[0].regionName;
    const areaGuide = guideCruisingArea(region, regional);
    const lead = guideCollectionLead(region, regional) || regional[0];
    const hubGuide = areaGuide || lead;
    return createPageMetadata({
      title: areaGuide?.seoTitle || `${regionName} Guides`,
      description: areaGuide?.seoDescription || `Explore Old Sea Dogs Guides to ${regionName}, including its harbours, rivers, anchorages and cruising character.`,
      path: `/guides/${region}`,
      image: { url: hubGuide.imageUrl, alt: hubGuide.imageAlt },
    });
  }
  const legacyGuide = await getGuideBySlug(region);
  return legacyGuide
    ? createPageMetadata({
        title: legacyGuide.seoTitle || legacyGuide.title,
        description: legacyGuide.seoDescription || legacyGuide.summary,
        path: guidePublicPath(legacyGuide),
        noIndex: legacyGuide.noindex,
        noIndexFollow: legacyGuide.noindex,
        image: { url: legacyGuide.imageUrl, alt: legacyGuide.imageAlt },
        type: "article",
      })
    : { title: "Guide not found | Old Sea Dogs" };
}

function PrimaryNavigation() {
  return <SiteHeader current="guides" />;
}

function GuideHubRelated({
  guide,
  guides,
}: {
  guide: EditableGuide;
  guides: EditableGuide[];
}) {
  const links = guideHubRelatedLinks(guide, guides);
  if (!links.length) return null;
  return (
    <nav className="guide-hub-related" aria-label="Related guides">
      <p className="eyebrow">Related guides</p>
      <ul>
        {links.map((link) => (
          <li key={link.slug}>
            <Link href={guidePublicPath(link.guide)}>{link.label} <span aria-hidden="true">→</span></Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function guideLatestStories(
  guide: EditableGuide,
  stories: Awaited<ReturnType<typeof getPublishedStories>>,
) {
  return guideLatestStoryLinks(guidePublicPath(guide), latestStoriesForGuide(guidePublicPath(guide), stories));
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { region } = await params;
  const [allPublished, stories] = await Promise.all([getPublishedGuides(), getPublishedStories()]);
  const regional = guideRegionRecords(allPublished).filter((guide) => guide.regionKey === region);

  if (!regional.length) {
    const legacyGuide = await getGuideBySlug(region);
    if (!legacyGuide) notFound();
    const placeJsonLd = guidePlaceJsonLd(legacyGuide);
    return (
      <main className="article-shell guides-shell guide-product-shell">
        <JsonLd data={[
          guideArticleJsonLd(legacyGuide),
          ...(placeJsonLd ? [placeJsonLd] : []),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: legacyGuide.title, path: guidePublicPath(legacyGuide) },
          ]),
        ]} />
        <PrimaryNavigation />
        <GuidePublicContent guide={legacyGuide} publishedGuides={allPublished} latestStories={guideLatestStories(legacyGuide, stories)} />
        <SiteFooter extraLinks={[{ href: "/guides", label: "Guides" }]} />
      </main>
    );
  }

  const regionName = regional[0].regionName;
  const areaGuide = guideCruisingArea(region, regional);
  if (areaGuide) {
    const placeJsonLd = guidePlaceJsonLd(areaGuide);
    const collectionGuides = guideCollectionMembers(region, regional);
    const childItems = collectionGuides.map((guide) => ({
      slug: guide.slug,
      title: guide.title,
      summary: guide.summary,
      guideType: guide.guideType,
      regionKey: guide.regionKey,
      regionName: guide.regionName,
      path: guidePublicPath(guide),
      imageUrl: guide.imageUrl,
      imageAlt: guide.imageAlt,
    }));
    return (
      <main className="article-shell guides-shell guide-product-shell">
        <JsonLd data={[
          guideArticleJsonLd(areaGuide),
          ...(placeJsonLd ? [placeJsonLd] : []),
          guideCollectionJsonLd(regionName, collectionGuides),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: regionName, path: `/guides/${region}` },
          ]),
        ]} />
        <PrimaryNavigation />
        <GuidePublicContent guide={areaGuide} publishedGuides={allPublished} latestStories={guideLatestStories(areaGuide, stories)} />
        <GuideCollectionBrowser
          guides={childItems}
          searchPlaceholder={`Search ${regionName} Guides`}
          title={`Explore ${regionName}`}
        />
        <SiteFooter extraLinks={[{ href: "/guides", label: "All Guides" }]} />
      </main>
    );
  }
  const lead = guideCollectionLead(region, regional)
    || regional.find((guide) => guide.slug === "the-solent")
    || regional[0];
  const listedGuides = guideCollectionMembers(region, regional);
  const placeJsonLd = guidePlaceJsonLd(lead);
  const heroAlt = publicImageAlt({
    alt: lead.imageAlt,
    caption: lead.imageCaption,
    title: lead.title,
    fallback: regionName,
  }) || regionName;
  const browserItems = listedGuides.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    summary: guide.summary,
    guideType: guide.guideType,
    regionKey: guide.regionKey,
    regionName: guide.regionName,
    path: guidePublicPath(guide),
    imageUrl: guide.imageUrl,
    imageAlt: guide.imageAlt,
  }));
  const marinaGroups = region === "solent"
    ? solentMarinaGuideGroups.map((group) => ({
        label: group.label,
        guides: group.slugs.flatMap((slug) => {
          const guide = regional.find((item) => item.slug === slug);
          return guide ? [guide] : [];
        }),
      }))
    : [];

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <JsonLd data={[
        guideArticleJsonLd(lead),
        ...(placeJsonLd ? [placeJsonLd] : []),
        guideCollectionJsonLd(regionName, listedGuides),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: regionName, path: `/guides/${region}` },
        ]),
      ]} />
      <PrimaryNavigation />
      <GuideBreadcrumbs items={[
        { href: "/", label: "Home" },
        { href: "/guides", label: "Guides" },
        { label: regionName },
      ]} />

      <header className="guide-region-hero">
        <figure>
          <DerivativeImage
            alt={heroAlt}
            eager
            sizes="100vw"
            src={lead.imageUrl}
            style={{ objectPosition: lead.imageFocalPoint }}
          />
        </figure>
        <div>
          <p className="eyebrow">Old Sea Dogs Guides</p>
          <h1>{regionName}</h1>
          <p>
            A clear route into the harbours, rivers, anchorages, history and cruising
            character of {regionName}.
          </p>
        </div>
      </header>

      <nav className="guide-region-routes" aria-label={`${regionName} Guide routes`}>
        <a href="#browse-by-type"><span>Browse by type</span><strong>Choose the kind of place</strong></a>
        <a href="#all-guides"><span>Browse all Guides</span><strong>See the full {regionName} collection</strong></a>
        <a href="#map-section"><span>View on map</span><strong>Orientate yourself</strong></a>
      </nav>

      <GuideHubRelated guide={lead} guides={allPublished} />

      <div id="browse-by-type">
        <GuideCollectionBrowser
          guides={browserItems}
          searchPlaceholder={`Search ${regionName} Guides`}
          title={`Explore ${regionName}`}
        />
      </div>

      {marinaGroups.length ? (
        <section className="guide-region-all guide-marina-directory" aria-labelledby="guide-marina-directory-title">
          <div className="section-heading">
            <p className="eyebrow">Browse marina Guides by area</p>
            <h2 id="guide-marina-directory-title">Solent marina collections</h2>
          </div>
          <div className="guide-marina-groups">
            {marinaGroups.map((group) => (
              <section className="guide-marina-group" key={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.guides.map((guide) => (
                    <li key={guide.slug}>
                      <small>Marina Guide</small>
                      <strong><Link href={guidePublicPath(guide)}>{guide.title}</Link></strong>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      <section className="guide-region-all" id="all-guides" aria-labelledby="guide-region-all-title">
        <div className="section-heading">
          <p className="eyebrow">The complete collection</p>
          <h2 id="guide-region-all-title">Read your way around {regionName}</h2>
        </div>
        <ul>
          {listedGuides.map((guide) => (
            <li key={guide.slug}>
              <small>{guide.guideType}</small>
              <strong><Link href={guidePublicPath(guide)}>{guide.title}</Link></strong>
              <p>{guide.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="guide-region-map" id="map-section">
        <GuideGoogleMap
          marinaName={regionName}
          location={{
            latitude: lead.location.latitude,
            longitude: lead.location.longitude,
            mapMetadata: { preferredZoom: lead.location.mapZoom || 10 },
          }}
        />
        <p className="guide-navigation-warning">
          This map is provided for general orientation only and must not be used for navigation.
        </p>
      </section>

      <p className="guide-back-link"><Link href="/guides">&larr; Back to all Old Sea Dogs Guides</Link></p>
      <SiteFooter extraLinks={[{ href: "/guides", label: "All Guides" }]} />
    </main>
  );
}
