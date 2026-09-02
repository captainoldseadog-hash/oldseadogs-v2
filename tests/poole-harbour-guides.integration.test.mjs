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
const releaseFixturePath = path.join(projectDir, "release/poole-harbour-guides/poole-harbour-oldseadogs-guide-batch-create-draft-v1.json");
const mediaManifestPath = path.join(projectDir, "release/poole-harbour-guides/media-manifest.json");
const mediaSourceDir = path.join(projectDir, "release/poole-harbour-guides/images");
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
let mediaManifest;
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

async function postForm(url, form, expectedStatus = 200) {
  const response = await controller.fetch(`http://localhost${url}`, { method: "POST", body: form });
  assert.equal(response.status, expectedStatus, await response.clone().text());
  return response.json();
}

before(async () => {
  fixtureText = await fs.readFile(pooleFixturePath, "utf8");
  fixture = JSON.parse(fixtureText);
  mediaManifest = JSON.parse(await fs.readFile(mediaManifestPath, "utf8"));
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

test("the byte-verified Poole batch and nine supplied images form the approved handoff", async () => {
  assert.equal(crypto.createHash("sha256").update(fixtureText).digest("hex"), "b10ac5e5d3122cf31da39a9aaa71e911a12b937d884a771584de9aaab4cad078");
  assert.equal(await fs.readFile(releaseFixturePath, "utf8"), fixtureText, "the release handoff must retain the approved batch byte-for-byte");
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
  assert.equal(mediaManifest.schema, "oldseadogs.guide-media-handoff");
  assert.equal(mediaManifest.images.length, 9);
  assert.deepEqual(mediaManifest.images.map((image) => image.guideSlug), expectedSlugs);
  assert.equal(new Set(mediaManifest.images.map((image) => image.filename)).size, 9);
  assert.equal(mediaManifest.images.every((image) => image.credit === "" && image.alt.trim() && image.caption.trim()), true);
  for (const image of mediaManifest.images) {
    const bytes = await fs.readFile(path.join(mediaSourceDir, image.filename));
    assert.equal(bytes.byteLength, image.bytes, `${image.filename} byte size`);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), image.sha256, `${image.filename} SHA-256`);
  }
});

