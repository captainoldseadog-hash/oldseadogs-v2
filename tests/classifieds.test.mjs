import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { CLASSIFIEDS_MAX_PHOTO_BYTES, CLASSIFIEDS_RETENTION_DAYS, addDays } from "../lib/classifieds-types.ts";
import { setClassifiedsMailSinkForTests } from "../lib/classifieds-mail.ts";
import { processClassifiedPhoto } from "../lib/classifieds-photos.ts";
import { filterPublicListings, toPublicListing } from "../lib/classifieds-public.ts";
import { publicCacheDisposition } from "../lib/public-cache-policy.ts";
import { clearClassifiedsCaches, classifiedsStorePath, readClassifiedsStore, updateClassifiedsStore } from "../lib/classifieds-store.ts";
import { readClassifiedsToken, signClassifiedsToken } from "../lib/classifieds-tokens.ts";
import { validateListingSubmission } from "../lib/classifieds-validation.ts";
import { assertClassifiedsSeedAllowed } from "../lib/classifieds-seed.ts";
import {
  ClassifiedsError,
  createBoatDraft,
  editorBoatListings,
  getListingById,
  listPublicBoatListings,
  moderateBoatListing,
  relayBoatEnquiry,
  runClassifiedsLifecycle,
  saveBoatPhoto,
  submitBoatAdvertisement,
  verifyBoatEmail,
  applySellerAction,
} from "../lib/classifieds-service.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-boats-"));
process.env.OLDSEADOGS_DATA_DIR = dataDir;
process.env.OLDSEADOGS_CLASSIFIEDS_TOKEN_SECRET = "classifieds-test-secret";
process.env.OLDSEADOGS_ENV = "test";
delete process.env.OLDSEADOGS_SMTP_HOST;
delete process.env.OLDSEADOGS_ENABLE_CLASSIFIEDS_SEED;

const mailbox = [];
setClassifiedsMailSinkForTests((message) => {
  mailbox.push(message);
});

const sellerEmail = "sentinel-seller@private.example";
const started = new Date("2026-01-01T00:00:00.000Z");

function request(pathname, headers = {}) {
  const headerMap = new Map(Object.entries({ accept: "text/html", ...headers }).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    method: "GET",
    pathname,
    searchParams: { has: () => false },
    header: (name) => headerMap.get(name.toLowerCase()) || null,
  };
}

function validInput(overrides = {}) {
  return {
    sellerName: "Jane Helm",
    sellerEmail,
    sellerPhone: "",
    showPhone: false,
    title: "Salt Petrel",
    make: "Westerly",
    model: "Centaur",
    year: 1974,
    lengthFeet: 26,
    boatType: "sail",
    keel: "bilge",
    engine: "Diesel",
    berths: 6,
    location: "Hamble Point Marina",
    cruisingGround: "solent",
    priceGbp: 18500,
    vatStatus: "not_applicable",
    description: "A fictional bilge-keel cruiser used only to prove the classifieds desk. She is not for sale.",
    trailerable: false,
    liveaboard: true,
    consent: true,
    ...overrides,
  };
}

async function resetStore() {
  clearClassifiedsCaches();
  mailbox.length = 0;
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.mkdir(dataDir, { recursive: true });
}

async function tinyJpeg() {
  return new Uint8Array(await sharp({
    create: { width: 24, height: 16, channels: 3, background: { r: 18, g: 57, b: 68 } },
  }).jpeg().toBuffer());
}

async function listingReadyForReview(now = started) {
  const draft = await createBoatDraft(now);
  await saveBoatPhoto({ token: draft.draftToken, bytes: await tinyJpeg(), declaredType: "image/jpeg", now });
  await submitBoatAdvertisement(validInput(), { token: draft.draftToken, ip: "203.0.113.10", now });
  const pendingEmail = (await readClassifiedsStore()).listings[0];
  const verify = mailbox.find((message) => message.subject.includes("Confirm your email"));
  const token = verify.text.match(/verify\/([^)\s]+)/)[1];
  await verifyBoatEmail(decodeURIComponent(token), now);
  return { id: pendingEmail.id, draftToken: draft.draftToken };
}

test("submission validation rejects an incomplete advertisement and accepts a bilge-keel boat", () => {
  const missing = validateListingSubmission({ title: "X", consent: false, keel: "bilge" });
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.equal(missing.errors.sellerName, "Enter your name.");
    assert.match(missing.errors.sellerEmail, /never show it publicly/);
    assert.equal(missing.errors.consent.includes("privacy"), true);
  }
  const accepted = validateListingSubmission(validInput());
  assert.equal(accepted.ok, true);
  if (accepted.ok) assert.equal(accepted.value.keel, "bilge");
  const honeypot = validateListingSubmission(validInput({ companyWebsite: "https://spam.example" }));
  assert.equal(honeypot.ok, false);
});

