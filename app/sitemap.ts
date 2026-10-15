import type { MetadataRoute } from "next";
import { manufacturers, storyMatchesManufacturer } from "../content/manufacturers";
import { storyPrefersGuideCanonical } from "../content/port-story-guides.ts";
import { oldSeaDogsSections } from "../content/sections";
import { guidePublicPath, guideRegionPath, guideRegionRecords } from "../lib/guides.ts";
import { isGalleryPublicRolloutEnabled } from "../lib/gallery-public.js";
import { getApprovedPublicGalleryPhotos, getIndexedGuides, getPublishedStories, getSiteSettings, isStorySearchIndexable } from "../lib/site-content";
import { listPublicBoatListings } from "../lib/classifieds-service.ts";
import { retiredMarinaGuideRedirect } from "../lib/marina-library-redirect";
import { absoluteUrl } from "../lib/seo";

export const dynamic = "force-dynamic";
/** Pages without a content timestamp. Request time would make lastmod change on every fetch. */
const STATIC_SITEMAP_LASTMOD = new Date("2026-10-11T00:00:00.000Z");
const staticRoutes = [
  { path: "/", priority: 1 }, { path: "/about", priority: 0.7 }, { path: "/authors/michael-hodges", priority: 0.7 },
  { path: "/contact", priority: 0.7 }, { path: "/editorial-standards", priority: 0.7 },
  { path: "/privacy", priority: 0.35 }, { path: "/cookie-policy", priority: 0.35 }, { path: "/terms", priority: 0.35 },
];
function lastModifiedDate(...values: Array<string | undefined>) {
  for (const value of values) { if (!value) continue; const date = new Date(value.includes("T") ? value : `${value}T00:00:00Z`); if (!Number.isNaN(date.getTime())) return date; }
  return STATIC_SITEMAP_LASTMOD;
}
function contentUpdatedDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function latestContentUpdate(values: Array<string | undefined>) {
  let latest = 0;
  for (const value of values) {
    const date = contentUpdatedDate(value);
    if (date) latest = Math.max(latest, date.getTime());
  }
  return latest ? new Date(latest) : null;
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publishedStories, indexedGuides, boatListings, settings] = await Promise.all([
    getPublishedStories(),
    getIndexedGuides(),
    listPublicBoatListings().catch(() => []),
    getSiteSettings(),
  ]);
  const galleryLive = isGalleryPublicRolloutEnabled(settings.galleryPublicRollout);
  const galleryPhotos = galleryLive ? await getApprovedPublicGalleryPhotos() : [];
  const stories = publishedStories.filter(
    (story) => isStorySearchIndexable(story) && !storyPrefersGuideCanonical(story.slug),
  );
  const productGuides = guideRegionRecords(indexedGuides);
  const guideRegions = [...new Set(productGuides.map((guide) => guide.regionKey))];
  return [
    ...staticRoutes.map((route) => ({ url: absoluteUrl(route.path), lastModified: STATIC_SITEMAP_LASTMOD, changeFrequency: route.path === "/" ? "daily" as const : "monthly" as const, priority: route.priority })),
    ...(galleryLive ? [{ url: absoluteUrl("/through-the-lens"), lastModified: lastModifiedDate(...galleryPhotos.map((photo) => photo.updatedAt)), changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    { url: absoluteUrl("/boats-for-sale"), lastModified: STATIC_SITEMAP_LASTMOD, changeFrequency: "daily" as const, priority: 0.8 },
    { url: absoluteUrl("/boats-for-sale/list-your-boat"), lastModified: STATIC_SITEMAP_LASTMOD, changeFrequency: "monthly" as const, priority: 0.55 },
    ...boatListings.map((listing) => ({ url: absoluteUrl(`/boats-for-sale/${listing.slug}`), lastModified: STATIC_SITEMAP_LASTMOD, changeFrequency: "weekly" as const, priority: 0.64 })),
    ...oldSeaDogsSections.map((section) => ({ url: absoluteUrl(`/${section.slug}`), lastModified: STATIC_SITEMAP_LASTMOD, changeFrequency: "daily" as const, priority: section.slug === "news" ? 0.9 : 0.75 })),
    ...(indexedGuides.length ? [{ url: absoluteUrl("/guides"), lastModified: lastModifiedDate(...indexedGuides.map((guide) => guide.updatedAt)), changeFrequency: "monthly" as const, priority: 0.68 }] : []),
    ...guideRegions.map((region) => ({ url: absoluteUrl(`/guides/${region}`), lastModified: lastModifiedDate(...productGuides.filter((guide) => guide.regionKey === region).map((guide) => guide.updatedAt)), changeFrequency: "monthly" as const, priority: 0.66 })),
    ...indexedGuides
      .filter((guide) => {
        const path = guidePublicPath(guide);
        return path !== guideRegionPath(guide.regionKey) && !retiredMarinaGuideRedirect(path);
      })
      .map((guide) => ({ url: absoluteUrl(guidePublicPath(guide)), lastModified: lastModifiedDate(guide.updatedAt), changeFrequency: "monthly" as const, priority: guide.showOnHomepage ? 0.72 : 0.62 })),
    ...manufacturers.filter((manufacturer, index, list) => list.findIndex((item) => item.slug === manufacturer.slug) === index).filter((manufacturer) => stories.some((story) => storyMatchesManufacturer(story, manufacturer))).map((manufacturer) => ({ url: absoluteUrl(`/manufacturers/${manufacturer.slug}`), lastModified: latestContentUpdate(stories.filter((story) => storyMatchesManufacturer(story, manufacturer)).map((story) => story.updatedAt)) ?? STATIC_SITEMAP_LASTMOD, changeFrequency: "weekly" as const, priority: 0.62 })),
    ...stories.map((story) => {
      const updated = contentUpdatedDate(story.updatedAt);
      return { url: absoluteUrl(`/stories/${story.slug}`), ...(updated ? { lastModified: updated } : {}), changeFrequency: "monthly" as const, priority: story.isFeatured ? 0.9 : 0.65 };
    }),
  ];
}
