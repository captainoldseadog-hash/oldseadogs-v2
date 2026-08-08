import assert from "node:assert/strict";
import { fork } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const body = [Array.from({ length: 150 }, (_, index) => `seaword${index + 1}`).join(" ")];
let dataDir;
let storePath;
let workers = [];
let requestSequence = 0;

function story(overrides = {}) {
  const stamp = "2026-07-20T08:00:00.000Z";
  return {
    id: "public-story",
    slug: "public-story",
    title: "Public story",
    category: "News",
    sectionSlugs: ["news"],
    date: "2026-07-20",
    author: "Old Sea Dogs",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs",
    sourceUrl: "",
    originalSourceType: "",
    originalSourceRef: "",
    originalSourceContent: "",
    imageUrl: "",
    imageAlt: "",
    imageCredit: "",
    imageCaption: "",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "Independent reporting for experienced boat owners.",
    sourceNotes: "Old Sea Dogs reporting.",
    methodNotes: "",
    contentBasis: "Original reporting",
    editorialStatus: "Published",
    noindex: false,
    summary: "A complete story used to verify read-only public requests and safe concurrent CMS writes.",
    body,
    tags: ["testing"],
    readMinutes: 3,
    isFeatured: false,
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

function initialStore() {
  return {
    version: 1,
    stories: [
      story({ isFeatured: true }),
      story({
        id: "due-without-scheduler",
        slug: "due-without-scheduler",
        title: "Due story without scheduler",
        status: "scheduled",
        editorialStatus: "Scheduled",
        publishedAt: "",
        scheduledPublishAt: "2026-07-20T09:00:00.000Z",
      }),
      story({ id: "published-a", slug: "published-a", title: "Published A" }),
      story({ id: "published-b", slug: "published-b", title: "Published B" }),
    ],
    guides: [],
    media: [],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {},
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    storyRevisions: [],
    updatedAt: "2026-07-20T08:00:00.000Z",
  };
}

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

async function workerRequest(worker, {
  url,
  method = "GET",
  headers = {},
  body: requestBody,
}) {
  const id = `${process.pid}-${++requestSequence}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.off("message", onMessage);
      reject(new Error(`Worker request timed out: ${method} ${url}`));
    }, 30_000);
    const onMessage = (message) => {
      if (message?.type !== "response" || message.id !== id) return;
      clearTimeout(timeout);
      worker.off("message", onMessage);
      resolve(message);
    };
    worker.on("message", onMessage);
    worker.send({
      type: "request",
      id,
      url,
      method,
      headers,
      body: requestBody,
    });
  });
}

async function post(worker, payload) {
  return workerRequest(worker, {
    url: "http://localhost/api/editor",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function startWorkers() {
  workers = [0, 1].map(() => {
    const child = fork("./tests/helpers/editor-store-process.mjs", [], {
      cwd: projectDir,
      env: {
        ...process.env,
        OLDSEADOGS_DATA_DIR: dataDir,
        OLDSEADOGS_ENV: "production",
        OLDSEADOGS_REQUIRE_EXISTING_STORE: "true",
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    child.setMaxListeners(0);
    return child;
  });
  await Promise.all(workers.map((worker) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Editor-store worker did not become ready.")), 30_000);
    worker.once("exit", (code) => reject(new Error(`Editor-store worker exited during startup: ${code}`)));
    worker.on("message", (message) => {
      if (message?.type !== "ready") return;
      clearTimeout(timeout);
      resolve();
    });
  })));
}

async function stopWorkers() {
  await Promise.all(workers.map(async (worker) => {
    if (worker.exitCode !== null) return;
    const exited = new Promise((resolve) => worker.once("exit", resolve));
    worker.kill("SIGTERM");
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 10_000))]);
  }));
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-store-concurrency-"));
  storePath = path.join(dataDir, "editor-store.json");
  await fs.writeFile(storePath, `${JSON.stringify(initialStore(), null, 2)}\n`, "utf8");
  await startWorkers();
});

after(async () => {
  await stopWorkers();
});

test("public requests are read-only and do not publish a due scheduled story", async () => {
  const before = await fs.readFile(storePath, "utf8");
  for (const [route, expectedStatus] of [
    ["/", 200],
    ["/stories/public-story", 200],
    ["/archive", 200],
    ["/search?q=public", 200],
    ["/sitemap.xml", 200],
    ["/api/editor/health", 403],
  ]) {
    const response = await workerRequest(workers[0], { url: `https://oldseadogs.com${route}` });
    assert.equal(response.status, expectedStatus, route);
  }
  const trackingResponse = await workerRequest(workers[0], {
    url: "https://oldseadogs.com/api/social/track",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "social_click",
      platform: "Public test",
      target: "https://example.com",
    })
  });
  assert.equal(trackingResponse.status, 403);
  const after = await fs.readFile(storePath, "utf8");
  assert.equal(after, before);
  const due = (await readStore()).stories.find((item) => item.id === "due-without-scheduler");
  assert.equal(due.status, "scheduled");
  assert.equal(due.publishedAt, "");
  assert.equal(due.statusHistory.length, 0);
});

