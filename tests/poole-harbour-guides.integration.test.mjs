import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { guideAreaChildren, guideCruisingArea, guideProductRecords, guidePublicPath } from "../lib/guides.ts";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const storeFixturePath = path.join(projectDir, "tests/fixtures/guide-management-characterisation-editor-store.json");
const pooleFixturePath = path.join(projectDir, "tests/fixtures/poole-harbour-oldseadogs-guide-batch-create-draft-v1.json");
const expectedSlugs = [
  "poole-harbour",
  "poole-quay-boat-haven",
  "port-of-poole-marina",
  "cobbs-quay-marina",
  "salterns-marina",
  "parkstone-bay-marina",
  "lake-yard-marina",
  "sandbanks",
  "brownsea-island",
];

let controller;
let dataDir;
let storePath;
let fixtureText;
let fixture;
let imported;

async function readStore() { return JSON.parse(await fs.readFile(storePath, "utf8")); }
async function post(payload, expectedStatus = 200) {
  const response = await controller.fetch("http://localhost/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, expectedStatus, await response.clone().text());
  return response.json();
}

before(async () => {
  fixtureText = await fs.readFile(pooleFixturePath, "utf8");
  fixture = JSON.parse(fixtureText);
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-poole-guides-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.copyFile(storeFixturePath, storePath);
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

test("the byte-verified Poole batch is the approved nine-record Draft contract", () => {
  assert.equal(crypto.createHash("sha256").update(fixtureText).digest("hex"), "b10ac5e5d3122cf31da39a9aaa71e911a12b937d884a771584de9aaab4cad078");
  assert.deepEqual(
    { contract: fixture.contract, version: fixture.version, mode: fixture.mode },
    { contract: "oldseadogs.guide-draft", version: 1, mode: "create-draft" },
  );
  assert.equal(fixture.guides.length, 9);
  assert.deepEqual(fixture.guides.map((guide) => guide.slug), expectedSlugs);
  assert.equal(fixture.guides.some((guide) => "guide" in guide), false, "Guide fields must be directly inside guides[]");
  assert.equal(fixture.guides.every((guide) => (guide.editorial?.warnings || []).every((warning) => typeof warning === "object" && warning.text.trim())), true);
  const unresolved = fixture.guides.flatMap((guide) => guide.verification?.unresolved || []);
  assert.equal(unresolved.filter((issue) => issue.severity === "safety").length, 16);
  assert.equal(unresolved.filter((issue) => issue.severity === "editorial" && issue.field === "media.heroImage").length, 9);
  assert.equal(fixture.guides.every((guide) => !guide.media?.heroImage), true);
  assert.equal(JSON.stringify(fixture).includes('"publish"'), false);
});

test("Poole dry run writes nothing and confirmation atomically creates nine private Drafts", async () => {
  const beforeText = await fs.readFile(storePath, "utf8");
  const before = JSON.parse(beforeText);
  const dryRun = await post({ action: "validateGuideImport", format: "json", mode: "create-draft", content: fixtureText });
  assert.deepEqual(dryRun.plan.summary, { total: 9, valid: 9, warnings: 9, blocked: 0, creates: 9, updates: 0, duplicates: 0 });
  assert.equal(await fs.readFile(storePath, "utf8"), beforeText, "Validate / Dry Run must perform zero writes");

  const confirmation = await post({ action: "confirmGuideImport", planToken: dryRun.plan.planToken });
  imported = confirmation.imported;
  assert.equal(imported.length, 9);
  assert.deepEqual(imported.map((guide) => guide.slug), expectedSlugs);
  assert.equal(imported.every((guide) => guide.status === "draft" && guide.noindex && guide.seo.noindex), true);
  assert.equal(imported.every((guide) => !guide.showOnHomepage && guide.homepageOrder === 0), true);
  assert.equal(imported.every((guide) => guide.publication.publishedAt === null && guide.publication.scheduledAt === null), true);
  assert.equal(imported.every((guide) => !guide.media?.heroImage && !guide.imageUrl), true);
  assert.equal(imported[0].parentGuideSlug, "");
  assert.equal(imported.slice(1).every((guide) => guide.parentGuideSlug === "poole-harbour"), true);
  assert.equal(imported[0].canonicalPath, "/guides/poole-harbour");
  assert.equal(imported.slice(1).every((guide) => guide.canonicalPath === `/guides/poole-harbour/${guide.slug}`), true);

  const stored = await readStore();
  const storyState = (stories) => stories.map(({ id, slug, title, status, publishedAt, scheduledPublishAt }) => ({ id, slug, title, status, publishedAt, scheduledPublishAt }));
  assert.deepEqual(storyState(stored.stories), storyState(before.stories), "Guide import must not change story records or workflows");
  assert.deepEqual(stored.settings, before.settings, "Guide import must not change Homepage Manager settings");
  assert.equal(stored.guides.filter((guide) => guide.regionKey === "poole-harbour").length, 9);
});

test("relationship helpers support Poole and a future third area without a new route", () => {
  const area = guideCruisingArea("poole-harbour", imported);
  assert.equal(area?.slug, "poole-harbour", JSON.stringify(imported.map(({ slug, guideType, regionKey, parentGuideSlug }) => ({ slug, guideType, regionKey, parentGuideSlug }))));
  assert.deepEqual(guideAreaChildren(area, imported).map((guide) => guide.slug), expectedSlugs.slice(1));
  assert.equal(guidePublicPath(area), "/guides/poole-harbour");

  const third = imported.map((guide, index) => ({
    ...guide,
    id: `third-${index}`,
    externalId: `third-${index}`,
    internalId: `OSD-G${900 + index}`,
    regionKey: "future-coast",
    regionName: "Future Coast",
    slug: index === 0 ? "future-coast" : `future-place-${index}`,
    parentGuideSlug: index === 0 ? "" : "future-coast",
    canonicalPath: "",
  }));
  const thirdArea = guideCruisingArea("future-coast", third);
  assert.equal(thirdArea?.slug, "future-coast");
  assert.equal(guideAreaChildren(thirdArea, third).length, 8);
  assert.equal(guidePublicPath(thirdArea), "/guides/future-coast");
});

test("Solent ordering, shared renderer, preview, sitemap and production integrations remain protected", async () => {
  const solent = { ...imported[0], id: "solent-root", externalId: "", internalId: "OSD-G001", slug: "the-solent", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "", canonicalPath: "/guides/solent/the-solent" };
  const combined = guideProductRecords([...imported, solent]);
  assert.equal(combined[0].regionKey, "solent", "the established lower Guide IDs keep the Solent collection first");
  const [regionRoute, detailRoute, renderer, sitemap, editorRoute, guideManager, css, seo] = await Promise.all([
    fs.readFile(path.join(projectDir, "app/guides/[region]/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/guides/[region]/[guide]/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "components/GuidePublicContent.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/sitemap.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "app/api/editor/route.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "app/editor/guides/GuideManager.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/globals.css"), "utf8"),
    fs.readFile(path.join(projectDir, "lib/seo.ts"), "utf8"),
  ]);
  assert.match(regionRoute, /guideCruisingArea/);
  assert.match(regionRoute, /<GuidePublicContent guide=\{areaGuide\}/);
  assert.doesNotMatch(regionRoute, /region === ["']poole-harbour["']/);
  assert.match(detailRoute, /guideRegionPath/);
  assert.match(renderer, /Hero image pending/);
  assert.match(css, /\.guide-image-pending/);
  assert.match(sitemap, /guidePublicPath\(guide\) !== guideRegionPath/);
  assert.match(editorRoute, /confirmGuideImport/);
  assert.match(guideManager, /GuideBulkImport/);
  assert.match(seo, /G-88HT8MHR7T/);
});
