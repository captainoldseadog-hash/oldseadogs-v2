import { guidePublicPath } from "./guides.ts";
import {
  BOAT_TYPE_LABELS,
  KEEL_LABELS,
  VAT_LABELS,
  cruisingGroundBySlug,
  daysSince,
  listingIsPublic,
  type ClassifiedListing,
  type ClassifiedPhoto,
} from "./classifieds-types.ts";
import { absoluteUrl } from "./seo.ts";

export type PublicPhoto = {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  thumb: string;
};

export type PublicListing = {
  id: string;
  slug: string;
  publicNumber: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
  lengthLabel: string;
  lengthFeet: number | null;
  boatType: ClassifiedListing["boatType"];
  boatTypeLabel: string;
  keel: ClassifiedListing["keel"];
  keelLabel: string;
  engine: string;
  berths: number | null;
  location: string;
  cruisingGround: string;
  cruisingGroundLabel: string;
  chartLabel: string;
  priceLabel: string;
  priceGbp: number | null;
  vatLabel: string;
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  photos: PublicPhoto[];
  sellerName: string;
  phone: string;
  tier: ClassifiedListing["tier"];
  listedDays: number | null;
  listedLabel: string;
  confirmedLabel: string;
  marinaGuide: { href: string; title: string } | null;
  example: boolean;
};

type GuideMatch = {
  title: string;
  slug: string;
  regionKey: string;
  canonicalPath?: string;
  guideType?: string;
  parentGuideSlug?: string;
};

export type ListingQuery = {
  q?: string;
  type?: string;
  keel?: string;
  ground?: string;
  minLength?: string;
  maxLength?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  trailerable?: string;
  liveaboard?: string;
  sort?: string;
};

export function toPublicListing(listing: ClassifiedListing, guides: readonly GuideMatch[] = [], now = new Date()): PublicListing | null {
  if (!listingIsPublic(listing, now)) return null;
  const ground = cruisingGroundBySlug(listing.cruisingGround);
  const listedDays = daysSince(listing.approvedAt, now);
  const phone = listing.showPhone ? listing.sellerPhone : "";
  return {
    id: listing.id,
    slug: listing.slug,
    publicNumber: formatPublicNumber(listing.publicNumber),
    title: listing.title,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    lengthLabel: formatLength(listing.lengthFeet),
    lengthFeet: listing.lengthFeet,
    boatType: listing.boatType,
    boatTypeLabel: BOAT_TYPE_LABELS[listing.boatType],
    keel: listing.keel,
    keelLabel: KEEL_LABELS[listing.keel],
    engine: listing.engine,
    berths: listing.berths,
    location: listing.location,
    cruisingGround: listing.cruisingGround,
    cruisingGroundLabel: ground?.label || "Cruising ground",
    chartLabel: `${(ground?.label || "Cruising ground").toUpperCase()} · ${listing.location.toUpperCase()}`,
    priceLabel: formatPrice(listing.priceGbp),
    priceGbp: listing.priceGbp,
    vatLabel: VAT_LABELS[listing.vatStatus],
    description: listing.description,
    trailerable: listing.trailerable,
    liveaboard: listing.liveaboard,
    photos: listing.photos.map((photo) => publicPhoto(photo)),
    sellerName: listing.sellerName,
    phone,
    tier: listing.tier,
    listedDays,
    listedLabel: listedDays === null ? "Recently listed" : listedDays === 0 ? "Listed today" : listedDays === 1 ? "Listed 1 day ago" : `Listed ${listedDays} days ago`,
    confirmedLabel: "Confirmed available",
    marinaGuide: matchMarinaGuide(listing.location, guides),
    example: listing.example,
  };
}

export function publicPhoto(photo: ClassifiedPhoto): PublicPhoto {
  return {
    id: photo.id,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    src: `/boats-media/${photo.id}`,
    thumb: `/boats-media/${photo.id}?variant=thumb`,
  };
}

