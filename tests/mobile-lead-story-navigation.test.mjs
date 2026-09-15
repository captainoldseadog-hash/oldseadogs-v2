import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("the Homepage Manager lead gets a full-card crawlable Link with full route prefetch", async () => {
  const homepage = await read("app/page.tsx");
  const leadLink = /<Link\s+aria-label=\{`Read \$\{featuredStory\.title\}`\}\s+className="mobile-lead-story-link"\s+href=\{`\/stories\/\$\{featuredStory\.slug\}`\}\s+prefetch=\{true\}\s*\/>/;

  assert.match(homepage, leadLink);
  assert.doesNotMatch(homepage, /mobile-lead-story-link[\s\S]{0,300}(?:onClick|onTouchStart|preventDefault|router\.push)/);
  assert.doesNotMatch(homepage, /msig-europe-finishes-ocean-race-atlantic-2026-lorient/);
  assert.match(homepage, /new HomepageContentProvider\(stories, settings\)\.getContent\(\)/);
});

test("desktop lead prefetches while ordinary secondary cards keep their existing native Link behavior", async () => {
  const homepage = await read("app/page.tsx");

  assert.match(
    homepage,
    /<Link href=\{`\/stories\/\$\{featuredStory\.slug\}`\} className="button-primary" prefetch=\{true\}>/,
  );
  assert.match(homepage, /<Link className="story-card-link" href=\{`\/stories\/\$\{story\.slug\}`\}>/);
  assert.doesNotMatch(homepage, /story-card-link[^>]*prefetch=/);
});

test("the lead uses one responsive eager image rather than separate mobile and desktop downloads", async () => {
  const [homepage, css] = await Promise.all([read("app/page.tsx"), read("app/globals.css")]);

  assert.match(homepage, /<picture className="hero-image">[\s\S]*?media="\(max-width: 1024px\)"[\s\S]*?publicMediaVariantUrl\(featuredStory\.imageUrl, "mobile"\)[\s\S]*?<img/);
  assert.doesNotMatch(homepage, /className="mobile-hero-image"/);
  assert.match(homepage, /fetchPriority="high"[\s\S]*?loading="eager"/);
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.hero-image \{\s*display: block;/);
});

test("the mobile lead has immediate pressed and keyboard-focus feedback without JavaScript", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /\.mobile-lead-story-link \{[\s\S]*?position: absolute;[\s\S]*?inset: 0;[\s\S]*?touch-action: manipulation;/);
  assert.match(css, /\.mobile-lead-story-link:active \{[\s\S]*?background:/);
  assert.match(css, /\.mobile-lead-story-link:focus-visible \{[\s\S]*?outline:/);
});
