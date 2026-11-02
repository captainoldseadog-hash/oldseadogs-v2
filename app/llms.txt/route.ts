import { oldSeaDogsSections } from "../../content/sections";
import { guideRegionPath, guideRegionRecords } from "../../lib/guides.ts";
import { llmsText } from "../../lib/llms-txt";
import { absoluteUrl, defaultDescription, productionSiteUrl } from "../../lib/seo";
import { getIndexedGuides } from "../../lib/site-content";
import { guidePublicPath } from "../../lib/guides.ts";
import { llmsEventGuides, llmsStandoutGuides } from "../../content/llms-guides.ts";
import { harbourLlmsBlock } from "../../lib/harbour-tv.ts";

export const dynamic = "force-dynamic";

export async function GET() {
  const guides = await getIndexedGuides();
  const seenAreas = new Set<string>();
  const areas = [];
  for (const guide of guideRegionRecords(guides)) {
    if (seenAreas.has(guide.regionKey)) continue;
    seenAreas.add(guide.regionKey);
    areas.push({
      label: guide.regionName,
      url: absoluteUrl(guideRegionPath(guide.regionKey)),
    });
  }

  const indexedPaths = new Set(guides.map((guide) => guidePublicPath(guide)));
  const curated = (list: ReadonlyArray<{ label: string; path: string }>) => list.filter((item) => indexedPaths.has(item.path)).map((item) => ({ label: item.label, url: absoluteUrl(item.path) }));
  const body = `${llmsText({
    summary: defaultDescription,
    guidesIndex: absoluteUrl("/guides"),
    areas,
    standoutGuides: curated(llmsStandoutGuides),
    eventGuides: curated(llmsEventGuides),
    eventsCalendar: absoluteUrl("/events"),
    contact: absoluteUrl("/contact"),
    storySections: oldSeaDogsSections.map((section) => ({
      label: section.label,
      url: absoluteUrl(`/${section.slug}`),
    })),
    boatsForSale: absoluteUrl("/boats-for-sale"),
    about: absoluteUrl("/about"),
  })}\n\n${harbourLlmsBlock(productionSiteUrl)}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
