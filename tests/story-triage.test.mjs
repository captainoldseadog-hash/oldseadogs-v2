import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import legacyStories from "../content/legacy-stories.json" with { type: "json" };
import noindexSlugs from "../content/story-triage/noindex-slugs.json" with { type: "json" };
import noindexWave2 from "../content/story-triage/noindex-wave-2.json" with { type: "json" };
import redirects from "../content/story-triage/redirects.json" with { type: "json" };
import sitemapExcludeSlugs from "../content/story-triage/sitemap-exclude-slugs.json" with { type: "json" };
import {
  flattenRedirectMap,
  getLegacyRedirectPath,
  legacyRedirectRuleCount,
} from "../lib/redirects.ts";
import { getRelatedGuides, latestStoriesForGuide } from "../lib/related-guides.ts";
import {
  isTriageNoindex,
  isTriageSitemapExcluded,
  slugsThroughWave,
  storyClearsStoryTriage,
} from "../lib/story-triage.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const imoca =
  "imoca-2026-season-five-races-two-oceans-and-one-relentless-test-of-offshore-sailing";
const imocaTarget = `/stories/racing-${imoca}`;

function guide(guidePath, title) {
  const parts = guidePath.split("/").filter(Boolean);
  const slug = parts.at(-1);
  const regionKey = parts.length > 2 ? parts[1] : slug === "solent" ? "solent" : "";
  return {
    slug,
    title,
    regionKey,
    canonicalPath: guidePath,
    guideType: guidePath === "/guides/solent" ? "Cruising Area" : "Harbour",
    parentGuideSlug: guidePath === "/guides/solent" ? "" : "the-solent",
  };
}

const publishedGuides = [
  guide("/guides/solent", "The Solent Cruising Guide"),
  guide("/guides/cowes-week-guide", "Cowes Week Guide"),
  guide("/guides/solent/cowes", "Cowes Harbour Guide"),
  guide("/guides/round-the-island-race-guide", "Round the Island Race Guide"),
];

