import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const publishedAt = "2026-08-11T09:30:00.000Z";
const updatedAt = "2026-08-11T10:45:00.000Z";
const futureSlug = "future-published-story-seo-proof";
const excludedSlug = "explicitly-excluded-published-story";
const draftSlug = "future-draft-story";
const scheduledSlug = "future-scheduled-story";
const mediaId = "media_future_story_seo_lead";
const leadImage = `/api/media/${mediaId}`;
const body = [
  "The future story opens with substantive reporting that is present in the server response before any browser JavaScript runs.",
  "## A second section in the published article",
  "Every future published record follows the same automatic story route and sitemap path without a manual source-code registration step.",
];

let controller;
let dataDir;

function story(overrides = {}) {
  return {
    id: futureSlug,
    slug: futureSlug,
    title: "Future published story SEO proof",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-08-11",
    author: "Michael Hodges",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: leadImage,
    imageAlt: "Racing yachts crossing open water",
    imageCredit: "Old Sea Dogs",
    imageCaption: "The fleet at sea",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "A future story should be indexable through publication state alone.",
    sourceNotes: "Original Old Sea Dogs reporting.",
    methodNotes: "Edited and checked before publication.",
    contentBasis: "Original reporting",
    editorialStatus: "Needs improvement",
    noindex: false,
    summary: "A representative future Old Sea Dogs story proving automatic search indexing, metadata and sitemap inclusion.",
    body,
    tags: ["future stories", "Google indexing"],
    readMinutes: 4,
    isFeatured: true,
    status: "published",
    publishedAt,
    scheduledPublishAt: "",
    sortOrder: 0,
    createdAt: publishedAt,
    updatedAt,
    statusHistory: [],
    ...overrides,
  };
}

function emptyStore(stories, media) {
  return {
    version: 1,
    stories,
    guides: [],
    media,
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    updatedAt,
  };
}

function metadataContent(html, name) {
  const tags = html.match(/<meta\s[^>]*>/g) || [];
  const tag = tags.find((item) => new RegExp(`name=["']${name}["']`, "i").test(item));
  if (!tag) return "";
  return tag.match(/content=["']([^"']*)["']/i)?.[1] || "";
}

