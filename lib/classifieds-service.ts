import { createSafeId } from "./safe-id.ts";
import { absoluteUrl } from "./seo.ts";
import {
  CLASSIFIEDS_DRAFT_HOURS,
  CLASSIFIEDS_EXPIRY_GRACE_DAYS,
  CLASSIFIEDS_REMINDER_DAYS,
  CLASSIFIEDS_RETENTION_DAYS,
  CLASSIFIEDS_TERM_DAYS,
  CLASSIFIEDS_UNVERIFIED_DAYS,
  DAY_MS,
  RESERVED_SLUGS,
  addDays,
  listingIsPublic,
  type ClassifiedListing,
  type ClassifiedPhoto,
  type ClassifiedsStore,
} from "./classifieds-types.ts";
import { appendLifecycleLog, redactMailLog, sendClassifiedsMail, type MailMessage } from "./classifieds-mail.ts";
import { ClassifiedPhotoError, processClassifiedPhoto, removeClassifiedPhotoFiles, writeClassifiedPhotoFiles } from "./classifieds-photos.ts";
import { toPublicListing, type PublicListing } from "./classifieds-public.ts";
import { readClassifiedsStore, updateClassifiedsStore } from "./classifieds-store.ts";
import { endedEmail, enquiryEmail, keepRunningEmail, pendingNotice, reminderEmail, verifyEmail } from "./classifieds-templates.ts";
import { readClassifiedsToken, signClassifiedsToken } from "./classifieds-tokens.ts";
import { honeypotFilled, validateListingSubmission } from "./classifieds-validation.ts";

const SUBMIT_LIMIT = 5;
const CONTACT_LIMIT = 8;
const UPLOAD_LIMIT = 40;
const HOUR_MS = 60 * 60 * 1000;
const CLAIM_STALE_MS = 15 * 60 * 1000;

function omitConsent<T extends { consent?: unknown }>(value: T): Omit<T, "consent"> {
  const fields = { ...value };
  delete fields.consent;
  return fields;
}

export class ClassifiedsError extends Error {
  status: number;
  errors: Record<string, string>;
  constructor(message: string, status = 400, errors: Record<string, string> = {}) {
    super(message);
    this.name = "ClassifiedsError";
    this.status = status;
    this.errors = errors;
  }
}

export async function listPublicBoatListings(now = new Date()): Promise<PublicListing[]> {
  const store = await readClassifiedsStore();
  return store.listings
    .map((listing) => toPublicListing(listing, [], now))
    .filter((listing): listing is PublicListing => Boolean(listing))
    .sort((left, right) => right.publicNumber.localeCompare(left.publicNumber));
}

export async function getListingBySlug(slug: string) {
  const store = await readClassifiedsStore();
  return store.listings.find((listing) => listing.slug === slug) || null;
}

export async function getListingById(id: string) {
  const store = await readClassifiedsStore();
  return store.listings.find((listing) => listing.id === id) || null;
}

export async function createBoatDraft(now = new Date()) {
  const listing = blankListing(createSafeId("boat"), now);
  await updateClassifiedsStore((store) => ({ ...store, listings: [...store.listings, listing] }));
  return { draftId: listing.id, draftToken: await signClassifiedsToken("draft", listing.id, now) };
}

