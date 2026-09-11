import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { normalizeManagedGuideFields } from "../lib/guide-contract.ts";
import { normalizeEditorialTypography } from "../lib/editorial-typography.ts";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixturePath = path.join(projectDir, "tests/fixtures/guide-management-characterisation-editor-store.json");
const editorialText = "Britain’s sailors said, “It’s blowing 20–25 knots — we’ll wait…” before paying £10 at the café.";
const regressionCases = ["It's", "It’s", "‘single quotes’", "“double quotes”", "20–25 knots", "wait—then go", "wait…", "£10", "café"];
const requiredCharacters = ["'", "’", "‘", "“", "”", "–", "—", "…", "£", "é"];
let controller;
let dataDir;
let storePath;

function assertRequiredCodePoints(value, context) {
  for (const character of requiredCharacters) {
    assert.ok(value.includes(character), `${context} lost ${character} (U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`);
  }
}

function assertRegressionCases(value, context) {
  for (const example of regressionCases) assert.ok(value.includes(example), `${context} lost ${example}`);
}

async function post(payload, expectedStatus = 200) {
  const serialized = JSON.stringify(payload);
  const response = await controller.fetch("http://localhost/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: serialized,
  });
  assert.equal(response.status, expectedStatus, await response.clone().text());
  return { payload: await response.json(), serialized };
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-typography-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.copyFile(fixturePath, storePath);
  controller = await startEditorStoreWorker({ projectDir, dataDir, env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" } });
});

