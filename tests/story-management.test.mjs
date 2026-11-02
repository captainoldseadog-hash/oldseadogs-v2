import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  makeStoryManagementIndex,
  storyDeletionEligibility,
  storyHasPriorPublication,
  storySourceCounts,
} from "../lib/story-management.ts";

const cmsDraft = {
  id: "watch_cruising-world_xnasb0",
  slug: "eight-bells",
  title: "Eight Bells",
  status: "draft",
  sourceType: "Automatic watch",
  createdAt: "2026-08-18T14:17:27.915Z",
};
const cmsPublished = {
  id: "cms-published",
  slug: "cms-published",
  title: "CMS Published",
  status: "published",
  publishedAt: "2026-09-01T10:00:00Z",
};
const legacyPublished = {
  id: "legacy-published",
  slug: "legacy-published",
  title: "Legacy Published",
  status: "published",
  publishedAt: "2025-01-01T00:00:00Z",
};

test("resolved Stories retain truthful CMS, Story Watch and archive provenance", () => {
  const index = makeStoryManagementIndex([cmsDraft, cmsPublished, legacyPublished], [cmsDraft.id, cmsPublished.id]);
  assert.deepEqual(index[cmsDraft.id], {
    source: "cms",
    origin: "story-watch",
    label: "Story Watch · managed",
    writable: true,
    editable: true,
  });
  assert.equal(index[cmsPublished.id].label, "CMS-managed");
  assert.deepEqual(index[legacyPublished.id], {
    source: "legacy",
    origin: "legacy",
    label: "Archive · read-only",
    writable: false,
    editable: false,
  });
  assert.deepEqual(storySourceCounts(index), {
    cmsManaged: 2,
    legacyReadOnly: 1,
    storyWatch: 1,
    newsroomImports: 0,
  });
});

test("All, Draft and Published counts remain coherent across managed and archive Stories", () => {
  const stories = [cmsDraft, cmsPublished, legacyPublished];
  assert.equal(stories.length, 3);
  assert.equal(stories.filter((story) => story.status === "draft").length, 1);
  assert.equal(stories.filter((story) => story.status === "published").length, 2);
  const index = makeStoryManagementIndex(stories, [cmsDraft.id, cmsPublished.id]);
  const counts = storySourceCounts(index);
  assert.equal(counts.cmsManaged + counts.legacyReadOnly, stories.length);
});

test("only a current writable private Draft is eligible for cleanup", () => {
  const index = makeStoryManagementIndex([cmsDraft, cmsPublished, legacyPublished], [cmsDraft.id, cmsPublished.id]);
  assert.equal(storyDeletionEligibility({ story: cmsDraft, management: index[cmsDraft.id] }).eligible, true);
  assert.equal(storyDeletionEligibility({ story: cmsPublished, management: index[cmsPublished.id] }).eligible, false);
  assert.equal(storyDeletionEligibility({ story: legacyPublished, management: index[legacyPublished.id] }).eligible, false);
});

test("prior publication and Homepage selection protect a CMS Draft", () => {
  const priorPublished = { ...cmsDraft, id: "bering", title: "Bering Yachts", publishedAt: "2026-06-09T00:00:00Z" };
  const index = makeStoryManagementIndex([priorPublished], [priorPublished.id]);
  assert.equal(storyHasPriorPublication(priorPublished), true);
  const result = storyDeletionEligibility({
    story: priorPublished,
    management: index[priorPublished.id],
    homepageIds: new Set([priorPublished.id]),
  });
  assert.equal(result.eligible, false);
  assert.match(result.reasons.join(" "), /prior publication evidence/);
  assert.match(result.reasons.join(" "), /Homepage Manager/);
});

test("the Helm only renders delete controls from server deletion eligibility", async () => {
  const ui = await fs.readFile(new URL("../app/editor/BridgeCms.tsx", import.meta.url), "utf8");
  assert.match(ui, /story\.deletion\.eligible \? \(/);
  assert.match(ui, /story\.management\.label/);
  assert.match(ui, /published archive records \(read-only\)/);
  assert.match(ui, /The Story list has been refreshed so removed or changed records cannot remain selected/);
  assert.doesNotMatch(ui, /story\.status === "draft" \? \(\s*<input/);
});

test("the API returns filtered source counts and never validates deletion against an unclassified list", async () => {
  const route = await fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8");
  assert.match(route, /sourceCounts: storySourceCounts\(Object\.fromEntries\([\s\S]*filtered\.map/);
  assert.match(route, /management: editorData\.storyManagement/);
  assert.match(route, /refreshRequired: validation\.refreshRequired/);
});
