import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { validateDraftCleanup } from "../lib/story-cleanup.ts";

const records = [
  { id: "draft-1", slug: "draft-1", title: "Draft One", status: "draft" },
  { id: "draft-2", slug: "draft-2", title: "Draft Two", status: "draft" },
  { id: "published", slug: "published", title: "Published", status: "published" },
  { id: "scheduled", slug: "scheduled", title: "Scheduled", status: "scheduled" },
  { id: "homepage", slug: "homepage", title: "Homepage Draft", status: "draft" },
  { id: "referenced", slug: "referenced", title: "Referenced Draft", status: "draft" },
  { id: "prior-published", slug: "prior-published", title: "Prior Published Draft", status: "draft", publishedAt: "2026-06-09T00:00:00Z" },
  { id: "legacy", slug: "legacy", title: "Legacy Published", status: "published" },
];

const management = Object.fromEntries(records.map((story) => [story.id, {
  source: story.id === "legacy" ? "legacy" : "cms",
  origin: story.id === "legacy" ? "legacy" : "cms",
  label: story.id === "legacy" ? "Archive · read-only" : "CMS-managed",
  writable: story.id !== "legacy",
  editable: story.id !== "legacy",
}]));

test("one or multiple unreferenced Drafts are eligible", () => {
  assert.equal(validateDraftCleanup({ ids: ["draft-1"], stories: records, management }).ok, true);
  assert.equal(validateDraftCleanup({ ids: ["draft-1", "draft-2"], stories: records, management }).selected.length, 2);
});

test("a fixture cleanup removes only the selected eligible CMS Draft", () => {
  const result = validateDraftCleanup({ ids: ["draft-1"], stories: records, management });
  assert.equal(result.ok, true);
  const remaining = records.filter((story) => !new Set(result.selected.map((item) => item.id)).has(story.id));
  assert.equal(remaining.some((story) => story.id === "draft-1"), false);
  assert.equal(remaining.some((story) => story.id === "published"), true);
  assert.equal(remaining.some((story) => story.id === "legacy"), true);
});

test("published, scheduled, homepage-selected and referenced stories are protected", () => {
  const result = validateDraftCleanup({
    ids: ["draft-1", "published", "scheduled", "homepage", "referenced"],
    stories: records,
    homepageIds: ["homepage"],
    referencedStoryIds: ["referenced"],
    management,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Published is published/);
  assert.match(result.errors.join(" "), /Scheduled is scheduled/);
  assert.match(result.errors.join(" "), /Homepage Manager/);
  assert.match(result.errors.join(" "), /press-release/);
});

test("a mixed selection fails as one preflight so callers cannot partially delete it", () => {
  const result = validateDraftCleanup({ ids: ["draft-1", "published"], stories: records, management });
  assert.equal(result.ok, false);
  assert.equal(result.selected.length, 2);
});

test("unknown ids fail clearly", () => {
  const result = validateDraftCleanup({ ids: ["missing"], stories: records, management });
  assert.equal(result.ok, false);
  assert.equal(result.refreshRequired, true);
  assert.match(result.errors[0], /no longer in the current CMS list/);
});

test("prior-Published and read-only legacy records are never deletable", () => {
  const result = validateDraftCleanup({ ids: ["prior-published", "legacy"], stories: records, management });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /prior publication evidence/);
  assert.match(result.errors.join(" "), /read-only archive Story/);
});

test("the API requires confirmation and backup before any deletion", async () => {
  const source = await fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8");
  const block = source.slice(source.indexOf('payload.action === "deleteStories"'), source.indexOf('payload.action === "saveSettings"'));
  assert.ok(block.indexOf("!payload.confirm") < block.indexOf("createPreBulkDeleteBackup"));
  assert.ok(block.indexOf("!payload.backupBeforeDelete") < block.indexOf("createPreBulkDeleteBackup"));
  assert.ok(block.indexOf("validateDraftCleanup") < block.indexOf("createPreBulkDeleteBackup"));
  assert.match(block, /management: editorData\.storyManagement/);
});
