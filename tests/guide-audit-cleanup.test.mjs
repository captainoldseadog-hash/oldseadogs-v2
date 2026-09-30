import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import { guideCollectionPath, guideRegionRecords } from "../lib/guides.ts";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => readFile(path.join(projectDir, file), "utf8");

test("Marina Guide navigation and the legacy URL use the canonical Guide route", async () => {
  const [navigation, header, homepage, story, index, region, proxy] = await Promise.all([
    read("content/sections.ts"),
    read("components/MobileSiteHeader.tsx"),
    read("app/page.tsx"),
    read("app/stories/[slug]/page.tsx"),
    read("app/guides/page.tsx"),
    read("app/guides/[region]/page.tsx"),
    read("proxy.ts"),
  ]);
  assert.doesNotMatch(header, /href: "\/marina-guide"/);
  assert.match(navigation, /marinaGuideNavigationLink[\s\S]*?href: "\/guides\/solent-marina-guide"[\s\S]*?label: "Marina Guide"/);
  assert.match(header, /marinaGuideNavigationLink/);
  assert.match(homepage, /\.concat\(marinaGuideNavigationLink\)/);
  assert.match(story, /href=\{marinaGuideNavigationLink\.href\}[\s\S]*?marinaGuideNavigationLink\.label/);
  assert.match(index, /href="\/guides\/solent-marina-guide"/);
  assert.match(region, /region === "solent"[\s\S]*?href="\/guides\/solent-marina-guide"/);
  assert.match(proxy, /pathname === "\/marina-guide"[\s\S]*?status: 301[\s\S]*?Location: "\/guides\/solent-marina-guide"/);
});

test("every public desktop header uses the shared Marina Guide destination", async () => {
  const desktopHeaderFiles = [
    "app/page.tsx",
    "app/[section]/page.tsx",
    "app/about/page.tsx",
    "app/archive/page.tsx",
    "app/authors/michael-hodges/page.tsx",
    "app/contact/page.tsx",
    "app/cookie-policy/page.tsx",
    "app/editorial-standards/page.tsx",
    "app/manufacturers/[manufacturer]/page.tsx",
    "app/privacy/page.tsx",
    "app/search/page.tsx",
    "app/social/page.tsx",
    "app/stories/[slug]/page.tsx",
    "app/terms/page.tsx",
  ];
  for (const file of desktopHeaderFiles) {
    assert.match(await read(file), /marinaGuideNavigationLink/, file);
  }
});

test("unnamed legacy region placeholders never become public collection routes", () => {
  const area = { internalId: "OSD-G001", regionKey: "solent", regionName: "The Solent", editorialOrder: 1, title: "The Solent" };
  const legacy = { internalId: "OSD-G025", regionKey: "story-1786032722923", regionName: "", editorialOrder: 2, title: "Cowes Week Guide" };
  assert.deepEqual(guideRegionRecords([legacy, area]).map((guide) => guide.regionKey), ["solent"]);
  assert.equal(guideCollectionPath(area), "/guides/solent");
  assert.equal(guideCollectionPath(legacy), "/guides");
});

test("the controlled CMS correction changes only four previous targets and two indexing states", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "oldseadogs-guide-audit-"));
  const storePath = path.join(temporary, "editor-store.json");
  const targets = [
    ["solent-marina-guide", "story-1786032722982"],
    ["round-the-island-race-guide", "story-1786032722974"],
    ["uk-boat-show-calendar", "story-1786032722989"],
    ["beginners-guide-to-yacht-clubs", "story-1786032722997"],
  ];
  const before = {
    version: 1,
    stories: [{ id: "story-current", title: "Current story", status: "published" }],
    guides: [
      ...targets.map(([slug, previousGuideSlug]) => ({ slug, previousGuideSlug, nextGuideSlug: previousGuideSlug, status: "published", noindex: false })),
      { slug: "bembridge-marina", status: "published", noindex: true, parentGuideSlug: "the-solent", seo: { noindex: true }, title: "Bembridge Marina" },
      { slug: "poole-quay-boat-haven", status: "published", noindex: true, parentGuideSlug: "poole-harbour", seo: { noindex: false }, title: "Poole Quay Boat Haven" },
      { slug: "unrelated-guide", status: "draft", noindex: true, title: "Unrelated" },
    ],
    media: [{ id: "media-current" }],
    settings: { homepageLeadStoryId: "story-current" },
  };
  await writeFile(storePath, `${JSON.stringify(before, null, 2)}\n`);
  try {
    const dryRun = await execFileAsync(process.execPath, ["scripts/correct-guide-navigation-indexing.mjs", "--store", storePath], { cwd: projectDir });
    assert.equal(JSON.parse(dryRun.stdout).mode, "dry-run");
    assert.deepEqual(JSON.parse(await readFile(storePath, "utf8")), before);

    const applied = await execFileAsync(process.execPath, ["scripts/correct-guide-navigation-indexing.mjs", "--store", storePath, "--write"], { cwd: projectDir });
    const report = JSON.parse(applied.stdout);
    assert.equal(report.changes.length, 7);
    const after = JSON.parse(await readFile(storePath, "utf8"));
    assert.deepEqual(after.stories, before.stories);
    assert.deepEqual(after.media, before.media);
    assert.deepEqual(after.settings, before.settings);
    assert.deepEqual(after.guides.find((guide) => guide.slug === "unrelated-guide"), before.guides.find((guide) => guide.slug === "unrelated-guide"));
    for (const [slug, legacy] of targets) {
      const guide = after.guides.find((item) => item.slug === slug);
      assert.equal(guide.previousGuideSlug, "");
      assert.equal(guide.nextGuideSlug, legacy);
    }
    assert.equal(after.guides.find((guide) => guide.slug === "bembridge-marina").parentGuideSlug, "the-solent");
    assert.equal(after.guides.find((guide) => guide.slug === "bembridge-marina").noindex, false);
    assert.equal(after.guides.find((guide) => guide.slug === "bembridge-marina").seo.noindex, false);
    assert.equal(after.guides.find((guide) => guide.slug === "poole-quay-boat-haven").noindex, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
