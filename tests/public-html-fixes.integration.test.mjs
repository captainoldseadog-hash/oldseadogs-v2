import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const stamp = "2026-10-01T09:00:00.000Z";
const leadSlug = "filename-alt-lead";

function story(overrides = {}) {
  return {
    id: "filename-alt-lead",
    slug: leadSlug,
    title: "A New Winter Harbour",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-10-01",
    author: "Michael Hodges",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs test desk",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: "/images/racing-yachts.png",
    imageAlt: "Monaco 1.png",
    imageCredit: "© Michael Hodges",
    imageCaption: "Monaco - Jeddah in 2027",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "The public page should describe the picture, not its file name.",
    sourceNotes: "Temporary store for the public HTML fix.",
    methodNotes: "Temporary integration test store.",
    contentBasis: "Original reporting",
    editorialStatus: "Published",
    noindex: false,
    summary: "A lead story whose stored image alt is only a file name.",
    body: [
      "The opening paragraph stays on the page.",
      '<figure class="article-inline-image" data-caption="RIB tender alongside the quay" data-credit="Old Sea Dogs"><img src="/images/marina-hero.png" alt="tender.png" loading="lazy" /></figure>',
    ],
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

test("public HTML serves the favicon, one homepage h1, and meaningful image alt text", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-public-html-"));
  const storePath = path.join(dataDir, "editor-store.json");
  const store = {
    version: 1,
    stories: [
      story(),
      story({
        id: "filename-alt-card",
        slug: "filename-alt-card",
        title: "boot Düsseldorf 2027",
        imageAlt: "boot26.jpg",
        imageCaption: "",
        isFeatured: false,
        sortOrder: 1,
        body: ["A second story whose only alt text was a file name."],
      }),
    ],
    guides: [],
    media: [],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {
      homepageLeadStoryId: "filename-alt-lead",
      homepageLeadStorySlug: leadSlug,
      homepageLatestStoryIds: JSON.stringify(["filename-alt-card"]),
      homepageEditorsChoiceStoryIds: "[]",
      homepageHiddenStoryIds: "[]",
    },
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    updatedAt: stamp,
  };
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
  const worker = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" },
  });
  t.after(async () => {
    await worker.stop();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  const faviconFile = await fs.readFile(path.join(projectDir, "dist/client/favicon.ico"));
  assert.equal(faviconFile.subarray(0, 4).toString("hex"), "00000100");
  const favicon = await worker.fetch("http://localhost/favicon.ico");
  assert.equal(favicon.status, 200);
  assert.equal(decodeURIComponent(favicon.headers.get("x-vinext-static-file") || ""), "/favicon.ico");

  const homepageResponse = await worker.fetch("http://localhost/", { headers: { accept: "text/html" } });
  assert.equal(homepageResponse.status, 200);
  const homepage = await homepageResponse.text();
  const homepageH1s = homepage.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.equal(homepageH1s.length, 1);
  assert.match(homepageH1s[0], />Old Sea Dogs</);
  assert.match(homepage, /<h2 id="mobile-lead-title">A New Winter Harbour<\/h2>/);
  assert.match(homepage, /alt="Monaco - Jeddah in 2027"/);
  assert.match(homepage, /alt="boot Düsseldorf 2027"/);
  assert.doesNotMatch(homepage, /alt="Monaco 1\.png"|alt="boot26\.jpg"/);
  assert.match(homepage, /rel="icon"[^>]*href="[^"]*\/favicon\.ico"/);

  const storyResponse = await worker.fetch(`http://localhost/stories/${leadSlug}`, { headers: { accept: "text/html" } });
  assert.equal(storyResponse.status, 200);
  const storyHtml = await storyResponse.text();
  assert.match(storyHtml, /alt="Monaco - Jeddah in 2027"/);
  assert.match(storyHtml, /alt="RIB tender alongside the quay"/);
  assert.doesNotMatch(storyHtml, /alt="Monaco 1\.png"|alt="tender\.png"/);

  const stored = JSON.parse(await fs.readFile(storePath, "utf8"));
  assert.equal(stored.stories.find((item) => item.slug === leadSlug).imageAlt, "Monaco 1.png");
  assert.equal(stored.stories.find((item) => item.slug === "filename-alt-card").imageAlt, "boot26.jpg");
});
