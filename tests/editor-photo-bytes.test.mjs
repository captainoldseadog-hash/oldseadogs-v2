import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { EditorPhotoRejectedError, saveLocalMediaUpload } from "../lib/local-media-storage.ts";

test("a file named .jpg that is not a photograph is refused and not stored", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "osd-photo-"));
  const previous = process.env.OLDSEADOGS_DATA_DIR;
  process.env.OLDSEADOGS_DATA_DIR = directory;
  try {
    const fake = Buffer.from("this is not a photograph");
    await assert.rejects(
      saveLocalMediaUpload({
        bytes: fake.buffer.slice(fake.byteOffset, fake.byteOffset + fake.byteLength),
        contentType: "image/jpeg",
        fileName: "fake.jpg",
        id: "media_fake",
      }),
      (error) => error instanceof EditorPhotoRejectedError && /not a photograph|could not be read/i.test(error.message),
    );
    const names = await fs.readdir(directory, { recursive: true });
    assert.equal(names.some((name) => String(name).includes("fake") || String(name).includes("media_fake")), false);
  } finally {
    if (previous === undefined) delete process.env.OLDSEADOGS_DATA_DIR;
    else process.env.OLDSEADOGS_DATA_DIR = previous;
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("a real JPEG is stored with its dimensions", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "osd-photo-"));
  const previous = process.env.OLDSEADOGS_DATA_DIR;
  process.env.OLDSEADOGS_DATA_DIR = directory;
  try {
    const jpeg = await sharp({
      create: { width: 12, height: 8, channels: 3, background: { r: 20, g: 40, b: 60 } },
    }).jpeg().toBuffer();
    const saved = await saveLocalMediaUpload({
      bytes: jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength),
      contentType: "image/jpeg",
      fileName: "real.jpg",
      id: "media_real",
    });
    assert.equal(saved?.width, 12);
    assert.equal(saved?.height, 8);
    const web = await fs.readFile(path.join(directory, "media", "web", "media_real.webp"));
    const meta = await sharp(web).metadata();
    assert.equal(meta.format, "webp");
  } finally {
    if (previous === undefined) delete process.env.OLDSEADOGS_DATA_DIR;
    else process.env.OLDSEADOGS_DATA_DIR = previous;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
