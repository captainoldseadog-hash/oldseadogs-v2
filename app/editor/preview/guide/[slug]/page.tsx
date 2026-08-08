import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GuidePublicContent } from "../../../../../components/GuidePublicContent.tsx";
import { canEditRequestHeaders } from "../../../../../lib/editor-auth.ts";
import { getGuideBySlug, getPublishedGuides } from "../../../../../lib/site-content.ts";
import { createPageMetadata } from "../../../../../lib/seo.ts";

type GuidePreviewPageProps = { params: Promise<{ slug: string }> };

export const metadata: Metadata = createPageMetadata({
  title: "Preview Guide | Old Sea Dogs Editor",
  description: "Private Old Sea Dogs Guide preview.",
  path: "/editor/preview/guide",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function GuidePreviewPage({ params }: GuidePreviewPageProps) {
  const requestHeaders = await headers();
  if (!await canEditRequestHeaders(requestHeaders)) {
    return (
      <main className="article-shell privacy-shell">
        <section className="privacy-hero">
          <p className="eyebrow">Private preview</p>
          <h1>Guide preview access is restricted</h1>
          <p>This unpublished preview is available only inside The Helm.</p>
        </section>
      </main>
    );
  }

  const { slug } = await params;
  const [guide, published] = await Promise.all([
    getGuideBySlug(slug, { includeDrafts: true }),
    getPublishedGuides(),
  ]);
  if (!guide) notFound();
  const previewRelationships = published.some((item) => item.slug === guide.slug)
    ? published
    : [guide, ...published];

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <nav className="article-nav" aria-label="Preview navigation">
        <Link href="/editor/guides" className="brand-lockup dark">
          <span className="brand-mark" aria-hidden="true" />
          <span>The Helm</span>
        </Link>
        <Link href="/editor/guides">Back to Guides</Link>
      </nav>
      <GuidePublicContent
        guide={guide}
        preview
        publishedGuides={previewRelationships}
      />
    </main>
  );
}
