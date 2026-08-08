import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const migrationPath = path.join(projectDir, "drizzle/0008_tearful_luckman.sql");

async function sqlite(dbPath, sql) {
  const { stdout } = await execFileAsync("/usr/bin/sqlite3", ["-json", dbPath, sql], { maxBuffer: 8 * 1024 * 1024 });
  return stdout.trim() ? JSON.parse(stdout) : [];
}

test("migration 0008 preserves 173 stories and homepage settings, adds sections safely, and restores from backup", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "helm-rc1-migration-"));
  const dbPath = path.join(root, "staging.sqlite");
  const backupPath = path.join(root, "pre-0008.sqlite");
  try {
    await sqlite(dbPath, `
      PRAGMA journal_mode=DELETE;
      CREATE TABLE stories (
        id text PRIMARY KEY NOT NULL, slug text NOT NULL UNIQUE, title text NOT NULL, category text NOT NULL,
        date text NOT NULL, author text NOT NULL, source_type text NOT NULL, source_name text NOT NULL, source_url text,
        image_url text NOT NULL, image_alt text NOT NULL, summary text NOT NULL, body_json text NOT NULL, tags_json text NOT NULL,
        read_minutes integer NOT NULL, is_featured integer DEFAULT 0 NOT NULL, status text DEFAULT 'published' NOT NULL,
        published_at text DEFAULT '' NOT NULL, scheduled_publish_at text DEFAULT '' NOT NULL, sort_order integer DEFAULT 0 NOT NULL,
        created_at text NOT NULL, updated_at text NOT NULL
      );
      CREATE TABLE site_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at text NOT NULL);
      BEGIN;
      ${Array.from({ length: 173 }, (_, index) => {
        const n = String(index + 1).padStart(3, "0");
        return `INSERT INTO stories VALUES ('story-${n}','unchanged-slug-${n}','Continuity story ${n}','News','2026-06-${String((index % 28) + 1).padStart(2, "0")}','Old Sea Dogs','Original','Desk',NULL,'','Image alt','Summary','["Body"]','[]',3,${index === 0 ? 1 : 0},'published','2026-06-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z','',${index},'2026-06-01T08:00:00.000Z','2026-06-01T08:00:00.000Z');`;
      }).join("\n")}
      INSERT INTO site_settings VALUES ('homepageLeadStoryId','story-001','2026-07-16T08:00:00.000Z');
      INSERT INTO site_settings VALUES ('homepageLeadStorySlug','unchanged-slug-001','2026-07-16T08:00:00.000Z');
      INSERT INTO site_settings VALUES ('homepageLatestStoryIds','["story-002"]','2026-07-16T08:00:00.000Z');
      COMMIT;
    `);
    const beforeStories = await sqlite(dbPath, "SELECT id,slug,published_at,date FROM stories ORDER BY id;");
    const beforeSettings = await sqlite(dbPath, "SELECT key,value,updated_at FROM site_settings ORDER BY key;");
    await fs.copyFile(dbPath, backupPath);

    const migration = (await fs.readFile(migrationPath, "utf8")).replaceAll("--> statement-breakpoint", "");
    await sqlite(dbPath, `BEGIN; ${migration} COMMIT;`);
    assert.deepEqual(await sqlite(dbPath, "SELECT id,slug,published_at,date FROM stories ORDER BY id;"), beforeStories);
    assert.deepEqual(await sqlite(dbPath, "SELECT key,value,updated_at FROM site_settings ORDER BY key;"), beforeSettings);
    assert.equal((await sqlite(dbPath, "SELECT count(*) AS count FROM stories;"))[0].count, 173);
    assert.equal((await sqlite(dbPath, "SELECT count(*) AS count FROM stories WHERE section_slugs_json='[]' AND original_source_type='' AND original_source_ref='' AND original_source_content='';"))[0].count, 173);

    await sqlite(dbPath, "UPDATE stories SET section_slugs_json='[\"news\",\"races\"]' WHERE id='story-001';");
    const assigned = await sqlite(dbPath, "SELECT id,slug,published_at,section_slugs_json FROM stories WHERE id='story-001';");
    assert.deepEqual(assigned[0], { id: "story-001", slug: "unchanged-slug-001", published_at: "2026-06-01T08:00:00.000Z", section_slugs_json: "[\"news\",\"races\"]" });

    await fs.copyFile(backupPath, dbPath);
    assert.deepEqual(await sqlite(dbPath, "SELECT id,slug,published_at,date FROM stories ORDER BY id;"), beforeStories);
    assert.deepEqual(await sqlite(dbPath, "SELECT key,value,updated_at FROM site_settings ORDER BY key;"), beforeSettings);
    const restoredColumns = await sqlite(dbPath, "PRAGMA table_info(stories);");
    assert.equal(restoredColumns.some((column) => column.name === "section_slugs_json"), false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
