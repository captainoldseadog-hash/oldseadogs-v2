import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { canEditRequestHeaders } from "../../../../lib/editor-auth.ts";
import { guideDiscoveryAreas } from "../../../../lib/guides.ts";
import { getAllGuides } from "../../../../lib/site-content.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";

export const metadata: Metadata = createPageMetadata({
  title: "Guide Collection Preview | Old Sea Dogs Editor",
  description: "Private Old Sea Dogs Guide collection preview.",
  path: "/editor/preview/guides",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function GuideCollectionPreviewPage() {
  if (!await canEditRequestHeaders(await headers())) {
    return <main className="article-shell privacy-shell"><section className="privacy-hero"><p className="eyebrow">Private preview</p><h1>Guide preview access is restricted</h1><p>This unpublished preview is available only inside The Helm.</p></section></main>;
  }

  const areas = guideDiscoveryAreas(await getAllGuides(), { includeDrafts: true });
  const previewPath = (slug: string) => `/editor/preview/guide/${slug}`;

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <nav className="article-nav" aria-label="Preview navigation"><Link href="/editor/guides" className="brand-lockup dark"><span className="brand-mark" aria-hidden="true" /><span>The Helm</span></Link><Link href="/editor/guides">Back to Guides</Link></nav>
      <header className="guide-library-intro-simple guide-discovery-intro"><p className="eyebrow">Private development preview</p><h1>Guide collection hierarchy</h1><p className="guide-library-introduction">Published and draft records are shown here for editorial review. Draft links never appear on the public Guide library.</p></header>
      <section className="guide-preview-hierarchy" aria-label="Guide hierarchy preview">
        {areas.map((area) => <article className="guide-area-card" key={area.key}><div className="guide-area-card-copy"><p className="eyebrow">{area.guideCount} records</p><h2><Link href={previewPath(area.guide.slug)}>{area.name}</Link>{area.guide.status !== "published" ? <span className="guide-preview-status">{area.guide.status}</span> : null}</h2>{area.nodes.map(({ guide, children }) => <section className="guide-subarea-list" key={guide.slug}><h3><Link href={previewPath(guide.slug)}>{guide.title}</Link>{guide.status !== "published" ? <span className="guide-preview-status">{guide.status}</span> : null}</h3><ul>{children.map((child) => <li key={child.slug}><Link href={previewPath(child.slug)}>{child.title}</Link>{child.status !== "published" ? <span className="guide-preview-status">{child.status}</span> : null}</li>)}</ul></section>)}{area.directGuides.length ? <ul className="guide-area-direct-links">{area.directGuides.map((guide) => <li key={guide.slug}><Link href={previewPath(guide.slug)}>{guide.title}</Link>{guide.status !== "published" ? <span className="guide-preview-status">{guide.status}</span> : null}</li>)}</ul> : null}</div></article>)}
      </section>
    </main>
  );
}