function jsonLdObjects(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap((match) => {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-future-story-seo-"));
  const originalFilename = `${mediaId}-future-story-seo.png`;
  const webFilename = `${mediaId}.webp`;
  const thumbnailFilename = `${mediaId}.webp`;
  const mediaDir = path.join(dataDir, "media");
  await Promise.all([
    path.join(mediaDir, "originals"),
    path.join(mediaDir, "web"),
    path.join(mediaDir, "thumbnails"),
    path.join(mediaDir, "metadata"),
  ].map((directory) => fs.mkdir(directory, { recursive: true })));
  await Promise.all([
    fs.writeFile(path.join(mediaDir, "originals", originalFilename), Buffer.from("future-story-original-image")),
    fs.writeFile(path.join(mediaDir, "web", webFilename), Buffer.from("future-story-web-image")),
    fs.writeFile(path.join(mediaDir, "thumbnails", thumbnailFilename), Buffer.from("future-story-thumbnail-image")),
    fs.writeFile(path.join(mediaDir, "metadata", `${mediaId}.json`), JSON.stringify({
      id: mediaId,
      filename: originalFilename,
      webFilename,
      thumbnailFilename,
      contentType: "image/png",
      webContentType: "image/webp",
      thumbnailContentType: "image/webp",
    })),
  ]);
  await fs.writeFile(
    path.join(dataDir, "editor-store.json"),
    `${JSON.stringify(emptyStore([
      story(),
      story({
        id: excludedSlug,
        slug: excludedSlug,
        title: "Explicitly excluded published story",
        isFeatured: false,
        noindex: true,
      }),
      story({
        id: draftSlug,
        slug: draftSlug,
        title: "Future draft story",
        isFeatured: false,
        status: "draft",
        publishedAt: "",
      }),
      story({
        id: scheduledSlug,
        slug: scheduledSlug,
        title: "Future scheduled story",
        isFeatured: false,
        status: "scheduled",
        publishedAt: "",
        scheduledPublishAt: "2099-08-11T09:30:00.000Z",
      }),
    ], [{
      id: mediaId,
      filename: originalFilename,
      originalFilename: "future-story-seo.png",
      contentType: "image/png",
      size: 27,
      r2Key: `local:${mediaId}`,
      originalKey: `local:${mediaId}:original`,
      webKey: `local:${mediaId}:web`,
      url: leadImage,
      width: 1600,
      height: 900,
      createdAt: publishedAt,
      updatedAt,
    }]), null, 2)}\n`,
    { mode: 0o600 },
  );
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

test("a normal future published story is automatically indexable, server rendered and fully described", async () => {
  const response = await controller.fetch(`https://oldseadogs.com/stories/${futureSlug}`);
  assert.equal(response.status, 200);
  const html = await response.text();

  for (const block of body) assert.match(html, new RegExp(block.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(metadataContent(html, "robots"), /\bindex\b/i);
  assert.match(metadataContent(html, "robots"), /\bfollow\b/i);
  assert.match(metadataContent(html, "googlebot"), /\bindex\b/i);
  assert.match(metadataContent(html, "googlebot"), /\bfollow\b/i);
  assert.match(metadataContent(html, "googlebot"), /max-image-preview:large/i);
  assert.match(html, new RegExp(`rel=["']canonical["'] href=["']https://oldseadogs\\.com/stories/${futureSlug}["']`));
  const articleFigure = html.match(/<figure class="article-figure">[\s\S]*?<\/figure>/)?.[0] || "";
  assert.match(articleFigure, new RegExp(`src="${leadImage.replaceAll("/", "\\/")}\\?variant=web"`, "i"));
  assert.match(articleFigure, new RegExp(`srcSet="[^"]*${leadImage.replaceAll("/", "\\/")}\\?variant=web 1600w"`, "i"));
  assert.match(articleFigure, /fetchpriority="high"/i);
  assert.match(articleFigure, /loading="eager"/i);

  const article = jsonLdObjects(html).find((item) => item["@type"] === "Article" || item["@type"] === "NewsArticle");
  assert.ok(article, "Article or NewsArticle JSON-LD must be present");
  assert.equal(article.headline, "Future published story SEO proof");
  assert.equal(article.description, "A representative future Old Sea Dogs story proving automatic search indexing, metadata and sitemap inclusion.");
  const shareImage = `/img/1200/media/${mediaId}`;
  assert.deepEqual(article.image, [{
    "@type": "ImageObject",
    url: `https://oldseadogs.com${shareImage}`,
    width: 1200,
    height: 675,
  }]);
  assert.match(html, new RegExp(`property=["']og:image["'] content=["']https://oldseadogs\\.com${shareImage.replaceAll("/", "\\/")}["']`));
  assert.match(html, new RegExp(`name=["']twitter:image["'] content=["']https://oldseadogs\\.com${shareImage.replaceAll("/", "\\/")}["']`));
  assert.match(html, /property=["']og:image:width["'] content=["']1200["']/);
  assert.match(html, /property=["']og:image:height["'] content=["']675["']/);
  assert.doesNotMatch(html, /variant=original/);
  assert.equal(article.datePublished, publishedAt);
  assert.equal(article.dateModified, updatedAt);
  assert.equal(article.author?.name, "Michael Hodges");
  assert.equal(article.author?.url, "https://oldseadogs.com/authors/michael-hodges");
  assert.equal(article.publisher?.name, "Old Sea Dogs");

  const imageResponse = await controller.fetch(`https://oldseadogs.com${leadImage}`);
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get("content-type"), "image/webp");
  assert.doesNotMatch(imageResponse.headers.get("x-robots-tag") || "", /noindex/i);
});

test("sitemap automatically includes every eligible published story with actual lastmod", async () => {
  const response = await controller.fetch("https://oldseadogs.com/sitemap.xml");
  assert.equal(response.status, 200);
  const xml = await response.text();
  const storyUrls = [...xml.matchAll(/<loc>https:\/\/oldseadogs\.com\/stories\/([^<]+)<\/loc>/g)].map((match) => match[1]);
  const legacyStories = JSON.parse(await fs.readFile(path.join(projectDir, "content/legacy-stories.json"), "utf8"));
  const report = {
    totalPublishedStories: legacyStories.length + 2,
    totalIndexablePublishedStories: legacyStories.length + 1,
    totalNoindexedPublishedStories: 1,
    totalSitemapStoryUrls: storyUrls.length,
  };

  assert.ok(storyUrls.includes(futureSlug));
  assert.ok(!storyUrls.includes(excludedSlug));
  assert.ok(!storyUrls.includes(draftSlug));
  assert.ok(!storyUrls.includes(scheduledSlug));
  assert.equal(report.totalSitemapStoryUrls, report.totalIndexablePublishedStories);
  assert.match(
    xml,
    new RegExp(`<loc>https://oldseadogs\\.com/stories/${futureSlug}</loc>\\s*<lastmod>${updatedAt.replaceAll(".", "\\.")}</lastmod>`),
  );
  assert.doesNotMatch(xml, /<loc>https:\/\/oldseadogs\.com\/search<\/loc>/);
  for (const privatePath of ["/editor", "/api/editor", "/api/search", "/api/social/track"]) {
    assert.doesNotMatch(
      xml,
      new RegExp(`<loc>https:\\/\\/oldseadogs\\.com${privatePath.replaceAll("/", "\\/")}(?:\\/[^<]*)?<\\/loc>`),
    );
  }
  console.log(`SEO_SITEMAP_TEST_REPORT=${JSON.stringify(report)}`);
});

test("explicit exclusion is noindex,follow while drafts and future schedules stay private", async () => {
  const excludedResponse = await controller.fetch(`https://oldseadogs.com/stories/${excludedSlug}`);
  assert.equal(excludedResponse.status, 200);
  const excludedHtml = await excludedResponse.text();
  assert.match(metadataContent(excludedHtml, "robots"), /noindex/i);
  assert.match(metadataContent(excludedHtml, "robots"), /follow/i);
  assert.doesNotMatch(metadataContent(excludedHtml, "robots"), /nofollow/i);

  const draftResponse = await controller.fetch(`https://oldseadogs.com/stories/${draftSlug}`);
  assert.equal(draftResponse.status, 404);

  const scheduledResponse = await controller.fetch(`https://oldseadogs.com/stories/${scheduledSlug}`);
  assert.equal(scheduledResponse.status, 404);
});

test("search, private routes and pagination retain the intended crawl controls", async () => {
  const searchResponse = await controller.fetch("https://oldseadogs.com/search?q=boat");
  assert.equal(searchResponse.status, 200);
  const searchRobots = metadataContent(await searchResponse.text(), "robots");
  assert.match(searchRobots, /noindex/i);
  assert.match(searchRobots, /follow/i);
  assert.doesNotMatch(searchRobots, /nofollow/i);

  const editorResponse = await controller.fetch("https://oldseadogs.com/editor");
  assert.equal(editorResponse.status, 200);
  assert.match(editorResponse.headers.get("x-robots-tag") || "", /noindex, nofollow, noarchive, nosnippet/i);
  assert.match(metadataContent(await editorResponse.text(), "robots"), /noindex/i);

  for (const route of ["/editor/preview/test", "/api/editor", "/api/search?q=boat", "/api/social/track"]) {
    const response = await controller.fetch(`https://oldseadogs.com${route}`);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex, nofollow, noarchive, nosnippet/i, route);
  }

  const pageTwo = await controller.fetch("https://oldseadogs.com/news?page=2");
  assert.equal(pageTwo.status, 200);
  const pageTwoHtml = await pageTwo.text();
  assert.match(pageTwoHtml, /rel="canonical" href="https:\/\/oldseadogs\.com\/news\?page=2"/);
  assert.match(metadataContent(pageTwoHtml, "robots"), /\bindex\b/i);
  assert.match(metadataContent(pageTwoHtml, "robots"), /\bfollow\b/i);
});

test("robots.txt allows public media and excludes private routes", async () => {
  const response = await controller.fetch("https://oldseadogs.com/robots.txt");
  assert.equal(response.status, 200);
  const robots = await response.text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \/(?:\r?\n|$)/i);
  for (const privatePath of ["/editor", "/api/editor", "/api/search", "/api/social/track"]) {
    assert.match(robots, new RegExp(`Disallow: ${privatePath.replaceAll("/", "\\/")}`));
  }
  assert.match(robots, /Sitemap: https:\/\/oldseadogs\.com\/sitemap\.xml/i);
  assert.doesNotMatch(robots, /Disallow: \/api\/media/i);
});
