import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { guideProductSeeds } from "../content/guide-product-seeds.ts";
import {
  solentMarinaGuideGroups,
  solentMarinaGuideRecords,
  solentMarinaGuideSeeds,
} from "../content/solent-marina-guides.ts";
import { validateGuideInput } from "../lib/guide-validation.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const expectedSlugs = [
  "port-hamble-marina",
  "mercury-yacht-harbour",
  "universal-marina",
  "swanwick-marina",
  "deacons-marina",
  "ocean-village-marina",
  "hythe-marina-village",
  "haslar-marina",
  "gosport-marina",
  "port-solent-marina",
  "lymington-yacht-haven",
  "berthon-lymington-marina",
  "island-harbour",
  "east-cowes-marina",
];
const requiredSections = [
  "Setting & Character",
  "Arrival by Sea",
  "Berthing Experience",
  "Facilities Afloat",
  "Marine Services",
  "Ashore",
  "Best For",
  "Less Suitable For",
  "History & Local Character",
  "Nearby Cruising",
  "Skipper’s Notes",
  "Old Sea Dogs View",
  "Information checked against official sources",
];
const phaseOneFactLabels = new Set([
  "Guide Type",
  "Region",
  "Local Waterway",
  "Country",
  "Harbour Authority",
  "Harbour Office",
  "Telephone",
  "Harbour Speed Limit",
  "Wash",
  "Harbour VHF",
  "Marina Arrival VHF",
  "Fuel",
  "Main Entrance",
  "Alternative Entrance",
  "Chain Ferry",
  "Lock Information",
  "Tide Restrictions",
  "Navigation Notes",
  "Operator",
  "Marina Address",
  "Email",
  "Reception Hours",
  "Berths",
  "Maximum LOA",
  "Maximum Draft",
]);
const unsupportedPhaseTwoFactLabels = new Set([
  "Location",
  "VHF",
  "Reception",
  "Water",
  "Electricity",
  "Laundry",
  "Wi-Fi",
  "Pump-out",
  "Parking",
]);

function validateBatch(slugs) {
  const records = solentMarinaGuideRecords.filter((record) => slugs.includes(record.slug));
  assert.deepEqual(records.map((record) => record.slug), slugs);
  for (const record of records) {
    const guide = solentMarinaGuideSeeds.find((item) => item.slug === record.slug);
    assert.ok(guide);
    assert.equal(guide.sections.length, requiredSections.length);
    assert.equal(guide.sourceLinks[0].href, record.sources[0].url);
  }
}

test("Phase Two contains exactly fourteen typed, ordered Solent marina records", () => {
  assert.equal(solentMarinaGuideRecords.length, 14);
  assert.deepEqual(solentMarinaGuideRecords.map((record) => record.slug), expectedSlugs);
  assert.deepEqual(solentMarinaGuideRecords.map((record) => record.internalId),
    Array.from({ length: 14 }, (_, index) => `OSD-G${String(index + 11).padStart(3, "0")}`));
  assert.deepEqual(solentMarinaGuideRecords.map((record) => record.editorialOrder),
    Array.from({ length: 14 }, (_, index) => index + 11));
  assert.equal(new Set(solentMarinaGuideRecords.map((record) => record.slug)).size, 14);
});

test("the fourteen marinas use the five approved Solent area groups", () => {
  assert.deepEqual(solentMarinaGuideGroups, [
    { label: "River Hamble", slugs: ["port-hamble-marina", "mercury-yacht-harbour", "universal-marina", "swanwick-marina", "deacons-marina"] },
    { label: "Southampton Water", slugs: ["ocean-village-marina", "hythe-marina-village"] },
    { label: "Portsmouth Harbour", slugs: ["haslar-marina", "gosport-marina", "port-solent-marina"] },
    { label: "Western Solent", slugs: ["lymington-yacht-haven", "berthon-lymington-marina"] },
    { label: "Isle of Wight", slugs: ["island-harbour", "east-cowes-marina"] },
  ]);
  assert.deepEqual(solentMarinaGuideGroups.flatMap((group) => group.slugs), expectedSlugs);
});

