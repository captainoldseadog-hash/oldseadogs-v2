#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startEditorStoreWorker } from "../tests/helpers/worker-fetch-client.mjs";

const projectDir = process.cwd();
const distDir = path.join(projectDir, "dist");
const manifestPath = path.join(projectDir, "reports", "phase-one-guides-live-homepage-manifest-2026-08-06.json");

async function filesUnder(root) {
  const output = [];
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile()) output.push(fullPath);
    }
  }
  await visit(root);
  return output;
}

const [siteContent, releaseCommon, ecosystem, manifest] = await Promise.all([
  fs.readFile(path.join(projectDir, "lib", "site-content.ts"), "utf8"),
  fs.readFile(path.join(projectDir, "deploy", "release-common.sh"), "utf8"),
  fs.readFile(path.join(projectDir, "ecosystem.config.cjs"), "utf8"),
  fs.readFile(manifestPath, "utf8").then(JSON.parse),
]);

assert.doesNotMatch(siteContent, /from\s+["']\.\.\/content\/homepage-production-snapshot["']/, "Fixture must not be statically imported.");
assert.match(siteContent, /await import\(["']\.\.\/content\/homepage-production-snapshot["']\)/, "Fixture import must remain dynamic.");
assert.match(siteContent, /Development fixture fallback is blocked in production/, "Production data failures must fail explicitly.");
assert.match(releaseCommon, /DATA_DIR="\$\{DATA_DIR:-\/var\/www\/oldseadogs-data\}"/);
assert.match(releaseCommon, /export OLDSEADOGS_DATA_DIR="\$DATA_DIR"/);
assert.match(ecosystem, /OLDSEADOGS_DATA_DIR:[^\n]+\/var\/www\/oldseadogs-data/);

const distFiles = await filesUnder(distDir);
const forbiddenRuntimeFiles = distFiles.filter((file) => {
  const relative = path.relative(distDir, file).split(path.sep).join("/");
  return path.basename(file) === "editor-store.json" ||
    relative.includes(".oldseadogs-data/") ||
    relative.includes("oldseadogs-data/");
});
assert.deepEqual(forbiddenRuntimeFiles, [], "Production bundle must not contain local editor or media stores.");

const currentLiveSlugs = [
  manifest.featuredStory.slug,
  ...manifest.latestStories.map((story) => story.slug),
];
const runtimeSourceFiles = [
  ...(await filesUnder(path.join(projectDir, "app"))),
  ...(await filesUnder(path.join(projectDir, "lib"))),
  ...(await filesUnder(path.join(projectDir, "content"))),
].filter((file) => /\.(?:ts|tsx|js|mjs|json)$/.test(file));
const runtimeText = (await Promise.all(runtimeSourceFiles.map((file) => fs.readFile(file, "utf8")))).join("\n");
const bundleText = (await Promise.all(distFiles.filter((file) => /\.(?:js|json|html)$/.test(file)).map((file) => fs.readFile(file, "utf8")))).join("\n");
for (const slug of currentLiveSlugs) {
  assert.equal(runtimeText.includes(slug), false, `Current live story slug is hard-coded in runtime source: ${slug}`);
  assert.equal(bundleText.includes(slug), false, `Current live story slug is hard-coded in the production bundle: ${slug}`);
}

const missingDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guides-missing-production-data-"));
let missingDataController;
try {
  missingDataController = await startEditorStoreWorker({
    projectDir,
    dataDir: missingDataDir,
    env: {
      NODE_ENV: "production",
      OLDSEADOGS_RUNTIME: "node",
      OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE: "true",
      OLDSEADOGS_SITE_URL: "http://localhost",
    },
  });
  const missingDataResponse = await missingDataController.fetch("http://localhost/");
  const missingDataHtml = await missingDataResponse.text();
  assert.notEqual(missingDataResponse.status, 200, "Missing production editor data must never silently render the development fixture.");
  assert.doesNotMatch(missingDataHtml, /back-2-black-wins-the-noakes-sydney-gold-coast-yacht-race/);
  assert.doesNotMatch(missingDataHtml, /Development-only fixture active/);
} finally {
  await missingDataController?.stop();
  await fs.rm(missingDataDir, { recursive: true, force: true });
}

const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guides-release-safety-"));
const stamp = "2026-08-06T09:00:00.000Z";
const ids = ["release-lead", "release-latest-a", "release-latest-b", "release-latest-c", "release-latest-d"];
const titles = [
  "Release safety lead story",
  "Harbour patrol confirms revised west channel markers",
  "Classic cutter returns to the Solent after restoration",
  "Volunteer lifeboat crew completes overnight rescue exercise",
  "Young dinghy sailors open the summer regatta series",
];
const stories = ids.map((id, index) => ({
  id,
  slug: id,
  title: titles[index],
  category: "News",
  sectionSlugs: ["news"],
  date: `2026-08-0${6 - index}`,
  author: "Old Sea Dogs",
  sourceType: "Original",
  sourceName: "Release safety fixture",
  sourceUrl: "",
  originalSourceType: "",
  originalSourceRef: "",
  originalSourceContent: "",
  imageUrl: `/images/release-safety-${index}.jpg`,
  imageAlt: `Release safety image ${index}`,
  imageCredit: "Old Sea Dogs",
  imageCaption: "Release safety only.",
  videoUrl: "",
  videoCaption: "",
  videoPosition: "",
  oldSeaDogsView: "A synthetic release-safety record proving the homepage remains data-driven.",
  sourceNotes: "Synthetic automated validation record.",
  methodNotes: "",
  contentBasis: "Synthetic validation",
  editorialStatus: "Keep live",
  noindex: false,
  summary: `Synthetic summary ${index} with enough detail for deterministic homepage validation.`,
  body: [Array.from({ length: 320 }, (_, word) => `safety${word}`).join(" ")],
  tags: ["Release safety"],
  readMinutes: 3,
  isFeatured: index === 0,
  status: "published",
  publishedAt: stamp,
  scheduledPublishAt: "",
  sortOrder: index,
  createdAt: stamp,
  updatedAt: stamp,
  statusHistory: [],
}));
const latestOrder = [ids[3], ids[1], ids[4], ids[2]];
await fs.writeFile(path.join(dataDir, "editor-store.json"), `${JSON.stringify({
  version: 1,
  stories,
  guides: [],
  media: [],
  galleryCategories: [],
  galleryItems: [],
  instagramImports: [],
  ads: [],
  settings: {
    homepageLeadStoryId: ids[0],
    homepageLeadStorySlug: ids[0],
    homepageLatestStoryIds: JSON.stringify(latestOrder),
    homepageEditorsChoiceStoryIds: "[]",
    homepageHiddenStoryIds: "[]",
  },
  socialEvents: [],
  pressReleases: [],
  blockedSenders: [],
  publicationOverrides: [],
  storyRevisions: [],
  updatedAt: stamp,
}, null, 2)}\n`, { mode: 0o600 });

let controller;
try {
  controller = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: {
      NODE_ENV: "production",
      OLDSEADOGS_RUNTIME: "node",
      OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE: "true",
      OLDSEADOGS_SITE_URL: "http://localhost",
    },
  });
  const response = await controller.fetch("http://localhost/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /href="\/stories\/release-lead"/);
  assert.match(html, /Discover Old Sea Dogs Guides/);
  assert.match(html, /href="\/guides"/);
  const latestStart = html.indexOf('id="latest"');
  const latestEnd = html.indexOf("</section>", latestStart);
  const latestHtml = html.slice(latestStart, latestEnd);
  let previousIndex = -1;
  for (const id of latestOrder) {
    const nextIndex = latestHtml.indexOf(`/stories/${id}`);
    assert.ok(nextIndex > previousIndex, `Latest story order must follow production settings: ${id}`);
    previousIndex = nextIndex;
  }
  assert.doesNotMatch(html, /back-2-black-wins-the-noakes-sydney-gold-coast-yacht-race/);
} finally {
  await controller?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
}

console.log("Guides release safety check passed: production data remains authoritative and no local store is bundled.");
