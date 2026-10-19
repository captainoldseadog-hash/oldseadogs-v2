import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import legacyStories from "../content/legacy-stories.json" with { type: "json" };
import { publicStoryHref } from "../lib/public-story-href.ts";
import { getLegacyRedirectPath } from "../lib/redirects.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const literalPath = /["'`](\/(?:stories|news|racing|boat-shows|boat-reviews|shows|races|reviews|masterclass|ports|clubs|gear|destinations|lifestyle|maintenance|regatta)(?:\/[A-Za-z0-9._~%-]+)?)["'`]/g;

const skippedDirs = new Set(["node_modules", "dist", ".next", "outputs", ".ga4-release-work", "story-triage", "editor"]);

async function sourceFiles(dir) {
  const found = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skippedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...await sourceFiles(full));
      continue;
    }
    if (!/\.(?:tsx?|mjs|jsx?)$/.test(entry.name)) continue;
    found.push(full);
  }
  return found;
}

test("public story hrefs land on a URL that is not itself a redirect", () => {
  assert.equal(publicStoryHref("ports-lymington-marina"), "/guides/solent/berthon-lymington-marina");
  assert.equal(
    publicStoryHref("boat-reviews-gypsy-moth-iv-the-iconic-british-yacht"),
    "/stories/boat-reviews-gypsy-moth-iv-an-iconic-british-yacht",
  );
  assert.equal(
    publicStoryHref("masterclass-gypsy-moth-iv-the-iconic-british-yacht"),
    "/stories/boat-reviews-gypsy-moth-iv-an-iconic-british-yacht",
  );
  assert.equal(
    publicStoryHref("racing-wavemakers-expands-to-portsmouth-as-rya-pushes-to-redefine-sailings-talent-pathway"),
    getLegacyRedirectPath("/stories/racing-wavemakers-expands-to-portsmouth-as-rya-pushes-to-redefine-sailings-talent-pathway"),
  );

  for (const story of legacyStories) {
    const href = publicStoryHref(story.slug);
    const target = href.split("#")[0];
    assert.equal(getLegacyRedirectPath(target), null, `${story.slug} -> ${href}`);
    if (getLegacyRedirectPath(`/stories/${story.slug}`)) {
      assert.notEqual(target, `/stories/${story.slug}`, story.slug);
    }
  }
});

test("quoted internal links do not point at a known redirect source", async () => {
  const roots = ["app", "components", "content", "lib"].map((name) => path.join(projectDir, name));
  const hits = [];
  for (const root of roots) {
    for (const file of await sourceFiles(root)) {
      if (file.endsWith(`${path.sep}lib${path.sep}redirects.ts`)) continue;
      if (file.endsWith(`${path.sep}content${path.sep}legacy-stories.json`)) continue;
      const text = await fs.readFile(file, "utf8");
      for (const match of text.matchAll(literalPath)) {
        const target = getLegacyRedirectPath(match[1]);
        if (!target) continue;
        hits.push(`${path.relative(projectDir, file)}: ${match[1]} -> ${target}`);
      }
    }
  }
  assert.deepEqual(hits, []);
});