test("Batch One validates Port Hamble, Mercury, Universal, Swanwick and Deacons", () => {
  const slugs = expectedSlugs.slice(0, 5);
  validateBatch(slugs);
  assert.notEqual(
    solentMarinaGuideRecords[0].media.primaryImage,
    "/images/guides/guides-marina-hamble-point-hero-v1.png",
  );
});

test("Batch Two validates Ocean Village, Hythe, Haslar, Gosport and Port Solent", () => {
  validateBatch(expectedSlugs.slice(5, 10));
  assert.equal(solentMarinaGuideRecords.find((record) => record.slug === "hythe-marina-village").arrival.lockDetails, "Controlled lock, operated 24 hours.");
  assert.match(solentMarinaGuideRecords.find((record) => record.slug === "port-solent-marina").arrival.lockDetails, /orientation only/);
});

test("Batch Three validates the two Lymington marinas, Island Harbour and East Cowes", () => {
  validateBatch(expectedSlugs.slice(10));
  assert.equal(solentMarinaGuideRecords.find((record) => record.slug === "island-harbour").media.supportingImages.length, 1);
  assert.match(solentMarinaGuideRecords.find((record) => record.slug === "lymington-yacht-haven").berthing.maximumDraft, /3 metres below chart datum/);
});

test("every marina seed has the complete public section, SEO, source and safety structure", () => {
  const allSlugs = new Set([...guideProductSeeds, ...solentMarinaGuideSeeds].map((guide) => guide.slug));
  for (const [index, guide] of solentMarinaGuideSeeds.entries()) {
    const record = solentMarinaGuideRecords[index];
    assert.equal(guide.guideType, "Marina");
    assert.equal(guide.regionKey, "solent");
    assert.equal(guide.canonicalPath, `/guides/solent/${guide.slug}`);
    assert.deepEqual(guide.sections.map((section) => section.heading), requiredSections);
    assert.ok(guide.seoTitle.includes(record.officialName));
    assert.ok(guide.seoDescription.length >= 80);
    assert.ok(guide.socialTitle.length > 0);
    assert.ok(guide.socialDescription.length > 0);
    assert.ok(guide.quickFacts.length > 0);
    assert.equal(new Set(guide.quickFacts.map((fact) => fact.label)).size, guide.quickFacts.length);
    for (const fact of guide.quickFacts) {
      assert.ok(phaseOneFactLabels.has(fact.label), `${guide.slug} uses unsupported fact label ${fact.label}`);
      assert.ok(fact.value.trim().length > 0, `${guide.slug} has a blank ${fact.label} card`);
      assert.equal(unsupportedPhaseTwoFactLabels.has(fact.label), false, `${guide.slug} exposes ${fact.label}`);
    }
    assert.deepEqual(guide.verifiedFacilities, []);
    assert.equal(guide.location.latitude, undefined);
    assert.equal(guide.location.longitude, undefined);
    assert.equal(record.sources.length > 0, true);
    for (const source of record.sources) {
      assert.match(source.url, /^https:\/\//);
      assert.equal(source.verifiedOn, "2026-08-06");
      assert.ok(source.supportedFields.length > 0);
    }
    assert.ok(guide.quickFacts.some((fact) => fact.label === "Operator" && fact.value === record.operator));
    assert.ok(guide.quickFacts.some((fact) => fact.label === "Marina Address" && fact.value === record.address));
    assert.ok(guide.quickFacts.some((fact) => fact.label === "Telephone" && fact.value === record.telephone));
    if (record.vhfChannel) assert.ok(guide.quickFacts.some((fact) => fact.label === "Marina Arrival VHF"));
    else assert.equal(guide.quickFacts.some((fact) => fact.label === "Marina Arrival VHF"), false);
    assert.match(guide.sections.at(-1).body.join(" "), /6 August 2026/);
    assert.doesNotThrow(() => validateGuideInput({ ...guide, status: "published" }));
    for (const relation of [
      ...guide.relatedGuideSlugs,
      ...guide.cruiseOnGuideSlugs,
      guide.previousGuideSlug,
      guide.nextGuideSlug,
    ].filter(Boolean)) {
      assert.ok(allSlugs.has(relation), `${guide.slug} has broken relationship ${relation}`);
    }
    const publicCopy = [guide.summary, guide.introduction, ...guide.sections.flatMap((section) => section.body)].join(" ");
    assert.doesNotMatch(publicCopy, /(?:^|[.!?]\s+)(?:And|But)\s/);
    const safetyCopy = [...guide.checklist, publicCopy].join(" ");
    assert.match(safetyCopy, /current charts|current harbour|current River|current Portsmouth|current Cowes/i);
    assert.match(safetyCopy, /never navigation|does not replace|not a substitute|orientation only/i);
  }
});

test("all approved marina artwork is controlled, local and used once as intended", async () => {
  const usedImages = [];
  for (const record of solentMarinaGuideRecords) {
    usedImages.push(record.media.primaryImage, ...record.media.supportingImages.map((image) => image.url));
  }
  assert.equal(usedImages.length, 15);
  assert.equal(new Set(usedImages).size, 15);
  for (const imageUrl of usedImages) {
    assert.match(imageUrl, /^\/images\/guides\/guides-marina-/);
    const stat = await fs.stat(path.join(projectDir, "public", imageUrl.replace(/^\/images\//, "images/")));
    assert.ok(stat.isFile());
    assert.ok(stat.size > 100_000);
  }
  for (const record of solentMarinaGuideRecords) {
    assert.equal(record.media.originalFilename, path.basename(record.media.primaryImage));
    for (const image of record.media.supportingImages) {
      assert.equal(image.originalFilename, path.basename(image.url));
    }
  }
  const portHamble = solentMarinaGuideRecords.find((record) => record.slug === "port-hamble-marina");
  assert.notEqual(portHamble.media.primaryImage, "/images/guides/guides-marina-hamble-point-hero-v1.png");
  const islandHarbour = solentMarinaGuideRecords.find((record) => record.slug === "island-harbour");
  assert.equal(islandHarbour.media.supportingImages.length, 1);
  assert.match(islandHarbour.media.supportingImages[0].originalFilename, /spice-bus/);
});

test("Phase Two uses the shared Phase One fact grid and omits unavailable values and map placeholders", async () => {
  const source = await fs.readFile(path.join(projectDir, "components/GuidePublicContent.tsx"), "utf8");
  assert.match(source, /className="guide-facts"/);
  assert.doesNotMatch(source, /MarinaGuidePracticalReference/);
  assert.doesNotMatch(source, /solentMarinaGuideBySlug/);
  assert.doesNotMatch(source, /Not published — confirm directly/);
  assert.doesNotMatch(source, /No navigation map is published in this edition/);
  assert.equal(solentMarinaGuideRecords.find((record) => record.slug === "deacons-marina").vhfChannel, null);
  assert.equal(solentMarinaGuideRecords.find((record) => record.slug === "universal-marina").berthing.berthCount, null);
  assert.equal(solentMarinaGuideSeeds.find((guide) => guide.slug === "deacons-marina").quickFacts.some((fact) => fact.label === "Marina Arrival VHF"), false);
  assert.equal(solentMarinaGuideSeeds.find((guide) => guide.slug === "universal-marina").quickFacts.some((fact) => fact.label === "Berths"), false);
});

test("Phase Two preserves the approved homepage, cookie and story-publication code byte for byte", async () => {
  const protectedFiles = {
    // Option C: approved mobile/tablet hero and Guide promotion over the canonical feed.
    "app/page.tsx": "e88760bd3440568095f058003d3f56c047d4762752ebaffe47c21ef8c67b3a62",
    // Option C follow-up: retain current/legacy recovery and a cookie spanning bare/www hosts.
    "components/CookieConsent.tsx": "f102748f9ae7cfce13e38bdb62771af5c98db2f126cd7e96dbc2dbd24dfd79b5",
    "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
    "content/homepage-production-snapshot.ts": "464346a0a9c6be2b34b168aae6a53b8d28b53016ad41d6c17a85c41a18ca1066",
    "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
    "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  };
  for (const [filename, expectedHash] of Object.entries(protectedFiles)) {
    const contents = await fs.readFile(path.join(projectDir, filename));
    assert.equal(crypto.createHash("sha256").update(contents).digest("hex"), expectedHash, filename);
  }
});
