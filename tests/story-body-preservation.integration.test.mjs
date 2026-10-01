import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const stamp = "2026-08-10T08:00:00.000Z";
const leadSlug = "full-body-preservation-story";
const sourceBody = Array.from(
  { length: 29 },
  (_, index) => `Full article preservation block ${String(index + 1).padStart(2, "0")}: unique source text must survive rendering in order.`,
);

let controller;
let dataDir;
let storePath;

function story(overrides = {}) {
  return {
    id: "full-body-preservation-story",
    slug: leadSlug,
    title: "Full story body preservation",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-08-10",
    author: "Old Sea Dogs",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: "/images/racing-yachts.png",
    imageAlt: "Racing yachts at sea",
    imageCredit: "Old Sea Dogs test credit",
    imageCaption: "A complete lead image caption",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "A complete public story must render without truncation.",
    sourceNotes: "Regression fixture.",
    methodNotes: "",
    contentBasis: "Original reporting",
    editorialStatus: "Published",
    noindex: false,
    summary: "A production-shaped record with a complete 29-block article body.",
    body: sourceBody,
    tags: ["body preservation", "navigation"],
    readMinutes: 6,
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

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-story-body-preservation-"));
  storePath = path.join(dataDir, "editor-store.json");
  const store = {
    version: 1,
    stories: [
      story(),
      story({ id: "related-story-one", slug: "related-story-one", title: "Related story one", body: ["Related body one."], imageUrl: "/images/related-story-one.png", isFeatured: false, sortOrder: 1 }),
      story({ id: "related-story-two", slug: "related-story-two", title: "Related story two", body: ["Related body two."], imageUrl: "/images/related-story-two.png", isFeatured: false, sortOrder: 2 }),
    ],
    guides: [],
    media: [],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {
      homepageLeadStoryId: "full-body-preservation-story",
      homepageLeadStorySlug: leadSlug,
      homepageLatestStoryIds: JSON.stringify(["related-story-one", "related-story-two"]),
    },
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    updatedAt: stamp,
  };
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
  controller = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" },
  });
});

after(async () => {
  await controller?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("full story rendering preserves all 29 source body blocks without truncation", async () => {
  const sourceBefore = JSON.parse(await fs.readFile(storePath, "utf8"));
  const sourceStoryBefore = sourceBefore.stories.find((item) => item.slug === leadSlug);
  assert.equal(sourceStoryBefore.body.length, 29);

  const response = await controller.fetch(`http://localhost/stories/${leadSlug}`, {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.equal((html.match(/<div class="article-paragraph-with-ad">/g) || []).length, 29);
  let previousIndex = -1;
  for (const block of sourceStoryBefore.body) {
    const renderedIndex = html.indexOf(block);
    assert.ok(renderedIndex > previousIndex, `Missing or reordered body block: ${block}`);
    previousIndex = renderedIndex;
  }

  assert.match(html, /<h1>Full story body preservation<\/h1>/);
  const leadImage = html.match(/<img[^>]+src="\/img\/1600\/images\/racing-yachts\.png"[^>]*>/)?.[0] || "";
  assert.match(leadImage, /src="\/img\/1600\/images\/racing-yachts\.png"/);
  assert.doesNotMatch(leadImage, /loading="lazy"/);
  assert.match(leadImage, /loading="eager"/);
  assert.match(leadImage, /fetchPriority="high"/);
  assert.match(leadImage, /sizes="\(max-width: 760px\) calc\(100vw - 40px\), 860px"/);
  assert.match(html, /<source[^>]+media="\(max-width: 1024px\)"[^>]+srcSet="\/img\/480\/images\/racing-yachts\.png 480w/);
  assert.match(html, /A complete lead image caption/);
  assert.match(html, /Old Sea Dogs test credit/);
  assert.match(html, /href="\/stories\/related-story-one"/);
  assert.match(html, /href="\/stories\/related-story-two"/);
  const relatedSectionStart = html.indexOf('<section class="related-band"');
  const relatedSectionEnd = html.indexOf("</section>", relatedSectionStart);
  assert.ok(relatedSectionStart >= 0 && relatedSectionEnd > relatedSectionStart);
  const relatedSection = html.slice(relatedSectionStart, relatedSectionEnd);
  assert.match(relatedSection, /<img[^>]+loading="lazy"[^>]+src="\/img\/480\/images\/related-story-one\.png"/);
  assert.match(relatedSection, /<img[^>]+loading="lazy"[^>]+src="\/img\/480\/images\/related-story-two\.png"/);
  assert.match(html, /rel="canonical" href="https:\/\/oldseadogs\.com\/stories\/full-body-preservation-story"/);
  assert.doesNotMatch(html, /isolated validation record mirrors|production-representative-validation/i);

  const sourceAfter = JSON.parse(await fs.readFile(storePath, "utf8"));
  const sourceStoryAfter = sourceAfter.stories.find((item) => item.slug === leadSlug);
  assert.deepEqual(sourceStoryAfter.body, sourceStoryBefore.body);
});
