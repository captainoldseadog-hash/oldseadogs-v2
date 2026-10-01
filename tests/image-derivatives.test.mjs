import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderWebpDerivative, serveDerivative } from "../lib/image-derivatives.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const originalPath = path.join(projectDir, "public/images/guides/guides-marina-hamble-point-hero-v1.png");

async function sha256(filePath) {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

test("a guide hero derivative is much smaller and does not replace the original", async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-image-cache-"));
  const previousCache = process.env.OLDSEADOGS_IMAGE_CACHE_DIR;
  process.env.OLDSEADOGS_IMAGE_CACHE_DIR = cacheDir;
  const before = await sha256(originalPath);
  const beforeStat = await fs.stat(originalPath);
  try {
    const first = await renderWebpDerivative("/images/guides/guides-marina-hamble-point-hero-v1.png", 1600);
    const second = await renderWebpDerivative("/images/guides/guides-marina-hamble-point-hero-v1.png", 1600);
    assert.ok(first);
    assert.ok(first.byteLength < 400_000, `derivative was ${first.byteLength} bytes`);
    assert.ok(first.byteLength < beforeStat.size / 5);
    assert.equal(Buffer.compare(first, second), 0);
    assert.equal(await sha256(originalPath), before);
    const cachedFiles = await fs.readdir(cacheDir, { recursive: true });
    assert.ok(cachedFiles.some((file) => String(file).endsWith(".webp")));
    const publicListing = await fs.readdir(path.dirname(originalPath));
    assert.equal(publicListing.includes("guides-marina-hamble-point-hero-v1.png.webp"), false);
  } finally {
    if (previousCache === undefined) delete process.env.OLDSEADOGS_IMAGE_CACHE_DIR;
    else process.env.OLDSEADOGS_IMAGE_CACHE_DIR = previousCache;
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
});

test("derivative requests cannot escape the public image directories", async () => {
  const response = await serveDerivative(
    new Request("http://127.0.0.1/img/1600/etc/passwd"),
    1600,
    ["..", "..", "etc", "passwd"],
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
