import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const operations = path.join(projectDir, "scripts/oldseadogs-ops.mjs");

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [operations, ...args], { cwd: projectDir, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve(output) : reject(new Error(output)));
  });
}

test("disposable backup verifies and restores story, media, homepage and imports", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-backup-acceptance-"));
  const dataDir = path.join(root, "data");
  const backupDir = path.join(root, "backups");
  const mediaDir = path.join(dataDir, "media");
  await fs.mkdir(mediaDir, { recursive: true });
  await fs.writeFile(path.join(mediaDir, "phase1-photo.jpg"), "disposable phase 1 media fixture");
  const original = {
    version: 1,
    stories: [{ id: "phase1-story", slug: "phase1-story", title: "Phase 1 story", category: "News", sectionSlugs: ["news", "races"], status: "published", publishedAt: "2026-07-16T08:00:00.000Z", imageUrl: "/api/media/phase1-media", body: ["A complete disposable story."], tags: [], statusHistory: [] }],
    guides: [],
    media: [{ id: "phase1-media", filename: "phase1-photo.jpg", originalFilename: "phase1-photo.jpg", contentType: "image/jpeg", size: 32, r2Key: "phase1-photo.jpg", originalKey: "phase1-photo.jpg", url: "/api/media/phase1-media" }],
    galleryCategories: [{ id: "phase1-gallery-category", name: "Racing" }],
    galleryItems: [{ id: "phase1-gallery-item", mediaId: "phase1-media", status: "pending" }],
    instagramImports: [], ads: [], socialEvents: [], blockedSenders: [], publicationOverrides: [],
    pressReleases: [{ id: "phase1-email", subject: "Private source email", rawEmail: "Original private email source", status: "processed", attachments: [], warnings: [], generatedBody: [], storyId: "phase1-story" }],
    settings: { homepageLeadStoryId: "phase1-story", homepageLeadStorySlug: "phase1-story", homepageLatestStoryIds: "[]", homepageEditorsChoiceStoryIds: "[]", homepageHiddenStoryIds: "[]" },
    updatedAt: "2026-07-16T08:00:00.000Z",
  };
  const storePath = path.join(dataDir, "editor-store.json");
  await fs.writeFile(storePath, `${JSON.stringify(original, null, 2)}\n`);

  try {
    const created = JSON.parse(await run(["backup:create", "--data-dir", dataDir, "--backup-dir", backupDir, "--config-paths", "", "--label", "phase1", "--json"]));
    const verified = JSON.parse(await run(["backup:verify", "--backup", created.backupPath, "--data-dir", dataDir, "--backup-dir", backupDir, "--json"]));
    assert.equal(verified.ok, true);
    assert.equal(verified.manifest.storeCounts.stories, 1);
    assert.equal(verified.manifest.storeCounts.mediaRecords, 1);
    assert.equal(verified.manifest.storeCounts.emailImports, 1);
    assert.equal(verified.manifest.storeCounts.galleryItems, 1);
    const storyMetadata = JSON.parse(await fs.readFile(path.join(created.backupPath, "story-metadata.json"), "utf8"));
    assert.deepEqual(storyMetadata[0].sectionSlugs, ["news", "races"]);

    await fs.writeFile(storePath, `${JSON.stringify({ ...original, stories: [], media: [], pressReleases: [], settings: {} }, null, 2)}\n`);
    await fs.writeFile(path.join(mediaDir, "phase1-photo.jpg"), "changed fixture");
    await run(["restore:plan", "--backup", created.backupPath, "--data-dir", dataDir, "--backup-dir", backupDir, "--json"]);
    await run(["restore:apply", "--backup", created.backupPath, "--data-dir", dataDir, "--backup-dir", backupDir, "--config-paths", "", "--confirm-restore", "--json"]);

    const restored = JSON.parse(await fs.readFile(storePath, "utf8"));
    assert.deepEqual(restored.stories, original.stories);
    assert.deepEqual(restored.media, original.media);
    assert.deepEqual(restored.pressReleases, original.pressReleases);
    assert.deepEqual(restored.settings, original.settings);
    assert.equal(await fs.readFile(path.join(mediaDir, "phase1-photo.jpg"), "utf8"), "disposable phase 1 media fixture");
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
