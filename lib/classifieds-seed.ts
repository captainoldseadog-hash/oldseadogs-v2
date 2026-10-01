import { createSafeId } from "../lib/safe-id.ts";
import { addDays, CLASSIFIEDS_TERM_DAYS, type ClassifiedListing } from "../lib/classifieds-types.ts";
import { writeClassifiedPhotoFiles, type ProcessedPhoto } from "../lib/classifieds-photos.ts";
import { updateClassifiedsStore } from "../lib/classifieds-store.ts";

type ExampleRecord = {
  title: string;
  make: string;
  model: string;
  year: number;
  lengthFeet: number;
  boatType: ClassifiedListing["boatType"];
  keel: ClassifiedListing["keel"];
  engine: string;
  berths: number;
  location: string;
  cruisingGround: string;
  priceGbp: number;
  vatStatus: ClassifiedListing["vatStatus"];
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  sellerName: string;
  sellerEmail: string;
  status: "approved" | "pending";
};

export function assertClassifiedsSeedAllowed() {
  const env = process.env.OLDSEADOGS_ENV;
  const nodeEnv = process.env.NODE_ENV;
  if (env === "production" || nodeEnv === "production") {
    throw new Error("Example boat advertisements are not loaded in production.");
  }
  if (process.env.OLDSEADOGS_ENABLE_CLASSIFIEDS_SEED !== "true") {
    throw new Error("Set OLDSEADOGS_ENABLE_CLASSIFIEDS_SEED=true to load example boats. They are never written in production.");
  }
}

export async function seedExampleBoats(examples: ExampleRecord[], now = new Date()) {
  assertClassifiedsSeedAllowed();
  const sharpModule = await import("sharp");
  const sharp = sharpModule.default;
  let number = 0;
  const listings: ClassifiedListing[] = [];
  for (const example of examples) {
    const id = createSafeId("boat");
    const approved = example.status === "approved";
    if (approved) number += 1;
    const photoId = createSafeId("photo");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
      <rect width="1600" height="1000" fill="#123944"/>
      <rect y="640" width="1600" height="360" fill="#2f6f67"/>
      <text x="72" y="160" fill="#f6f7f3" font-family="Georgia" font-size="64">EXAMPLE ONLY</text>
      <text x="72" y="230" fill="#b98945" font-family="Georgia" font-size="28">Not a real boat</text>
      <text x="72" y="820" fill="#f6f7f3" font-family="Georgia" font-size="42">${escapeXml(example.title)}</text>
    </svg>`;
    const webp = new Uint8Array(await sharp(Buffer.from(svg)).webp({ quality: 76 }).toBuffer());
    const thumb = new Uint8Array(await sharp(Buffer.from(svg)).resize({ width: 640, height: 400, fit: "inside" }).webp({ quality: 70 }).toBuffer());
    const processed: ProcessedPhoto = { webp, thumb, width: 1600, height: 1000, sourceFormat: "svg" };
    await writeClassifiedPhotoFiles(id, photoId, processed);
    const stamp = now.toISOString();
    listings.push({
      id,
      slug: example.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      publicNumber: approved ? number : 0,
      status: example.status,
      tier: "free",
      sellerName: example.sellerName,
      sellerEmail: example.sellerEmail,
      sellerPhone: "",
      showPhone: false,
      title: example.title,
      make: example.make,
      model: example.model,
      year: example.year,
      lengthFeet: example.lengthFeet,
      boatType: example.boatType,
      keel: example.keel,
      engine: example.engine,
      berths: example.berths,
      location: example.location,
      cruisingGround: example.cruisingGround,
      priceGbp: example.priceGbp,
      vatStatus: example.vatStatus,
      description: example.description,
      trailerable: example.trailerable,
      liveaboard: example.liveaboard,
      photos: [{ id: photoId, alt: `${example.title} — example photograph, not a real boat`, width: 1600, height: 1000, bytes: webp.byteLength, createdAt: stamp }],
      consentAt: stamp,
      createdAt: stamp,
      updatedAt: stamp,
      emailVerifiedAt: stamp,
      submittedAt: stamp,
      approvedAt: approved ? stamp : null,
      expiresAt: approved ? addDays(now, CLASSIFIEDS_TERM_DAYS).toISOString() : null,
      lifecycleAnchorAt: approved ? stamp : null,
      lifecycleGeneration: approved ? 1 : 0,
      soldAt: null,
      removedAt: null,
      rejectedAt: null,
      rejectionNote: "",
      expiredAt: null,
      purgeAfter: null,
      expiryAskSentAt: null,
      availabilityConfirmedAt: approved ? stamp : null,
      lastReminderAt: null,
      reminderCount: 0,
      extensionCount: 0,
      sellerEditedAt: null,
      moderationNote: "Example seed. Not a real advertisement.",
      example: true,
    });
  }
  await updateClassifiedsStore((store) => ({
    ...store,
    listings: [...store.listings.filter((listing) => !listing.example), ...listings],
  }));
  return listings;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character] || character));
}
