import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { compareStoriesNewestCreated, sortAndPaginateStories, storyCreatedAt, storyMatchesWorkflow } from "../lib/story-list.ts";

const stories = [
  { id: "a", title: "Story A", status: "draft", editorialStatus: "Needs Review", createdAt: "2026-09-03T10:00:00Z" },
  { id: "b", title: "Story B", status: "published", editorialStatus: "Published", createdAt: "2026-09-01T10:00:00Z" },
  { id: "c", title: "Story C", status: "scheduled", editorialStatus: "Scheduled", createdAt: "2026-09-02T10:00:00Z" },
];

test("Workflow All is newest-created-first regardless of publication status", () => {
  assert.deepEqual(stories.filter((story) => storyMatchesWorkflow(story, "")).sort(compareStoriesNewestCreated).map((story) => story.id), ["a", "c", "b"]);
});

test("core workflow filters use actual story status and then creation order", () => {
  assert.deepEqual(stories.filter((story) => storyMatchesWorkflow(story, "Draft")).map((story) => story.id), ["a"]);
  assert.deepEqual(stories.filter((story) => storyMatchesWorkflow(story, "Published")).map((story) => story.id), ["b"]);
  assert.deepEqual(stories.filter((story) => storyMatchesWorkflow(story, "Scheduled")).map((story) => story.id), ["c"]);
  assert.deepEqual(stories.filter((story) => storyMatchesWorkflow(story, "Needs Review")).map((story) => story.id), ["a"]);
});

test("ties are deterministic and legacy creation fallback is stable", () => {
  const tied = [
    { id: "z", status: "draft", createdAt: "2026-09-01T00:00:00Z" },
    { id: "a", status: "draft", createdAt: "2026-09-01T00:00:00Z" },
  ];
  assert.deepEqual(tied.sort(compareStoriesNewestCreated).map((story) => story.id), ["a", "z"]);
  assert.equal(storyCreatedAt({ id: "legacy", status: "draft", date: "2020-04-05" }), "2020-04-05T00:00:00.000Z");
  assert.equal(storyCreatedAt({ id: "unknown", status: "draft" }), "1970-01-01T00:00:00.000Z");
});

test("sorting happens before pagination without duplicates or omissions", () => {
  const records = Array.from({ length: 7 }, (_, index) => ({ id: `story-${index}`, status: "draft", createdAt: `2026-09-0${index + 1}T00:00:00Z` }));
  const pages = [1, 2, 3].flatMap((page) => sortAndPaginateStories(records, page, 3).stories.map((story) => story.id));
  assert.deepEqual(pages, ["story-6", "story-5", "story-4", "story-3", "story-2", "story-1", "story-0"]);
  assert.equal(new Set(pages).size, records.length);
});

test("workflow and search changes reset the Helm list to page one", async () => {
  const source = await fs.readFile(new URL("../app/editor/BridgeCms.tsx", import.meta.url), "utf8");
  assert.match(source, /setWorkflowFilter\(event\.target\.value\); setPage\(1\); setSelectedIds\(\[\]\)/);
  assert.match(source, /setQuery\(event\.target\.value\);\s*setPage\(1\);\s*setSelectedIds\(\[\]\)/);
});