test("duplicate clusters flatten to one hop and land on an indexable story", () => {
  assert.equal(getLegacyRedirectPath(`/news/${imoca}`), imocaTarget);
  assert.equal(getLegacyRedirectPath(`/stories/news-${imoca}`), imocaTarget);
  assert.equal(getLegacyRedirectPath(`/stories/${imoca}`), imocaTarget);
  assert.equal(getLegacyRedirectPath(imocaTarget), null);

  const published = new Set(legacyStories.map((story) => story.slug));
  const noindex = new Set(noindexSlugs);
  const excluded = new Set(sitemapExcludeSlugs);
  const keepers = new Set([...published].filter((slug) => !noindex.has(slug) && !excluded.has(slug)));

  for (const entry of redirects.duplicates) {
    const to = entry.to.replace(/^\/stories\//, "");
    const from = entry.from.replace(/^\/stories\//, "");
    assert.equal(published.has(to), true, entry.to);
    assert.equal(noindex.has(to), false, entry.to);
    assert.equal(excluded.has(to), false, entry.to);
    assert.equal(keepers.has(from), false, entry.from);
    assert.equal(getLegacyRedirectPath(entry.from), entry.to);
    assert.equal(getLegacyRedirectPath(entry.to), null);
  }

  for (const entry of redirects.unprefixed) {
    const to = entry.to.replace(/^\/stories\//, "");
    const from = entry.from.replace(/^\/stories\//, "");
    assert.equal(published.has(to) || to.endsWith("perfo") || to.endsWith("northe"), true, entry.to);
    assert.equal(keepers.has(from), false, entry.from);
    const target = getLegacyRedirectPath(entry.from);
    assert.equal(target, entry.to);
    assert.equal(getLegacyRedirectPath(target), null);
  }

  console.log(`STORY_TRIAGE_REDIRECT_RULES=${legacyRedirectRuleCount()}`);
  console.log(`STORY_TRIAGE_DUPLICATE_REDIRECTS=${redirects.duplicates.length}`);
  console.log(`STORY_TRIAGE_NOINDEX_WAVE1=${noindexSlugs.length}`);
  console.log(`STORY_TRIAGE_NOINDEX_WAVE2=${noindexWave2.length}`);
});

test("flattenRedirectMap throws on a loop and a chain longer than five hops", () => {
  assert.throws(
    () => flattenRedirectMap(new Map([["/a", "/b"], ["/b", "/a"]])),
    /Redirect loop at \/a/,
  );
  const chain = new Map([
    ["/a", "/b"],
    ["/b", "/c"],
    ["/c", "/d"],
    ["/d", "/e"],
    ["/e", "/f"],
    ["/f", "/g"],
  ]);
  assert.throws(() => flattenRedirectMap(chain), /exceeds 5 hops/);
  assert.equal(flattenRedirectMap(new Map([["/a", "/b"], ["/b", "/c"]])).get("/a"), "/c");
});

test("wave 1 noindex can ship without wave 2", () => {
  const wave1 = ["thin-story"];
  const wave2 = ["later-story"];
  assert.equal(slugsThroughWave([wave1, wave2], 1).has("later-story"), false);
  assert.equal(slugsThroughWave([wave1, wave2], 2).has("later-story"), true);
  assert.equal(slugsThroughWave([wave1, wave2], 1).has("thin-story"), true);

  const sample = noindexSlugs[0];
  const previous = process.env.STORY_TRIAGE_WAVE;
  process.env.STORY_TRIAGE_WAVE = "1";
  assert.equal(isTriageNoindex(sample), true);
  assert.equal(isTriageSitemapExcluded(sample), true);
  assert.equal(storyClearsStoryTriage({ slug: sample, editorialStatus: "Needs improvement" }), false);
  assert.equal(storyClearsStoryTriage({ slug: sample, editorialStatus: "Keep live" }), true);
  assert.equal(storyClearsStoryTriage({ slug: sample, editorialStatus: "Ready" }), true);
  assert.equal(isTriageSitemapExcluded(sample, "Keep live"), false);
  process.env.STORY_TRIAGE_WAVE = previous;
});

test("related guides follow place keywords and stay off thin stories", () => {
  const solent = getRelatedGuides(
    { title: "Overnight racing on the Solent", summary: "", body: [] },
    publishedGuides,
  );
  assert.equal(solent[0]?.guidePath, "/guides/solent");
  assert.equal(solent[0]?.reason, "Cruising guide");

  const cowesWeek = getRelatedGuides(
    { title: "Cowes Week", summary: "A first look at Cowes Week.", body: [] },
    publishedGuides,
  );
  const cowesPaths = cowesWeek.map((item) => item.guidePath);
  assert.ok(cowesPaths.includes("/guides/cowes-week-guide"));
  assert.ok(cowesPaths.indexOf("/guides/cowes-week-guide") < cowesPaths.indexOf("/guides/solent/cowes"));

  const plain = getRelatedGuides(
    { title: "Winch service notes", summary: "Grease and check the pawls.", body: ["No place names here."] },
    publishedGuides,
  );
  assert.deepEqual(plain, []);

  const retired = getRelatedGuides(
    { title: "Cowes Week", summary: "", body: [] },
    publishedGuides.filter((item) => item.canonicalPath !== "/guides/cowes-week-guide"),
  );
  assert.equal(retired.some((item) => item.guidePath === "/guides/cowes-week-guide"), false);

  const thinSlug = noindexSlugs.find((slug) => /solent|cowes/i.test(slug)) || noindexSlugs[0];
  assert.equal(storyClearsStoryTriage({ slug: thinSlug, editorialStatus: "Needs improvement" }), false);
  assert.equal(storyClearsStoryTriage({ slug: thinSlug, editorialStatus: "Keep live" }), true);

  const latest = latestStoriesForGuide("/guides/solent", [
    {
      slug: "indexable-solent-story",
      title: "Solent breeze",
      summary: "Solent",
      body: [],
      date: "2026-08-02",
      editorialStatus: "Needs improvement",
      noindex: false,
    },
    {
      slug: thinSlug,
      title: "Solent thin story",
      summary: "Solent",
      body: [],
      date: "2026-08-03",
      editorialStatus: "Needs improvement",
      noindex: false,
    },
  ]);
  assert.deepEqual(latest.map((story) => story.slug), ["indexable-solent-story"]);
});

test("internal link groups keep room for the related guides block", async () => {
  const source = await fs.readFile(path.join(projectDir, "lib/internal-links.ts"), "utf8");
  assert.match(source, /\.slice\(0,\s*4\)/);
  assert.match(source, /title: "Related guides"/);
  assert.match(source, /storyClearsStoryTriage/);
});
