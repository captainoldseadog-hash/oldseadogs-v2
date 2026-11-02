import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { westCountryGuideSeeds } from "../content/west-country-guides.ts";
import { guideProductSeeds } from "../content/guide-product-seeds.ts";
import { solentMarinaGuideSeeds } from "../content/solent-marina-guides.ts";
import { flagshipGuides } from "../content/flagship-guides.ts";
import { guidePublicPath, guideDiscoveryAreas, guideProductRecords } from "../lib/guides.ts";

function guideWordCount(guide) {
  return [guide.summary, ...guide.sections.flatMap((section) => [section.heading, ...section.body]), ...guide.checklist]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const area = westCountryGuideSeeds.find((guide) => guide.slug === "west-country");
const dartmouth = westCountryGuideSeeds.find((guide) => guide.slug === "dartmouth");

function published(guide) {
  return {
    ...guide,
    status: "published",
    noindex: false,
    showOnHomepage: true,
    homepageOrder: guide.editorialOrder,
    tags: [],
    featuredMediaId: "",
    inlineImages: [],
    introduction: guide.introduction,
  };
}

test("West Country is an area hub and Dartmouth is its only harbour page", () => {
  assert.equal(westCountryGuideSeeds.length, 2);
  assert.ok(area);
  assert.ok(dartmouth);
  assert.equal(guidePublicPath(area), "/guides/west-country");
  assert.equal(guidePublicPath(dartmouth), "/guides/west-country/dartmouth");
  assert.equal(area.guideType, "Cruising Area");
  assert.equal(area.regionKey, "west-country");
  assert.equal(area.regionName, "West Country");
  assert.equal(dartmouth.regionKey, "west-country");
  assert.equal(dartmouth.regionName, "West Country");
  assert.equal(dartmouth.parentGuideSlug, "west-country");
  assert.equal(dartmouth.guideType, "Harbour");
  assert.deepEqual(
    westCountryGuideSeeds.map((guide) => guide.slug),
    ["west-country", "dartmouth"],
  );
  const laterHops = ["salcombe", "fowey", "falmouth", "plymouth", "noss", "noss-on-dart"];
  for (const slug of laterHops) {
    assert.equal(westCountryGuideSeeds.some((guide) => guide.slug === slug), false, slug);
  }
});

test("heroes use the supplied paintings and the Old Sea Dogs credit line", async () => {
  assert.equal(area.imageUrl, "/images/guides/guides-west-country-durdle-door-v1.png");
  assert.equal(area.imageCaption, "Durdle Door, Dorset Jurassic Coast, illustrated for Old Sea Dogs Guides.");
  assert.equal(area.artworkCredit, "Artwork supplied by Old Sea Dogs");
  assert.match(area.introduction, /Durdle Door is well worth seeing/);
  assert.equal(dartmouth.imageUrl, "/images/guides/guides-dartmouth-v1.png");
  assert.equal(dartmouth.imageCaption, "Dartmouth, illustrated for Old Sea Dogs Guides.");
  assert.equal(dartmouth.artworkCredit, "Artwork supplied by Old Sea Dogs");
  for (const file of [area.imageUrl, dartmouth.imageUrl]) {
    const stat = await fs.stat(path.join(projectDir, "public", file));
    assert.ok(stat.size > 100_000, file);
  }
});

test("Dartmouth is the only map pin and tide pages are official links", () => {
  assert.equal(area.location?.latitude, undefined);
  assert.equal(dartmouth.location.latitude, 50.3518);
  assert.equal(dartmouth.location.longitude, -3.5789);
  const tideHrefs = dartmouth.sections.flatMap((section) => section.links || []).map((link) => link.href);
  assert.ok(tideHrefs.includes("https://www.dartharbour.org/forecasts/"));
  assert.ok(tideHrefs.includes("https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/23"));
  assert.ok(tideHrefs.includes("https://easytide.admiralty.co.uk/"));
  const text = JSON.stringify(westCountryGuideSeeds);
  assert.equal(text.includes("£"), false);
  assert.match(text, /1\.8 m/);
  assert.match(text, /2 m/);
  assert.match(text, /Channel 11/);
  assert.match(text, /Channel 80/);
  assert.match(text, /Ch 6/);
  assert.match(text, /Ch 69/);
  assert.match(text, /confirm the channel/i);
  assert.match(text, /Noss on Dart/);
  assert.match(text, /Weymouth & Portland/);
  assert.ok(dartmouth.relatedGuideSlugs.includes("weymouth-portland"));
  assert.ok(area.relatedGuideSlugs.includes("weymouth-portland"));
});

test("both guides are long enough to publish and appear in the guides index", () => {
  for (const guide of westCountryGuideSeeds) {
    assert.ok(guideWordCount(published(guide)) >= 80, guide.slug);
    assert.match(guide.internalId, /^OSD-G\d+$/);
  }
  const publishedSeeds = [
    ...guideProductSeeds,
    ...solentMarinaGuideSeeds,
    ...westCountryGuideSeeds,
    ...flagshipGuides,
  ].map(published);
  const records = guideProductRecords(publishedSeeds);
  const areas = guideDiscoveryAreas(records);
  const west = areas.find((item) => item.key === "west-country");
  assert.ok(west);
  assert.equal(west.name, "West Country");
  assert.equal(west.path, "/guides/west-country");
  assert.equal(west.guideCount, 1);
  assert.equal(west.directGuides[0].slug, "dartmouth");
  const slugs = new Set(records.map((guide) => guide.slug));
  assert.equal(slugs.has("salcombe"), false);
  assert.equal(slugs.has("fowey"), false);
  assert.equal(slugs.has("falmouth"), false);
  assert.equal(slugs.has("plymouth"), false);
});

test("guide copy does not invent a separate Noss page or extra West Country harbours", async () => {
  const source = await fs.readFile(path.join(projectDir, "content/west-country-guides.ts"), "utf8");
  assert.equal(source.includes('slug: "salcombe"'), false);
  assert.equal(source.includes('slug: "fowey"'), false);
  assert.equal(source.includes('slug: "falmouth"'), false);
  assert.equal(source.includes('slug: "plymouth"'), false);
  assert.equal(source.includes('slug: "noss"'), false);
  assert.match(source, /2026 visitors page is the authority/);
});