export async function saveBoatPhoto(options: {
  token: string;
  bytes: Uint8Array;
  declaredType?: string;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const payload = await readClassifiedsToken(options.token, undefined, now);
  if (!payload || (payload.p !== "draft" && payload.p !== "manage")) {
    throw new ClassifiedsError("That upload link is no longer valid.", 403);
  }
  await assertRateLimit(`upload:${await clientHash(options.token)}`, UPLOAD_LIMIT, HOUR_MS, now);
  const listing = await getListingById(payload.l);
  if (!listing) throw new ClassifiedsError("That advertisement could not be found.", 404);
  if (listing.photos.length >= 30) throw new ClassifiedsError("An advertisement can have up to 30 photographs.", 413);
  let processed;
  try {
    processed = await processClassifiedPhoto(options.bytes, options.declaredType || "");
  } catch (error) {
    if (error instanceof ClassifiedPhotoError) throw new ClassifiedsError(error.message, error.status);
    throw error;
  }
  const photo: ClassifiedPhoto = {
    id: createSafeId("photo"),
    alt: listing.title ? `${listing.title} photograph` : "Boat photograph",
    width: processed.width,
    height: processed.height,
    bytes: processed.webp.byteLength,
    createdAt: now.toISOString(),
  };
  await writeClassifiedPhotoFiles(listing.id, photo.id, processed);
  await updateClassifiedsStore((store) => replaceListing(store, listing.id, (current) => ({
    ...current,
    photos: [...current.photos, photo],
    updatedAt: now.toISOString(),
  })));
  return photo;
}

export async function submitBoatAdvertisement(input: unknown, options: { token: string; ip?: string; now?: Date }) {
  const now = options.now ?? new Date();
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  if (honeypotFilled(source)) return { ok: true as const, accepted: false };
  const parsed = validateListingSubmission(input);
  if (!parsed.ok) throw new ClassifiedsError("Please check the advertisement and try again.", 400, parsed.errors);
  const payload = await readClassifiedsToken(options.token, "draft", now);
  if (!payload) throw new ClassifiedsError("The listing session has expired. Please start again.", 403);
  await assertRateLimit(`submit:${await clientHash(options.ip || "unknown")}`, SUBMIT_LIMIT, HOUR_MS, now);
  const existing = await getListingById(payload.l);
  if (!existing || existing.status !== "draft") throw new ClassifiedsError("This advertisement has already been sent.", 409);
  if (existing.photos.length < 1) throw new ClassifiedsError("Add at least one photograph.", 400, { photos: "Add at least one photograph." });
  const slug = await uniqueSlug(parsed.value.title, existing.id);
  const fields = omitConsent(parsed.value);
  let submitted: ClassifiedListing = existing;
  await updateClassifiedsStore((store) => replaceListing(store, existing.id, (current) => {
    submitted = {
      ...current,
      ...fields,
      slug,
      status: "pending_email",
      consentAt: now.toISOString(),
      updatedAt: now.toISOString(),
      photos: current.photos.map((photo) => ({ ...photo, alt: `${parsed.value.title} photograph` })),
    };
    return submitted;
  }));
  const token = await signClassifiedsToken("verify", submitted.id, now);
  await deliverOnce({
    key: `verify:${submitted.id}`,
    listingId: submitted.id,
    kind: "verify",
    message: verifyEmail(submitted, token),
    now,
  });
  return { ok: true as const, accepted: true, listingId: submitted.id };
}

export async function verifyBoatEmail(token: string, now = new Date()) {
  const payload = await readClassifiedsToken(token, "verify", now);
  if (!payload) return { ok: false as const, error: "This confirmation link has expired or has already been used." };
  const listing = await getListingById(payload.l);
  if (!listing) return { ok: false as const, error: "We could not find that advertisement." };
  if (listing.status === "pending_email") {
    await updateClassifiedsStore((store) => replaceListing(store, listing.id, (current) => ({
      ...current,
      status: "pending",
      emailVerifiedAt: now.toISOString(),
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })));
    const next = await getListingById(listing.id);
    if (next) {
      await deliverOnce({
        key: `moderator:${next.id}`,
        listingId: next.id,
        kind: "moderator",
        message: pendingNotice(next),
        now,
      });
    }
  }
  return { ok: true as const, status: (await getListingById(listing.id))?.status || listing.status };
}

export async function relayBoatEnquiry(input: unknown, options: { ip?: string; now?: Date }) {
  const now = options.now ?? new Date();
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  if (honeypotFilled(source)) return { ok: true as const };
  const name = String(source.name || "").trim().slice(0, 80);
  const email = String(source.email || "").trim().toLowerCase().slice(0, 200);
  const message = String(source.message || "").trim().slice(0, 4000);
  const slug = String(source.slug || "").trim();
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter your email address so the seller can reply.";
  if (message.length < 10) errors.message = "Write a short message for the seller.";
  if (Object.keys(errors).length) throw new ClassifiedsError("Please check the enquiry.", 400, errors);
  const listing = await getListingBySlug(slug);
  if (!listing || !listingIsPublic(listing, now)) throw new ClassifiedsError("That advertisement is no longer available.", 404);
  await assertRateLimit(`contact:${await clientHash(options.ip || "unknown")}`, CONTACT_LIMIT, HOUR_MS, now);
  await deliverOnce({
    key: `enquiry:${listing.id}:${await clientHash(`${email}:${message}`)}:${now.toISOString().slice(0, 13)}`,
    listingId: listing.id,
    kind: "enquiry",
    message: enquiryEmail(listing, { name, email, message }),
    now,
  });
  return { ok: true as const };
}

export async function readSellerListing(token: string, purpose: "manage" | "keep" | "relist" | "draft" = "manage", now = new Date()) {
  const payload = await readClassifiedsToken(token, purpose, now);
  if (!payload) return null;
  const listing = await getListingById(payload.l);
  if (!listing) return null;
  return { listing, payload };
}

export async function applySellerAction(token: string, action: string, patch: unknown, now = new Date()) {
  if (action === "keep") {
    const context = await readSellerListing(token, "keep", now);
    if (!context) throw new ClassifiedsError("This renewal link has expired.", 403);
    if (context.payload.x && context.listing.expiresAt !== context.payload.x) {
      throw new ClassifiedsError("This renewal link has already been used.", 409);
    }
    await extendListing(context.listing.id, now, "seller");
    return getListingById(context.listing.id);
  }
  if (action === "relist") {
    const context = await readSellerListing(token, "relist", now);
    if (!context) throw new ClassifiedsError("This relist link has expired.", 403);
    await updateClassifiedsStore((store) => replaceListing(store, context.listing.id, (current) => ({
      ...current,
      status: "pending",
      submittedAt: now.toISOString(),
      approvedAt: null,
      expiresAt: null,
      expiryAskSentAt: null,
      expiredAt: null,
      purgeAfter: null,
      updatedAt: now.toISOString(),
    })));
    return getListingById(context.listing.id);
  }
  const context = await readSellerListing(token, "manage", now);
  if (!context) throw new ClassifiedsError("This management link has expired.", 403);
  if (action === "sold") return markListing(context.listing.id, "sold", now);
  if (action === "remove") return markListing(context.listing.id, "removed", now);
  if (action === "delete") {
    await purgeListing(context.listing.id, "seller-delete");
    return null;
  }
  if (action === "edit") {
    const parsed = validateListingSubmission({ ...(context.listing as unknown as Record<string, unknown>), ...(patch as object), consent: true });
    if (!parsed.ok) throw new ClassifiedsError("Please check the changes.", 400, parsed.errors);
    const fields = omitConsent(parsed.value);
    await updateClassifiedsStore((store) => replaceListing(store, context.listing.id, (current) => ({
      ...current,
      ...fields,
      sellerEditedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })));
    return getListingById(context.listing.id);
  }
  throw new ClassifiedsError("That action is not available.", 400);
}

export async function moderateBoatListing(action: string, id: string, patch: unknown = {}, now = new Date()) {
  const listing = await getListingById(id);
  if (!listing) throw new ClassifiedsError("That advertisement could not be found.", 404);
  if (action === "approve") {
    await updateClassifiedsStore((store) => {
      const number = listing.publicNumber || nextPublicNumber(store);
      return replaceListing(store, id, (current) => ({
        ...current,
        status: "approved",
        publicNumber: current.publicNumber || number,
        approvedAt: current.approvedAt || now.toISOString(),
        expiresAt: addDays(now, CLASSIFIEDS_TERM_DAYS).toISOString(),
        lifecycleAnchorAt: now.toISOString(),
        lifecycleGeneration: current.lifecycleGeneration + (current.status === "approved" ? 0 : 1) || 1,
        availabilityConfirmedAt: now.toISOString(),
        expiryAskSentAt: null,
        expiredAt: null,
        purgeAfter: null,
        rejectedAt: null,
        updatedAt: now.toISOString(),
      }));
    });
  } else if (action === "reject") {
    const note = String((patch as { note?: string })?.note || "").slice(0, 500);
    await updateClassifiedsStore((store) => replaceListing(store, id, (current) => ({
      ...current,
      status: "rejected",
      rejectedAt: now.toISOString(),
      rejectionNote: note,
      purgeAfter: addDays(now, CLASSIFIEDS_RETENTION_DAYS).toISOString(),
      updatedAt: now.toISOString(),
    })));
  } else if (action === "sold") {
    await markListing(id, "sold", now);
  } else if (action === "remove") {
    await markListing(id, "removed", now);
  } else if (action === "extend") {
    await extendListing(id, now, "editor");
  } else if (action === "delete") {
    await purgeListing(id, "editor-delete");
    return null;
  } else if (action === "save") {
    const parsed = validateListingSubmission({ ...listing, ...(patch as object), consent: true });
    if (!parsed.ok) throw new ClassifiedsError("Please check the changes.", 400, parsed.errors);
    const fields = omitConsent(parsed.value);
    await updateClassifiedsStore((store) => replaceListing(store, id, (current) => ({
      ...current,
      ...fields,
      moderationNote: String((patch as { moderationNote?: string })?.moderationNote || current.moderationNote).slice(0, 500),
      tier: (patch as { tier?: string })?.tier === "featured" ? "featured" : current.tier,
      updatedAt: now.toISOString(),
    })));
  } else {
    throw new ClassifiedsError("Unknown moderation action.", 400);
  }
  return getListingById(id);
}

export async function editorBoatListings() {
  const store = await readClassifiedsStore();
  return [...store.listings].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function runClassifiedsLifecycle(now = new Date()) {
  const sent: string[] = [];
  const expired: string[] = [];
  const purged: string[] = [];
  const store = await readClassifiedsStore();
  for (const listing of store.listings) {
    if (shouldPurge(listing, now)) {
      await purgeListing(listing.id, "retention");
      purged.push(listing.id);
      continue;
    }
    if (listing.status === "draft" && ageMs(listing.createdAt, now) >= CLASSIFIEDS_DRAFT_HOURS * 60 * 60 * 1000) {
      await purgeListing(listing.id, "draft");
      purged.push(listing.id);
      continue;
    }
    if (listing.status === "pending_email" && ageMs(listing.createdAt, now) >= CLASSIFIEDS_UNVERIFIED_DAYS * DAY_MS) {
      await purgeListing(listing.id, "unverified");
      purged.push(listing.id);
      continue;
    }
    if (listing.example || listing.status !== "approved" || !listing.expiresAt || !listing.approvedAt) continue;
    const expiresAt = Date.parse(listing.expiresAt);
    if (now.getTime() >= expiresAt) {
      const askKey = `expiry-ask:${listing.id}:${listing.expiresAt}`;
      if (!listing.expiryAskSentAt) {
        const keepToken = await signClassifiedsToken("keep", listing.id, now, {
          generation: listing.lifecycleGeneration,
          expiresAt: listing.expiresAt,
        });
        const manageToken = await signClassifiedsToken("manage", listing.id, now);
        const didSend = await deliverOnce({
          key: askKey,
          listingId: listing.id,
          kind: "expiry-ask",
          message: keepRunningEmail(listing, keepToken, manageToken),
          now,
        });
        if (didSend) {
          sent.push(askKey);
          await updateClassifiedsStore((current) => replaceListing(current, listing.id, (item) => ({
            ...item,
            expiryAskSentAt: now.toISOString(),
            updatedAt: now.toISOString(),
          })));
        }
      } else if (ageMs(listing.expiryAskSentAt, now) >= CLASSIFIEDS_EXPIRY_GRACE_DAYS * DAY_MS) {
        const endedKey = `ended:${listing.id}:${listing.expiresAt}`;
        const relistToken = await signClassifiedsToken("relist", listing.id, now);
        const didSend = await deliverOnce({
          key: endedKey,
          listingId: listing.id,
          kind: "ended",
          message: endedEmail(listing, relistToken),
          now,
        });
        if (didSend || await alreadySent(endedKey)) {
          expired.push(listing.id);
          await updateClassifiedsStore((current) => replaceListing(current, listing.id, (item) => (
            item.status === "expired" ? item : {
              ...item,
              status: "expired",
              expiredAt: now.toISOString(),
              purgeAfter: addDays(now, CLASSIFIEDS_RETENTION_DAYS).toISOString(),
              updatedAt: now.toISOString(),
            }
          )));
          if (didSend) sent.push(endedKey);
        }
      }
      continue;
    }
    const anchor = Date.parse(listing.lifecycleAnchorAt || listing.approvedAt);
    const periodsDue = Math.floor((now.getTime() - anchor) / (CLASSIFIEDS_REMINDER_DAYS * DAY_MS));
    if (periodsDue < 1) continue;
    const dueKeys = Array.from({ length: periodsDue }, (_, index) => `reminder:${listing.id}:${listing.lifecycleGeneration}:${index + 1}`);
    const unsent = [];
    for (const key of dueKeys) {
      if (!(await alreadySent(key))) unsent.push(key);
    }
    if (unsent.length === 0) continue;
    const manageToken = await signClassifiedsToken("manage", listing.id, now);
    const didSend = await deliverOnce({
      key: unsent[unsent.length - 1],
      listingId: listing.id,
      kind: "reminder",
      message: reminderEmail(listing, manageToken),
      now,
      alsoClaim: unsent.slice(0, -1),
    });
    if (didSend) {
      sent.push(unsent[unsent.length - 1]);
      await updateClassifiedsStore((current) => replaceListing(current, listing.id, (item) => ({
        ...item,
        lastReminderAt: now.toISOString(),
        reminderCount: item.reminderCount + 1,
        availabilityConfirmedAt: item.availabilityConfirmedAt,
        updatedAt: now.toISOString(),
      })));
    }
  }
  await appendLifecycleLog({
    event: "run",
    sent: sent.length,
    expired: expired.length,
    purged: purged.length,
  });
  return { sent, expired, purged };
}

export async function findPhotoOwner(photoId: string) {
  const store = await readClassifiedsStore();
  for (const listing of store.listings) {
    const photo = listing.photos.find((item) => item.id === photoId);
    if (photo) return { listing, photo };
  }
  return null;
}

async function extendListing(id: string, now: Date, source: string) {
  await updateClassifiedsStore((store) => replaceListing(store, id, (current) => ({
    ...current,
    status: "approved",
    expiresAt: addDays(now, CLASSIFIEDS_TERM_DAYS).toISOString(),
    lifecycleAnchorAt: now.toISOString(),
    lifecycleGeneration: current.lifecycleGeneration + 1,
    expiryAskSentAt: null,
    expiredAt: null,
    purgeAfter: null,
    availabilityConfirmedAt: now.toISOString(),
    extensionCount: current.extensionCount + 1,
    moderationNote: source === "editor" ? current.moderationNote : current.moderationNote,
    updatedAt: now.toISOString(),
  })));
}

async function markListing(id: string, status: "sold" | "removed", now: Date) {
  await updateClassifiedsStore((store) => replaceListing(store, id, (current) => ({
    ...current,
    status,
    soldAt: status === "sold" ? now.toISOString() : current.soldAt,
    removedAt: status === "removed" ? now.toISOString() : current.removedAt,
    purgeAfter: addDays(now, CLASSIFIEDS_RETENTION_DAYS).toISOString(),
    updatedAt: now.toISOString(),
  })));
  return getListingById(id);
}

async function purgeListing(id: string, reason: string) {
  const listing = await getListingById(id);
  await removeClassifiedPhotoFiles(id);
  await updateClassifiedsStore((store) => ({
    ...store,
    listings: store.listings.filter((item) => item.id !== id),
    deliveries: store.deliveries.filter((item) => item.listingId !== id),
  }));
  await redactMailLog(id);
  await appendLifecycleLog({ event: "purge", listingId: id, reason });
  return listing;
}

function shouldPurge(listing: ClassifiedListing, now: Date) {
  if (!listing.purgeAfter) return false;
  return Date.parse(listing.purgeAfter) <= now.getTime();
}

async function deliverOnce(options: {
  key: string;
  listingId: string;
  kind: string;
  message: MailMessage;
  now: Date;
  alsoClaim?: string[];
}) {
  let claimed = false;
  await updateClassifiedsStore((store) => {
    if (deliveryBlocks(store, options.key, options.now)) return store;
    claimed = true;
    const keys = [options.key, ...(options.alsoClaim || [])];
    const additions = keys.filter((key) => !deliveryBlocks(store, key, options.now)).map((key) => ({
      key,
      listingId: options.listingId,
      kind: options.kind,
      status: "claimed" as const,
      at: options.now.toISOString(),
      to: options.message.to,
      subject: options.message.subject,
    }));
    return { ...store, deliveries: [...store.deliveries, ...additions] };
  });
  if (!claimed) return false;
  try {
    await sendClassifiedsMail({ ...options.message, listingId: options.listingId });
    await updateClassifiedsStore((store) => ({
      ...store,
      deliveries: store.deliveries.map((item) => (
        item.key === options.key || options.alsoClaim?.includes(item.key)
          ? { ...item, status: "sent" as const, at: options.now.toISOString() }
          : item
      )),
    }));
    return true;
  } catch (error) {
    await updateClassifiedsStore((store) => ({
      ...store,
      deliveries: store.deliveries.map((item) => (
        item.key === options.key ? { ...item, status: "failed" as const, at: options.now.toISOString() } : item
      )),
    }));
    await appendLifecycleLog({
      event: "mail-failed",
      listingId: options.listingId,
      kind: options.kind,
      error: error instanceof Error ? error.message : "mail failed",
    });
    return false;
  }
}

function deliveryBlocks(store: ClassifiedsStore, key: string, now: Date) {
  return store.deliveries.some((item) => {
    if (item.key !== key) return false;
    if (item.status === "sent") return true;
    if (item.status === "claimed") return now.getTime() - Date.parse(item.at) < CLAIM_STALE_MS;
    return false;
  });
}

async function alreadySent(key: string) {
  const store = await readClassifiedsStore();
  return store.deliveries.some((item) => item.key === key && item.status === "sent");
}

async function assertRateLimit(key: string, limit: number, windowMs: number, now: Date) {
  let blocked = false;
  await updateClassifiedsStore((store) => {
    const cutoff = now.getTime() - windowMs;
    const rateHits = store.rateHits.filter((hit) => Date.parse(hit.at) >= cutoff);
    const count = rateHits.filter((hit) => hit.key === key).length;
    if (count >= limit) {
      blocked = true;
      return { ...store, rateHits };
    }
    return { ...store, rateHits: [...rateHits, { key, at: now.toISOString() }] };
  });
  if (blocked) throw new ClassifiedsError("Please wait a while before trying again.", 429);
}

async function clientHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("base64url").slice(0, 24);
}

function blankListing(id: string, now: Date): ClassifiedListing {
  const stamp = now.toISOString();
  return {
    id,
    slug: id,
    publicNumber: 0,
    status: "draft",
    tier: "free",
    sellerName: "",
    sellerEmail: "",
    sellerPhone: "",
    showPhone: false,
    title: "",
    make: "",
    model: "",
    year: null,
    lengthFeet: null,
    boatType: "sail",
    keel: "fin",
    engine: "",
    berths: null,
    location: "",
    cruisingGround: "solent",
    priceGbp: null,
    vatStatus: "unspecified",
    description: "",
    trailerable: false,
    liveaboard: false,
    photos: [],
    consentAt: "",
    createdAt: stamp,
    updatedAt: stamp,
    emailVerifiedAt: null,
    submittedAt: null,
    approvedAt: null,
    expiresAt: null,
    lifecycleAnchorAt: null,
    lifecycleGeneration: 0,
    soldAt: null,
    removedAt: null,
    rejectedAt: null,
    rejectionNote: "",
    expiredAt: null,
    purgeAfter: null,
    expiryAskSentAt: null,
    availabilityConfirmedAt: null,
    lastReminderAt: null,
    reminderCount: 0,
    extensionCount: 0,
    sellerEditedAt: null,
    moderationNote: "",
    example: false,
  };
}

function replaceListing(store: ClassifiedsStore, id: string, mutator: (listing: ClassifiedListing) => ClassifiedListing) {
  return {
    ...store,
    listings: store.listings.map((listing) => listing.id === id ? mutator(listing) : listing),
  };
}

function nextPublicNumber(store: ClassifiedsStore) {
  return store.listings.reduce((max, listing) => Math.max(max, listing.publicNumber || 0), 0) + 1;
}

async function uniqueSlug(title: string, id: string) {
  const store = await readClassifiedsStore();
  const base = slugify(title);
  const used = new Set(store.listings.filter((listing) => listing.id !== id).map((listing) => listing.slug));
  let slug = base;
  let suffix = 2;
  while (used.has(slug) || RESERVED_SLUGS.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "boat";
}

function ageMs(iso: string, now: Date) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 0;
  return now.getTime() - then;
}

export function boatsManagePath(token: string) {
  return absoluteUrl(`/boats-for-sale/manage/${encodeURIComponent(token)}`);
}
