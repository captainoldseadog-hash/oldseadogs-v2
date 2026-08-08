import assert from "node:assert/strict";
import { fork } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const body = [Array.from({ length: 150 }, (_, index) => `sailing${index + 1}`).join(" ")];
let dataDir;
let storePath;
let worker;
let requestSequence = 0;
let workerOutput = "";

function story(overrides = {}) {
  const stamp = "2026-07-20T08:00:00.000Z";
  return {
    id: "story-1",
    slug: "unchanged-canonical-story",
    title: "Original published story title",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-07-20",
    author: "Old Sea Dogs",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs",
    sourceUrl: "",
    imageUrl: "/api/media/media-1",
    imageAlt: "Original yacht",
    imageCredit: "Old Sea Dogs",
    imageCaption: "Original image",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "A practical report for experienced boat owners.",
    sourceNotes: "Old Sea Dogs reporting.",
    methodNotes: "",
    contentBasis: "Original reporting",
    editorialStatus: "Published",
    noindex: false,
    summary: "The original published excerpt.",
    body,
    tags: ["original"],
    readMinutes: 3,
    isFeatured: true,
    status: "published",
    publishedAt: stamp,
    scheduledPublishAt: "",
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
    statusHistory: [],
    ...overrides,
  };
}

function media(id) {
  return {
    id,
    filename: `${id}.jpg`,
    contentType: "image/jpeg",
    size: 100,
    r2Key: `media/${id}.jpg`,
    url: `/api/media/${id}`,
    alt: `${id} yacht`,
    credit: "Old Sea Dogs",
    copyrightOwnership: "owned",
    createdAt: "2026-07-20T08:00:00.000Z",
  };
}

function initialStore() {
  return {
    version: 1,
    stories: [
      story(),
      story({ id: "scheduled-a", slug: "scheduled-a", title: "Scheduled story A", status: "draft", publishedAt: "", isFeatured: false }),
      story({ id: "scheduled-b", slug: "scheduled-b", title: "Scheduled story B", status: "draft", publishedAt: "", isFeatured: false }),
      story({ id: "scheduled-future", slug: "scheduled-future", title: "Future scheduled story", status: "draft", publishedAt: "", isFeatured: false }),
      story({ id: "scheduled-while-idle", slug: "scheduled-while-idle", title: "Scheduled while idle", status: "draft", publishedAt: "", isFeatured: false }),
      story({ id: "publish-now", slug: "publish-now", title: "Immediate publication story", status: "draft", publishedAt: "", isFeatured: false }),
    ],
    guides: [],
    media: [media("media-1"), media("media-2")],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    updatedAt: "2026-07-20T08:00:00.000Z",
  };
}

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

async function post(payload) {
  const id = `${process.pid}-${++requestSequence}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.off("message", onMessage);
      reject(new Error("Editor worker request timed out."));
    }, 30_000);
    const onMessage = (message) => {
      if (message?.type !== "response" || message.id !== id) return;
      clearTimeout(timeout);
      worker.off("message", onMessage);
      resolve({
        status: message.status,
        json: async () => JSON.parse(message.body || "{}"),
      });
    };
    worker.on("message", onMessage);
    worker.send({
      type: "request",
      id,
      url: "http://localhost/api/editor",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  });
}

function withPublicationOverride(value) {
  return {
    ...value,
    publicationOverride: {
      confirm: true,
      confirmImageRights: true,
      confirmEditorialWarnings: true,
      editorNote: "Integration test review.",
    },
  };
}

async function startServer() {
  workerOutput = "";
  worker = fork("./tests/helpers/editor-store-process.mjs", [], {
    cwd: projectDir,
    env: {
      ...process.env,
      OLDSEADOGS_DATA_DIR: dataDir,
      OLDSEADOGS_ENV: "production",
      OLDSEADOGS_REQUIRE_EXISTING_STORE: "true",
      OLDSEADOGS_SCHEDULER_IDLE_MS: "1000",
      OLDSEADOGS_TEST_SCHEDULER: "true",
    },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  worker.stdout.on("data", (chunk) => { workerOutput += chunk; });
  worker.stderr.on("data", (chunk) => { workerOutput += chunk; });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Editor worker did not start.")), 30_000);
    worker.once("exit", (code) => reject(new Error(`Editor worker exited during startup: ${code}`)));
    worker.on("message", (message) => {
      if (message?.type !== "ready") return;
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function stopServer() {
  if (!worker || worker.exitCode !== null) return;
  const exited = new Promise((resolve) => worker.once("exit", resolve));
  worker.kill("SIGTERM");
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 10_000))]);
}

async function waitForStoryStatus(id, status, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const candidate = (await readStore()).stories.find((item) => item.id === id);
    if (candidate?.status === status) return candidate;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Story ${id} did not become ${status}.\n${workerOutput}`);
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-scheduling-revisions-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.writeFile(storePath, `${JSON.stringify(initialStore(), null, 2)}\n`, "utf8");
  await startServer();
});

after(async () => {
  await stopServer();
});

test("invalid and past scheduled dates are rejected without changing the draft", async () => {
  for (const scheduledPublishAt of ["not-a-date", new Date(Date.now() - 60_000).toISOString()]) {
    const source = (await readStore()).stories.find((item) => item.id === "scheduled-a");
    const response = await post({ action: "saveStory", story: withPublicationOverride({ ...source, status: "scheduled", scheduledPublishAt }) });
    assert.equal(response.status, 400);
    assert.equal((await readStore()).stories.find((item) => item.id === "scheduled-a").status, "draft");
  }
});

