#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function nowStamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function atomicWriteJson(filePath, value) {
  const dataDir = path.dirname(filePath);
  await fs.mkdir(dataDir, { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  const payload = JSON.stringify(value, null, 2);
  const startedAt = new Date().toISOString();

  try {
    await fs.writeFile(tempPath, payload, "utf8");
    const tempStat = await fs.stat(tempPath);
    const tempPayload = await fs.readFile(tempPath, "utf8");
    JSON.parse(tempPayload);
    const destinationExists = await exists(filePath);
    console.log("Prepared atomic write");
    console.table({
      tempPath,
      tempExistsBeforeRename: true,
      tempSize: tempStat.size,
      destinationPath: filePath,
      destinationExists,
      startedAt,
    });
    await fs.rename(tempPath, filePath);
  } catch (error) {
    const tempExistsBeforeRename = await exists(tempPath);
    let tempSize = 0;
    if (tempExistsBeforeRename) tempSize = (await fs.stat(tempPath)).size;
    console.error("Atomic write failed");
    console.table({
      tempPath,
      tempExistsBeforeRename,
      tempSize,
      destinationPath: filePath,
      destinationExists: await exists(filePath),
      startedAt,
      error: error instanceof Error ? error.message : String(error),
      code: typeof error === "object" && error && "code" in error ? String(error.code) : "",
      errno: typeof error === "object" && error && "errno" in error ? String(error.errno) : "",
    });
    throw error;
  }
}

async function main() {
  const explicitStore = argValue("--store");
  const dataDir =
    argValue("--data-dir") ||
    process.env.OLDSEADOGS_DATA_DIR?.trim() ||
    (await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-storage-check-")));
  const storePath = explicitStore
    ? path.join(path.dirname(explicitStore), `.storage-check-${nowStamp()}.json`)
    : path.join(dataDir, `editor-store-storage-check-${nowStamp()}.json`);

  const testStore = {
    version: 1,
    stories: [
      {
        id: "storage_check_story",
        slug: "storage-check-story",
        title: "Storage Check Story",
        category: "News",
        date: new Date().toISOString().slice(0, 10),
        author: "Old Sea Dogs",
        sourceType: "Storage check",
        sourceName: "Old Sea Dogs",
        sourceUrl: "",
        imageUrl: "",
        imageAlt: "",
        imageCredit: "",
        imageCaption: "",
        summary: "Storage self-test record.",
        body: ["Storage self-test record."],
        tags: [],
        readMinutes: 1,
        isFeatured: false,
        status: "draft",
        publishedAt: "",
        scheduledPublishAt: "",
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    media: [],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    updatedAt: new Date().toISOString(),
  };

  console.log("OldSeaDogs storage self-test");
  console.log(`Data directory: ${dataDir}`);
  console.log(`Test store: ${storePath}`);
  if (explicitStore) console.log(`Real store left untouched: ${explicitStore}`);

  await atomicWriteJson(storePath, testStore);
  const reloaded = JSON.parse(await fs.readFile(storePath, "utf8"));
  if (reloaded.stories?.[0]?.id !== "storage_check_story") {
    throw new Error("Reloaded JSON did not contain the expected storage check story.");
  }

  await fs.rm(storePath, { force: true });

  console.log("Storage self-test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
