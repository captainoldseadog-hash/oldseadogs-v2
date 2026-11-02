#!/usr/bin/env node
// Unpublishes the Lake Yard guide (status -> draft) in editor-store.json. Dry run by default.
import fs from "node:fs/promises";
import path from "node:path";

const SLUG = "lake-yard-marina";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const rb = args.indexOf("--rollback");
if (process.env.DATABASE_URL) { console.error("REFUSED: DATABASE_URL is set, so settings live in the database. Unpublish Lake Yard in the editor instead."); process.exit(2); }
const dataDir = process.env.OLDSEADOGS_DATA_DIR?.trim();
if (!dataDir) { console.error("Set OLDSEADOGS_DATA_DIR (e.g. /var/www/oldseadogs-data)."); process.exit(2); }
const storePath = path.join(dataDir, "editor-store.json");
const lockPath = `${storePath}.lock`;
const token = `${process.pid}-${Date.now()}`;
const stamp = new Date().toISOString();

async function lock() {
  const until = Date.now() + 30_000;
  for (;;) {
    try {
      await fs.mkdir(lockPath, { mode: 0o700 });
      await fs.writeFile(`${lockPath}/owner.json`, JSON.stringify({ pid: process.pid, token, acquiredAt: stamp }), { mode: 0o600 });
      return;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (Date.now() > until) { console.error(`Store lock held (${lockPath}). Nothing written. Do not delete the lock while the app is running.`); process.exit(3); }
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}
async function unlock() {
  try { const o = JSON.parse(await fs.readFile(`${lockPath}/owner.json`, "utf8")); if (o.token === token) await fs.rm(lockPath, { recursive: true, force: true }); } catch {}
}
async function atomicWrite(text) {
  const st = await fs.stat(storePath);
  const tmp = `${storePath}.tmp-${token}`;
  await fs.writeFile(tmp, text, { mode: st.mode & 0o777 });
  try { await fs.chown(tmp, st.uid, st.gid); } catch {}
  JSON.parse(await fs.readFile(tmp, "utf8"));
  await fs.rename(tmp, storePath);
}

if (rb >= 0) {
  const backup = args[rb + 1];
  if (!backup) { console.error("Usage: --rollback <backup> [--apply]"); process.exit(2); }
  const text = await fs.readFile(backup, "utf8"); JSON.parse(text);
  if (!apply) { console.log(`DRY RUN: would restore ${storePath} from ${backup}. Add --apply.`); process.exit(0); }
  await lock();
  try { await atomicWrite(text); console.log(`Restored ${storePath} from ${backup}.`); } finally { await unlock(); }
  process.exit(0);
}


if (apply) await lock();
try {
  const raw = await fs.readFile(storePath, "utf8");
  const store = JSON.parse(raw);
  const g = (store.guides || []).find((x) => x.slug === SLUG);
  if (!g) { console.log("Lake Yard guide not in store. Nothing to do."); process.exit(0); }
  console.log("Current status:", g.status);
  if (g.status !== "published") { console.log("Already unpublished. Nothing to do."); process.exit(0); }
  g.status = "draft";
  g.updatedAt = stamp;
  g.editorialNotes = `${g.editorialNotes || ""}\n[${stamp}] Unpublished at Lake Yard's request (fully sold, no visitors, members-only). Do not republish.`.trim();
  // strip any links from other guides
  let refs = 0;
  for (const o of store.guides) {
    if (o === g) continue;
    for (const k of ["relatedGuideSlugs", "cruiseOnGuideSlugs"]) {
      const v = o[k];
      if (Array.isArray(v) && v.includes(SLUG)) { o[k] = v.filter((s) => s !== SLUG); refs++; }
      else if (typeof v === "string" && v.includes(SLUG)) { o[k] = v.split(/[,\n]/).map((s) => s.trim()).filter((s) => s && s !== SLUG && s !== `"${SLUG}"`).join(","); refs++; }
    }
    for (const k of ["previousGuideSlug", "nextGuideSlug"]) if (o[k] === SLUG) { o[k] = ""; refs++; }
  }
  console.log(`Will set status=draft; cleared ${refs} references in other guides.`);
  if (!apply) { console.log("DRY RUN: nothing written. Re-run with --apply."); process.exit(0); }
  const backup = `${storePath}.bak-lake-yard-${stamp.replace(/[:.]/g, "")}`;
  await fs.writeFile(backup, raw, { mode: 0o600 });
  await atomicWrite(JSON.stringify(store, null, 2));
  console.log(`Wrote. Backup: ${backup}\nRollback: sudo OLDSEADOGS_DATA_DIR=${dataDir} node ${process.argv[1]} --rollback ${backup} --apply`);
} finally { if (apply) await unlock(); }
