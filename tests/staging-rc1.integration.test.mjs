import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixtureScript = path.join(projectDir, "scripts/create-staging-rc1-fixture.mjs");
const port = 3431;
const baseUrl = `http://127.0.0.1:${port}`;
let dataDir;
let storePath;
let server;
let serverOutput = "";
let workerController;
let nativeFetch;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectDir, ...options, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve(output) : reject(new Error(output)));
  });
}

async function resetFixture() {
  await run(process.execPath, [fixtureScript, dataDir]);
}

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

async function post(body) {
  return fetch(`${baseUrl}/api/editor`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

function confirmPublicationWarnings(story) {
  return {
    ...story,
    publicationOverride: {
      confirm: true,
      confirmImageRights: true,
      confirmEditorialWarnings: true,
      editorNote: "Confirmed by RC1 integration test.",
    },
  };
}

async function getStory(id) {
  const response = await fetch(`${baseUrl}/api/editor?view=story&id=${encodeURIComponent(id)}`);
  assert.equal(response.status, 200);
  return (await response.json()).story;
}

async function waitForServer() {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`RC1 staging server exited early.\n${serverOutput}`);
    try {
      if ((await fetch(`${baseUrl}/api/editor?view=dashboard`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`RC1 staging server did not start.\n${serverOutput}`);
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "helm-rc1-staging-"));
  storePath = path.join(dataDir, "editor-store.json");
  await resetFixture();
  workerController = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: { NODE_ENV: "production", OLDSEADOGS_RUNTIME: "node" },
  });
  server = workerController.child;
  nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return url.origin === baseUrl ? workerController.fetch(input, init) : nativeFetch(input, init);
  };
  await waitForServer();
});

