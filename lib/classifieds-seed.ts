import { createSafeId } from "../lib/safe-id.ts";
import { addDays, CLASSIFIEDS_TERM_DAYS, type ClassifiedListing, type ClassifiedPhoto } from "../lib/classifieds-types.ts";
import { processClassifiedPhoto, writeClassifiedPhotoFiles, type ProcessedPhoto } from "../lib/classifieds-photos.ts";
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
  photos?: Array<{ file: string; credit: string }>;
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
  const sharp = sharpModule.default as SharpFactory;
  let number = 0;
  const listings: ClassifiedListing[] = [];
  for (const example of examples) {
    const id = createSafeId("boat");
    const approved = example.status === "approved";
    if (approved) number += 1;
    const stamp = now.toISOString();
    const photos = await seedPhotos(id, example, sharp, stamp);
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
      photos,
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

type SharpFactory = (input: Buffer, options?: { failOn?: string }) => {
  resize: (options: { width: number; height: number; fit: "cover" }) => {
    webp: (options: { quality: number }) => { toBuffer: () => Promise<Buffer> };
  };
};

async function seedPhotos(listingId: string, example: ExampleRecord, sharp: SharpFactory, stamp: string): Promise<ClassifiedPhoto[]> {
  if (example.photos?.length) {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const photos: ClassifiedPhoto[] = [];
    for (const source of example.photos) {
      const bytes = new Uint8Array(await readFile(path.join(process.cwd(), "tests/fixtures/boats-photos", source.file)));
      const processed = await processClassifiedPhoto(bytes, "image/jpeg");
      photos.push(await storeSeedPhoto(listingId, processed, `${example.title} — example photograph, not a real boat. Photograph: ${source.credit}`, stamp));
    }
    return photos;
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="#123944"/><text x="80" y="480" fill="#f6f7f3" font-family="Georgia, serif" font-size="64">${escapeXml(example.title)}</text><text x="80" y="560" fill="#f3d2c6" font-family="Georgia, serif" font-size="32">Example photograph, not a real boat</text></svg>`);
  const webp = new Uint8Array(await sharp(svg).resize({ width: 1600, height: 1000, fit: "cover" }).webp({ quality: 70 }).toBuffer());
  const thumb = new Uint8Array(await sharp(svg).resize({ width: 640, height: 400, fit: "cover" }).webp({ quality: 60 }).toBuffer());
  return [await storeSeedPhoto(listingId, { webp, thumb, width: 1600, height: 1000, sourceFormat: "svg" }, `${example.title} — example photograph, not a real boat`, stamp)];
}

async function storeSeedPhoto(listingId: string, photo: ProcessedPhoto, alt: string, stamp: string): Promise<ClassifiedPhoto> {
  const photoId = createSafeId("photo");
  await writeClassifiedPhotoFiles(listingId, photoId, photo);
  return {
    id: photoId,
    alt,
    width: photo.width,
    height: photo.height,
    bytes: photo.webp.byteLength,
    createdAt: stamp,
  };
}

function escapeXml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character] || character));
}