test("sending an advertisement before a photograph asks for a photograph", async () => {
  await assert.rejects(
    () => submitBoatAdvertisement(validInput(), { token: "", ip: "203.0.113.40" }),
    (error) => error instanceof ClassifiedsError && error.status === 400 && error.errors.photos === "Add at least one photograph.",
  );
});

test("email verification, moderation and the public view hide the seller email", async () => {
  await resetStore();
  const created = await listingReadyForReview();
  assert.equal((await getListingById(created.id)).status, "pending");
  assert.deepEqual(await listPublicBoatListings(started), []);
  const approved = await moderateBoatListing("approve", created.id, {}, started);
  assert.equal(approved.status, "approved");
  const [publicListing] = await listPublicBoatListings(started);
  const serialised = JSON.stringify(publicListing);
  assert.equal(publicListing.keel, "bilge");
  assert.doesNotMatch(serialised, /sentinel-seller@private\.example/);
  assert.equal("sellerEmail" in publicListing, false);
  assert.match(publicListing.chartLabel, /SOLENT/);
  const rejected = await moderateBoatListing("reject", (await createAndVerify("Another Boat")).id, { note: "Not this one" }, started);
  assert.equal(rejected.status, "rejected");
  assert.equal((await listPublicBoatListings(started)).some((item) => item.id === rejected.id), false);
});

async function createAndVerify(title) {
  const draft = await createBoatDraft(started);
  await saveBoatPhoto({ token: draft.draftToken, bytes: await tinyJpeg(), declaredType: "image/jpeg", now: started });
  await submitBoatAdvertisement(validInput({ title, sellerEmail: `other.${title.replace(/\s+/g, "").toLowerCase()}@private.example` }), { token: draft.draftToken, ip: `203.0.113.${title.length}`, now: started });
  const verify = mailbox.at(-1);
  const token = verify.text.match(/verify\/([^)\s]+)/)[1];
  await verifyBoatEmail(decodeURIComponent(token), started);
  return (await readClassifiedsStore()).listings.find((listing) => listing.title === title);
}

test("lifecycle sends fortnightly reminders, asks at 90 days, extends once, and expires without a double send", async () => {
  await resetStore();
  const created = await listingReadyForReview();
  await moderateBoatListing("approve", created.id, {}, started);
  mailbox.length = 0;

  const tooSoon = await runClassifiedsLifecycle(addDays(started, 13));
  assert.deepEqual(tooSoon.sent, []);

  const firstReminder = await runClassifiedsLifecycle(addDays(started, 14));
  assert.equal(firstReminder.sent.length, 1);
  assert.match(mailbox.at(-1).subject, /still running/);
  assert.match(mailbox.at(-1).text, /Manage this advertisement/);
  const repeat = await runClassifiedsLifecycle(addDays(started, 14));
  assert.deepEqual(repeat.sent, []);
  assert.equal(mailbox.length, 1);

  const second = await runClassifiedsLifecycle(addDays(started, 28));
  assert.equal(second.sent.length, 1);
  assert.equal(mailbox.length, 2);

  const askAt = addDays(started, 90);
  const asked = await runClassifiedsLifecycle(askAt);
  assert.equal(asked.sent.length, 1);
  assert.match(mailbox.at(-1).subject, /keep your free boat advertisement running/i);
  assert.match(mailbox.at(-1).text, /Keep my ad running for another 3 months/);
  const askAgain = await runClassifiedsLifecycle(askAt);
  assert.deepEqual(askAgain.sent, []);

  const keepToken = decodeURIComponent(mailbox.at(-1).text.match(/keep\/([^)\s]+)/)[1]);
  await applySellerAction(keepToken, "keep", {}, addDays(askAt, 1));
  const extended = await getListingById(created.id);
  assert.equal(extended.status, "approved");
  assert.equal(extended.expiresAt, addDays(askAt, 91).toISOString());
  await assert.rejects(applySellerAction(keepToken, "keep", {}, addDays(askAt, 2)), ClassifiedsError);

  const quiet = await runClassifiedsLifecycle(addDays(askAt, 2));
  assert.deepEqual(quiet.sent, []);
  const afterExtension = await runClassifiedsLifecycle(addDays(askAt, 1 + 14));
  assert.equal(afterExtension.sent.length, 1);
  assert.match(mailbox.at(-1).subject, /still running/);
});

