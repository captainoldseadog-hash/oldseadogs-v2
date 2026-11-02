import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { westCountrySixGuideSeeds } from "../content/west-country-six-guides.ts";
import { guideMapCoordinates } from "../content/guide-map-coordinates.ts";
import { guideConditions } from "../content/guide-conditions.ts";
import { guidePublicPath } from "../lib/guides.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const slugs = ["brixham", "salcombe", "plymouth", "fowey", "falmouth", "helford"];

test("six West Country harbours nest under the area with paintings, pins and tide links", async () => {
  assert.deepEqual(westCountrySixGuideSeeds.map((g) => g.slug), slugs);
  for (const g of westCountrySixGuideSeeds) {
    assert.equal(g.parentGuideSlug, "west-country");
    assert.equal(g.regionKey, "west-country");
    assert.equal(guidePublicPath(g), `/guides/west-country/${g.slug}`);
    assert.equal(g.imageUrl, `/images/guides/guides-${g.slug}-v1.png`);
    const stat = await fs.stat(path.join(projectDir, "public", g.imageUrl));
    assert.ok(stat.size > 100_000, g.imageUrl);
    assert.ok(guideMapCoordinates[g.slug], `pin ${g.slug}`);
    assert.equal(guideConditions[g.slug]?.tide, "none");
    assert.match(guideConditions[g.slug].tideLink.href, /^https:\/\//);
  }
});
