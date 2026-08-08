import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

test("scheduled publication is callable only from the dedicated scheduler API", async () => {
  const siteContent = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  const editorRoute = await fs.readFile(path.join(projectDir, "app/api/editor/route.ts"), "utf8");

  assert.equal(
    (siteContent.match(/publishDueScheduledStories\(\)/g) || []).length,
    1,
    "site-content must contain only the function declaration, not read-path calls"
  );
  assert.equal(
    (editorRoute.match(/publishDueScheduledStories\(\)/g) || []).length,
    1,
    "only the dedicated authenticated scheduler action may invoke publication"
  );
  assert.match(
    editorRoute,
    /payload\.action === "publishScheduledStories"[\s\S]*publishDueScheduledStories\(\)/
  );
});

test("visitor social requests cannot write the CMS store", async () => {
  const route = await fs.readFile(path.join(projectDir, "app/api/social/track/route.ts"), "utf8");
  const authenticationCheck = route.indexOf("canEditSite(request)");
  const persistenceCall = route.indexOf("recordSocialEvent({");
  assert.ok(authenticationCheck >= 0);
  assert.ok(persistenceCall > authenticationCheck);
});

test("every local JSON write flows through the locked transaction", async () => {
  const siteContent = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  assert.equal((siteContent.match(/writeLocalEditorStoreNow\(/g) || []).length, 2);
  assert.match(
    siteContent,
    /withLocalEditorStoreFileLock[\s\S]*runLocalEditorStoreWriteTransaction/
  );
  assert.doesNotMatch(siteContent, /async function writeLocalEditorStore\(/);
});
