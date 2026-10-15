import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GuidePublicContent } from "../../../../components/GuidePublicContent.tsx";
import { JsonLd } from "../../../../components/JsonLd.tsx";
import { SiteFooter } from "../../../../components/SiteFooter.tsx";

import { guideArticleJsonLd, guidePlaceJsonLd, guideProductRecords, guidePublicPath, guideRegionPath } from "../../../../lib/guides.ts";
import { latestStoriesForGuide } from "../../../../lib/internal-links.ts";
import { getGuideBySlug, getPublishedGuides, getPublishedStories } from "../../../../lib/site-content.ts";
import { createPageMetadata, metaDescription, pageTitle } from "../../../../lib/seo.ts";
import { breadcrumbJsonLd } from "../../../../lib/structured-data.ts";
import { SiteHeader } from "../../../../components/SiteHeader";

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
    noIndexFollow: record.noindex,
    image: { url: record.imageUrl, alt: record.imageAlt },
    type: "article",
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      title: pageTitle(record.socialTitle || record.seoTitle || record.title),
      description: metaDescription(record.socialDescription || record.seoDescription || record.introduction),
    },
    twitter: {
      ...metadata.twitter,
      title: pageTitle(record.socialTitle || record.seoTitle || record.title),
      description: metaDescription(record.socialDescription || record.seoDescription || record.introduction),
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { region, guide: slug } = await params;
  const [guide, allPublished, stories] = await Promise.all([
    getGuideBySlug(slug),
    getPublishedGuides(),
    getPublishedStories(),
  ]);
  if (!guide || guide.regionKey !== region) notFound();
  if (guidePublicPath(guide) === guideRegionPath(region)) permanentRedirect(guideRegionPath(region));
  const publishedProductGuides = guideProductRecords(allPublished);
  const path = guidePublicPath(guide);
  const latestStories = latestStoriesForGuide(path, stories).map((story) => ({
    slug: story.slug,
    title: story.title,
    summary: story.summary,
  }));
  const placeJsonLd = guidePlaceJsonLd(guide);
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: guide.regionName, path: `/guides/${guide.regionKey}` },
    { name: guide.title, path },
  ]);

  return (
    <main className="article-shell guides-shell guide-product-shell">
      <JsonLd data={placeJsonLd
        ? [guideArticleJsonLd(guide), placeJsonLd, breadcrumbData]
        : [guideArticleJsonLd(guide), breadcrumbData]} />
      <SiteHeader current="guides" />
      <GuidePublicContent guide={guide} publishedGuides={publishedProductGuides} latestStories={latestStories} />
      <SiteFooter extraLinks={[
        { href: `/guides/${guide.regionKey}`, label: `${guide.regionName} Guides` },
        { href: "/guides", label: "All Guides" },
      ]} />
    </main>
  );
}
