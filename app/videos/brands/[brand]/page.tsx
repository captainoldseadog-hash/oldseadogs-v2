import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../../../components/SiteFooter.tsx";
import { SiteHeader } from "../../../../components/SiteHeader.tsx";
import { HarbourBucketBlocks, HarbourSectionIntro, HarbourTvPage } from "../../../../components/HarbourTvPage.tsx";
import { harbourBrand, harbourBrands } from "../../../../lib/harbour-tv.ts";

type PageProps = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return harbourBrands().map(([brand]) => ({ brand }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand } = await params;
  const bucket = harbourBrand(brand);
  if (!bucket) return { title: "Harbour TV" };
  const documentTitle = `${bucket.title} Videos – Best New ${bucket.title} Boat Videos This Week | Harbour TV`;
  const description = `The latest ${bucket.title.toLowerCase()} videos from trusted YouTube channels: reviews, tours, tips and Shorts, refreshed every other day by Old Sea Dogs.`;
  const image = [...bucket.full, ...bucket.shorts][0]?.thumb;
  return {
    title: { absolute: documentTitle },
    description,
    alternates: { canonical: `/videos/brands/${brand}` },
    robots: { index: true, follow: true, "max-video-preview": -1 },
    openGraph: { title: documentTitle, description, url: `/videos/brands/${brand}`, type: "website", images: image ? [image] : undefined },
  };
}

export default async function HarbourTvBrandPage({ params }: PageProps) {
  const { brand } = await params;
  const bucket = harbourBrand(brand);
  if (!bucket) notFound();
  const videos = [...bucket.full, ...bucket.shorts];
  const description = `The latest ${bucket.title.toLowerCase()} videos from trusted YouTube channels: reviews, tours, tips and Shorts, refreshed every other day by Old Sea Dogs.`;
  return (
    <main className="article-shell htv-page">
      <SiteHeader current="videos" />
      <HarbourTvPage
        crumb={[["Home", "/"], ["Harbour TV", "/videos"], ["Brands", "/videos"], [bucket.title, `/videos/brands/${brand}`]]}
        current={`b${brand}`}
        description={description}
        faqLower={bucket.title.toLowerCase()}
        faqName={bucket.title}
        path={`/videos/brands/${brand}`}
        title={`${bucket.title} videos`}
        videos={videos}
      >
        <HarbourSectionIntro copyKey={brand} />
        <HarbourBucketBlocks bucket={bucket} />
      </HarbourTvPage>
      <SiteFooter />
    </main>
  );
}
