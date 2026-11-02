import { harbourVideoSitemapXml } from "../../lib/harbour-tv.ts";
import { productionSiteUrl } from "../../lib/seo.ts";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(harbourVideoSitemapXml(productionSiteUrl), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
