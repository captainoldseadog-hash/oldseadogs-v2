import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { guideProductSeeds } from "../content/guide-product-seeds.ts";
import { portStoryGuideLink, portStoryGuideLinks } from "../content/port-story-guides.ts";
import { solentMarinaGuideSeeds } from "../content/solent-marina-guides.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

test("Cowes Yacht Heaven points at the Cowes Yacht Haven section of the harbour guide", () => {
  const link = portStoryGuideLink("ports-cowes-yacht-heaven");
  const cowes = guideProductSeeds.find((guide) => guide.slug === "cowes");
  const section = cowes?.sections.find((item) => item.heading === "Cowes Yacht Haven");

  assert.equal(link?.href, "/guides/solent/cowes#cowes-yacht-haven");
  assert.equal(link?.canonicalPath, "/guides/solent/cowes");
  assert.equal(cowes?.canonicalPath, "/guides/solent/cowes");
  assert.equal(section?.anchor, "cowes-yacht-haven");
  assert.match(link?.notice || "", /Cowes Yacht Haven/);
  assert.match(link?.linkLabel || "", /Cowes Yacht Haven/);
});

test("Lymington Marina points at the Berthon Lymington Marina guide", () => {
  const link = portStoryGuideLink("ports-lymington-marina");
  const berthon = solentMarinaGuideSeeds.find((guide) => guide.slug === "berthon-lymington-marina");

  assert.equal(link?.href, "/guides/solent/berthon-lymington-marina");
  assert.equal(link?.canonicalPath, "/guides/solent/berthon-lymington-marina");
  assert.equal(berthon?.canonicalPath, "/guides/solent/berthon-lymington-marina");
  assert.equal(berthon?.title, "Berthon Lymington Marina");
  assert.match(link?.notice || "", /Berthon/);
});

test("other stories keep their own URL", () => {
  assert.equal(portStoryGuideLink("ports-brighton-marina"), null);
  assert.equal(portStoryGuideLinks.length, 2);
});

test("the story page links readers to the guide and uses it as the canonical URL", async () => {
  const [page, sitemap, styles] = await Promise.all([
    fs.readFile(path.join(projectDir, "app/stories/[slug]/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/sitemap.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "app/globals.css"), "utf8"),
  ]);

  assert.match(page, /portStoryGuideLink\(story\.slug\)/);
  assert.match(page, /guideLink\?\.canonicalPath \|\| `\/stories\/\$\{story\.slug\}`/);
  assert.match(page, /<PortStoryGuideNotice link=\{guideLink\} \/>/);
  assert.match(page, /articleJsonLd\(story, storyImage \|\| undefined, canonicalPath\)/);
  assert.match(sitemap, /storyPrefersGuideCanonical\(story\.slug\)/);
  assert.match(styles, /\.story-guide-notice a/);
});
