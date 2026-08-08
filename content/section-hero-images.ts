export type SectionHeroPhoto = {
  sectionSlug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  focalPoint: string;
  overlayStrength: "light" | "medium" | "strong";
  isLogoLike?: boolean;
};

// Supplied OldSeaDogs section-header artwork.
// These deliberately bypass the old generated art/filter pipeline.
export const sectionHeroImagesBySlug: Record<string, SectionHeroPhoto> = {
  news: {
    sectionSlug: "news",
    title: "News",
    imageUrl: "/images/section-heroes/oldseadogs-news.webp",
    imageAlt: "Old Sea Dogs news section artwork with sailing boats, harbour light and newspaper textures",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs news artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  shows: {
    sectionSlug: "shows",
    title: "Shows",
    imageUrl: "/images/section-heroes/oldseadogs-shows.webp",
    imageAlt: "Old Sea Dogs shows section artwork with superyachts at a marina show",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs shows artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  races: {
    sectionSlug: "races",
    title: "Races",
    imageUrl: "/images/section-heroes/oldseadogs-races.webp",
    imageAlt: "Old Sea Dogs races section artwork with yachts racing under spinnakers",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs races artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  reviews: {
    sectionSlug: "reviews",
    title: "Reviews",
    imageUrl: "/images/section-heroes/oldseadogs-reviews.webp",
    imageAlt: "Old Sea Dogs reviews section artwork with a yacht under test",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs reviews artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  gear: {
    sectionSlug: "gear",
    title: "Gear",
    imageUrl: "/images/section-heroes/oldseadogs-gear.webp",
    imageAlt: "Old Sea Dogs gear section artwork with winch, rope, compass and instruments",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs gear artwork",
    focalPoint: "center center",
    overlayStrength: "strong",
  },
  destinations: {
    sectionSlug: "destinations",
    title: "Destinations",
    imageUrl: "/images/section-heroes/oldseadogs-destinations.webp",
    imageAlt: "Old Sea Dogs destinations section artwork with yachts in a bright coastal harbour",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs destinations artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  masterclass: {
    sectionSlug: "masterclass",
    title: "Masterclass",
    imageUrl: "/images/section-heroes/oldseadogs-masterclass.webp",
    imageAlt: "Old Sea Dogs masterclass section artwork with sextant, compass, chart and sailing yacht",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs masterclass artwork",
    focalPoint: "center center",
    overlayStrength: "strong",
  },
  lifestyle: {
    sectionSlug: "lifestyle",
    title: "Lifestyle",
    imageUrl: "/images/section-heroes/oldseadogs-lifestyle.webp",
    imageAlt: "Old Sea Dogs lifestyle section artwork with sunset marina dining and yachts",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs lifestyle artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  clubs: {
    sectionSlug: "clubs",
    title: "Clubs",
    imageUrl: "/images/section-heroes/oldseadogs-clubs.webp",
    imageAlt: "Old Sea Dogs clubs section artwork with yacht club, flags and classic yachts",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs clubs artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
  ports: {
    sectionSlug: "ports",
    title: "Ports",
    imageUrl: "/images/section-heroes/oldseadogs-ports.webp",
    imageAlt: "Old Sea Dogs ports section artwork with harbour, marina, lighthouse and yachts",
    imageCredit: "© Michael Hodges",
    imageCaption: "Old Sea Dogs ports artwork",
    focalPoint: "center center",
    overlayStrength: "medium",
  },
};

export const fallbackSectionHeroImage = sectionHeroImagesBySlug.ports;
