import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

function story(overrides = {}) {
  const stamp = "2026-08-17T09:00:00.000Z";
  return {
    id: "current-content-baseline",
    slug: "current-content-baseline",
    title: "Current content baseline",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-08-16",
    author: "Old Sea Dogs",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs test desk",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: "",
    imageAlt: "",
    imageCredit: "",
    imageCaption: "",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "A deliberately isolated verification of the live publication rules.",
    sourceNotes: "Created only in a temporary editor store for current-content parity verification.",
    methodNotes: "Temporary integration test store.",
    contentBasis: "Original reporting",
    editorialStatus: "Published",
    noindex: false,
    summary: "A temporary story used to verify that every responsive layout reads the canonical publication feed.",
    body: [Array.from({ length: 180 }, (_, index) => `verification${index + 1}`).join(" ")],
    tags: ["verification"],
    readMinutes: 3,
    isFeatured: true,
    status: "published",
    publishedAt: stamp,
    scheduledPublishAt: "",
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
    statusHistory: [],
    ...overrides,
  };
}

function publicationOverride(value) {
  return {
    ...value,
    publicationOverride: {
      confirm: true,
      confirmImageRights: true,
      confirmEditorialWarnings: true,
      editorNote: "Disposable current-content parity verification.",
    },
  };
}

test("mobile latest stories use the canonical publish/unpublish pipeline", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-current-content-"));
  const storePath = path.join(dataDir, "editor-store.json");
  const disposable = story({
    id: "disposable-current-story",
    slug: "disposable-current-story",
    title: "Disposable current story reaches every responsive feed",
    date: "2026-08-17",
    publishedAt: "",
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
    editorialStatus: "Draft",
    isFeatured: false,
    status: "draft",
  });
  const store = {
    version: 1,
    stories: [story(), disposable],
    guides: [],
    media: [],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {
      homepageLeadStoryId: "current-content-baseline",
      homepageLeadStorySlug: "current-content-baseline",
      homepageLatestStoryIds: "[]",
      homepageEditorsChoiceStoryIds: "[]",
      homepageHiddenStoryIds: "[]",
    },
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    updatedAt: "2026-08-17T10:00:00.000Z",
  };
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");

  const worker = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" },
  });
  t.after(async () => {
    await worker.stop();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  const save = async (candidate) => worker.fetch("http://localhost/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "saveStory", story: candidate }),
  });

  let response = await save(publicationOverride({ ...disposable, status: "published" }));
  assert.equal(response.status, 200);
  const published = (await response.json()).story;
  assert.equal(published.status, "published");

  const publishedHomepage = await (await worker.fetch("http://localhost/")).text();
  assert.match(publishedHomepage, /class="mobile-hero-content"/);
  assert.match(publishedHomepage, /class="story-grid"/);
  assert.match(publishedHomepage, /href="\/stories\/disposable-current-story"/);
  assert.match(publishedHomepage, /href="\/stories\/current-content-baseline" class="button-primary">Read the lead story/);
  assert.equal((JSON.parse(await fs.readFile(storePath, "utf8"))).settings.homepageLeadStoryId, "current-content-baseline");

  response = await save({ ...published, status: "unpublished" });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).story.status, "unpublished");

  const unpublishedHomepage = await (await worker.fetch("http://localhost/")).text();
  assert.doesNotMatch(unpublishedHomepage, /disposable-current-story/);
  assert.match(unpublishedHomepage, /href="\/stories\/current-content-baseline" class="button-primary">Read the lead story/);

  const homepageSource = await fs.readFile(path.join(projectDir, "app/page.tsx"), "utf8");
  assert.equal((homepageSource.match(/latestReviewedOrFallback\.map/g) || []).length, 1);
  assert.match(homepageSource, /new HomepageContentProvider\(stories, settings\)\.getContent\(\)/);
  assert.doesNotMatch(homepageSource, /mobile(?:Stories|Latest|ContentSource|Cache)\s*=/i);
});
