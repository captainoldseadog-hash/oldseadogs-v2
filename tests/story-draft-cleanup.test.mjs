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
];

test("one or multiple unreferenced Drafts are eligible", () => {
  assert.equal(validateDraftCleanup({ ids: ["draft-1"], stories: records }).ok, true);
  assert.equal(validateDraftCleanup({ ids: ["draft-1", "draft-2"], stories: records }).selected.length, 2);
});

test("published, scheduled, homepage-selected and referenced stories are protected", () => {
  const result = validateDraftCleanup({
    ids: ["draft-1", "published", "scheduled", "homepage", "referenced"],
    stories: records,
    homepageIds: ["homepage"],
    referencedStoryIds: ["referenced"],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Published is published/);
  assert.match(result.errors.join(" "), /Scheduled is scheduled/);
  assert.match(result.errors.join(" "), /Homepage Manager/);
  assert.match(result.errors.join(" "), /press-release/);
});

test("a mixed selection fails as one preflight so callers cannot partially delete it", () => {
  const result = validateDraftCleanup({ ids: ["draft-1", "published"], stories: records });
  assert.equal(result.ok, false);
  assert.equal(result.selected.length, 2);
});

test("unknown ids fail clearly", () => {
  const result = validateDraftCleanup({ ids: ["missing"], stories: records });
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /not found/);
});

test("the API requires confirmation and backup before any deletion", async () => {
  const source = await fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8");
  const block = source.slice(source.indexOf('payload.action === "deleteStories"'), source.indexOf('payload.action === "saveSettings"'));
  assert.ok(block.indexOf("!payload.confirm") < block.indexOf("createPreBulkDeleteBackup"));
  assert.ok(block.indexOf("!payload.backupBeforeDelete") < block.indexOf("createPreBulkDeleteBackup"));
  assert.ok(block.indexOf("validateDraftCleanup") < block.indexOf("createPreBulkDeleteBackup"));
});
