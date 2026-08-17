import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const guardPath = path.join(projectDir, "scripts/check-current-content-store.mjs");

function runGuard(env = {}) {
  return spawnSync(process.execPath, [guardPath], {
    cwd: projectDir,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      ...env,
    },
  });
}

test("current-content approval refuses implicit fallback", () => {
  const result = runGuard();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Current production-matching CMS store unavailable/);
  assert.match(result.stderr, /OLDSEADOGS_REQUIRE_EXISTING_STORE=true/);
});

test("current-content approval refuses a missing explicit store", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-missing-current-store-"));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));

  const result = runGuard({
    OLDSEADOGS_DATA_DIR: dataDir,
    OLDSEADOGS_REQUIRE_EXISTING_STORE: "true",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Current production-matching CMS store unavailable/);
  assert.match(result.stderr, /editor-store\.json/);
});

test("current-content approval accepts and reports an explicit existing store", async (t) => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-explicit-current-store-"));
  t.after(() => fs.rm(dataDir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dataDir, "editor-store.json"), JSON.stringify({
    version: 7,
    stories: [
      { title: "Older published story", slug: "older", status: "published", publishedAt: "2026-08-15T09:00:00.000Z" },
      { title: "Newest published story", slug: "newest", status: "published", publishedAt: "2026-08-17T10:30:00.000Z" },
      { title: "Draft story", slug: "draft", status: "draft", publishedAt: "" },
    ],
  }), "utf8");

  const result = runGuard({
    OLDSEADOGS_DATA_DIR: dataDir,
    OLDSEADOGS_REQUIRE_EXISTING_STORE: "true",
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.currentContentApprovalStore, true);
  assert.equal(report.storyCount, 3);
  assert.equal(report.publishedStoryCount, 2);
  assert.deepEqual(report.newestPublishedStory, {
    title: "Newest published story",
    slug: "newest",
    publishedAt: "2026-08-17T10:30:00.000Z",
  });
});
