export type Story = {
  slug: string;
  title: string;
  category: "News" | "Boat Reviews" | "Cruising" | "Maintenance" | "Regatta";
  date: string;
  author: string;
  sourceType: "Press release" | "Automatic watch" | "Original";
  sourceName: string;
  sourceUrl?: string;
  image: string;
  imageAlt: string;
  summary: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  featured?: boolean;
};

export const stories: Story[] = [
  {
    slug: "cowes-week-solent-countdown",
    title: "Cowes Week 200: the Solent counts down to a landmark summer",
    category: "Regatta",
    date: "2026-06-08",
    author: "Michael Hodges",
    sourceType: "Original",
    sourceName: "Old Sea Dogs desk",
    image: "/images/marina-hero.png",
    imageAlt:
      "A classic motorboat moored at a marina with sailing yachts in the morning light.",
    summary:
      "The world's longest-running regatta is heading for its bicentenary with a summer of classic racing, shore-side celebration, and fresh stories from the Solent.",
    body: [
      "Two hundred years after cutters first gathered off Cowes Castle, the Solent is preparing for another moment of yachting theatre. The anniversary gives the regatta a rare chance to look backwards and forwards at the same time: polished classics on one tide, modern performance fleets on the next.",
      "For Old Sea Dogs, the countdown is not only about entry lists and trophies. It is about the boatbuilders, clubs, volunteers, harbour teams, and crews who keep the week moving. Those stories will shape our Cowes coverage as the summer programme fills in.",
      "Expect practical previews, archive notes, and first-hand dockside reports as the season builds. The good stuff, as ever, will be found in the details: the change in tide, the repair made at midnight, the one clean start that made a race.",
    ],
    tags: ["Cowes Week", "Solent", "classic yachts"],
    readMinutes: 4,
    featured: true,
  },
  {
    slug: "amels-80-project-zurich-sea-trials",
    title: "Amels 80 project begins sea trials from Vlissingen",
    category: "News",
    date: "2026-06-06",
    author: "Old Sea Dogs wire",
    sourceType: "Automatic watch",
    sourceName: "Yachting industry feeds",
    image: "/images/racing-yachts.png",
    imageAlt:
      "Two offshore racing yachts sailing in fresh breeze near a rocky coastline.",
    summary:
      "The latest yacht in the Amels 80 series is moving through trials as the Dutch yard prepares the project for delivery.",
    body: [
      "Damen Yachting's Amels 80 series continues to build momentum, with the latest project now moving through a sea-trial programme from Vlissingen. The schedule gives engineers and delivery teams a final chance to tune systems before the yacht leaves the yard.",
      "At this scale, the trial period is as much about integration as speed. Stabilisation, hotel systems, deck operations, bridge equipment, and crew workflow all have to behave as one coherent vessel.",
      "The project is another sign that the large-yacht market is still rewarding proven platforms with room for personal specification. Buyers want confidence, but they also want a boat that feels like their own.",
    ],
    tags: ["superyachts", "Damen Yachting", "sea trials"],
    readMinutes: 3,
  },
  {
    slug: "princess-f58-flybridge-first-look",
    title: "Princess F58 brings a sharper brief to the flybridge market",
    category: "Boat Reviews",
    date: "2026-06-03",
    author: "Michael Hodges",
    sourceType: "Press release",
    sourceName: "Manufacturer announcement",
    image: "/images/motor-yacht-review.png",
    imageAlt:
      "A modern white motor yacht moored at a marina during golden hour.",
    summary:
      "The new flybridge model aims to sit neatly between social space, range, and manageable ownership.",
    body: [
      "The flybridge sector is crowded, but the best boats still win by getting the basics right: movement on deck, sightlines from the helm, useful shade, and a cockpit that can cope with real family life.",
      "The F58 pitch is clear enough. It promises the larger-boat feel buyers expect from the class while keeping the handling and layout within reach for owners stepping up from smaller cruisers.",
      "The details to watch will be storage, engine-room access, tender handling, and how the flybridge works when the forecast is less kind than the brochure.",
    ],
    tags: ["Princess", "motor yachts", "flybridge"],
    readMinutes: 3,
  },
  {
    slug: "winter-refit-checklist-cruisers",
    title: "The jobs worth doing before the next launch day",
    category: "Maintenance",
    date: "2026-05-30",
    author: "Old Sea Dogs practical desk",
    sourceType: "Original",
    sourceName: "Old Sea Dogs desk",
    image: "/images/boatyard-maintenance.png",
    imageAlt:
      "A cruiser lifted in a boatyard while a worker inspects the hull.",
    summary:
      "A practical reminder for cruiser owners: the quiet boatyard weeks are where next season's reliability is usually won.",
    body: [
      "A lifted boat tells the truth quickly. Antifoul, anodes, seacocks, shaft seals, skin fittings, and rudders all stop being abstract once the hull is in the slings.",
      "The smartest refit lists start with safety and water ingress, then move through propulsion, electrics, comfort, and cosmetics. Paint can wait. A stiff seacock, a tired hose, or a mystery electrical draw should not.",
      "Photograph everything before it is stripped apart, label the jobs as you go, and keep invoices with part numbers. The future version of you, lying upside down in a locker in July, will be quietly grateful.",
    ],
    tags: ["maintenance", "cruisers", "boatyard"],
    readMinutes: 4,
  },
  {
    slug: "atlantic-refit-center-acquisition",
    title: "Atlantic refit capacity becomes a European battleground",
    category: "News",
    date: "2026-05-28",
    author: "Old Sea Dogs wire",
    sourceType: "Automatic watch",
    sourceName: "Industry reports",
    image: "/images/boatyard-maintenance.png",
    imageAlt:
      "A cruiser lifted in a boatyard while a worker inspects the hull.",
    summary:
      "Large-yacht refit yards are becoming strategic assets as owners look for reliable capacity on both sides of the Atlantic.",
    body: [
      "Refit is no longer the quiet end of the yacht business. As larger fleets age and owners expect shorter downtime, yards with serious lift, dock, and project-management capacity have become prized infrastructure.",
      "The Atlantic coast is especially interesting. It offers access to Northern Europe, the Med, the Caribbean circuit, and long-range expedition traffic without forcing every project through the same congested routes.",
      "For crews, the practical question remains simple: can the yard deliver the work, parts, and specialists when the boat actually needs them?",
    ],
    tags: ["refit", "superyachts", "shipyards"],
    readMinutes: 3,
  },
];

export const featuredStory =
  stories.find((story) => story.featured) ?? stories[0];

export const latestStories = stories
  .filter((story) => story.slug !== featuredStory.slug)
  .slice(0, 4);

export function getStory(slug: string) {
  return stories.find((story) => story.slug === slug);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
