import {
  fallbackSectionHeroImage,
  sectionHeroImagesBySlug,
  type SectionHeroPhoto,
} from "./section-hero-images.ts";

export type OldSeaDogsSection = {
  label: string;
  slug: string;
  categories: string[];
  description: string;
};

export type { SectionHeroPhoto };

const categoryAliasMap: Record<string, string> = {
  "boat review": "Reviews",
  "boat reviews": "Reviews",
  cruising: "Destinations",
  destination: "Destinations",
  destinations: "Destinations",
  gear: "Gear",
  lifestyle: "Lifestyle",
  maintenance: "Masterclass",
  masterclass: "Masterclass",
  news: "News",
  port: "Ports",
  ports: "Ports",
  marina: "Ports",
  marinas: "Ports",
  race: "Races",
  races: "Races",
  racing: "Races",
  regatta: "Races",
  regattas: "Races",
  review: "Reviews",
  reviews: "Reviews",
  show: "Shows",
  shows: "Shows",
  "boat show": "Shows",
  "boat shows": "Shows",
  "yacht show": "Shows",
  "yacht shows": "Shows",
  club: "Clubs",
  clubs: "Clubs",
};

export const oldSeaDogsSections: OldSeaDogsSection[] = [
  {
    label: "News",
    slug: "news",
    categories: ["News"],
    description: "Latest boating, yachting, marina, yard, and industry stories.",
  },
  {
    label: "Shows",
    slug: "shows",
    categories: ["Shows"],
    description: "Boat shows, marine exhibitions, launches, and show reports.",
  },
  {
    label: "Races",
    slug: "races",
    categories: ["Racing", "Races", "Regatta", "Regattas"],
    description: "Offshore racing, regattas, records, fleets, and results.",
  },
  {
    label: "Reviews",
    slug: "reviews",
    categories: ["Boat Reviews", "Reviews"],
    description: "Boat reviews, yacht launches, sea trials, and owner-minded notes.",
  },
  {
    label: "Gear",
    slug: "gear",
    categories: ["Gear"],
    description: "Equipment, electronics, clothing, safety gear, and useful kit.",
  },
  {
    label: "Destinations",
    slug: "destinations",
    categories: ["Destinations"],
    description: "Places to sail, harbours to visit, and waters worth exploring.",
  },
  {
    label: "Masterclass",
    slug: "masterclass",
    categories: ["Masterclass"],
    description: "Practical seamanship, maintenance, handling, and how-to articles.",
  },
  {
    label: "Lifestyle",
    slug: "lifestyle",
    categories: ["Lifestyle"],
    description: "The people, places, culture, and pleasures around life afloat.",
  },
  {
    label: "Clubs",
    slug: "clubs",
    categories: ["Clubs"],
    description: "Yacht clubs, sailing clubs, clubhouses, traditions, and member stories.",
  },
  {
    label: "Ports",
    slug: "ports",
    categories: ["Ports"],
    description: "Ports, marinas, waterfronts, and practical harbour information.",
  },
];

export const marinaGuideNavigationLink = {
  href: "/guides/solent-marina-guide",
  label: "Marina Guide",
  slug: "marina-guide",
} as const;

export const boatsForSaleNavigationLink = {
  href: "/boats-for-sale",
  label: "Boats for Sale",
  slug: "boats-for-sale",
} as const;

export const publicNavigationLinks = [
  ...oldSeaDogsSections.map((section) => ({
    href: `/${section.slug}`,
    label: section.label,
    slug: section.slug,
  })),
  {
    href: "/guides",
    label: "Guides",
    slug: "guides",
  },
  marinaGuideNavigationLink,
  boatsForSaleNavigationLink,
] as const;

function categoryKey(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, " ");
}

export function displayCategoryLabel(category: string) {
  const trimmed = category.trim();
  if (!trimmed) return "News";
  return categoryAliasMap[categoryKey(trimmed)] ?? trimmed;
}

export function categoryMatchesLabel(category: string, label: string) {
  return displayCategoryLabel(category) === displayCategoryLabel(label);
}

export function normalizeStoryCategory(category: string) {
  const trimmed = category.trim();
  if (!trimmed) return "News";
  return displayCategoryLabel(trimmed);
}

export function getOldSeaDogsSection(slug: string) {
  return oldSeaDogsSections.find((section) => section.slug === slug) ?? null;
}

export function getSectionForCategory(category: string) {
  const label = displayCategoryLabel(category);
  return oldSeaDogsSections.find((section) => section.label === label) ?? null;
}

export function sectionPathForCategory(category: string) {
  const section = getSectionForCategory(category);
  return section ? `/${section.slug}` : "/news";
}

export function getSectionHeroArtwork(slug: string) {
  return sectionHeroImagesBySlug[slug] ?? fallbackSectionHeroImage;
}

export function storyMatchesSection(
  story: { category: string; sectionSlugs?: string[] },
  section: OldSeaDogsSection
) {
  const assignedSections = Array.isArray(story.sectionSlugs)
    ? story.sectionSlugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean)
    : [];
  return assignedSections.includes(section.slug) || getSectionForCategory(story.category)?.slug === section.slug;
}