test("real Media Library uploads resolve and confirmation atomically creates nine illustrated private Drafts", async () => {
  const uploadedBySlug = new Map();
  for (const image of mediaManifest.images) {
    const bytes = await fs.readFile(path.join(mediaSourceDir, image.filename));
    const form = new FormData();
    form.append("action", "uploadMedia");
    form.append("photo", new File([bytes], image.filename, { type: "image/png" }));
    form.append("alt", image.alt);
    const upload = await postForm("/api/editor/media/upload", form);
    assert.match(upload.mediaId, /^media_/);
    assert.equal(upload.mediaUrl, `/api/media/${upload.mediaId}`);
    assert.equal(upload.media.width, image.width);
    assert.equal(upload.media.height, image.height);
    const updated = await post({
      action: "updateMedia",
      id: upload.mediaId,
      media: {
        displayName: image.guideTitle,
        internalTitle: `${image.guideTitle} Guide hero`,
        alt: image.alt,
        description: image.alt,
        caption: image.caption,
        credit: image.credit,
        creditLine: image.credit,
        collectionsJson: JSON.stringify(["Poole Harbour Guides"]),
      },
    });
    assert.equal(updated.media.caption, image.caption);
    assert.equal(updated.media.credit, image.credit);
    uploadedBySlug.set(image.guideSlug, updated.media);
  }

  const completedFixture = structuredClone(fixture);
  for (const guide of completedFixture.guides) {
    const image = mediaManifest.images.find((item) => item.guideSlug === guide.slug);
    const media = uploadedBySlug.get(guide.slug);
    assert.ok(image && media, `missing mapped Media Library upload for ${guide.slug}`);
    guide.media = {
      ...(guide.media || {}),
      heroImage: {
        mediaId: media.id,
        url: media.url,
        alt: image.alt,
        caption: image.caption,
        credit: image.credit,
        focalPoint: image.focalPoint,
      },
    };
    guide.verification.unresolved = guide.verification.unresolved.filter(
      (issue) => !(issue.severity === "editorial" && issue.field === "media.heroImage"),
    );
  }
  const completedFixtureText = JSON.stringify(completedFixture);
  const completedUnresolved = completedFixture.guides.flatMap((guide) => guide.verification.unresolved);
  assert.equal(completedUnresolved.filter((issue) => issue.severity === "safety").length, 16);
  assert.equal(completedUnresolved.filter((issue) => issue.severity === "editorial" && issue.field === "media.heroImage").length, 0);

  const beforeText = await fs.readFile(storePath, "utf8");
  const before = JSON.parse(beforeText);
  const dryRun = await post({ action: "validateGuideImport", format: "json", mode: "create-draft", content: completedFixtureText });
  assert.deepEqual(dryRun.plan.summary, { total: 9, valid: 9, warnings: 8, blocked: 0, creates: 9, updates: 0, duplicates: 0 });
  assert.equal(dryRun.plan.items.every((item) => item.mediaStatus === "valid"), true);
  assert.equal(dryRun.plan.items.flatMap((item) => item.warnings).some((warning) => /No hero image is supplied/.test(warning)), false);
  assert.equal(await fs.readFile(storePath, "utf8"), beforeText, "Validate / Dry Run must perform zero writes");

  const confirmation = await post({ action: "confirmGuideImport", planToken: dryRun.plan.planToken });
  imported = confirmation.imported;
  assert.equal(imported.length, 9);
  assert.deepEqual(imported.map((guide) => guide.slug), expectedSlugs);
  assert.equal(imported.every((guide) => guide.status === "draft" && guide.noindex && guide.seo.noindex), true);
  assert.equal(imported.every((guide) => !guide.showOnHomepage && guide.homepageOrder === 0), true);
  assert.equal(imported.every((guide) => guide.publication.publishedAt === null && guide.publication.scheduledAt === null), true);
  assert.equal(imported.every((guide) => guide.media?.heroImage?.mediaId && guide.imageUrl === guide.media.heroImage.url), true);
  assert.equal(imported.every((guide) => guide.imageAlt === guide.media.heroImage.alt && guide.imageCaption === guide.media.heroImage.caption), true);
  assert.equal(imported.every((guide) => (guide.imageCredit || "") === "" && (guide.media.heroImage.credit || "") === ""), true);
  assert.equal(imported.flatMap((guide) => guide.verification.unresolved).filter((issue) => issue.severity === "safety").length, 16);
  assert.equal(imported.flatMap((guide) => guide.verification.unresolved).filter((issue) => issue.field === "media.heroImage").length, 0);
  assert.equal(imported[0].parentGuideSlug, "");
  assert.equal(imported.slice(1).every((guide) => guide.parentGuideSlug === "poole-harbour"), true);
  assert.equal(imported[0].canonicalPath, "/guides/poole-harbour");
  assert.equal(imported.slice(1).every((guide) => guide.canonicalPath === `/guides/poole-harbour/${guide.slug}`), true);

  const stored = await readStore();
  const storyState = (stories) => stories.map(({ id, slug, title, status, publishedAt, scheduledPublishAt }) => ({ id, slug, title, status, publishedAt, scheduledPublishAt }));
  assert.deepEqual(storyState(stored.stories), storyState(before.stories), "Guide import must not change story records or workflows");
  assert.deepEqual(stored.settings, before.settings, "Guide import must not change Homepage Manager settings");
  assert.equal(stored.guides.filter((guide) => guide.regionKey === "poole-harbour").length, 9);
  const uploadedIds = new Set([...uploadedBySlug.values()].map((media) => media.id));
  assert.equal(stored.media.filter((media) => uploadedIds.has(media.id)).length, 9);
  assert.equal(stored.media.filter((media) => media.collectionsJson === '["Poole Harbour Guides"]').length, 9);
  for (const guide of imported) {
    const response = await controller.fetch(`http://localhost${guide.imageUrl}`);
    assert.equal(response.status, 200, `${guide.title} media reference must resolve`);
    assert.equal(response.headers.get("content-type"), "image/webp");
  }

  const safetyBlockedGuide = imported.find((guide) => guide.verification.unresolved.some((issue) => issue.severity === "safety"));
  assert.ok(safetyBlockedGuide, "at least one imported Guide must retain a safety publication blocker");
  const blockedPublish = await post({ action: "publishGuide", id: safetyBlockedGuide.id, expectedUpdatedAt: safetyBlockedGuide.updatedAt }, 400);
  assert.match(blockedPublish.error, /Resolve all safety-critical navigation uncertainties/);
  assert.equal((await readStore()).guides.find((guide) => guide.id === safetyBlockedGuide.id).status, "draft");
  assert.equal((await readStore()).guides.filter((guide) => guide.regionKey === "poole-harbour").every((guide) => guide.status === "draft"), true);
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
