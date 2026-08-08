import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuidePublicContent } from "../../../../components/GuidePublicContent.tsx";
import { JsonLd } from "../../../../components/JsonLd.tsx";
import { SiteFooter } from "../../../../components/SiteFooter.tsx";
import { publicNavigationLinks } from "../../../../content/sections.ts";
import { guideArticleJsonLd, guideProductRecords, guidePublicPath } from "../../../../lib/guides.ts";
import { getGuideBySlug, getPublishedGuides } from "../../../../lib/site-content.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";
import { breadcrumbJsonLd } from "../../../../lib/structured-data.ts";

type GuidePageProps = { params: Promise<{ region: string; guide: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { region, guide: slug } = await params;
  const record = await getGuideBySlug(slug);
  if (!record || record.regionKey !== region) return { title: "Guide not found | Old Sea Dogs" };
  const metadata = createPageMetadata({
    title: record.seoTitle || record.title,
    description: record.seoDescription || record.introduction,
    path: guidePublicPath(record),
    noIndex: record.noindex,
    image: { url: record.imageUrl, alt: record.imageAlt },
    type: "article",
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      title: record.socialTitle || record.seoTitle || record.title,
      description: record.socialDescription || record.seoDescription || record.introduction,
    },
    twitter: {
      ...metadata.twitter,
      title: record.socialTitle || record.seoTitle || record.title,
      description: record.socialDescription || record.seoDescription || record.introduction,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { region, guide: slug } = await params;
  const [guide, allPublished] = await Promise.all([
    getGuideBySlug(slug),
    getPublishedGuides(),
  ]);
  if (!guide || guide.regionKey !== region) notFound();
  const publishedProductGuides = guideProductRecords(allPublished);
  const path = guidePublicPath(guide);

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <JsonLd data={[
        guideArticleJsonLd(guide),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.regionName, path: `/guides/${guide.regionKey}` },
          { name: guide.title, path },
        ]),
      ]} />
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
      <GuidePublicContent guide={guide} publishedGuides={publishedProductGuides} />
      <SiteFooter extraLinks={[
        { href: `/guides/${guide.regionKey}`, label: `${guide.regionName} Guides` },
        { href: "/guides", label: "All Guides" },
      ]} />
    </main>
  );
}
