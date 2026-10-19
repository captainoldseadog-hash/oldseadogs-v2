import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatDate } from "../content/stories.ts";
import { storyHeaderDateLabel } from "../lib/story-header-date.ts";
import { isPlaceholderStoryDate, knownStoryDate } from "../lib/story-dates.ts";

test("the archive dummy day is unknown and a real calendar day is kept", () => {
  assert.equal(isPlaceholderStoryDate("2025-01-01"), true);
  assert.equal(isPlaceholderStoryDate("2025-01-01T00:00:00Z"), true);
  assert.equal(isPlaceholderStoryDate("2025-01-01T00:00:00.000Z"), true);
  assert.equal(isPlaceholderStoryDate("2025-01-01T12:00:00.000Z"), false);
  assert.equal(knownStoryDate("2025-01-01"), "");
  assert.equal(knownStoryDate("2026-10-02"), "2026-10-02");
  assert.equal(knownStoryDate(""), "");
});

test("club and port headers omit the dummy 1 January 2025 date", () => {
  assert.equal(storyHeaderDateLabel({
    date: "2025-01-01",
    publishedAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  }), "");
  assert.equal(formatDate("2025-01-01"), "");
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("2026-10-02"), "02 Oct 2026");
});

test("article structured data omits unknown publish and update dates", () => {
  const source = readFileSync(new URL("../lib/structured-data.ts", import.meta.url), "utf8");
  assert.match(source, /knownStoryDate\(story\.publishedAt \|\| story\.date\)/);
  assert.match(source, /datePublished \? \{ datePublished \} : \{\}/);
  assert.match(source, /dateModified \? \{ dateModified \} : \{\}/);
});