after(async () => {
  globalThis.fetch = nativeFetch;
  await workerController?.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("disposable staging copy represents the required production-shaped datasets", async () => {
  await resetFixture();
  const store = await readStore();
  assert.equal(store.stories.length, 173);
  assert.equal(store.stories.filter((story) => story.sourceType === "Automatic watch").length, 145);
  assert.equal(store.media.length, 15);
  assert.equal(store.pressReleases.length, 3);
  assert.equal(store.galleryItems.length, 3);
  assert.equal(store.galleryCategories.length, 27);
  assert.equal(store.settings.homepageLeadStoryId, "staging-homepage-lead");
});

test("email, scraped, OCR and press-release records use one full editor and preserve private originals through publish/unpublish", async () => {
  await resetFixture();
  for (const id of ["staging-email-import", "staging-scraped-story", "staging-ocr-story", "staging-press-release"]) {
    const before = await getStory(id);
    assert.ok(before.originalSourceContent);
    const editor = await fetch(`${baseUrl}/editor/write?story=${id}`);
    assert.equal(editor.status, 200);
    const preview = await fetch(`${baseUrl}/editor/preview/${id}`);
    assert.equal(preview.status, 200);
    assert.match(await preview.text(), new RegExp(before.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const publishCandidate = { ...before, status: "published" };
    let response = await post({ action: "saveStory", story: publishCandidate });
    assert.equal(response.status, 409);
    let warningPayload = await response.json();
    assert.equal(warningPayload.requiresPublicationOverride, true);
    response = await post({ action: "saveStory", story: confirmPublicationWarnings(publishCandidate) });
    assert.equal(response.status, 200);
    let payload = await response.json();
    assert.equal(payload.story.id, before.id);
    assert.equal(payload.story.slug, before.slug);
    assert.equal(payload.story.status, "published");
    assert.ok(payload.editorialWarnings.length > 0);
    assert.equal((await fetch(`${baseUrl}/stories/${before.slug}`)).status, 200);

    response = await post({ action: "saveStory", story: { ...payload.story, status: "unpublished" } });
    assert.equal(response.status, 200);
    payload = await response.json();
    assert.equal(payload.story.id, before.id);
    assert.equal(payload.story.slug, before.slug);
    assert.equal(payload.story.status, "unpublished");
    const after = await getStory(id);
    assert.equal(after.originalSourceType, before.originalSourceType);
    assert.equal(after.originalSourceRef, before.originalSourceRef);
    assert.equal(after.originalSourceContent, before.originalSourceContent);
    assert.equal((await readStore()).stories.filter((story) => story.id === id).length, 1);
  }
  const editorSource = await fs.readFile(path.join(projectDir, "app/editor/BridgeCms.tsx"), "utf8");
  for (const capability of ["Story Media", "Video URL", "Story formatting", "Schedule", "Preview", "Publish Now", "Private original source"]) {
    assert.match(editorSource, new RegExp(capability));
  }
});

test("one story reaches Front Page, News and Races only after Homepage Manager Save", async () => {
  await resetFixture();
  const homepageManager = await fetch(`${baseUrl}/editor/homepage`);
  assert.equal(homepageManager.status, 200);
  assert.match(await homepageManager.text(), /Homepage Manager/);
  const before = (await readStore()).settings.homepageLeadStoryId;
  const story = await getStory("staging-multisection-story");
  let response = await post({ action: "saveStory", story: { ...story, status: "published" } });
  assert.equal(response.status, 200);
  const published = (await response.json()).story;
  assert.equal((await readStore()).settings.homepageLeadStoryId, before);
  assert.deepEqual(published.sectionSlugs, ["news", "races"]);
  assert.match(await (await fetch(`${baseUrl}/news`)).text(), /\/stories\/staging-solent-race-briefing/);
  assert.match(await (await fetch(`${baseUrl}/races`)).text(), /\/stories\/staging-solent-race-briefing/);
  const frontBeforeSave = await (await fetch(baseUrl)).text();
  assert.match(frontBeforeSave, /\/stories\/staging-solent-race-briefing/);
  assert.match(frontBeforeSave, /href="\/stories\/staging-harbour-notice" class="button-primary">Read the lead story/);

  const rejected = await post({ action: "saveHomepage", homepage: { leadStoryId: published.id, homepageLatestStoryIds: "[]", homepageEditorsChoiceStoryIds: "[]", homepageHiddenStoryIds: "[]", allowMissingImage: true } });
  assert.equal(rejected.status, 403);
  assert.equal((await readStore()).settings.homepageLeadStoryId, before);
  response = await post({ action: "saveHomepage", homepageSource: "homepage-manager-save", homepage: { leadStoryId: published.id, homepageLatestStoryIds: "[]", homepageEditorsChoiceStoryIds: "[]", homepageHiddenStoryIds: "[]", allowMissingImage: true } });
  assert.equal(response.status, 200);
  assert.equal((await readStore()).settings.homepageLeadStoryId, published.id);
  assert.match(await (await fetch(baseUrl)).text(), /href="\/stories\/staging-solent-race-briefing" class="button-primary">Read the lead story/);
  assert.equal((await readStore()).stories.filter((item) => item.id === published.id).length, 1);
});

test("Story Editor and Media Library return the same persisted metadata; unknown rights stays advisory", async () => {
  await resetFixture();
  const update = {
    caption: "Consistent RC1 caption", credit: "", copyright: "", copyrightOwnership: "unknown", copyrightOwner: "",
    photographer: "", source: "", licence: "", permissionNote: "", usageRestrictions: "", creditLine: "", permissionReceivedAt: "",
  };
  let response = await post({ action: "updateMedia", id: "staging-media-01", media: update });
  assert.equal(response.status, 200);
  const mediaView = await (await fetch(`${baseUrl}/api/editor?view=media&q=staging-media-01`)).json();
  const storyView = await (await fetch(`${baseUrl}/api/editor?view=story&id=staging-email-import`)).json();
  const fromLibrary = mediaView.media.find((item) => item.id === "staging-media-01");
  const fromEditor = storyView.media.find((item) => item.id === "staging-media-01");
  for (const key of Object.keys(update)) assert.equal(fromLibrary[key], fromEditor[key]);

  const publishCandidate = { ...storyView.story, status: "published" };
  response = await post({ action: "saveStory", story: publishCandidate });
  assert.equal(response.status, 409);
  response = await post({ action: "saveStory", story: confirmPublicationWarnings(publishCandidate) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.story.status, "published");
  assert.equal(payload.copyrightWarnings[0].missingField, "Copyright Ownership or Rights Evidence");
});

test("vague headline is advisory and does not block publication", async () => {
  await resetFixture();
  const story = await getStory("staging-vague-headline");
  const publishCandidate = { ...story, status: "published" };
  let response = await post({ action: "saveStory", story: publishCandidate });
  assert.equal(response.status, 409);
  const warningPayload = await response.json();
  assert.equal(warningPayload.requiresPublicationOverride, true);
  response = await post({ action: "saveStory", story: confirmPublicationWarnings(publishCandidate) });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.story.status, "published");
  assert.match(payload.editorialWarnings.join(" "), /Improve the headline|Vague promotional headline wording/);
});
