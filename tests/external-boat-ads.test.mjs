import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { readExternalBoatAds, shortExternalSnippet, EXTERNAL_BOAT_AD_SNIPPET_LIMIT } from "../lib/external-boat-ads.ts";

const projectDir = path.resolve(import.meta.dirname, "..");

const sampleIds = [
  "gumtree-newbridge-navigator-fareham",
  "gumtree-ywdb-poole",
  "ebay-trident-24-cowes",
  "ebay-hunter-delta-25-gosport",
  "yachtworld-contessa-32-brockenhurst",
  "yachtworld-jeanneau-so403-port-solent",
];

test("the draft file is the six sample advertisements", () => {
  const ads = readExternalBoatAds();
  assert.deepEqual(ads.map((ad) => ad.id), sampleIds);
  assert.deepEqual(ads.map((ad) => ad.source), ["Gumtree", "Gumtree", "eBay", "eBay", "YachtWorld", "YachtWorld"]);
  assert.equal(ads[0].makeModel, "Newbridge Navigator");
  assert.equal(ads[0].price, "£400");
  assert.equal(ads[0].year, null);
  assert.equal(ads[1].year, 2007);
  assert.equal(ads[2].url, "https://www.ebay.co.uk/itm/226120186441");
  assert.equal(ads[4].priceNote, "VAT included (broker listing)");
  assert.equal(ads[5].makeModel, "Jeanneau Sun Odyssey 40.3");
  for (const ad of ads) {
    assert.ok(ad.snippet.length > 0 && ad.snippet.length <= EXTERNAL_BOAT_AD_SNIPPET_LIMIT, ad.id);
    assert.equal(ad.url.startsWith("https://"), true, ad.id);
  }
  assert.equal(ads[0].thumbnail, "/images/boats/external/gumtree-newbridge-navigator-fareham.jpg");
  assert.equal(ads[1].thumbnail, "/images/boats/external/gumtree-ywdb-poole.jpg");
  assert.deepEqual(ads.slice(2).map((ad) => ad.thumbnail), [null, null, null, null]);
});

test("a long seller write-up is cut to a short snippet", () => {
  const writeUp = "A".repeat(EXTERNAL_BOAT_AD_SNIPPET_LIMIT + 40);
  const snippet = shortExternalSnippet(writeUp);
  assert.ok(snippet.length <= EXTERNAL_BOAT_AD_SNIPPET_LIMIT);
  assert.ok(snippet.endsWith("…"));
});

test("external cards keep photographs off the card face", async () => {
  const component = await fs.readFile(path.join(projectDir, "components/boats/ExternalBoatAds.tsx"), "utf8");
  const page = await fs.readFile(path.join(projectDir, "app/boats-for-sale/page.tsx"), "utf8");
  const css = await fs.readFile(path.join(projectDir, "app/globals.css"), "utf8");
  const data = await fs.readFile(path.join(projectDir, "content/external-boat-ads.json"), "utf8");
  const placeholder = component.slice(
    component.indexOf("external-boat-ad-placeholder"),
    component.indexOf("external-boat-ad-body"),
  );
  assert.doesNotMatch(placeholder, /<img|thumbnail|background-image/);
  assert.match(component, /external-boat-ad-preview[\s\S]*ad\.thumbnail/);
  assert.match(page, /<ExternalBoatAds \/>/);
  assert.match(page, /function Card\([\s\S]*listing\.photos\[0\]/);
  for (const source of [component, page, css, data]) {
    assert.doesNotMatch(source, /seen elsewhere/i);
  }
  for (const ad of readExternalBoatAds()) {
    if (!ad.thumbnail) continue;
    const file = await fs.stat(path.join(projectDir, "public", ad.thumbnail));
    assert.ok(file.size > 0, ad.thumbnail);
  }
});
