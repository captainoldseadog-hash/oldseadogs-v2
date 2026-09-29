import type { EditableGuide } from "./site-content.ts";
import { absoluteUrl } from "./seo.ts";

export function guidePublicPath(guide: Pick<EditableGuide, "slug" | "regionKey" | "canonicalPath" | "guideType" | "parentGuideSlug">) {
  if (guide.guideType === "Cruising Area" && guide.slug === guide.regionKey && !guide.parentGuideSlug) {
    return guideRegionPath(guide.regionKey);
  }
  if (guide.canonicalPath?.startsWith("/guides/")) return guide.canonicalPath;
  return guide.regionKey
    ? `/guides/${guide.regionKey}/${guide.slug}`
    : `/guides/${guide.slug}`;
}

export function guideRegionPath(regionKey: string) {
  return `/guides/${regionKey}`;
}

export function guideProductRecords(guides: readonly EditableGuide[]) {
  const productGuides = guides.filter((guide) => /^OSD-G\d+$/i.test(guide.internalId) && guide.regionKey);
  const regionOrder = new Map<string, number>();
  for (const guide of productGuides) {
    const sequence = Number(guide.internalId.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);
    regionOrder.set(guide.regionKey, Math.min(regionOrder.get(guide.regionKey) ?? Number.MAX_SAFE_INTEGER, sequence));
  }
  return productGuides
    .sort((left, right) =>
      (regionOrder.get(left.regionKey) ?? Number.MAX_SAFE_INTEGER) - (regionOrder.get(right.regionKey) ?? Number.MAX_SAFE_INTEGER)
      || left.editorialOrder - right.editorialOrder
      || left.title.localeCompare(right.title)
    );
}

export function guideRegionRecords(guides: readonly EditableGuide[]) {
  return guideProductRecords(guides).filter((guide) => guide.regionName.trim());
}

export function guideCollectionPath(guide: Pick<EditableGuide, "regionKey" | "regionName">) {
  return guide.regionKey.trim() && guide.regionName.trim()
    ? guideRegionPath(guide.regionKey)
    : "/guides";
}

export function guideCruisingArea(regionKey: string, guides: readonly EditableGuide[]) {
  const candidates = guides.filter((guide) =>
    guide.regionKey === regionKey
    && guide.guideType === "Cruising Area"
    && !guide.parentGuideSlug
  );
  return candidates.find((guide) => guide.slug === regionKey) || candidates[0] || null;
}

export function guideAreaChildren(area: EditableGuide, guides: readonly EditableGuide[]) {
  return guides.filter((guide) =>
    guide.slug !== area.slug
    && guide.regionKey === area.regionKey
    && (
      guide.parentGuideSlug === area.slug
      || Boolean(guide.parentGuideId && area.id && guide.parentGuideId === area.id)
      || Boolean(guide.parentGuideId && area.externalId && guide.parentGuideId === area.externalId)
    )
  );
}

function isGuideChildOf(parent: EditableGuide, child: EditableGuide) {
  return child.slug !== parent.slug
    && child.regionKey === parent.regionKey
    && (
      child.parentGuideSlug === parent.slug
      || Boolean(child.parentGuideId && parent.id && child.parentGuideId === parent.id)
      || Boolean(child.parentGuideId && parent.externalId && child.parentGuideId === parent.externalId)
    );
}

export type GuideDiscoveryNode = {
  guide: EditableGuide;
  children: EditableGuide[];
};

export type GuideDiscoveryArea = {
  key: string;
  name: string;
  path: string;
  guide: EditableGuide;
  guideCount: number;
  nodes: GuideDiscoveryNode[];
  directGuides: EditableGuide[];
};

export function guideDiscoveryAreas(guides: readonly EditableGuide[], options: { includeDrafts?: boolean } = {}): GuideDiscoveryArea[] {
  const publishedProductGuides = guideProductRecords([...guides]).filter(
    (guide) => (options.includeDrafts || guide.status === "published") && guide.regionKey.trim() && guide.regionName.trim(),
  );
  const regions = new Map<string, EditableGuide[]>();
  for (const guide of publishedProductGuides) {
    regions.set(guide.regionKey, [...(regions.get(guide.regionKey) || []), guide]);
  }

  return [...regions.entries()].flatMap(([key, regional]) => {
    const areaGuide = guideCruisingArea(key, regional);
    if (!areaGuide) return [];
    const areaChildren = regional.filter((guide) => isGuideChildOf(areaGuide, guide));
    const nodes = regional.flatMap((guide) => {
      if (guide.slug === areaGuide.slug) return [];
      const children = regional.filter((candidate) => isGuideChildOf(guide, candidate));
      return children.length ? [{ guide, children }] : [];
    });
    const nodeSlugs = new Set(nodes.map(({ guide }) => guide.slug));

    return [{
      key,
      name: areaGuide.regionName,
      path: guideRegionPath(key),
      guide: areaGuide,
      guideCount: regional.length,
      nodes,
      directGuides: areaChildren.filter((guide) => !nodeSlugs.has(guide.slug)),
    }];
  });
}

export type GuideEditorialLinkMatch = { start: number; end: number; label: string; guide: EditableGuide };

function guideEditorialAliases(guide: EditableGuide) {
  const title = guide.title.trim();
  const aliases = new Set([title, title.replace(/\s+Guide$/i, "").trim()]);
  const withoutMarina = title.replace(/\s+Marina(?:\s+Guide)?$/i, "").trim();
  if (withoutMarina.includes(" ")) aliases.add(withoutMarina);
  return [...aliases].filter((alias) => alias.length >= 5);
}

function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function guideEditorialLinkMatches(text: string, currentSlug: string, guides: readonly EditableGuide[], alreadyLinked: ReadonlySet<string> = new Set()): GuideEditorialLinkMatch[] {
  const candidates = guides
    .filter((guide) => guide.status === "published" && guide.slug !== currentSlug && !alreadyLinked.has(guide.slug))
    .flatMap((guide) => guideEditorialAliases(guide).map((label) => ({ guide, label })));
  const aliasCounts = new Map<string, number>();
  for (const { label } of candidates) aliasCounts.set(label.toLowerCase(), (aliasCounts.get(label.toLowerCase()) || 0) + 1);
  const possible = candidates.flatMap(({ guide, label }) => {
    if (aliasCounts.get(label.toLowerCase()) !== 1) return [];
    const match = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(label)})(?=$|[^\\p{L}\\p{N}])`, "iu").exec(text);
    if (!match || match.index === undefined) return [];
    const start = match.index + match[1].length;
    return [{ start, end: start + match[2].length, label: match[2], guide }];
  }).sort((left, right) => left.start - right.start || (right.end - right.start) - (left.end - left.start));
  const matches: GuideEditorialLinkMatch[] = [];
  const usedSlugs = new Set(alreadyLinked);
  for (const candidate of possible) {
    if (usedSlugs.has(candidate.guide.slug) || matches.some((match) => candidate.start < match.end && candidate.end > match.start)) continue;
    matches.push(candidate); usedSlugs.add(candidate.guide.slug);
  }
  return matches.sort((left, right) => left.start - right.start);
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
