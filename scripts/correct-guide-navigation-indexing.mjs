import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const storeFlag = args.indexOf("--store");
const storePath = storeFlag >= 0 ? path.resolve(args[storeFlag + 1] || "") : "";
const write = args.includes("--write");

if (!storePath) {
  throw new Error("Usage: node scripts/correct-guide-navigation-indexing.mjs --store /absolute/editor-store.json [--write]");
}

const source = await readFile(storePath, "utf8");
const beforeSha256 = createHash("sha256").update(source).digest("hex");
const store = JSON.parse(source);

function guide(slug) {
  const match = store.guides?.find((item) => item.slug === slug);
  if (!match) throw new Error(`Required Guide is missing: ${slug}`);
  return match;
}

const legacyPreviousTargets = [
  ["solent-marina-guide", "story-1786032722982"],
  ["round-the-island-race-guide", "story-1786032722974"],
  ["uk-boat-show-calendar", "story-1786032722989"],
  ["beginners-guide-to-yacht-clubs", "story-1786032722997"],
];
const changes = [];

for (const [slug, expected] of legacyPreviousTargets) {
  const record = guide(slug);
  if (record.previousGuideSlug !== expected) {
    throw new Error(`${slug}.previousGuideSlug changed since audit; expected ${expected}, found ${record.previousGuideSlug || "<empty>"}`);
  }
  changes.push({ slug, field: "previousGuideSlug", before: record.previousGuideSlug, after: "" });
  record.previousGuideSlug = "";
}

for (const slug of ["bembridge-marina", "poole-quay-boat-haven"]) {
  const record = guide(slug);
  if (record.status !== "published" || record.noindex !== true) {
    throw new Error(`${slug} is no longer a published noindex Guide; refusing to infer editorial intent`);
  }
  changes.push({ slug, field: "noindex", before: true, after: false });
  record.noindex = false;
  if (record.seo && record.seo.noindex !== false) {
    changes.push({ slug, field: "seo.noindex", before: record.seo.noindex, after: false });
    record.seo.noindex = false;
  }
}

const output = `${JSON.stringify(store, null, 2)}\n`;
const afterSha256 = createHash("sha256").update(output).digest("hex");

if (write) {
  const temporaryPath = `${storePath}.guide-audit-${process.pid}.tmp`;
  await writeFile(temporaryPath, output, { mode: 0o600 });
  await rename(temporaryPath, storePath);
}

process.stdout.write(`${JSON.stringify({ storePath, mode: write ? "write" : "dry-run", beforeSha256, afterSha256, changes }, null, 2)}\n`);
