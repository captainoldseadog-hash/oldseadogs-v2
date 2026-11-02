import type { Metadata } from "next";
import { SiteFooter } from "../../components/SiteFooter.tsx";
import { SiteHeader } from "../../components/SiteHeader.tsx";
import { HarbourHubBody, HarbourTvPage } from "../../components/HarbourTvPage.tsx";
import { harbourSections } from "../../lib/harbour-tv.ts";

const title = "Harbour TV";
const documentTitle = "Harbour TV – The Best New Boat Videos This Week | Old Sea Dogs";
const description = "The best new boating videos on YouTube, hand-picked by section: sailing, powerboats, flybridges, jet skis, diving, gear, fishing and top brands. Updated every other day.";

export const metadata: Metadata = {
  title: { absolute: documentTitle },
  description,
  alternates: { canonical: "/videos" },
  robots: { index: true, follow: true, "max-video-preview": -1 },
  openGraph: { title: documentTitle, description, url: "/videos", type: "website" },
};

export default function HarbourTvHubPage() {
  const videos = harbourSections().flatMap(([, bucket]) => [...bucket.full.slice(0, 3), ...bucket.shorts.slice(0, 6)]);
  return (
    <main className="article-shell htv-page">
      <SiteHeader current="videos" />
      <HarbourTvPage
        crumb={[["Home", "/"], ["Harbour TV", "/videos"]]}
        current=""
        description={description}
        faqLower="boating"
        faqName="Harbour TV"
        path="/videos"
        title={title}
        videos={videos}
      >
        <HarbourHubBody />
      </HarbourTvPage>
      <SiteFooter />
    </main>
  );
}
