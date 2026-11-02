import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import noindexSlugs from "../content/story-triage/noindex-slugs.json" with { type: "json" };
import noindexWave2 from "../content/story-triage/noindex-wave-2.json" with { type: "json" };
import { oldSeaDogsViewQuality } from "../lib/editorial-quality.ts";
import {
  legacyArchiveMethodNotes,
  publicStoryMethodNotes,
  retiredLegacyArchiveMethodNotes,
} from "../lib/public-story-method.ts";
import { isTriageNoindex } from "../lib/story-triage.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

const stockView = [
  "This story matters only if it helps sailors, owners, clubs, marinas and readers make better decisions afloat or ashore.",
  "The new point should be the named event, result, boat, notice, place or change in the report above, not the shine around it.",
  "Old Sea Dogs treats press releases and organiser statements as a starting point, then looks for the practical detail.",
].join(" ");

function functionSource(source, name, nextName) {
  const start = source.indexOf(`export function ${name}`);
  const end = source.indexOf(`export function ${nextName}`);
  assert.ok(start >= 0 && end > start, `${name} before ${nextName}`);
  return source.slice(start, end);
}

test("a story renders an Old Sea Dogs View only when it has one of its own", async () => {
  const source = await fs.readFile(path.join(projectDir, "components/ArticlePreviewContent.tsx"), "utf8");
  assert.doesNotMatch(source, /defaultOldSeaDogsView/);
  assert.doesNotMatch(source, /this story matters only if it helps/i);
  assert.match(source, /story\.oldSeaDogsView\?\.trim\(\) \? \(/);
  assert.match(source, /What this means on the water/);
  assert.match(source, /publicStoryMethodNotes\(story\.methodNotes\)/);
});

test("legacy archive method notes no longer say they are queued for audit", async () => {
  assert.equal(publicStoryMethodNotes(retiredLegacyArchiveMethodNotes), legacyArchiveMethodNotes);
  assert.equal(publicStoryMethodNotes(`  ${retiredLegacyArchiveMethodNotes}  `), legacyArchiveMethodNotes);
  assert.equal(publicStoryMethodNotes("  Edited on the desk.  "), "Edited on the desk.");
  assert.equal(publicStoryMethodNotes(""), "");
  assert.doesNotMatch(legacyArchiveMethodNotes, /queued for editorial audit/i);

  const siteContent = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  assert.match(siteContent, /methodNotes: legacyArchiveMethodNotes/);
  assert.doesNotMatch(siteContent, /queued for editorial audit/);
});

test("dropping the stock view does not change which stories are noindexed", async () => {
  assert.ok(Array.isArray(noindexSlugs));
  assert.ok(Array.isArray(noindexWave2));
  assert.equal(oldSeaDogsViewQuality("").status, "missing");
  assert.equal(oldSeaDogsViewQuality(stockView).status, "boilerplate");
  assert.equal(oldSeaDogsViewQuality("The lock at Island Harbour is the part to plan.").status, "custom");

  const siteContent = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  const weak = functionSource(siteContent, "isWeakEditorialStory", "isStorySearchIndexable");
  const indexable = functionSource(siteContent, "isStorySearchIndexable", "isPromotedStory");
  assert.match(weak, /oldSeaDogsViewQuality\(story\.oldSeaDogsView\)/);
  assert.match(weak, /viewQuality\.status !== "custom"/);
  assert.doesNotMatch(indexable, /oldSeaDogsView|methodNotes|legacyArchiveMethodNotes/);
  assert.match(indexable, /story\.noindex/);
  assert.match(indexable, /isTriageNoindex\(story\.slug\)/);

  const held = noindexSlugs[0];
  const previous = process.env.STORY_TRIAGE_WAVE;
  process.env.STORY_TRIAGE_WAVE = "2";
  try {
    assert.equal(isTriageNoindex(held), true);
    for (const slug of noindexWave2) {
      assert.equal(isTriageNoindex(slug), true, slug);
    }
  } finally {
    if (previous === undefined) delete process.env.STORY_TRIAGE_WAVE;
    else process.env.STORY_TRIAGE_WAVE = previous;
  }
});
