import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { storyHeaderDateLabel } from "../lib/story-header-date.ts";

test("Antigua and Red Sea style headers use the London publish day, not the imported date or updatedAt", () => {
  assert.equal(
    storyHeaderDateLabel({
      date: "2026-09-30",
      publishedAt: "2026-10-02T08:12:57.054Z",
      updatedAt: "2026-10-04T18:00:00.000Z",
    }),
    "2 October 2026",
  );
  assert.equal(
    storyHeaderDateLabel({
      date: "2026-09-29",
      publishedAt: "2026-10-01T08:05:10.330Z",
    }),
    "1 October 2026",
  );
});

test("a publish instant just before UTC midnight still shows the London day", () => {
  assert.equal(
    storyHeaderDateLabel({
      date: "2026-10-01",
      publishedAt: "2026-10-01T23:30:00.000Z",
    }),
    "2 October 2026",
  );
  assert.equal(
    storyHeaderDateLabel({
      date: "2026-09-30",
      publishedAt: "2026-10-02T00:30:00.000Z",
    }),
    "2 October 2026",
  );
  assert.equal(
    storyHeaderDateLabel({
      date: "2026-01-16",
      publishedAt: "2026-01-15T23:30:00.000Z",
    }),
    "15 January 2026",
  );
});

test("the story page header renders that publish-date label", () => {
  const source = readFileSync(new URL("../components/ArticlePreviewContent.tsx", import.meta.url), "utf8");
  assert.match(source, /className="article-meta"[\s\S]*?storyHeaderDateLabel\(story\)/);
  assert.doesNotMatch(source, /className="article-meta"[\s\S]*?formatArticleDate\(story\.date\)/);
});

test("date-only values keep their calendar day when no publish timestamp exists", () => {
  assert.equal(storyHeaderDateLabel({ date: "2026-09-30", publishedAt: "" }), "30 September 2026");
  assert.equal(storyHeaderDateLabel({ date: "2026-01-15", publishedAt: "2026-10-02" }), "2 October 2026");
});