test("an unanswered 90-day check expires the advertisement once, then hides it", async () => {
  await resetStore();
  const created = await listingReadyForReview();
  await moderateBoatListing("approve", created.id, {}, started);
  mailbox.length = 0;
  const askAt = addDays(started, 90);
  await runClassifiedsLifecycle(askAt);
  const stillLive = await runClassifiedsLifecycle(addDays(askAt, 13));
  assert.equal((await getListingById(created.id)).status, "approved");
  assert.deepEqual(stillLive.expired, []);
  assert.equal((await listPublicBoatListings(addDays(askAt, 1))).length, 0);

  const ended = await runClassifiedsLifecycle(addDays(askAt, 14));
  assert.deepEqual(ended.expired, [created.id]);
  assert.match(mailbox.at(-1).subject, /has ended/);
  assert.match(mailbox.at(-1).text, /List this boat again/);
  const again = await runClassifiedsLifecycle(addDays(askAt, 14));
  assert.deepEqual(again.sent, []);
  assert.equal(mailbox.filter((message) => message.subject.includes("has ended")).length, 1);
  const expired = await getListingById(created.id);
  assert.equal(expired.status, "expired");
  assert.equal(toPublicListing(expired, [], addDays(askAt, 14)), null);
  const relistToken = decodeURIComponent(mailbox.at(-1).text.match(/relist\/([^)\s]+)/)[1]);
  await applySellerAction(relistToken, "relist", {}, addDays(askAt, 15));
  assert.equal((await getListingById(created.id)).status, "pending");
});

test("signed links expire, reject tampering, and do not carry the seller email", async () => {
  const token = await signClassifiedsToken("manage", "boat_123", started);
  const payload = await readClassifiedsToken(token, "manage", started);
  assert.equal(payload.l, "boat_123");
  assert.equal(await readClassifiedsToken(token, "keep", started), null);
  assert.equal(await readClassifiedsToken(token, "manage", addDays(started, 22)), null);
  const [body, signature] = token.split(".");
  assert.equal(await readClassifiedsToken(`${body}.${signature.slice(0, -1)}a`, "manage", started), null);
  assert.doesNotMatch(Buffer.from(body, "base64url").toString("utf8"), /@/);
});

test("photograph limits and location metadata are enforced", async () => {
  await resetStore();
  const draft = await createBoatDraft(started);
  await assert.rejects(
    saveBoatPhoto({ token: draft.draftToken, bytes: new Uint8Array(CLASSIFIEDS_MAX_PHOTO_BYTES + 1), declaredType: "image/jpeg", now: started }),
    (error) => error instanceof ClassifiedsError && error.status === 413,
  );
  await assert.rejects(
    saveBoatPhoto({ token: draft.draftToken, bytes: new Uint8Array([1, 2, 3, 4]), declaredType: "image/jpeg", now: started }),
    ClassifiedsError,
  );
  await updateClassifiedsStore((store) => ({
    ...store,
    listings: store.listings.map((listing) => ({
      ...listing,
      photos: Array.from({ length: 30 }, (_, index) => ({ id: `photo_${index}`, alt: "x", width: 1, height: 1, bytes: 1, createdAt: started.toISOString() })),
    })),
  }));
  await assert.rejects(
    saveBoatPhoto({ token: draft.draftToken, bytes: await tinyJpeg(), declaredType: "image/jpeg", now: started }),
    (error) => error instanceof ClassifiedsError && /30 photographs/.test(error.message),
  );

  const described = await sharp({
    create: { width: 20, height: 12, channels: 3, background: { r: 20, g: 40, b: 60 } },
  }).jpeg().toBuffer();
  const withSecret = await sharp(described).withMetadata({
    exif: { IFD0: { ImageDescription: "GPS-SECRET-LOCATION-51.5" } },
  }).jpeg().toBuffer();
  assert.match(Buffer.from(withSecret).toString("latin1"), /GPS-SECRET-LOCATION-51\.5/);
  const processed = await processClassifiedPhoto(new Uint8Array(withSecret), "image/jpeg");
  assert.doesNotMatch(Buffer.from(processed.webp).toString("latin1"), /GPS-SECRET-LOCATION/);
});

