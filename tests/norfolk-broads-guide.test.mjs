import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { norfolkBroadsGuideSeeds } from "../content/norfolk-broads-guide.ts";
import { norfolkBroadsStopGuideSeeds, norfolkBroadsStopOrder } from "../content/norfolk-broads-stops-guides.ts";
import { guideMapCoordinates, guideMapExcludedSlugs } from "../content/guide-map-coordinates.ts";
import { guideFaqs } from "../content/guide-faqs.ts";
import { guidePublicPath } from "../lib/guides.ts";
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
test("Norfolk Broads hub: windmill hero, sailboat inline, excluded from pins, links every stop", async () => {
  const [g] = norfolkBroadsGuideSeeds;
  assert.equal(guidePublicPath(g), "/guides/norfolk-broads");
  assert.equal(g.guideType, "Cruising Area");
  assert.match(g.imageUrl, /guides-norfolk-broads-v1\.png$/);
  assert.equal(g.inlineImages.length, 1);
  for (const url of [g.imageUrl, ...g.inlineImages.map((i) => i.url)]) assert.ok((await fs.stat(path.join(projectDir, "public", url))).size > 100_000);
  assert.ok(!guideMapCoordinates["norfolk-broads"]); assert.ok(guideMapExcludedSlugs.has("norfolk-broads"));
  const area = g.sections.find((s) => s.heading === "In This Area");
  assert.deepEqual(area.links.map((l) => l.guideSlug), [...norfolkBroadsStopOrder]);
  assert.ok(guideFaqs["norfolk-broads"].length >= 3);
});
test("Norfolk Broads stops: 14 children with pins, FAQs, chain and honest images", async () => {
  assert.equal(norfolkBroadsStopGuideSeeds.length, 14);
  const slugs = norfolkBroadsStopGuideSeeds.map((g) => g.slug);
  norfolkBroadsStopGuideSeeds.forEach((g, i) => {
    assert.equal(g.regionKey, "norfolk-broads"); assert.equal(g.parentGuideSlug, "norfolk-broads");
    assert.equal(guidePublicPath(g), `/guides/norfolk-broads/${g.slug}`);
    assert.ok(guideMapCoordinates[g.slug], g.slug);
    assert.ok(guideFaqs[g.slug]?.length >= 3, g.slug);
    assert.equal(g.previousGuideSlug, i ? slugs[i - 1] : "norfolk-broads");
    assert.equal(g.nextGuideSlug, slugs[i + 1] ?? "norfolk-broads");
    if (!["reedham", "potter-heigham", "wroxham-hoveton", "horning", "acle", "great-yarmouth", "brundall"].includes(g.slug)) { assert.match(g.imageUrl, /guides-sail-boat-norfolk-broads-v1\.png$/); assert.match(g.imageCaption, /painting by Michael Hodges/); assert.doesNotMatch(JSON.stringify(g), /Photo to follow|placeholder/i); }
  });
  for (const g of norfolkBroadsStopGuideSeeds) assert.ok((await fs.stat(path.join(projectDir, "public", g.imageUrl))).size > 1000);
});
