import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideCollectionBrowser } from "../../../components/GuideCollectionBrowser.tsx";
import { GuidePublicContent } from "../../../components/GuidePublicContent.tsx";
import { JsonLd } from "../../../components/JsonLd.tsx";
import { GuideBreadcrumbs } from "../../../components/GuideBreadcrumbs.tsx";
import { GuideGoogleMap } from "../../../components/GuideGoogleMap.tsx";
import { SiteFooter } from "../../../components/SiteFooter.tsx";
import { publicNavigationLinks } from "../../../content/sections.ts";
import { solentMarinaGuideGroups } from "../../../content/solent-marina-guides.ts";
import {
  guideArticleJsonLd,
  guideCollectionJsonLd,
  guideProductRecords,
  guidePublicPath,
} from "../../../lib/guides.ts";
import { getGuideBySlug, getPublishedGuides } from "../../../lib/site-content.ts";
import { createPageMetadata } from "../../../lib/seo.ts";
import { breadcrumbJsonLd } from "../../../lib/structured-data.ts";

type RegionPageProps = { params: Promise<{ region: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { region } = await params;
  const guides = guideProductRecords(await getPublishedGuides());
  const regional = guides.filter((guide) => guide.regionKey === region);
  if (regional.length) {
    const regionName = regional[0].regionName;
    return createPageMetadata({
      title: `${regionName} Guides`,
      description: `Explore Old Sea Dogs Guides to ${regionName}, including its harbours, rivers, anchorages and cruising character.`,
      path: `/guides/${region}`,
      image: { url: regional[0].imageUrl, alt: regional[0].imageAlt },
    });
  }
  const legacyGuide = await getGuideBySlug(region);
  return legacyGuide
    ? createPageMetadata({
        title: legacyGuide.seoTitle || legacyGuide.title,
        description: legacyGuide.seoDescription || legacyGuide.summary,
        path: guidePublicPath(legacyGuide),
        noIndex: legacyGuide.noindex,
        image: { url: legacyGuide.imageUrl, alt: legacyGuide.imageAlt },
        type: "article",
      })
    : { title: "Guide not found | Old Sea Dogs" };
}

function PrimaryNavigation() {
  return (
    <nav className="article-nav" aria-label="Primary navigation">
      <Link href="/" className="brand-lockup dark" aria-label="Old Sea Dogs home">
        <span className="brand-mark" aria-hidden="true" />
        <span>Old Sea Dogs</span>
      </Link>
      <div className="nav-links section-nav-links">
        {publicNavigationLinks.map((section) => (
          <Link className={section.slug === "guides" ? "active" : ""} href={section.href} key={section.slug}>
            {section.label}
          </Link>
        ))}
        <Link href="/search">Search</Link>
      </div>
    </nav>
  );
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { region } = await params;
  const allPublished = await getPublishedGuides();
  const regional = guideProductRecords(allPublished).filter((guide) => guide.regionKey === region);

  if (!regional.length) {
    const legacyGuide = await getGuideBySlug(region);
    if (!legacyGuide) notFound();
    return (
      <main className="article-shell guides-shell guide-product-shell">
        <JsonLd data={guideArticleJsonLd(legacyGuide)} />
        <PrimaryNavigation />
        <GuidePublicContent guide={legacyGuide} publishedGuides={allPublished} />
        <SiteFooter extraLinks={[{ href: "/guides", label: "Guides" }]} />
      </main>
    );
  }

  const regionName = regional[0].regionName;
  const lead = regional.find((guide) => guide.slug === "the-solent") || regional[0];
  const browserItems = regional.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    summary: guide.summary,
    guideType: guide.guideType,
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
        guideCollectionJsonLd(regionName, regional),
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
          <img src={lead.imageUrl} alt="" style={{ objectPosition: lead.imageFocalPoint }} />
        </figure>
        <div>
          <p className="eyebrow">Old Sea Dogs Guides</p>
          <h1>{regionName}</h1>
          <p>
            A clear route into the harbours, rivers, anchorages, history and cruising
            character of Britain&apos;s most concentrated sailing waters.
          </p>
        </div>
      </header>

      <nav className="guide-region-routes" aria-label={`${regionName} Guide routes`}>
        <a href="#browse-by-type"><span>Browse by type</span><strong>Choose the kind of place</strong></a>
        <a href="#all-guides"><span>Browse all Guides</span><strong>See the full Solent collection</strong></a>
        <a href="#map-section"><span>View on map</span><strong>Orientate yourself</strong></a>
      </nav>

      <div id="browse-by-type">
        <GuideCollectionBrowser
          guides={browserItems}
          searchPlaceholder="Search Solent Guides"
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
          {regional.map((guide) => (
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
