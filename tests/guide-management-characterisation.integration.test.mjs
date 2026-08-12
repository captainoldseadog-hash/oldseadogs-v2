import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(projectDir, "tests/fixtures/guide-management-characterisation-editor-store.json");
let controller;
let dataDir;
let storePath;

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

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

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guide-characterisation-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.copyFile(fixturePath, storePath);
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

test("stored Guides override static seeds without changing current URLs or artwork", async () => {
  const editorResponse = await request("/api/editor?view=guides");
  assert.equal(editorResponse.status, 200);
  const payload = await editorResponse.json();
  const override = payload.guides.find((guide) => guide.slug === "the-solent");
  assert.equal(override.title, "Stored Solent Override Characterisation");
  assert.equal(override.imageUrl, "/images/guides/guides-solent-needles-hero-v1.png");

  for (const [pathname, artwork] of [
    ["/guides/solent/the-solent", "guides-solent-needles-hero-v1.png"],
    ["/guides/solent/hamble-point-marina", "guides-marina-hamble-point-hero-v1.png"],
    ["/guides/solent/cowes", "guides-harbour-cowes-hero-v1.png"],
  ]) {
    const response = await request(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), new RegExp(artwork.replaceAll(".", "\\.")));
  }
});

test("existing special presentation and preview continue to use the approved Guide renderer", async () => {
  const cowes = await request("/guides/solent/cowes");
  const cowesHtml = await cowes.text();
  assert.match(cowesHtml, /cowes-navigation-warning-panel/);
  assert.match(cowesHtml, /cowes-berth-panel/);
  assert.match(cowesHtml, /guide-section-navigation guide-section-navigation--wrapped/);

  const preview = await request("/editor/preview/guide/cms-only-draft-characterisation");
  assert.equal(preview.status, 200);
  const previewHtml = await preview.text();
  assert.match(previewHtml, /CMS-only Draft Characterisation Guide/);
  assert.match(previewHtml, /guide-product-hero/);
  assert.match(previewHtml, /guide-section-navigation/);
  assert.match(previewHtml, /noindex/i);
});

test("Drafts stay private while published and noindex Guide eligibility matches current behavior", async () => {
  assert.equal((await request("/guides/solent/cms-only-draft-characterisation")).status, 404);

  const published = await request("/guides/solent/cms-published-characterisation");
  assert.equal(published.status, 200);
  const publishedHtml = await published.text();
  assert.match(publishedHtml, /CMS Published Characterisation Guide/);
  assert.match(publishedHtml, /rel="canonical" href="https:\/\/oldseadogs\.com\/guides\/solent\/cms-published-characterisation"/);
  assert.match(publishedHtml, /"@type":"Article"/);
  assert.match(publishedHtml, /"@type":"BreadcrumbList"/);

  const excluded = await request("/guides/solent/cms-noindex-characterisation");
  assert.equal(excluded.status, 200);
  const excludedHtml = await excluded.text();
  assert.match(excludedHtml, /noindex/i);
  assert.match(excludedHtml, /rel="canonical" href="https:\/\/oldseadogs\.com\/guides\/solent\/cms-noindex-characterisation"/);

  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.match(xml, /cms-published-characterisation/);
  assert.doesNotMatch(xml, /cms-only-draft-characterisation/);
  assert.doesNotMatch(xml, /cms-noindex-characterisation/);
});

test("legacy Guide saves preserve Homepage Manager and scheduled story state", async () => {
  const before = await readStore();
  const homepageBefore = structuredClone(before.settings);
  const scheduledBefore = structuredClone(before.stories.find((story) => story.id === "characterisation-scheduled-story"));
  const draft = before.guides.find((guide) => guide.slug === "cms-only-draft-characterisation");
  const response = await post({
    action: "saveGuide",
    guide: { ...draft, title: "CMS-only Draft Characterisation Guide Edited", status: "draft" },
  });
  assert.equal(response.status, 200);

  const after = await readStore();
  assert.deepEqual(after.settings, homepageBefore);
  const scheduledAfter = after.stories.find((story) => story.id === scheduledBefore.id);
  for (const field of ["id", "slug", "status", "publishedAt", "scheduledPublishAt", "createdAt", "updatedAt"]) {
    assert.equal(scheduledAfter[field], scheduledBefore[field], field);
  }
  assert.deepEqual(scheduledAfter.statusHistory, scheduledBefore.statusHistory);
  assert.equal(after.guides.find((guide) => guide.slug === draft.slug).title, "CMS-only Draft Characterisation Guide Edited");
});
