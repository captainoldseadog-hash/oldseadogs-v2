import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const words = Array.from({ length: 90 }, (_, index) => `creek${index + 1}`).join(" ");
const heroAlt = "Chichester Harbour viewed across its tidal waters and shoreline";

function guide(overrides) {
  return {
    id: overrides.slug,
    status: "published",
    noindex: false,
    showOnHomepage: false,
    homepageOrder: 0,
    author: "Michael Hodges",
    updatedAt: "2026-08-12T09:00:00.000Z",
    imageUrl: "/images/guides/guides-solent-needles-hero-v1.png",
    imageAlt: heroAlt,
    summary: `${overrides.title} is a published collection fixture.`,
    introduction: `${overrides.title} introduction for the collection hub.`,
    sections: [{ heading: "Overview", body: [words] }],
    location: { latitude: 50.8132069, longitude: -0.8964437 },
    navigation: { latitude: 50.8132069, longitude: -0.8964437 },
    verification: { verifiedAt: "2026-08-12", unresolved: [] },
    ...overrides,
  };
}

const editorStore = {
  version: 1,
  stories: [],
  guides: [
    guide({
      internalId: "OSD-G300",
      slug: "chichester-harbour",
      title: "Chichester Harbour",
      guideType: "Cruising Area",
      regionKey: "chichester-harbour",
      regionName: "Chichester Harbour",
      parentGuideSlug: "the-solent",
      canonicalPath: "/guides/chichester-harbour",
    }),
    guide({
      internalId: "OSD-G301",
      slug: "itchenor",
      title: "Itchenor",
      guideType: "Destination",
      regionKey: "chichester-harbour",
      regionName: "Chichester Harbour",
      parentGuideSlug: "chichester-harbour",
      canonicalPath: "/guides/chichester-harbour/itchenor",
      imageAlt: "Sailing boats at Itchenor in Chichester Harbour",
    }),
  ],
  media: [],
  galleryCategories: [],
  galleryItems: [],
  instagramImports: [],
  ads: [],
  settings: {},
  socialEvents: [],
  pressReleases: [],
  blockedSenders: [],
  publicationOverrides: [],
  storyRevisions: [],
  guideRevisions: [],
  updatedAt: "2026-08-12T09:00:00.000Z",
};

let controller;
let dataDir;

function jsonLdObjects(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-chichester-hub-"));
  await fs.writeFile(path.join(dataDir, "editor-store.json"), `${JSON.stringify(editorStore, null, 2)}\n`, { mode: 0o600 });
  controller = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" },
  });
});

after(async () => {
  await controller?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("the Chichester collection hub has Article and Place data, a hero alt, and a menu link", async () => {
  const response = await controller.fetch("http://localhost/guides/chichester-harbour");
  assert.equal(response.status, 200);
  const html = await response.text();
  const data = jsonLdObjects(html);
  const article = data.find((item) => item["@type"] === "Article" && item.headline === "Chichester Harbour");
  assert.ok(article, "collection hub publishes an Article for the cruising area");
  assert.equal(article.about?.["@type"], "Place");
  assert.equal(article.about?.name, "Chichester Harbour");
  const place = data.find((item) => item["@type"] === "Place" && item.name === "Chichester Harbour");
  assert.equal(place.geo.latitude, 50.8132069);
  assert.equal(place.geo.longitude, -0.8964437);

  const hero = html.match(/class="guide-region-hero"[\s\S]*?<img\b[^>]*>/);
  assert.ok(hero, "collection hub keeps its header image");
  assert.match(hero[0], new RegExp(`alt="${heroAlt}"`));
  assert.match(html, /See the full\s*(?:<!-- -->)?Chichester Harbour(?:<!-- -->)? collection/);
  assert.match(html, /Search Chichester Harbour Guides/);
  assert.doesNotMatch(html, /full Solent collection/);
  assert.doesNotMatch(html, /Search Solent Guides/);

  const menu = html.match(/aria-label="Mobile navigation"[\s\S]*?<\/nav>/);
  assert.ok(menu);
  assert.match(menu[0], /href="\/guides\/solent"/);
  assert.match(menu[0], /href="\/guides\/poole-harbour"/);
  assert.match(menu[0], /href="\/guides\/chichester-harbour"/);
  assert.match(menu[0], /Chichester Harbour/);

  const index = await controller.fetch("http://localhost/guides");
  assert.equal(index.status, 200);
  const indexHtml = await index.text();
  assert.match(indexHtml, /guide-area-card[\s\S]*href="\/guides\/chichester-harbour"[\s\S]*Chichester Harbour/);

  const solent = await controller.fetch("http://localhost/guides/solent");
  assert.equal(solent.status, 200);
  const solentHtml = await solent.text();
  assert.match(solentHtml, /"@type":"Article"/);
  assert.match(solentHtml, /Explore The Solent/);
  assert.doesNotMatch(solentHtml, /guide-region-hero/);
});
