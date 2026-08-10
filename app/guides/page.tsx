import type { Metadata } from "next";
import Link from "next/link";
import { GuideCollectionBrowser } from "../../components/GuideCollectionBrowser.tsx";
import { JsonLd } from "../../components/JsonLd.tsx";
import { SiteFooter } from "../../components/SiteFooter.tsx";
import type { GuideType } from "../../content/flagship-guides.ts";
import { publicNavigationLinks } from "../../content/sections.ts";
import { guideCollectionJsonLd, guideProductRecords, guidePublicPath } from "../../lib/guides.ts";
import { getIndexedGuides, getPublishedGuides } from "../../lib/site-content.ts";
import { createPageMetadata } from "../../lib/seo.ts";

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
  const quickAccessSlugs = [
    "hamble-point-marina",
    "cowes",
    "yarmouth",
    "river-hamble",
    "portsmouth-harbour",
    "southampton-water",
    "beaulieu-river",
    "newtown-creek",
    "the-solent",
  ];
  const quickAccessGuides = quickAccessSlugs.flatMap((slug) => {
    const guide = guides.find((item) => item.slug === slug);
    return guide ? [guide] : [];
  });
  const featuredGuides = guides.slice(0, 4);
  const regions = [...guides.reduce((groups, guide) => {
    const current = groups.get(guide.regionKey);
    if (current) {
      current.guides.push(guide);
    } else {
      groups.set(guide.regionKey, { key: guide.regionKey, name: guide.regionName, guides: [guide] });
    }
    return groups;
  }, new Map<string, { key: string; name: string; guides: typeof guides }>()).values()];
  const browserItems = guides.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    summary: guide.summary,
    guideType: guide.guideType,
    regionName: guide.regionName,
    path: guidePublicPath(guide),
    imageUrl: guide.imageUrl,
    imageAlt: guide.imageAlt,
  }));

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <JsonLd data={guideCollectionJsonLd("Old Sea Dogs", guides)} />
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

      <header className="guide-library-intro-simple">
        <p className="eyebrow">Old Sea Dogs Guides</p>
        <h1>Old Sea Dogs Guides</h1>
        <p className="guide-library-introduction">
          Practical marina, harbour and cruising information for planning real days afloat.
          The first collection covers the Solent, with the library designed to grow across
          Britain and international cruising regions.
        </p>
      </header>

      <section className="guide-practical-directory" aria-labelledby="guide-practical-directory-title">
        <div className="guide-editorial-heading">
          <p className="eyebrow">Practical quick access</p>
          <h2 id="guide-practical-directory-title">Marina &amp; Harbour Guides</h2>
          <p>
            Go directly to the current first-edition locations, or browse the growing library
            by region and Guide type.
          </p>
        </div>
        <nav className="guide-directory-actions" aria-label="Browse Guide collections">
          <a href="#guide-regions">Browse by region</a>
          <Link href="/guides?type=Marina#guide-library">Browse marinas</Link>
          <Link href="/guides?type=Harbour#guide-library">Browse harbours</Link>
          <a href="#guide-location-links">Browse rivers and anchorages</a>
          <a href="#guide-library">View all Guides</a>
        </nav>
        <div className="guide-quick-links" id="guide-location-links">
          {quickAccessGuides.map((guide) => (
            <Link href={guidePublicPath(guide)} key={guide.slug}>
              <span>{guide.guideType}</span>
              <strong>{guide.title}</strong>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="guide-region-directory" id="guide-regions" aria-labelledby="guide-regions-title">
        <div className="section-heading">
          <p className="eyebrow">Browse by region</p>
          <h2 id="guide-regions-title">Regional Guide collections</h2>
        </div>
        <div className="guide-region-grid">
          {regions.map((region) => (
            <Link href={`/guides/${region.key}`} key={region.key}>
              <strong>{region.name}</strong>
              <span>{region.guides.length} {region.guides.length === 1 ? "Guide" : "Guides"}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        <p className="guide-region-scope">
          The Solent is the first regional collection. The same region structure supports
          future British, European and worldwide cruising areas without changing Guide routes.
        </p>
      </section>

      <section className="guide-featured" aria-labelledby="guide-featured-title">
        <div className="section-heading">
          <p className="eyebrow">Featured and recently updated</p>
          <h2 id="guide-featured-title">Useful Guides to start with</h2>
        </div>
        <div className="guide-featured-grid">
          {featuredGuides.map((guide) => (
            <article className="guide-card" key={guide.slug}>
              <Link className="guide-card-image" href={guidePublicPath(guide)}>
                <img
                  alt={guide.imageAlt}
                  decoding="async"
                  loading="lazy"
                  sizes="(max-width: 640px) calc(100vw - 40px), 560px"
                  src={guide.imageUrl}
                />
              </Link>
              <div>
                <p className="eyebrow">{guide.guideType}</p>
                <h3><Link href={guidePublicPath(guide)}>{guide.title}</Link></h3>
                <p>{guide.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GuideCollectionBrowser
        guides={browserItems}
        initialGuideType={initialGuideType}
        searchPlaceholder="Search marinas, harbours, anchorages and cruising areas"
        title="Browse the complete Guide library"
      />

      <SiteFooter extraLinks={[{ href: "/", label: "Home" }]} />
    </main>
  );
}
