import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(projectDir, "tests/fixtures/guide-management-characterisation-editor-store.json");
const slug = "managed-foundation-marina";
let controller;
let dataDir;
let storePath;
let created;
let edited;
let duplicate;
let published;

const enoughWords = Array.from({ length: 115 }, (_, index) => `harbourword${index + 1}`).join(" ");

async function request(pathname, init = {}) {
  return controller.fetch(`http://localhost${pathname}`, init);
}

async function post(payload) {
  return request("/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function jsonPost(payload, expectedStatus = 200) {
  const response = await post(payload);
  assert.equal(response.status, expectedStatus, await response.clone().text());
  return response.json();
}

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

function draftInput(overrides = {}) {
  return {
    slug,
    title: "Managed Foundation Marina Guide",
    guideType: "Marina",
    regionKey: "solent",
    regionName: "The Solent",
    area: "Test Harbour",
    editorial: {
      standfirst: "A server-managed marina Draft used to verify the safe Guide publishing foundation.",
      introduction: "This is an authenticated CMS Draft and not navigation advice.",
      sections: [{ heading: "Overview", body: [enoughWords] }],
      oldSeaDogsView: ["The useful point is that publication is now an explicit content operation."],
    },
    navigation: { latitude: 50.8, longitude: -1.3 },
    marina: { fuel: { available: true, detail: "Available", sourceUrl: "https://example.com/official", verifiedAt: "2026-08-12" } },
    media: {
      heroImage: {
        mediaId: "characterisation-guide-media",
        url: "/api/media/characterisation-guide-media",
        alt: "A test marina used to verify Guide management",
        caption: "Disposable Guide test media",
        credit: "Old Sea Dogs test fixture",
      },
    },
    verification: {
      verifiedAt: "2026-08-12",
      sources: [{ label: "Official test source", url: "https://example.com/official", accessedAt: "2026-08-12" }],
      unresolved: [],
    },
    ...overrides,
  };
}

function jsonLdObjects(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guide-management-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.copyFile(fixturePath, storePath);
  controller = await startEditorStoreWorker({ projectDir, dataDir, env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" } });
});

after(async () => {
  await controller?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("create Draft is sanitized, private, noindexed and never mutates Homepage Manager", async () => {
  const settingsBefore = structuredClone((await readStore()).settings);
  const result = await jsonPost({ action: "saveGuideDraft", guide: { ...draftInput(), status: "published", showOnHomepage: true } });
  created = result.guide;
  assert.equal(created.status, "draft");
  assert.equal(created.noindex, true);
  assert.equal(created.showOnHomepage, false);
  assert.ok(created.id.startsWith("guide_"));
  assert.match(created.internalId, /^OSD-G\d+$/);
  assert.equal(created.publication.publishedAt, null);
  assert.equal(created.publication.scheduledAt, null);
  assert.equal(created.summary, draftInput().editorial.standfirst);
  assert.equal(created.imageUrl, "/api/media/characterisation-guide-media");
  assert.equal(created.location.latitude, 50.8);
  assert.ok(created.quickFacts.some((fact) => fact.label === "Fuel"));
  assert.ok(created.verifiedFacilities.some((facility) => facility.label === "Fuel"));
  assert.equal((await request(`/guides/solent/${slug}`)).status, 404);
  assert.doesNotMatch(await (await request("/sitemap.xml")).text(), new RegExp(slug));
  assert.deepEqual((await readStore()).settings, settingsBefore);
});

test("edit Draft creates an audit snapshot and stale edits return 409 without overwrite", async () => {
  const first = await jsonPost({
    action: "saveGuideDraft",
    guide: { ...created, title: "Managed Foundation Marina Guide Edited", noindex: false },
    expectedUpdatedAt: created.updatedAt,
  });
  edited = first.guide;
  assert.equal(edited.title, "Managed Foundation Marina Guide Edited");
  assert.equal(edited.noindex, false);
  assert.notEqual(edited.updatedAt, created.updatedAt);

  const stale = await jsonPost({
    action: "saveGuideDraft",
    guide: { ...created, title: "Stale overwrite attempt" },
    expectedUpdatedAt: created.updatedAt,
  }, 409);
  assert.match(stale.error, /Reload and compare/);
  const stored = (await readStore()).guides.find((guide) => guide.slug === slug);
  assert.equal(stored.title, "Managed Foundation Marina Guide Edited");
  assert.ok((await readStore()).guideRevisions.some((item) => item.reason === "Material CMS Draft edit" && item.actor === "Bridge editor"));
});

test("duplicate creates an independent Draft with new identity and leaves the original unchanged", async () => {
  const originalBefore = structuredClone((await readStore()).guides.find((guide) => guide.slug === slug));
  const result = await jsonPost({ action: "duplicateGuide", id: edited.id, guide: { slug: `${slug}-copy`, title: "Independent Marina Copy" } });
  duplicate = result.guide;
  assert.notEqual(duplicate.id, edited.id);
  assert.notEqual(duplicate.internalId, edited.internalId);
  assert.equal(duplicate.status, "draft");
  assert.equal(duplicate.noindex, true);
  assert.equal(duplicate.showOnHomepage, false);
  assert.equal(duplicate.publication.publishedAt, null);
  assert.deepEqual((await readStore()).guides.find((guide) => guide.slug === slug), originalBefore);
});

test("authenticated Draft preview uses the existing Guide renderer", async () => {
  const response = await request(`/editor/preview/guide/${slug}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Managed Foundation Marina Guide Edited/);
  assert.match(html, /guide-product-hero/);
  assert.match(html, /guide-section-navigation/);
  assert.match(html, /Old Sea Dogs View/);
});

test("publication rejects missing media and unresolved safety uncertainty", async () => {
  const invalidMedia = await jsonPost({ action: "saveGuideDraft", guide: draftInput({ slug: "invalid-media-guide", title: "Invalid Media Guide", media: { heroImage: { mediaId: "missing-media", url: "/api/media/missing-media", alt: "Missing" } } }) });
  const missing = await jsonPost({ action: "publishGuide", id: invalidMedia.guide.id, expectedUpdatedAt: invalidMedia.guide.updatedAt }, 400);
  assert.match(missing.error, /does not exist in the media library/);

  const unsafe = await jsonPost({ action: "saveGuideDraft", guide: draftInput({ slug: "unresolved-safety-guide", title: "Unresolved Safety Guide", verification: { unresolved: [{ field: "navigation.depths", reason: "Not verified", severity: "safety" }] } }) });
  const unresolved = await jsonPost({ action: "publishGuide", id: unsafe.guide.id, expectedUpdatedAt: unsafe.guide.updatedAt }, 400);
  assert.match(unresolved.error, /Resolve all safety-critical/);
});

test("explicit publish makes the Guide public, indexable, canonical and structured", async () => {
  const result = await jsonPost({ action: "publishGuide", id: edited.id, expectedUpdatedAt: edited.updatedAt });
  published = result.guide;
  assert.equal(published.status, "published");
  assert.equal(published.noindex, false);
  assert.ok(Date.parse(published.publication.publishedAt));
  assert.equal(published.publication.scheduledAt, null);

  const response = await request(`/guides/solent/${slug}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /max-image-preview:large/);
  assert.match(html, new RegExp(`rel="canonical" href="https://oldseadogs\\.com/guides/solent/${slug}"`));
  const data = jsonLdObjects(html);
  const article = data.find((item) => item["@type"] === "Article" && item.headline === published.title);
  assert.equal(article.datePublished, published.publication.publishedAt);
  assert.ok(data.some((item) => item["@type"] === "BreadcrumbList"));
  const place = data.find((item) => item["@type"] === "Place" && item.name === published.title);
  assert.equal(place.geo.latitude, 50.8);

  const sitemap = await (await request("/sitemap.xml")).text();
  assert.match(sitemap, new RegExp(`<loc>https://oldseadogs\\.com/guides/solent/${slug}</loc>`));
  assert.match(sitemap, new RegExp(`<lastmod>${published.updatedAt.replaceAll(".", "\\.")}</lastmod>`));
});

test("published noindex stays HTTP 200 with noindex,follow and is absent from sitemap", async () => {
  const noindexDraftResult = await jsonPost({ action: "saveGuideDraft", guide: draftInput({ slug: "managed-noindex-marina", title: "Managed Noindex Marina" }) });
  const noindexDraft = noindexDraftResult.guide;
  const noindexPublished = await jsonPost({ action: "publishGuide", id: noindexDraft.id, expectedUpdatedAt: noindexDraft.updatedAt });
  assert.equal(noindexPublished.guide.noindex, true);
  const response = await request("/guides/solent/managed-noindex-marina");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/oldseadogs\.com\/guides\/solent\/managed-noindex-marina"/);
  assert.doesNotMatch(await (await request("/sitemap.xml")).text(), /managed-noindex-marina/);
});

test("explicit unpublish preserves publication history and removes public/sitemap access", async () => {
  const result = await jsonPost({ action: "unpublishGuide", id: published.id, expectedUpdatedAt: published.updatedAt });
  const unpublished = result.guide;
  assert.equal(unpublished.status, "unpublished");
  assert.equal(unpublished.noindex, true);
  assert.equal(unpublished.publication.publishedAt, published.publication.publishedAt);
  assert.equal((await request(`/guides/solent/${slug}`)).status, 404);
  assert.doesNotMatch(await (await request("/sitemap.xml")).text(), new RegExp(slug));
  const revisions = (await readStore()).guideRevisions.filter((item) => item.guideId === published.id);
  assert.ok(revisions.some((item) => item.reason === "Guide published"));
  assert.ok(revisions.some((item) => item.reason === "Guide unpublished"));
});

test("a previously published Guide cannot change slug through Draft editing", async () => {
  const current = (await readStore()).guides.find((guide) => guide.id === published.id);
  const response = await jsonPost({ action: "saveGuideDraft", guide: { ...current, slug: "changed-published-slug" }, expectedUpdatedAt: current.updatedAt }, 409);
  assert.match(response.error, /has been published cannot change slug/);
  assert.equal((await readStore()).guides.find((guide) => guide.id === published.id).slug, slug);
});

test("only targeted stored Guides are written; static records are not materialized", async () => {
  const store = await readStore();
  assert.ok(store.guides.some((guide) => guide.slug === slug));
  assert.equal(store.guides.filter((guide) => guide.slug === "hamble-point-marina").length, 0);
  assert.equal(store.guides.filter((guide) => guide.slug === "cowes").length, 0);
  assert.ok(duplicate);
});