test("published stories save in place, retain identity, and create rollback revisions", async () => {
  const original = (await readStore()).stories.find((item) => item.id === "story-1");
  let response = await post({
    action: "saveStory",
    story: {
      ...original,
      title: "Updated published story title",
      summary: "Updated excerpt and SEO description.",
      body: [...body, "A second updated paragraph."],
      category: "Races",
      sectionSlugs: ["races"],
      tags: ["updated", "racing"],
      imageUrl: "/api/media/media-2",
      imageAlt: "Replacement yacht",
      imageCredit: "Old Sea Dogs",
      noindex: true,
    },
  });
  assert.equal(response.status, 200);
  let saved = (await response.json()).story;
  assert.equal(saved.status, "published");
  assert.equal(saved.editorialStatus, "Updated");
  assert.equal(saved.id, original.id);
  assert.equal(saved.slug, original.slug);
  assert.equal(saved.publishedAt, original.publishedAt);
  assert.equal(saved.isFeatured, true);
  assert.equal(saved.imageUrl, "/api/media/media-2");

  response = await post({ action: "saveStory", story: { ...saved, title: "Updated published story title again" } });
  assert.equal(response.status, 200);
  saved = (await response.json()).story;
  let store = await readStore();
  assert.equal(store.stories.filter((item) => item.id === original.id).length, 1);
  assert.equal(store.storyRevisions.length, 2);

  const originalRevision = store.storyRevisions.find((revision) => revision.snapshot.title === original.title);
  assert.ok(originalRevision);
  response = await post({ action: "restoreStoryRevision", id: original.id, revisionId: originalRevision.id });
  assert.equal(response.status, 200);
  const restored = (await response.json()).story;
  assert.equal(restored.title, original.title);
  assert.deepEqual(restored.body, original.body);
  assert.equal(restored.status, "published");
  assert.equal(restored.id, original.id);
  assert.equal(restored.slug, original.slug);
  assert.equal(restored.publishedAt, original.publishedAt);
  assert.equal(restored.isFeatured, true);
  store = await readStore();
  assert.equal(store.stories.filter((item) => item.id === original.id).length, 1);
  assert.equal(store.storyRevisions.length, 3);
});

test("multiple schedules persist across restart and publish automatically while future stories wait", async () => {
  // Leave enough headroom for a heavily loaded full-suite run, then restart
  // immediately. The old 2.5-second window could expire while stopServer was
  // waiting for the worker, turning this persistence check into a timing race.
  const dueAt = new Date(Date.now() + 10_000).toISOString();
  const futureAt = new Date(Date.now() + 120_000).toISOString();
  for (const [id, scheduledPublishAt] of [["scheduled-a", dueAt], ["scheduled-b", dueAt], ["scheduled-future", futureAt]]) {
    const source = (await readStore()).stories.find((item) => item.id === id);
    const response = await post({
      action: "saveStory",
      story: withPublicationOverride({ ...source, status: "scheduled", scheduledPublishAt }),
    });
    assert.equal(response.status, 200);
    const saved = (await response.json()).story;
    assert.equal(saved.status, "scheduled");
    assert.equal(saved.scheduledPublishAt, scheduledPublishAt);
  }

  await stopServer();
  let store = await readStore();
  assert.equal(store.stories.find((item) => item.id === "scheduled-a").status, "scheduled");
  await startServer();

  const first = await waitForStoryStatus("scheduled-a", "published", 20_000);
  const second = await waitForStoryStatus("scheduled-b", "published", 20_000);
  assert.equal(first.publishedAt, dueAt);
  assert.equal(second.publishedAt, dueAt);
  assert.equal(first.scheduledPublishAt, "");
  assert.equal(first.editorialStatus, "Published");
  assert.equal(first.statusHistory[0].changedBy, "Automatic scheduler");
  store = await readStore();
  assert.equal(store.stories.find((item) => item.id === "scheduled-future").status, "scheduled");
  assert.equal(store.stories.find((item) => item.id === "scheduled-future").scheduledPublishAt, futureAt);
});

test("Publish Now remains immediate and does not create a duplicate", async () => {
  const source = (await readStore()).stories.find((item) => item.id === "publish-now");
  const response = await post({ action: "saveStory", story: withPublicationOverride({ ...source, status: "published" }) });
  assert.equal(response.status, 200);
  const saved = (await response.json()).story;
  assert.equal(saved.status, "published");
  assert.match(saved.publishedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal((await readStore()).stories.filter((item) => item.id === "publish-now").length, 1);
});

test("the dedicated scheduler publishes a newly scheduled story without public traffic", async () => {
  // Let the scheduler finish an idle check before creating the near-term
  // schedule. This proves it notices new work independently of page requests.
  await new Promise((resolve) => setTimeout(resolve, 1_500));
  const source = (await readStore()).stories.find((item) => item.id === "scheduled-while-idle");
  const dueAt = new Date(Date.now() + 2_000).toISOString();
  const response = await post({
    action: "saveStory",
    story: withPublicationOverride({ ...source, status: "scheduled", scheduledPublishAt: dueAt }),
  });
  assert.equal(response.status, 200);

  // waitForStoryStatus reads the disposable JSON file directly. It sends no
  // homepage, story, search, sitemap, health, or editor read request.
  const published = await waitForStoryStatus("scheduled-while-idle", "published", 10_000);
  assert.equal(published.publishedAt, dueAt);
  assert.equal(published.statusHistory.filter((entry) =>
    entry.fromStatus === "scheduled" && entry.toStatus === "published"
  ).length, 1);
});
