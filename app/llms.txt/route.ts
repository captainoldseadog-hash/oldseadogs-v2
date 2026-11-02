import { oldSeaDogsSections } from "../../content/sections";
import { guideRegionPath, guideRegionRecords } from "../../lib/guides.ts";
import { llmsText } from "../../lib/llms-txt";
import { absoluteUrl, defaultDescription } from "../../lib/seo";
import { getIndexedGuides } from "../../lib/site-content";

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

  const body = llmsText({
    summary: defaultDescription,
    guidesIndex: absoluteUrl("/guides"),
    areas,
    storySections: oldSeaDogsSections.map((section) => ({
      label: section.label,
      url: absoluteUrl(`/${section.slug}`),
    })),
    boatsForSale: absoluteUrl("/boats-for-sale"),
    about: absoluteUrl("/about"),
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
