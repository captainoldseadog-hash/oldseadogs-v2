export const CLASSIFIEDS_STORE_VERSION = 1;
export const CLASSIFIEDS_TERM_DAYS = 90;
export const CLASSIFIEDS_REMINDER_DAYS = 14;
export const CLASSIFIEDS_EXPIRY_GRACE_DAYS = 14;
/** Personal data is removed this many days after an advertisement ends. */
export const CLASSIFIEDS_RETENTION_DAYS = 183;
export const CLASSIFIEDS_MAX_PHOTOS = 30;
export const CLASSIFIEDS_MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const CLASSIFIEDS_DRAFT_HOURS = 48;
export const CLASSIFIEDS_UNVERIFIED_DAYS = 14;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const BOAT_TYPES = ["sail", "power", "other"] as const;
export const KEEL_TYPES = ["fin", "bilge", "lifting", "long", "twin", "centreboard", "none", "other"] as const;
export const VAT_STATUSES = ["included", "excluded", "not_applicable", "unspecified"] as const;
export const LISTING_TIERS = ["free", "featured"] as const;
export const LISTING_STATUSES = [
  "draft",
  "pending_email",
  "pending",
  "approved",
  "rejected",
  "sold",
  "removed",
  "expired",
] as const;
export const RESERVED_SLUGS = new Set([
  "list-your-boat",
  "manage",
  "verify",
  "keep",
  "relist",
  "terms",
  "privacy",
]);

export type BoatType = (typeof BOAT_TYPES)[number];
export type KeelType = (typeof KEEL_TYPES)[number];
export type VatStatus = (typeof VAT_STATUSES)[number];
export type ListingTier = (typeof LISTING_TIERS)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export type CruisingGround = {
  slug: string;
  label: string;
  blurb: string;
  guidePath?: string;
};

export const CRUISING_GROUNDS: readonly CruisingGround[] = [
  { slug: "solent", label: "Solent", blurb: "The Solent and its harbours", guidePath: "/guides/solent" },
  { slug: "south-west", label: "South West", blurb: "Devon, Cornwall and the western Channel" },
  { slug: "east-coast", label: "East Coast", blurb: "Thames, Essex, Suffolk and Norfolk" },
  { slug: "inland", label: "Inland waterways", blurb: "Rivers, broads and canals" },
  { slug: "scotland", label: "Scotland", blurb: "West coast, firths and islands" },
  { slug: "wales", label: "Wales", blurb: "Bristol Channel to the Menai" },
  { slug: "channel-islands", label: "Channel Islands", blurb: "Alderney, Guernsey, Jersey and Sark" },
  { slug: "ireland", label: "Ireland", blurb: "Irish Sea, Atlantic coast and loughs" },
  { slug: "overseas", label: "Overseas", blurb: "Beyond home waters" },
];

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  sail: "Sail",
  power: "Power",
  other: "Other",
};

export const KEEL_LABELS: Record<KeelType, string> = {
  fin: "Fin keel",
  bilge: "Bilge keel",
  lifting: "Lifting keel",
  long: "Long keel",
  twin: "Twin keel",
  centreboard: "Centreboard",
  none: "No keel",
  other: "Other keel",
};

export const VAT_LABELS: Record<VatStatus, string> = {
  included: "VAT included",
  excluded: "VAT excluded",
  not_applicable: "VAT not applicable",
  unspecified: "VAT not stated",
};

export type ClassifiedPhoto = {
  id: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
};

export type ClassifiedListing = {
  id: string;
  slug: string;
  publicNumber: number;
  status: ListingStatus;
  tier: ListingTier;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  showPhone: boolean;
  title: string;
  make: string;
  model: string;
  year: number | null;
  lengthFeet: number | null;
  boatType: BoatType;
  keel: KeelType;
  engine: string;
  berths: number | null;
  location: string;
  cruisingGround: string;
  priceGbp: number | null;
  vatStatus: VatStatus;
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  photos: ClassifiedPhoto[];
  consentAt: string;
  createdAt: string;
  updatedAt: string;
  emailVerifiedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  lifecycleAnchorAt: string | null;
  lifecycleGeneration: number;
  soldAt: string | null;
  removedAt: string | null;
  rejectedAt: string | null;
  rejectionNote: string;
  expiredAt: string | null;
  purgeAfter: string | null;
  expiryAskSentAt: string | null;
  availabilityConfirmedAt: string | null;
  lastReminderAt: string | null;
  reminderCount: number;
  extensionCount: number;
  sellerEditedAt: string | null;
  moderationNote: string;
  /** Dev-seed rows only. Never shown when OLDSEADOGS_ENV is production. */
  example: boolean;
};

export type DeliveryStatus = "claimed" | "sent" | "failed";

export type ClassifiedDelivery = {
  key: string;
  listingId: string;
  kind: string;
  status: DeliveryStatus;
  at: string;
  to: string;
  subject: string;
};

export type RateHit = {
  key: string;
  at: string;
};

export type ClassifiedsStore = {
  version: 1;
  listings: ClassifiedListing[];
  deliveries: ClassifiedDelivery[];
  rateHits: RateHit[];
  updatedAt: string;
};

export type ListingInput = {
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  showPhone: boolean;
  title: string;
  make: string;
  model: string;
  year: number | null;
  lengthFeet: number | null;
  boatType: BoatType;
  keel: KeelType;
  engine: string;
  berths: number | null;
  location: string;
  cruisingGround: string;
  priceGbp: number | null;
  vatStatus: VatStatus;
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  consent: true;
};

export type TokenPurpose = "verify" | "manage" | "keep" | "relist" | "draft";

export function cruisingGroundBySlug(slug: string) {
  return CRUISING_GROUNDS.find((ground) => ground.slug === slug) || null;
}

export function emptyClassifiedsStore(now = new Date()): ClassifiedsStore {
  return {
    version: 1,
    listings: [],
    deliveries: [],
    rateHits: [],
    updatedAt: now.toISOString(),
  };
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function listingIsPublic(listing: ClassifiedListing, now = new Date()) {
  if (listing.example && process.env.OLDSEADOGS_ENV === "production") return false;
  if (listing.status !== "approved" || !listing.expiresAt) return false;
  const expires = Date.parse(listing.expiresAt);
  return Number.isFinite(expires) && expires > now.getTime();
}

export function daysSince(iso: string | null, now = new Date()) {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.floor((now.getTime() - then) / DAY_MS));
}
