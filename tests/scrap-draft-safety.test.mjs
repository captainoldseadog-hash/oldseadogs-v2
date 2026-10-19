import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { scrapBackupMessage, scrapConfirmAccepted, scrapConfirmPhrase } from "../lib/scrap-draft-confirm.ts";
import {
  isPreBulkDeleteBackupId,
  isScrappedStoryId,
  listRecentlyScrappedDrafts,
  readScrappedDraft,
} from "../lib/scrapped-story-backup.ts";

test("scrap confirmation accepts SCRAP or the first word of the title", () => {
  assert.equal(scrapConfirmPhrase("Harbour lights at dusk"), "Harbour");
  assert.equal(scrapConfirmPhrase("   "), "");
  assert.equal(scrapConfirmAccepted("SCRAP", "Harbour lights"), true);
  assert.equal(scrapConfirmAccepted(" scrap ", "Harbour lights"), false);
  assert.equal(scrapConfirmAccepted("harbour", "Harbour lights"), true);
  assert.equal(scrapConfirmAccepted("Harbour lights", "Harbour lights"), false);
  assert.equal(scrapConfirmAccepted("", "Harbour lights"), false);
  assert.equal(scrapConfirmAccepted("SCRAP", "   "), true);
});

test("the scrap message names the backup and the one-story restore", () => {
  const message = scrapBackupMessage("Harbour lights", "/var/backups/20261019-pre-bulk-delete-2026-10-19");
  assert.match(message, /Harbour lights/);
  assert.match(message, /\/var\/backups\/20261019-pre-bulk-delete-2026-10-19/);
  assert.match(message, /Recently scrapped/);
  assert.match(message, /one story/);
  assert.match(scrapBackupMessage("", ""), /backup was saved/i);
});

test("backup ids cannot include a path", () => {
  assert.equal(isPreBulkDeleteBackupId("20261019-090000-pre-bulk-delete-2026-10-19"), true);
  assert.equal(isPreBulkDeleteBackupId("../pre-bulk-delete-2026-10-19"), false);
  assert.equal(isPreBulkDeleteBackupId("pre-bulk-delete-2026-10-19/../../etc"), false);
  assert.equal(isPreBulkDeleteBackupId("manual-backup"), false);
  assert.equal(isPreBulkDeleteBackupId("pre-bulk-delete-.."), false);
  assert.equal(isScrappedStoryId("story_abc"), true);
  assert.equal(isScrappedStoryId("../story_abc"), false);
});

test("recently scrapped lists only missing drafts from the newest pre-delete backup", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "osd-scrap-"));
  const older = path.join(root, "20261018-090000-pre-bulk-delete-2026-10-18");
  const newer = path.join(root, "20261019-090000-pre-bulk-delete-2026-10-19");
  const ignored = path.join(root, "20261019-100000-manual");
  const outsideName = "not-a-backup";
  await fs.mkdir(older, { recursive: true });
  await fs.mkdir(newer, { recursive: true });
  await fs.mkdir(ignored, { recursive: true });
  await fs.writeFile(path.join(older, "editor-store.json"), JSON.stringify({
    stories: [
      { id: "story_oldtitle", title: "Old title", status: "draft" },
      { id: "story_onlyold", title: "Only in the older backup", status: "draft" },
    ],
  }));
  await fs.writeFile(path.join(newer, "editor-store.json"), JSON.stringify({
    stories: [
      { id: "story_oldtitle", title: "Newer title", status: "draft" },
      { id: "story_live", title: "Still in the editor", status: "draft" },
      { id: "story_public", title: "Was published", status: "published" },
    ],
  }));
  await fs.writeFile(path.join(ignored, "editor-store.json"), JSON.stringify({
    stories: [{ id: "story_manual", title: "Manual backup", status: "draft" }],
  }));
  await fs.writeFile(path.join(root, outsideName), "nope");

  try {
    const listed = await listRecentlyScrappedDrafts(new Set(["story_live"]), [root]);
    assert.deepEqual(listed.map((item) => [item.id, item.title]), [
      ["story_oldtitle", "Newer title"],
      ["story_onlyold", "Only in the older backup"],
    ]);
    assert.equal(listed.every((item) => item.backupPath.startsWith(root)), true);

    const restored = await readScrappedDraft("20261019-090000-pre-bulk-delete-2026-10-19", "story_oldtitle", [root]);
    assert.equal(restored.ok, true);
    if (restored.ok) assert.equal(restored.story.title, "Newer title");

    const published = await readScrappedDraft("20261019-090000-pre-bulk-delete-2026-10-19", "story_public", [root]);
    assert.equal(published.ok, false);

    const escaped = await readScrappedDraft("../20261019-090000-pre-bulk-delete-2026-10-19", "story_oldtitle", [root]);
    assert.equal(escaped.ok, false);

    const manual = await readScrappedDraft("20261019-100000-manual", "story_manual", [root]);
    assert.equal(manual.ok, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Write Story keeps Scrap draft out of the publish button row", async () => {
  const source = await fs.readFile(new URL("../app/editor/BridgeCms.tsx", import.meta.url), "utf8");
  const stripStart = source.indexOf('className="bridge-publish-strip"');
  const strip = source.slice(stripStart, source.indexOf("displayedEditorialWarnings.length", stripStart));
  assert.match(strip, /Publish Now/);
  assert.equal(strip.includes("Scrap draft"), false);
  assert.match(source, /className="bridge-scrap-danger"/);
  assert.match(source, /scrapConfirmAccepted/);
  assert.match(source, /onClick=\{\(\) => void saveStory\("published"\)\}/);
});
