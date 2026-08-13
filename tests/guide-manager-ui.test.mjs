import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("the Bridge routes Guides through the extracted Guide Manager only", async () => {
  const bridge = await read("app/editor/BridgeCms.tsx");
  assert.match(bridge, /import GuideManager from "\.\/guides\/GuideManager"/);
  assert.match(bridge, /section === "guides"\) return <GuideManager \/>/);
  assert.doesNotMatch(bridge, /section === "guides"\) return <GuidesPage \/>/);
});

test("the Guide library exposes search, filters, verification and safe actions", async () => {
  const source = await read("app/editor/guides/GuideList.tsx");
  for (const label of ["Search Guides", "All statuses", "All types", "All regions", "Unresolved checks", "Missing hero image", "Noindex enabled", "Edit", "Duplicate", "Preview", "Live"]) {
    assert.ok(source.includes(label), `missing Guide list capability: ${label}`);
  }
  assert.match(source, /guide\.verification\?\.unresolved/);
  assert.match(source, /guide\.status === "published"/);
});

test("the Guide editor covers the structured Phase 2 schema and explicit publication workflow", async () => {
  const source = await read("app/editor/guides/GuideEditor.tsx");
  for (const label of ["Identity", "Eyebrow", "Structured Guide copy", "Add section", "Move up", "Practical notes", "Local knowledge", "Old Sea Dogs View", "Warnings", "Navigation &amp; safety", "What3Words", "OS grid reference", "Marina facilities", "Contacts", "Relationships", "Searchable routes onward", "SEO", "Sources &amp; verification", "Fields supported", "UNRESOLVED EDITORIAL", "UNRESOLVED SAFETY", "Publication review", "Confirm Publish", "Save Draft", "Unpublish Guide"]) {
    assert.ok(source.includes(label), `missing Guide editor capability: ${label}`);
  }
  for (const action of ["saveGuideDraft", "publishGuide", "unpublishGuide"]) assert.ok(source.includes(action));
  assert.doesNotMatch(source, /<select[^>]*>[^]*<option value="published">/);
  assert.match(source, /disabled=\{published \|\| saving\}/);
  assert.match(source, /readOnly=\{Boolean\(draft\.publication\?\.publishedAt\)\}/);
});

test("Guide media reuses the existing library API without touching public presentation", async () => {
  const manager = await read("app/editor/guides/GuideManager.tsx");
  const picker = await read("app/editor/guides/GuideMediaPicker.tsx");
  assert.match(manager, /view=media&filter=all/);
  assert.match(picker, /\/api\/editor\/media\/upload/);
  assert.match(picker, /form\.append\("action", "uploadMedia"\)/);
  assert.match(picker, /Use as hero/);
  assert.match(picker, /Add to gallery/);
  assert.match(picker, /Insert inline/);
  assert.match(picker, /Inline image placement/);
  assert.doesNotMatch(`${manager}\n${picker}`, /GuidePublicContent|consent|analytics|sitemap|redirect/i);
});

test("the Guide Manager uses only the explicit Phase 1 service actions", async () => {
  const manager = await read("app/editor/guides/GuideManager.tsx");
  const editor = await read("app/editor/guides/GuideEditor.tsx");
  const combined = `${manager}\n${editor}`;
  for (const action of ["saveGuideDraft", "duplicateGuide", "publishGuide", "unpublishGuide"]) assert.ok(combined.includes(action));
  assert.doesNotMatch(combined, /action:\s*"saveGuide"[,}]/);
});

test("the Guide Manager provides a two-stage Draft-only JSON and CSV bulk importer", async () => {
  const manager = await read("app/editor/guides/GuideManager.tsx");
  const importer = await read("app/editor/guides/GuideBulkImport.tsx");
  assert.match(manager, /GuideBulkImport/);
  for (const label of ["Bulk imports create Draft Guides only", "Upload JSON or CSV", "Paste JSON envelope", "Validate / Dry Run", "Confirm Import Drafts", "Download result report", "Nothing is published automatically"] ) assert.ok(importer.includes(label), `missing bulk-import UI: ${label}`);
  assert.match(importer, /validateGuideImport/);
  assert.match(importer, /confirmGuideImport/);
  assert.match(importer, /planToken/);
  assert.match(importer, /plan\.summary\.blocked > 0/);
  assert.doesNotMatch(importer, /The Guide file must use create-draft or update-draft\./);
});