after(async () => {
  await controller?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("editorial typography survives normalization with exact Unicode code points", () => {
  const input = `${editorialText} ${regressionCases.join(" | ")}`;
  assertRequiredCodePoints(input, "input");
  assertRegressionCases(input, "input");
  assert.equal(normalizeEditorialTypography(input), input);
  assert.equal(normalizeManagedGuideFields({ editorial: { standfirst: input } }).editorial?.standfirst, input);
  assert.equal(normalizeEditorialTypography("Britain\u0019s — cafÃ© &pound;10 &hellip;"), "Britain’s — café £10 …");
});

test("Story editor input survives request serialization, storage, API response and public rendering", async () => {
  const exactText = `${editorialText} ${regressionCases.join(" | ")}`;
  const { payload: saved, serialized } = await post({
    action: "saveStory",
    story: {
      id: "characterisation-lead-story",
      slug: "characterisation-lead-story",
      title: "A sailor’s test — “unchanged”…",
      category: "News",
      author: "Michael Hodges",
      summary: exactText,
      body: [exactText],
      status: "published",
      publishedAt: "2026-08-12T08:00:00.000Z",
    },
  });
  assertRequiredCodePoints(serialized, "serialized request JSON");
  assertRegressionCases(serialized, "serialized request JSON");
  assert.equal(saved.story.summary, exactText);
  assert.equal(saved.story.body[0], exactText);
  assertRequiredCodePoints(saved.story.summary, "API response");
  assertRegressionCases(saved.story.summary, "API response");

  const storedText = await fs.readFile(storePath, "utf8");
  assertRequiredCodePoints(storedText, "stored JSON");
  assertRegressionCases(storedText, "stored JSON");
  const stored = JSON.parse(storedText).stories.find((story) => story.id === saved.story.id);
  assert.equal(stored.summary, exactText);
  assert.equal(stored.body[0], exactText);

  const response = await controller.fetch("http://localhost/stories/characterisation-lead-story");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes(exactText));
  assertRequiredCodePoints(html, "public Story HTML");
  assertRegressionCases(html, "public Story HTML");
});

test("legacy Word apostrophe controls are repaired before storage", async () => {
  const { payload: saved } = await post({
    action: "saveStory",
    story: {
      slug: "word-control-apostrophe",
      title: "Word control apostrophe",
      category: "News",
      summary: "Britain\u0019s coast",
      body: ["Britain\u0092s coast"],
      status: "draft",
    },
  });
  assert.equal(saved.story.summary, "Britain’s coast");
  assert.equal(saved.story.body[0], "Britain’s coast");
});

test("Solent collection introductions fall back, edit, preview, publish, reload and revert", async () => {
  const guidesPayload = await (await controller.fetch("http://localhost/api/editor?view=guides")).json();
  const initial = guidesPayload.guides.find((guide) => guide.slug === "the-solent");
  const originalStandfirst = "Britain’s most concentrated cruising ground: compact, tidal, crowded with choices and never quite mastered.";
  const originalIntroduction = initial.introduction;
  assert.equal(initial.summary, originalStandfirst);

  const { payload: unpublished } = await post({ action: "unpublishGuide", id: initial.internalId, expectedUpdatedAt: initial.updatedAt });

  const exactText = `${editorialText} ${regressionCases.join(" | ")}`;
  const editedStandfirst = `${exactText} Collection edit.`;
  const editedIntroduction = `${exactText} Welcome edit.`;
  const { payload: saved, serialized } = await post({
    action: "saveGuideDraft",
    guide: {
      ...unpublished.guide,
      editorial: {
        ...unpublished.guide.editorial,
        standfirst: editedStandfirst,
        introduction: editedIntroduction,
      },
    },
    expectedUpdatedAt: unpublished.guide.updatedAt,
  });
  assertRequiredCodePoints(serialized, "serialized Guide request JSON");
  assertRegressionCases(serialized, "serialized Guide request JSON");
  assert.equal(saved.guide.summary, editedStandfirst);
  assert.equal(saved.guide.introduction, editedIntroduction);
  assert.equal(saved.guide.editorial.standfirst, editedStandfirst);
  assert.equal(saved.guide.editorial.introduction, editedIntroduction);

  const storedText = await fs.readFile(storePath, "utf8");
  assertRequiredCodePoints(storedText, "stored Guide JSON");
  assertRegressionCases(storedText, "stored Guide JSON");
  const stored = JSON.parse(storedText).guides.find((guide) => guide.slug === "the-solent");
  assert.equal(stored.summary, editedStandfirst);
  assert.equal(stored.editorial.standfirst, editedStandfirst);
  const reloaded = (await (await controller.fetch("http://localhost/api/editor?view=guides")).json()).guides.find((guide) => guide.slug === "the-solent");
  assert.equal(reloaded.editorial.introduction, editedIntroduction);

  const previewResponse = await controller.fetch("http://localhost/editor/preview/guide/the-solent");
  assert.equal(previewResponse.status, 200);
  const previewHtml = await previewResponse.text();
  assert.ok(previewHtml.includes(editedStandfirst));
  assert.ok(previewHtml.includes(editedIntroduction));
  assertRequiredCodePoints(previewHtml, "Guide preview HTML");
  assertRegressionCases(previewHtml, "Guide preview HTML");

  const { payload: published } = await post({ action: "publishGuide", id: saved.guide.internalId, expectedUpdatedAt: saved.guide.updatedAt });
  assert.equal(published.guide.status, "published");
  const publicHtml = await (await controller.fetch("http://localhost/guides/solent")).text();
  assert.ok(publicHtml.includes(editedStandfirst));
  assert.ok(publicHtml.includes(editedIntroduction));
  assertRequiredCodePoints(publicHtml, "public Guide HTML");
  assertRegressionCases(publicHtml, "public Guide HTML");

  const { payload: revertDraft } = await post({ action: "unpublishGuide", id: published.guide.internalId, expectedUpdatedAt: published.guide.updatedAt });
  const { payload: reverted } = await post({
    action: "saveGuideDraft",
    guide: {
      ...revertDraft.guide,
      editorial: {
        ...revertDraft.guide.editorial,
        standfirst: originalStandfirst,
        introduction: originalIntroduction,
      },
    },
    expectedUpdatedAt: revertDraft.guide.updatedAt,
  });
  const { payload: republished } = await post({ action: "publishGuide", id: reverted.guide.internalId, expectedUpdatedAt: reverted.guide.updatedAt });
  assert.equal(republished.guide.summary, originalStandfirst);
  assert.equal(republished.guide.introduction, originalIntroduction);
  const restoredHtml = await (await controller.fetch("http://localhost/guides/solent")).text();
  assert.ok(restoredHtml.includes(originalStandfirst));
  assert.ok(restoredHtml.includes(originalIntroduction));
  assert.ok(!restoredHtml.includes("Collection edit"));
});