test("concurrent editor processes retain every independent story write", async () => {
  const writes = Array.from({ length: 24 }, (_, index) => {
    const id = `concurrent-draft-${index}`;
    return post(workers[index % workers.length], {
      action: "saveStory",
      story: {
        id,
        slug: id,
        title: `Concurrent draft ${index}`,
        category: "News",
        body: [`Draft body ${index}`],
        status: "draft",
      },
    });
  });
  const responses = await Promise.all(writes);
  assert.ok(responses.every((response) => response.status === 200));

  const store = await readStore();
  for (let index = 0; index < 24; index += 1) {
    assert.equal(store.stories.filter((item) => item.id === `concurrent-draft-${index}`).length, 1);
  }
});

test("a lock left by a dead writer is recovered without manual migration", async () => {
  const lockPath = `${storePath}.lock`;
  await fs.mkdir(lockPath, { mode: 0o700 });
  await fs.writeFile(`${lockPath}/owner.json`, JSON.stringify({
    pid: 2_147_483_647,
    token: "dead-test-process",
    acquiredAt: "2026-07-20T08:00:00.000Z",
  }));
  const response = await post(workers[0], {
    action: "saveStory",
    story: {
      id: "after-stale-lock",
      slug: "after-stale-lock",
      title: "Saved after stale lock",
      category: "News",
      body: ["The stale lock was recovered safely."],
      status: "draft",
    },
  });
  assert.equal(response.status, 200);
  assert.equal((await readStore()).stories.filter((item) => item.id === "after-stale-lock").length, 1);
  await assert.rejects(fs.access(lockPath));
});

test("two schedulers and an editor cannot duplicate publication or lose a write", async () => {
  const editorId = "editor-during-scheduler";
  const [firstScheduler, editorSave, secondScheduler] = await Promise.all([
    post(workers[0], { action: "publishScheduledStories" }),
    post(workers[1], {
      action: "saveStory",
      story: {
        id: editorId,
        slug: editorId,
        title: "Editor write during scheduler",
        category: "News",
        body: ["This draft was saved while two scheduler calls competed."],
        status: "draft",
      },
    }),
    post(workers[1], { action: "publishScheduledStories" }),
  ]);
  assert.equal(firstScheduler.status, 200);
  assert.equal(editorSave.status, 200);
  assert.equal(secondScheduler.status, 200);

  const store = await readStore();
  const due = store.stories.find((item) => item.id === "due-without-scheduler");
  assert.equal(due.status, "published");
  assert.equal(due.publishedAt, "2026-07-20T09:00:00.000Z");
  assert.equal(due.statusHistory.filter((entry) =>
    entry.fromStatus === "scheduled" && entry.toStatus === "published"
  ).length, 1);
  assert.equal(store.stories.filter((item) => item.id === editorId).length, 1);
});

test("concurrent published edits create one revision for every committed save", async () => {
  const original = (await readStore()).stories.find((item) => item.id === "published-a");
  const [left, right] = await Promise.all([
    post(workers[0], {
      action: "saveStory",
      story: { ...original, title: "Published A left edit" },
    }),
    post(workers[1], {
      action: "saveStory",
      story: { ...original, title: "Published A right edit" },
    }),
  ]);
  assert.equal(left.status, 200);
  assert.equal(right.status, 200);

  const store = await readStore();
  assert.equal(store.stories.filter((item) => item.id === original.id).length, 1);
  assert.equal(store.storyRevisions.filter((item) => item.storyId === original.id).length, 2);
  assert.equal(store.stories.find((item) => item.id === original.id).publishedAt, original.publishedAt);
  await assert.rejects(fs.access(`${storePath}.lock`));
});
