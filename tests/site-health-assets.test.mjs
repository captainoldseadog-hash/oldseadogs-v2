import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import legacyStories from "../content/legacy-stories.json" with { type: "json" };
import { isFilenameLikeAlt } from "../lib/public-image-alt.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

const portPhotos = [
  "public/legacy-photos/30e4a2399ca0-alimos-marina.webp",
  "public/legacy-photos/e83d39d256ef-marina-coppola.webp",
  "public/legacy-photos/1447ca9b05c7-port-adriano.webp",
  "public/legacy-photos/6e8004361768-v-and-a-waterfront-marina.webp",
  "public/legacy-photos/97b1d2cf7c10-setur-marina.webp",
  "public/legacy-photos/8e1fa806171b-gustavia-harbour.webp",
];

test("ports card photos and the share image stay within the compressed sizes", async () => {
  for (const relative of portPhotos) {
    const file = path.join(projectDir, relative);
    const bytes = await fs.readFile(file);
    const meta = await sharp(bytes).metadata();
    assert.equal(meta.format, "webp", relative);
    assert.ok(bytes.length < 200 * 1024, `${relative} is ${bytes.length} bytes`);
  }

  const share = await fs.readFile(path.join(projectDir, "public/images/old-sea-dogs-og.jpg"));
  const shareMeta = await sharp(share).metadata();
  assert.equal(shareMeta.format, "jpeg");
  assert.equal(shareMeta.width, 1200);
  assert.equal(shareMeta.height, 630);
  assert.ok(share.length < 150 * 1024, `share image is ${share.length} bytes`);

  const favicon = await fs.readFile(path.join(projectDir, "public/favicon.png"));
  const faviconMeta = await sharp(favicon).metadata();
  assert.equal(faviconMeta.width, 256);
  assert.equal(faviconMeta.height, 256);
  assert.ok(favicon.length < 40 * 1024, `favicon.png is ${favicon.length} bytes`);

  for (const size of [16, 32, 48]) {
    const small = await fs.readFile(path.join(projectDir, `public/favicon-${size}.png`));
    const meta = await sharp(small).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
  }

  const ico = await fs.readFile(path.join(projectDir, "public/favicon.ico"));
  assert.equal(ico.subarray(0, 4).toString("hex"), "00000100");
  assert.ok(ico.length < 12 * 1024);
});

test("stored story alt text is not a filename or a slug", () => {
  const nanny = legacyStories.find((story) => story.slug === "ports-nanny-cay-marina");
  assert.match(nanny.imageAlt, /Aerial view of Nanny Cay Resort and Marina/);
  const slugAlts = legacyStories.filter((story) => isFilenameLikeAlt(story.imageAlt || ""));
  assert.deepEqual(slugAlts.map((story) => story.slug), []);
});
