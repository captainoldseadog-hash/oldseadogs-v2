import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { westCountrySecondWaveGuideSeeds } from "../content/west-country-second-wave-guides.ts";
import { guideMapCoordinates } from "../content/guide-map-coordinates.ts";
import { guideConditions } from "../content/guide-conditions.ts";
import { guidePublicPath } from "../lib/guides.ts";
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
test("second-wave West Country harbours nest under the area with paintings, pins and tide links", async () => {
  assert.deepEqual(westCountrySecondWaveGuideSeeds.map((g) => g.slug), ["torquay", "yealm", "mevagissey", "st-mawes", "newlyn", "padstow"]);
  for (const g of westCountrySecondWaveGuideSeeds) {
    assert.equal(guidePublicPath(g), `/guides/west-country/${g.slug}`);
    assert.ok((await fs.stat(path.join(projectDir, "public", g.imageUrl))).size > 100_000);
    assert.ok(guideMapCoordinates[g.slug]);
    assert.equal(guideConditions[g.slug]?.tide, "none");
    assert.ok(g.sections.length >= 8);
  }
});
