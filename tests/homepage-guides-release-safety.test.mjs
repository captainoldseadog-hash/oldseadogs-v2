import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { developmentHomepageFixturePolicy } from "../lib/homepage-fixture-policy.js";
import { parseHomepageStoryManifest, parseStoryPageDetails } from "../lib/live-homepage-manifest.js";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

test("development homepage fixture policy is explicit and fail-closed", () => {
  const active = developmentHomepageFixturePolicy({
    nodeEnv: "development",
    oldSeaDogsEnv: "development",
    explicitlyEnabled: "true",
    authoritativeStoryCount: 0,
  });
  assert.equal(active.active, true);
  assert.equal(active.reason, "development-fallback-active");

  for (const input of [
    { nodeEnv: "production", oldSeaDogsEnv: "development", explicitlyEnabled: "true", authoritativeStoryCount: 0 },
    { nodeEnv: "development", oldSeaDogsEnv: "production", explicitlyEnabled: "true", authoritativeStoryCount: 0 },
    { nodeEnv: "development", oldSeaDogsEnv: "development", explicitlyEnabled: "false", authoritativeStoryCount: 0 },
    { nodeEnv: "development", oldSeaDogsEnv: "development", explicitlyEnabled: "true", authoritativeStoryCount: 1 },
    { nodeEnv: "test", oldSeaDogsEnv: "development", explicitlyEnabled: "true", authoritativeStoryCount: 0 },
  ]) {
    assert.equal(developmentHomepageFixturePolicy(input).active, false, JSON.stringify(input));
  }
});

test("production story persistence paths and missing-store safety remain unchanged", async () => {
  const [siteContent, fixturePolicy, releaseCommon, ecosystem] = await Promise.all([
    fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "lib/homepage-fixture-policy.js"), "utf8"),
    fs.readFile(path.join(projectDir, "deploy/release-common.sh"), "utf8"),
    fs.readFile(path.join(projectDir, "ecosystem.config.cjs"), "utf8"),
  ]);
  assert.doesNotMatch(siteContent, /from\s+["']\.\.\/content\/homepage-production-snapshot["']/);
  assert.match(siteContent, /await import\(["']\.\.\/content\/homepage-production-snapshot["']\)/);
  assert.match(siteContent, /NODE_ENV/);
  assert.match(siteContent, /OLDSEADOGS_ENV/);
  assert.match(fixturePolicy, /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.match(siteContent, /authoritativeStoryCount/);
  assert.match(siteContent, /Static-only fallback was blocked/);
  assert.match(siteContent, /Development fixture fallback is blocked in production/);
  assert.match(releaseCommon, /\/var\/www\/oldseadogs-data/);
  assert.match(releaseCommon, /export OLDSEADOGS_DATA_DIR="\$DATA_DIR"/);
  assert.match(ecosystem, /OLDSEADOGS_DATA_DIR:[^\n]+\/var\/www\/oldseadogs-data/);
});

test("Guides promotion is isolated from featured and latest story selection", async () => {
  const [homepage, provider] = await Promise.all([
    fs.readFile(path.join(projectDir, "app/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "lib/homepage-content-provider.ts"), "utf8"),
  ]);
  assert.match(homepage, /new HomepageContentProvider\(stories, settings\)\.getContent\(\)/);
  assert.match(homepage, /Discover Old Sea Dogs Guides/);
  assert.match(homepage, /href="\/guides"/);
  assert.equal((homepage.match(/<GuidePromoBand\b/g) || []).length, 1);
  assert.match(provider, /findHomepageLeadStory\(homepageLeadStories, this\.settings\)/);
  assert.match(provider, /homepageLatestStoryIds/);
  assert.match(provider, /storiesInSettingOrder/);
  assert.doesNotMatch(homepage, /cowes-week-2026-folkboats-j70-rs21-squibs-tp52-racing|exploring-duo-worlds-toughest-row-atlantic-2026|princess-anne-cowes-week-2026/);
});

test("live homepage manifest parser preserves story order, links, dates and images", () => {
  const html = `
    <section class="hero"><div class="hero-image" style="background-image:url(/api/media/lead)"></div>
      <a class="button-primary" href="/stories/lead-story">Read the lead story</a></section>
    <section id="latest"><div class="story-grid">
      <article class="story-card"><a><span class="story-image" style="background-image:url(/api/media/one)"></span></a><div class="story-meta"><span>News</span><span>06 Aug 2026</span></div><h3><a href="/stories/one">Story One</a></h3></article>
      <article class="story-card"><a><span class="story-image" style="background-image:url(/api/media/two)"></span></a><div class="story-meta"><span>News</span><span>05 Aug 2026</span></div><h3><a href="/stories/two">Story &amp; Two</a></h3></article>
      <article class="story-card"><a><span class="story-image" style="background-image:url(/api/media/three)"></span></a><div class="story-meta"><span>News</span><span>04 Aug 2026</span></div><h3><a href="/stories/three">Story Three</a></h3></article>
      <article class="story-card"><a><span class="story-image" style="background-image:url(/api/media/four)"></span></a><div class="story-meta"><span>News</span><span>03 Aug 2026</span></div><h3><a href="/stories/four">Story Four</a></h3></article>
    </div></section>`;
  const manifest = parseHomepageStoryManifest(html);
  assert.equal(manifest.featuredStory.slug, "lead-story");
  assert.equal(manifest.featuredStory.imageUrl, "https://oldseadogs.com/api/media/lead");
  assert.deepEqual(manifest.latestStories.map((story) => story.slug), ["one", "two", "three", "four"]);
  assert.equal(manifest.latestStories[1].title, "Story & Two");
  assert.equal(manifest.latestStories[1].date, "05 Aug 2026");
  assert.equal(manifest.latestStories[1].imageUrl, "https://oldseadogs.com/api/media/two");
  assert.deepEqual(parseStoryPageDetails('<h1>Lead &amp; Story</h1><div class="article-meta"><span>6 August 2026</span></div>'), {
    title: "Lead & Story",
    date: "6 August 2026",
  });
});
