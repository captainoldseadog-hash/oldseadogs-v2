export type OldSeaDogsSection = {
  label: string;
  slug: string;
  categories: string[];
  description: string;
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
    categories: ["Racing", "Races", "Regatta"],
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

export function getOldSeaDogsSection(slug: string) {
  return oldSeaDogsSections.find((section) => section.slug === slug) ?? null;
}

export function storyMatchesSection(
  story: { category: string },
  section: OldSeaDogsSection
) {
  return section.categories.includes(story.category);
}