test("buyer enquiries and public pages never reveal the seller email", async () => {
  await resetStore();
  const created = await listingReadyForReview();
  await moderateBoatListing("approve", created.id, {}, started);
  mailbox.length = 0;
  await relayBoatEnquiry({
    slug: (await getListingById(created.id)).slug,
    name: "Alex Buyer",
    email: "alex.buyer@example.com",
    message: "Is she still available this weekend?",
  }, { ip: "198.51.100.8", now: started });
  assert.equal(mailbox.at(-1).to, sellerEmail);
  assert.equal(mailbox.at(-1).replyTo, "alex.buyer@example.com");
  const [publicListing] = await listPublicBoatListings(started);
  assert.doesNotMatch(JSON.stringify(publicListing), new RegExp(sellerEmail.replace(".", "\\.")));
  for (const relative of [
    "app/boats-for-sale/page.tsx",
    "app/boats-for-sale/[slug]/page.tsx",
    "components/BoatsForSaleTeaser.tsx",
    "components/boats/BoatGallery.tsx",
  ]) {
    const source = await fs.readFile(path.join(projectDir, relative), "utf8");
    assert.doesNotMatch(source, /sellerEmail|seller\.email/, relative);
  }
});

test("browse filters understand keel, length, price and cruising ground", async () => {
  const listings = [
    { ...samplePublic("a"), keel: "bilge", lengthFeet: 26, priceGbp: 18000, cruisingGround: "solent", trailerable: false, liveaboard: true, year: 1974 },
    { ...samplePublic("b"), keel: "fin", lengthFeet: 40, priceGbp: 90000, cruisingGround: "scotland", trailerable: false, liveaboard: false, year: 2010 },
  ];
  const filtered = filterPublicListings(listings, { keel: "bilge", maxLength: "30", maxPrice: "20000", ground: "solent", liveaboard: "1" });
  assert.deepEqual(filtered.map((item) => item.id), ["a"]);
});

test("public browse and listing pages can be cached, while forms, manage links and APIs cannot", () => {
  for (const pathname of ["/boats-for-sale", "/boats-for-sale/salt-petrel"]) {
    assert.equal(publicCacheDisposition(request(pathname)), "public-document", pathname);
  }
  for (const pathname of [
    "/boats-for-sale/list-your-boat",
    "/boats-for-sale/manage/token",
    "/boats-for-sale/verify/token",
    "/boats-for-sale/keep/token",
    "/boats-for-sale/relist/token",
    "/api/boats/submit",
    "/api/boats/lifecycle",
    "/editor/boats",
  ]) {
    assert.equal(publicCacheDisposition(request(pathname)), "private", pathname);
  }
  assert.equal(publicCacheDisposition(request("/boats-media/photo_1")), "omit");
});

test("the scheduler hook runs the boats lifecycle without replacing story publication", async () => {
  const hook = await fs.readFile(path.join(projectDir, "scripts/story-scheduler-hook.mjs"), "utf8");
  assert.match(hook, /publishScheduledStories/);
  assert.match(hook, /\/api\/boats\/lifecycle/);
  assert.match(hook, /runClassifiedsLifecycle/);
});

test("example boats are refused in production and classifieds writes do not touch the CMS store", async () => {
  const previous = process.env.OLDSEADOGS_ENV;
  process.env.OLDSEADOGS_ENV = "production";
  assert.throws(assertClassifiedsSeedAllowed, /not loaded in production/);
  process.env.OLDSEADOGS_ENV = previous;
  delete process.env.OLDSEADOGS_ENABLE_CLASSIFIEDS_SEED;
  assert.throws(assertClassifiedsSeedAllowed, /OLDSEADOGS_ENABLE_CLASSIFIEDS_SEED/);
  await resetStore();
  await listingReadyForReview();
  await assert.rejects(fs.access(path.join(dataDir, "editor-store.json")));
  assert.equal(path.basename(await classifiedsStorePath()), "classifieds-store.json");
  const helm = await editorBoatListings();
  assert.equal(helm.length, 1);
  assert.equal(helm[0].sellerEmail, sellerEmail);
  assert.equal(CLASSIFIEDS_RETENTION_DAYS, 183);
});

function samplePublic(id) {
  return {
    id,
    slug: id,
    publicNumber: "No. 001",
    title: id,
    make: "Maker",
    model: "Model",
    year: 2000,
    lengthLabel: "26 ft",
    lengthFeet: 26,
    boatType: "sail",
    boatTypeLabel: "Sail",
    keel: "fin",
    keelLabel: "Fin keel",
    engine: "",
    berths: 4,
    location: "Hamble",
    cruisingGround: "solent",
    cruisingGroundLabel: "Solent",
    chartLabel: "SOLENT",
    priceLabel: "£1",
    priceGbp: 1,
    vatLabel: "VAT not stated",
    description: "A test boat with enough words.",
    trailerable: false,
    liveaboard: false,
    photos: [],
    sellerName: "Seller",
    phone: "",
    tier: "free",
    listedDays: 1,
    listedLabel: "Listed 1 day ago",
    confirmedLabel: "Confirmed available",
    marinaGuide: null,
    example: false,
  };
}
