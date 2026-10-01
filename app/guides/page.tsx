import type { Metadata } from "next";
import Link from "next/link";
import { GuideCollectionBrowser } from "../../components/GuideCollectionBrowser.tsx";
import { JsonLd } from "../../components/JsonLd.tsx";
import { SiteFooter } from "../../components/SiteFooter.tsx";
import type { GuideType } from "../../content/flagship-guides.ts";

import { guideCollectionJsonLd, guideDiscoveryAreas, guideProductRecords, guidePublicPath } from "../../lib/guides.ts";
import { getIndexedGuides, getPublishedGuides } from "../../lib/site-content.ts";
import { createPageMetadata } from "../../lib/seo.ts";
import { SiteHeader } from "../../components/SiteHeader";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const indexedGuides = guideProductRecords(await getIndexedGuides());
  return createPageMetadata({
    title: "Old Sea Dogs Guides",
    description:
      "Practical cruising knowledge, maritime history and the stories behind Britain’s harbours, anchorages and sailing waters.",
    path: "/guides",
    noIndex: indexedGuides.length === 0,
  });
}

type GuidesIndexPageProps = {
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function GuidesIndexPage({ searchParams }: GuidesIndexPageProps) {
  const guides = guideProductRecords(await getPublishedGuides());
  const { type: requestedType } = await searchParams;
  const publishedTypes = [...new Set(guides.map((guide) => guide.guideType))];
  const initialGuideType = typeof requestedType === "string" && publishedTypes.includes(requestedType as GuideType)
    ? requestedType
    : "All";
  const discoveryAreas = guideDiscoveryAreas(guides);
  const browserItems = guides.map((guide) => ({
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
      <JsonLd data={guideCollectionJsonLd("Old Sea Dogs", guides)} />
      <SiteHeader current="guides" />

      <header className="guide-library-intro-simple guide-discovery-intro">
        <p className="eyebrow">Old Sea Dogs Guides</p>
        <h1>Where do you want to sail?</h1>
        <p className="guide-library-introduction">
          Practical marina, harbour and cruising information, organised by the water.
          Choose a cruising area, then follow it into harbours, marinas and destinations.
        </p>
        <div className="guide-directory-actions">
          <a className="guide-skip-to-search" href="#guide-library">Find a particular place</a>
          <Link className="guide-skip-to-search" href="/guides/solent-marina-guide">Read the Solent Marina Guide</Link>
        </div>
      </header>

      <section className="guide-area-discovery" aria-labelledby="guide-area-discovery-title">
        <div className="guide-editorial-heading">
          <p className="eyebrow">Cruising areas</p>
          <h2 id="guide-area-discovery-title">Start with the water</h2>
          <p>
            Each collection opens into the places that shape a passage: working harbours,
            sheltered rivers, visitor marinas and worthwhile stops ashore.
          </p>
        </div>
        <div className="guide-area-discovery-grid">
          {discoveryAreas.map((area) => (
            <article className="guide-area-card" key={area.key}>
              <Link className="guide-area-card-image" href={area.path}>
                {area.guide.imageUrl ? <img
                  alt={area.guide.imageAlt}
                  decoding="async"
                  loading="lazy"
                  sizes="(max-width: 760px) calc(100vw - 28px), 560px"
                  src={area.guide.imageUrl}
                /> : null}
              </Link>
              <div className="guide-area-card-copy">
                <p className="eyebrow">{area.guideCount} {area.guideCount === 1 ? "Guide" : "Guides"}</p>
                <h3><Link href={area.path}>{area.name}</Link></h3>
                <p>{area.guide.summary}</p>
                <Link className="guide-area-open" href={area.path}>Explore the collection <span aria-hidden="true">→</span></Link>
                {area.nodes.length ? (
                  <div className="guide-subarea-list">
                    {area.nodes.map(({ guide, children }) => (
                      <section key={guide.slug}>
                        <h4><Link href={guidePublicPath(guide)}>{guide.title}</Link></h4>
                        <p>{children.length} {children.length === 1 ? "Guide" : "Guides"}</p>
                        <ul>
                          {children.map((child) => (
                            <li key={child.slug}><Link href={guidePublicPath(child)}>{child.title}</Link></li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ) : area.directGuides.length ? (
                  <ul className="guide-area-direct-links">
                    {area.directGuides.slice(0, 8).map((guide) => (
                      <li key={guide.slug}><Link href={guidePublicPath(guide)}>{guide.title}</Link></li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <GuideCollectionBrowser
        guides={browserItems}
        initialGuideType={initialGuideType}
        searchPlaceholder="Search marinas, harbours, anchorages and cruising areas"
        title="Find a particular harbour, marina or destination"
      />

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
