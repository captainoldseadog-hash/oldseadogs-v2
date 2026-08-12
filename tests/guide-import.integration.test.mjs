import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { safeCsvCell } from "../lib/csv-safety.ts";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(projectDir, "tests/fixtures/guide-management-characterisation-editor-store.json");
let controller;
let dataDir;
let storePath;
let created;
const enoughWords = Array.from({ length: 120 }, (_, index) => `importword${index + 1}`).join(" ");

async function readStore() { return JSON.parse(await fs.readFile(storePath, "utf8")); }
async function post(payload, expectedStatus = 200) {
  const response = await controller.fetch("http://localhost/api/editor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert.equal(response.status, expectedStatus, await response.clone().text());
  return response.json();
}
function record(overrides = {}) {
  return {
    externalId: "import-fixture-001", slug: "fictional-import-marina", title: "Fictional Import Marina", guideType: "Marina",
    region: { key: "example-coast", name: "Example Coast", area: "Test Reach" },
    editorial: { standfirst: "A fictional Guide import fixture.", introduction: "Private research Draft only.", sections: [{ heading: "Overview", body: [enoughWords] }] },
    media: { heroImage: { mediaId: "characterisation-guide-media", url: "/api/media/characterisation-guide-media", alt: "Fictional test marina" } },
    verification: { sources: [{ label: "Example source", url: "https://example.com/harbour", accessedAt: "2026-08-12", supports: ["editorial.introduction"] }], unresolved: [{ field: "navigation.depths", reason: "Awaiting confirmation", severity: "safety" }] },
    ...overrides,
  };
}
function envelope(guides, mode = "create-draft") { return { contract: "oldseadogs.guide-draft", version: 1, mode, guides }; }
async function dry(content, format = "json", mode) { return (await post({ action: "validateGuideImport", format, mode, content: format === "json" ? JSON.stringify(content) : content })).plan; }

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guide-import-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.copyFile(fixturePath, storePath);
  controller = await startEditorStoreWorker({ projectDir, dataDir, env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" } });
});
after(async () => { await controller?.stop(); await fs.rm(dataDir, { recursive: true, force: true }); });

test("valid one and multi-Guide JSON dry runs plan creates and write nothing", async () => {
  const beforeText = await fs.readFile(storePath, "utf8");
  const one = await dry(envelope([record()]));
  assert.deepEqual(one.summary, { total: 1, valid: 1, warnings: 1, blocked: 0, creates: 1, updates: 0, duplicates: 0 });
  assert.equal(one.items[0].verificationStatus, "unresolved-safety");
  const multi = await dry(envelope([record({ externalId: "batch-1", slug: "fictional-batch-one" }), record({ externalId: "batch-2", slug: "fictional-batch-two" }), record({ externalId: "batch-3", slug: "fictional-batch-three" })]));
  assert.equal(multi.summary.creates, 3);
  assert.equal(await fs.readFile(storePath, "utf8"), beforeText);
});

test("valid CSV dry run uses the fixed schema and malformed CSV is rejected", async () => {
  const csv = `externalId,slug,title,guideType,regionKey,regionName,area,standfirst,introduction,sections,unresolved\ncsv-001,fictional-csv-marina,Fictional CSV Marina,Marina,example-coast,Example Coast,CSV Reach,CSV standfirst,CSV intro,"[{""heading"":""Overview"",""body"":[""${enoughWords}""]}]","[]"`;
  const plan = await dry(csv, "csv");
  assert.equal(plan.summary.creates, 1);
  await post({ action: "validateGuideImport", format: "csv", content: 'externalId,slug,title,guideType,regionKey,regionName\n"broken' }, 400);
});

test("confirmation atomically creates a forced private Draft and preserves homepage and safety data", async () => {
  const before = await readStore();
  const plan = await dry(envelope([record({ publication: { publishedAt: "2026-01-01", scheduledAt: "2026-09-01" }, seo: { noindex: false } })]));
  const result = await post({ action: "confirmGuideImport", planToken: plan.planToken });
  created = result.imported[0];
  assert.equal(created.status, "draft"); assert.equal(created.noindex, true); assert.equal(created.showOnHomepage, false);
  assert.equal(created.publication.publishedAt, null); assert.equal(created.publication.scheduledAt, null);
  assert.equal(created.externalId, "import-fixture-001");
  assert.deepEqual(created.verification.unresolved, record().verification.unresolved);
  assert.ok((await readStore()).guideRevisions.some((item) => item.guideId === created.id && item.source === "bulk-import" && item.reason.includes("import-fixture-001")));
  assert.deepEqual((await readStore()).settings, before.settings);
  assert.deepEqual((await readStore()).stories.map(({ id, slug, title, status, publishedAt, scheduledPublishAt }) => ({ id, slug, title, status, publishedAt, scheduledPublishAt })), before.stories.map(({ id, slug, title, status, publishedAt, scheduledPublishAt }) => ({ id, slug, title, status, publishedAt, scheduledPublishAt })));
});

test("create-draft is idempotent by externalId and never overwrites the existing Guide", async () => {
  const before = structuredClone((await readStore()).guides.find((guide) => guide.externalId === created.externalId));
  const plan = await dry(envelope([record({ title: "Must not overwrite" })]));
  assert.equal(plan.items[0].action, "duplicate");
  const result = await post({ action: "confirmGuideImport", planToken: plan.planToken });
  assert.equal(result.imported.length, 0); assert.equal(result.skippedDuplicates, 1);
  assert.deepEqual((await readStore()).guides.find((guide) => guide.externalId === created.externalId), before);
});

test("duplicate batch externalIds/slugs and existing static slugs block the whole batch", async () => {
  const beforeCount = (await readStore()).guides.length;
  const duplicate = await dry(envelope([record({ externalId: "dupe", slug: "dupe-one" }), record({ externalId: "dupe", slug: "dupe-one" })]));
  assert.equal(duplicate.summary.blocked, 2);
  await post({ action: "confirmGuideImport", planToken: duplicate.planToken }, 400);
  const collision = await dry(envelope([record({ externalId: "static-collision", slug: "the-solent" })]));
  assert.equal(collision.items[0].action, "blocked");
  assert.equal((await readStore()).guides.length, beforeCount);
});

test("update-draft requires externalId and current updatedAt, records a bulk-import revision, and remains private", async () => {
  const current = (await readStore()).guides.find((guide) => guide.externalId === created.externalId);
  const plan = await dry(envelope([record({ updatedAt: current.updatedAt, title: "Fictional Import Marina Revised", verification: { sources: [], unresolved: [] } })], "update-draft"));
  assert.equal(plan.items[0].action, "update");
  const result = await post({ action: "confirmGuideImport", planToken: plan.planToken });
  assert.equal(result.imported[0].title, "Fictional Import Marina Revised"); assert.equal(result.imported[0].status, "draft"); assert.equal(result.imported[0].noindex, true);
  const revision = (await readStore()).guideRevisions.find((item) => item.reason.includes(created.externalId));
  assert.equal(revision.source, "bulk-import"); assert.equal(revision.snapshot.title, created.title);
  created = result.imported[0];
});

test("stale updates and Published or Unpublished targets are rejected", async () => {
  const stale = await dry(envelope([record({ updatedAt: "2020-01-01", title: "Stale" })], "update-draft"));
  assert.match(stale.items[0].errors.join(" "), /stale/i);
  const store = await readStore(); const target = store.guides.find((guide) => guide.externalId === created.externalId); target.status = "published"; await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
  const published = await dry(envelope([record({ updatedAt: target.updatedAt })], "update-draft"));
  assert.match(published.items[0].errors.join(" "), /Published and Unpublished Guides are protected/);
  target.status = "unpublished"; await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
  const unpublished = await dry(envelope([record({ updatedAt: target.updatedAt })], "update-draft"));
  assert.equal(unpublished.items[0].valid, false);
  target.status = "draft"; await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
});

test("invalid contract, unknown version, malformed JSON and unknown fields fail clearly", async () => {
  await post({ action: "validateGuideImport", format: "json", content: "{" }, 400);
  await post({ action: "validateGuideImport", format: "json", content: JSON.stringify({ ...envelope([record()]), contract: "wrong" }) }, 400);
  await post({ action: "validateGuideImport", format: "json", content: JSON.stringify({ ...envelope([record()]), version: 2 }) }, 400);
  const unknown = await post({ action: "validateGuideImport", format: "json", content: JSON.stringify(envelope([record({ mysteryField: "must not disappear" })])) }, 400);
  assert.match(unknown.error, /mysteryField is unknown/);
});

test("media validation blocks invalid references while a missing hero is an explicit warning", async () => {
  const invalid = await dry(envelope([record({ externalId: "bad-media", slug: "bad-media", media: { heroImage: { mediaId: "missing", url: "/api/media/missing", alt: "Missing" } } })]));
  assert.equal(invalid.items[0].mediaStatus, "invalid"); assert.equal(invalid.items[0].valid, false);
  const missing = await dry(envelope([record({ externalId: "missing-hero", slug: "missing-hero", media: undefined })]));
  assert.equal(missing.items[0].mediaStatus, "missing-hero"); assert.match(missing.items[0].warnings.join(" "), /publication will remain blocked/);
});

test("plan tokens cannot be forged and Guide/media changes make a plan stale without writes", async () => {
  await post({ action: "confirmGuideImport", planToken: "forged-token" }, 409);
  const plan = await dry(envelope([record({ externalId: "stale-plan", slug: "stale-plan" })]));
  const store = await readStore(); store.guides[0].updatedAt = new Date(Date.parse(store.guides[0].updatedAt) + 1000).toISOString(); await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
  await post({ action: "confirmGuideImport", planToken: plan.planToken }, 409);
  assert.equal((await readStore()).guides.some((guide) => guide.slug === "stale-plan"), false);
});

test("a blocking row prevents every otherwise-valid row from being imported", async () => {
  const plan = await dry(envelope([record({ externalId: "atomic-good", slug: "atomic-good" }), record({ externalId: "atomic-bad", slug: "Bad Slug" })]));
  assert.equal(plan.summary.blocked, 1);
  await post({ action: "confirmGuideImport", planToken: plan.planToken }, 400);
  assert.equal((await readStore()).guides.some((guide) => guide.slug === "atomic-good"), false);
});

test("a concurrent story save survives Guide confirmation because only Guide conflicts stale the plan", async () => {
  const plan = await dry(envelope([record({ externalId: "concurrent-guide", slug: "concurrent-guide" })]));
  const before = await readStore(); const story = before.stories[0];
  await post({ action: "saveStory", story: { ...story, title: `${story.title} concurrently saved` } });
  await post({ action: "confirmGuideImport", planToken: plan.planToken });
  const after = await readStore(); assert.equal(after.stories.find((item) => item.id === story.id).title, `${story.title} concurrently saved`); assert.ok(after.guides.some((guide) => guide.slug === "concurrent-guide"));
});

test("CSV report cells neutralise spreadsheet formula prefixes", () => {
  assert.equal(safeCsvCell("=SUM(1,2)"), '"\'=SUM(1,2)"');
  assert.equal(safeCsvCell("+cmd"), "'+cmd"); assert.equal(safeCsvCell("-1"), "'-1"); assert.equal(safeCsvCell("@risk"), "'@risk");
});
