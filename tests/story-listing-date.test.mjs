import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { storyHeaderDateLabel, storyListingDateLabel } from "../lib/story-header-date.ts";

const batchDay = "2026-10-14";

const liveStories = [
  {
    name: "Hong Kong Sail Grand Prix",
    date: batchDay,
    publishedAt: "2026-10-22T09:22:56.657Z",
    listing: "22 Oct 2026",
    header: "22 October 2026",
  },
  {
    name: "Antigua Racing Cup",
    date: batchDay,
    publishedAt: "2026-10-21T13:01:39.864Z",
    listing: "21 Oct 2026",
    header: "21 October 2026",
  },
  {
    name: "Ocean Race Porto",
    date: batchDay,
    publishedAt: "2026-10-20T09:09:17.699Z",
    listing: "20 Oct 2026",
    header: "20 October 2026",
  },
  {
    name: "Henri-Lloyd Round the Island",
    date: batchDay,
    publishedAt: "2026-10-19T08:07:41.802Z",
    listing: "19 Oct 2026",
    header: "19 October 2026",
  },
  {
    name: "Jakub Golebiowski",
    date: batchDay,
    publishedAt: "2026-10-17T07:50:52.371Z",
    listing: "17 Oct 2026",
    header: "17 October 2026",
  },
  {
    name: "Oyster 595",
    date: "2026-10-12",
    publishedAt: "2026-10-15T07:58:44.086Z",
    listing: "15 Oct 2026",
    header: "15 October 2026",
  },
  {
    name: "boot Düsseldorf tickets",
    date: "2026-09-21",
    publishedAt: "2026-09-28T08:53:14.355Z",
    listing: "28 Sept 2026",
    header: "28 September 2026",
  },
  {
    name: "Newport International Boat Show",
    date: "2026-09-21",
    publishedAt: "2026-09-22T05:03:00.000Z",
    listing: "22 Sept 2026",
    header: "22 September 2026",
  },
];

test("listing dates use the London publish day, not the editorial or batch day", () => {
  for (const story of liveStories) {
    const source = {
      date: story.date,
      publishedAt: story.publishedAt,
      createdAt: "2026-10-14T00:00:00.000Z",
      updatedAt: "2026-10-25T12:00:00.000Z",
    };
    assert.equal(storyListingDateLabel(source), story.listing, story.name);
    assert.equal(storyHeaderDateLabel(source), story.header, story.name);
  }
});

test("a publish instant just before UTC midnight shows the next London day on cards", () => {
  const story = {
    date: "2026-10-01",
    publishedAt: "2026-10-01T23:30:00.000Z",
    createdAt: "2026-10-14T00:00:00.000Z",
  };
  assert.equal(storyListingDateLabel(story), "2 Oct 2026");
  assert.equal(storyHeaderDateLabel(story), "2 October 2026");
});

test("date-only stories keep that calendar day when no publish timestamp exists", () => {
  assert.equal(storyListingDateLabel({ date: "2026-09-30", publishedAt: "" }), "30 Sept 2026");
  assert.equal(storyListingDateLabel({ date: "2026-10-14", publishedAt: "2026-10-22" }), "22 Oct 2026");
});

test("story cards and listings render the publish-date label", () => {
  const files = [
    "app/page.tsx",
    "components/MobileAppHome.tsx",
    "app/[section]/page.tsx",
    "app/archive/page.tsx",
    "app/manufacturers/[manufacturer]/page.tsx",
    "lib/search.ts",
  ];
  for (const file of files) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /storyListingDateLabel\(/, file);
    assert.doesNotMatch(source, /formatDate\(story\.date\)/, file);
    assert.doesNotMatch(source, /formatDate\(featuredStory\.date\)/, file);
    assert.doesNotMatch(source, /cardDate\(/, file);
  }
});

test("article JSON-LD still publishes the same datePublished field", () => {
  const source = readFileSync(new URL("../lib/structured-data.ts", import.meta.url), "utf8");
  assert.match(source, /datePublished:\s*story\.publishedAt\s*\|\|\s*story\.date/);
});
