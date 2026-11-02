import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../components/SiteFooter.tsx";
import { SiteHeader } from "../../../components/SiteHeader.tsx";
import { HarbourBucketBlocks, HarbourSectionIntro, HarbourTvPage } from "../../../components/HarbourTvPage.tsx";
import { harbourSection, harbourSections } from "../../../lib/harbour-tv.ts";

type PageProps = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return harbourSections().map(([section]) => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  const bucket = harbourSection(section);
  if (!bucket) return { title: "Harbour TV" };
  const documentTitle = `${bucket.title} Videos – Best New ${bucket.title} Videos This Week | Harbour TV`;
  const description = `The latest ${bucket.title.toLowerCase()} videos from trusted YouTube channels: reviews, tours, tips and Shorts, refreshed every other day by Old Sea Dogs.`;
  const image = [...bucket.full, ...bucket.shorts][0]?.thumb;
  return {
    title: { absolute: documentTitle },
    description,
    alternates: { canonical: `/videos/${section}` },
    robots: { index: true, follow: true, "max-video-preview": -1 },
    openGraph: { title: documentTitle, description, url: `/videos/${section}`, type: "website", images: image ? [image] : undefined },
  };
}

export default async function HarbourTvSectionPage({ params }: PageProps) {
  const { section } = await params;
  const bucket = harbourSection(section);
  if (!bucket) notFound();
  const videos = [...bucket.full, ...bucket.shorts];
  const description = `The latest ${bucket.title.toLowerCase()} videos from trusted YouTube channels: reviews, tours, tips and Shorts, refreshed every other day by Old Sea Dogs.`;
  return (
    <main className="article-shell htv-page">
      <SiteHeader current="videos" />
      <HarbourTvPage
        crumb={[["Home", "/"], ["Harbour TV", "/videos"], [bucket.title, `/videos/${section}`]]}
        current={section}
        description={description}
        faqLower={bucket.title.toLowerCase()}
        faqName={bucket.title}
        path={`/videos/${section}`}
        title={`${bucket.title} videos`}
        videos={videos}
      >
        <HarbourSectionIntro copyKey={section} />
        <HarbourBucketBlocks bucket={bucket} />
      </HarbourTvPage>
      <SiteFooter />
    </main>
  );
}
