import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const mediaId = "media_fdf2c6453ef34092af19c5885509e4d1";
const baseUrl = "http://oldseadogs.test";
const originalBody = Buffer.from("oldseadogs-original-image-body");
const webBody = Buffer.from("oldseadogs-web-image-body");
const thumbnailBody = Buffer.from("oldseadogs-thumbnail-image-body");
let dataDir;
let app;
let previousDataDir;
let previousEnvironment;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-media-route-"));
  const mediaDir = path.join(dataDir, "media");
  const originalDir = path.join(mediaDir, "originals");
  const webDir = path.join(mediaDir, "web");
  const thumbnailDir = path.join(mediaDir, "thumbnails");
  const metadataDir = path.join(mediaDir, "metadata");
  await Promise.all([originalDir, webDir, thumbnailDir, metadataDir].map((directory) => fs.mkdir(directory, { recursive: true })));

  const originalFilename = `${mediaId}-production-example.png`;
  const webFilename = `${mediaId}.webp`;
  const thumbnailFilename = `${mediaId}.webp`;
  await fs.writeFile(path.join(originalDir, originalFilename), originalBody);
  await fs.writeFile(path.join(webDir, webFilename), webBody);
  await fs.writeFile(path.join(thumbnailDir, thumbnailFilename), thumbnailBody);
  await fs.writeFile(path.join(metadataDir, `${mediaId}.json`), JSON.stringify({
    id: mediaId,
    filename: originalFilename,
    webFilename,
    thumbnailFilename,
    contentType: "image/png",
    webContentType: "image/webp",
    thumbnailContentType: "image/webp",
  }));
  await fs.writeFile(path.join(dataDir, "editor-store.json"), JSON.stringify({
    version: 1,
    stories: [],
    guides: [],
    media: [{
      id: mediaId,
      filename: originalFilename,
      originalFilename: "production-example.png",
      contentType: "image/png",
      size: originalBody.byteLength,
      r2Key: `local:${mediaId}`,
      originalKey: `local:${mediaId}:original`,
      webKey: `local:${mediaId}:web`,
      url: `/api/media/${mediaId}`,
      createdAt: "2026-07-22T08:00:00.000Z",
    }],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    updatedAt: "2026-07-22T08:00:00.000Z",
  }));

  previousDataDir = process.env.OLDSEADOGS_DATA_DIR;
  previousEnvironment = process.env.OLDSEADOGS_ENV;
  process.env.OLDSEADOGS_DATA_DIR = dataDir;
  process.env.OLDSEADOGS_ENV = "production";
  const entryUrl = pathToFileURL(path.join(projectDir, "dist/server/index.js"));
  app = (await import(`${entryUrl.href}?media-route-test=${Date.now()}`)).default;
});

after(async () => {
  if (previousDataDir === undefined) delete process.env.OLDSEADOGS_DATA_DIR;
  else process.env.OLDSEADOGS_DATA_DIR = previousDataDir;
  if (previousEnvironment === undefined) delete process.env.OLDSEADOGS_ENV;
  else process.env.OLDSEADOGS_ENV = previousEnvironment;
  await fs.rm(dataDir, { recursive: true, force: true });
});

function requestMedia(search = "") {
  return app.fetch(
    new Request(`${baseUrl}/api/media/${mediaId}${search}`),
    undefined,
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("local media route preserves the exact ID and serves original content type and body", async () => {
  const response = await requestMedia("?variant=original");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), originalBody);
});

test("local media route serves the generated web and thumbnail file bodies", async () => {
  const webResponse = await requestMedia();
  assert.equal(webResponse.status, 200);
  assert.equal(webResponse.headers.get("content-type"), "image/webp");
  assert.deepEqual(Buffer.from(await webResponse.arrayBuffer()), webBody);

  const thumbnailResponse = await requestMedia("?variant=thumbnail");
  assert.equal(thumbnailResponse.status, 200);
  assert.equal(thumbnailResponse.headers.get("content-type"), "image/webp");
  assert.deepEqual(Buffer.from(await thumbnailResponse.arrayBuffer()), thumbnailBody);
});
