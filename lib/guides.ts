import type { EditableGuide } from "./site-content.ts";
import { absoluteUrl } from "./seo.ts";

export function guidePublicPath(guide: Pick<EditableGuide, "slug" | "regionKey" | "canonicalPath">) {
  if (guide.canonicalPath?.startsWith("/guides/")) return guide.canonicalPath;
  return guide.regionKey
    ? `/guides/${guide.regionKey}/${guide.slug}`
    : `/guides/${guide.slug}`;
}

export function guideRegionPath(regionKey: string) {
  return `/guides/${regionKey}`;
}

export function guideProductRecords(guides: readonly EditableGuide[]) {
  return guides
    .filter((guide) => /^OSD-G\d+$/i.test(guide.internalId) && guide.regionKey)
    .sort((left, right) =>
      left.regionName.localeCompare(right.regionName)
      || left.editorialOrder - right.editorialOrder
      || left.title.localeCompare(right.title)
    );
}

export function relatedGuides(
  guide: EditableGuide,
  guides: readonly EditableGuide[],
  relationship: "relatedGuideSlugs" | "cruiseOnGuideSlugs",
) {
  const bySlug = new Map(guides.map((item) => [item.slug, item]));
  return guide[relationship]
    .map((slug) => bySlug.get(slug))
    .filter((item): item is EditableGuide => Boolean(item))
    .slice(0, relationship === "relatedGuideSlugs" ? 5 : 4);
}

export function guideArticleJsonLd(guide: EditableGuide) {
  const path = guidePublicPath(guide);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    alternativeHeadline: guide.summary,
    description: guide.seoDescription || guide.introduction,
    articleSection: guide.guideType,
    mainEntityOfPage: absoluteUrl(path),
    datePublished: guide.publication?.publishedAt || undefined,
    dateModified: guide.updatedAt,
    author: {
      "@type": "Person",
      name: guide.author || "Michael Hodges",
      url: absoluteUrl("/authors/michael-hodges"),
    },
    publisher: {
      "@type": "Organization",
      name: "Old Sea Dogs",
      url: absoluteUrl("/"),
    },
    image: guide.imageUrl ? [absoluteUrl(guide.imageUrl)] : undefined,
    about: guide.regionName ? {
      "@type": "Place",
      name: guide.regionName,
      geo: Number.isFinite(guide.location.latitude) && Number.isFinite(guide.location.longitude)
        ? {
            "@type": "GeoCoordinates",
            latitude: guide.location.latitude,
            longitude: guide.location.longitude,
          }
        : undefined,
    } : undefined,
  };
}

export function guidePlaceJsonLd(guide: EditableGuide) {
  const latitude = guide.navigation?.latitude ?? guide.location.latitude;
  const longitude = guide.navigation?.longitude ?? guide.location.longitude;
  if (!guide.verification?.verifiedAt || !guide.regionName || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: guide.title,
    url: absoluteUrl(guidePublicPath(guide)),
    geo: {
      "@type": "GeoCoordinates",
      latitude,
      longitude,
    },
  };
}

export function guideCollectionJsonLd(regionName: string, guides: readonly EditableGuide[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${regionName} Guides`,
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: absoluteUrl(guidePublicPath(guide)),
    })),
  };
}
