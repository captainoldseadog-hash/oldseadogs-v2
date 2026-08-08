export type GuideSectionImage = {
  id: string;
  url: string;
  alt: string;
};

const guideSectionImages: Record<string, Record<string, GuideSectionImage[]>> = {
  cowes: {
    "Arrival by Sea": [
      {
        id: "cowes-royal-yacht-squadron-waterfront",
        url: "/images/guides/guides-cowes-royal-yacht-squadron-hero-v1.png",
        alt: "The Royal Yacht Squadron waterfront viewed from the Solent.",
      },
    ],
    "Best For": [
      {
        id: "cowes-racing-start-cannons",
        url: "/images/guides/guides-cowes-racing-start-cannons-v1.png",
        alt: "Royal Yacht Squadron starting cannons overlooking the Solent.",
      },
    ],
    "Old Sea Dogs View": [
      {
        id: "cowes-castle",
        url: "/images/guides/guides-cowes-castle-v1.png",
        alt: "Cowes Castle, home of the Royal Yacht Squadron.",
      },
    ],
  },
  "river-hamble": {
    "Walking the River": [
      {
        id: "river-hamble-jolly-sailor",
        url: "/images/guides/guides-river-hamble-jolly-sailor-v1.png",
        alt: "The Jolly Sailor beside the River Hamble at dusk.",
      },
    ],
  },
  "island-harbour": {
    Ashore: [
      {
        id: "island-harbour-spice-bus",
        url: "/images/guides/guides-marina-island-harbour-spice-bus-v1.png",
        alt: "Illustrated Spice Bus beside Island Harbour Marina.",
      },
    ],
  },
};

export function guideSectionImagesFor(slug: string, sectionHeading: string) {
  return guideSectionImages[slug]?.[sectionHeading] ?? [];
}