export function matchMarinaGuide(location: string, guides: readonly GuideMatch[]) {
  const haystack = location.toLowerCase();
  const matches = guides.filter((guide) => {
    const title = guide.title.trim().toLowerCase();
    return title.length >= 8 && haystack.includes(title);
  }).sort((left, right) => right.title.length - left.title.length);
  const guide = matches[0];
  if (!guide) return null;
  return {
    href: guidePublicPath({
      slug: guide.slug,
      regionKey: guide.regionKey,
      canonicalPath: guide.canonicalPath || "",
      guideType: "Marina",
      parentGuideSlug: guide.parentGuideSlug || "",
    }),
    title: guide.title,
  };
}

export function filterPublicListings(listings: PublicListing[], query: ListingQuery) {
  const q = (query.q || "").trim().toLowerCase();
  const minLength = numberOrNull(query.minLength);
  const maxLength = numberOrNull(query.maxLength);
  const minPrice = numberOrNull(query.minPrice);
  const maxPrice = numberOrNull(query.maxPrice);
  const minYear = numberOrNull(query.minYear);
  const maxYear = numberOrNull(query.maxYear);
  const filtered = listings.filter((listing) => {
    if (query.type && listing.boatType !== query.type) return false;
    if (query.keel && listing.keel !== query.keel) return false;
    if (query.ground && listing.cruisingGround !== query.ground) return false;
    if (query.trailerable === "1" && !listing.trailerable) return false;
    if (query.liveaboard === "1" && !listing.liveaboard) return false;
    if (minLength !== null && (listing.lengthFeet === null || listing.lengthFeet < minLength)) return false;
    if (maxLength !== null && (listing.lengthFeet === null || listing.lengthFeet > maxLength)) return false;
    if (minPrice !== null && (listing.priceGbp === null || listing.priceGbp < minPrice)) return false;
    if (maxPrice !== null && (listing.priceGbp === null || listing.priceGbp > maxPrice)) return false;
    if (minYear !== null && (listing.year === null || listing.year < minYear)) return false;
    if (maxYear !== null && (listing.year === null || listing.year > maxYear)) return false;
    if (!q) return true;
    const haystack = [listing.title, listing.make, listing.model, listing.location, listing.cruisingGroundLabel, listing.description].join(" ").toLowerCase();
    return haystack.includes(q);
  });
  const sort = query.sort || "newest";
  return filtered.sort((left, right) => {
    if (left.tier !== right.tier) return left.tier === "featured" ? -1 : 1;
    if (sort === "price-asc") return (left.priceGbp ?? Number.MAX_SAFE_INTEGER) - (right.priceGbp ?? Number.MAX_SAFE_INTEGER);
    if (sort === "price-desc") return (right.priceGbp ?? -1) - (left.priceGbp ?? -1);
    if (sort === "length") return (right.lengthFeet ?? 0) - (left.lengthFeet ?? 0);
    if (sort === "year") return (right.year ?? 0) - (left.year ?? 0);
    return right.publicNumber.localeCompare(left.publicNumber);
  });
}

export function listingJsonLd(listing: PublicListing) {
  const images = listing.photos.map((photo) => absoluteUrl(photo.src));
  const offer = listing.priceGbp === null ? {
    "@type": "Offer",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/boats-for-sale/${listing.slug}`),
    description: "Price on application",
  } : {
    "@type": "Offer",
    priceCurrency: "GBP",
    price: listing.priceGbp,
    availability: "https://schema.org/InStock",
    url: absoluteUrl(`/boats-for-sale/${listing.slug}`),
  };
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    name: listing.title,
    description: listing.description,
    category: "Boat",
    image: images,
    brand: listing.make ? { "@type": "Brand", name: listing.make } : undefined,
    model: listing.model || undefined,
    vehicleModelDate: listing.year ? String(listing.year) : undefined,
    vehicleConfiguration: listing.keelLabel,
    offers: offer,
  };
}

export function formatPublicNumber(value: number) {
  return `No. ${String(Math.max(0, value)).padStart(3, "0")}`;
}

export function formatLength(feet: number | null) {
  if (!feet) return "Not stated";
  const metres = feet * 0.3048;
  return `${trimNumber(feet)} ft (${metres.toFixed(1)} m)`;
}

export function formatPrice(gbp: number | null) {
  if (gbp === null) return "Price on application";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(gbp);
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function numberOrNull(value: string | undefined) {
  if (!value?.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
