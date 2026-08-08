import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const port = 3420;
const baseUrl = `http://127.0.0.1:${port}`;
const longBody = Array.from({ length: 140 }, (_, index) => `harbour${index + 1}`).join(" ");
const longGuideBody = Array.from({ length: 1050 }, (_, index) => `guide${index + 1}`).join(" ");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3L8AAAAASUVORK5CYII=", "base64");
let dataDir;
let storePath;
let server;
let serverOutput = "";
let workerController;
let nativeFetch;

function story(overrides = {}) {
  const stamp = "2026-07-15T08:00:00.000Z";
  return {
    id: "draft-story",
    slug: "cowes-harbour-safety-update-2026",
    title: "Cowes harbour safety update for summer 2026",
    category: "Sailing News",
    sectionSlugs: ["news"],
    date: "2026-07-15",
    author: "Old Sea Dogs",
    sourceType: "Original reporting",
    sourceName: "Old Sea Dogs",
    sourceUrl: "",
    imageUrl: "/api/media/incomplete-photo",
    imageAlt: "Yacht entering Cowes harbour",
    imageCredit: "",
    imageCaption: "A yacht enters Cowes harbour.",
    videoUrl: "",
    videoCaption: "",
    videoPosition: "",
    oldSeaDogsView: "The sensible skipper checks the harbour notice before casting off.",
    sourceNotes: "Old Sea Dogs reporting and harbour notice.",
    methodNotes: "",
    contentBasis: "Original reporting",
    editorialStatus: "Draft",
    noindex: false,
    summary: "Cowes crews have a practical harbour safety update to check before their next departure.",
    body: [longBody],
    tags: ["Cowes", "safety"],
    readMinutes: 3,
    isFeatured: false,
    status: "draft",
    publishedAt: "",
    scheduledPublishAt: "",
    sortOrder: 0,
    createdAt: stamp,
    updatedAt: stamp,
    statusHistory: [],
    ...overrides,
  };
}

function featuredStory(overrides = {}) {
  return story({
    id: "homepage-lead",
    slug: "solent-regatta-lead-2026",
    title: "Solent regatta fleet gathers for 2026 start",
    imageUrl: "",
    isFeatured: true,
    status: "published",
    publishedAt: "2026-07-14T08:00:00.000Z",
    editorialStatus: "Published",
    ...overrides,
  });
}

function media(overrides = {}) {
  return {
    id: "incomplete-photo",
    filename: "Ellie Driver.jpg",
    originalFilename: "Ellie Driver.jpg",
    displayName: "Ellie Driver",
    internalTitle: "Ellie Driver",
    contentType: "image/jpeg",
    size: 1024,
    r2Key: "media/incomplete-photo.jpg",
    url: "/api/media/incomplete-photo",
    alt: "Ellie Driver aboard a yacht",
    caption: "",
    credit: "",
    copyright: "",
    copyrightOwnership: "unknown",
    copyrightOwner: "",
    photographer: "",
    source: "",
    licence: "",
    permissionNote: "",
    usageRestrictions: "",
    creditLine: "",
    permissionReceivedAt: "",
    location: "",
    dateTaken: "",
    sourceType: "upload",
    category: "",
    tagsJson: "[]",
    collectionsJson: "[]",
    storyIdsJson: "[]",
    galleryItemId: "",
    originalKey: "media/incomplete-photo.jpg",
    webKey: "",
    width: 1200,
    height: 800,
    posterMediaId: "",
    externalUrl: "",
    description: "",
    storyAssociationId: "",
    galleryAssociationId: "",
    createdAt: "2026-07-15T08:00:00.000Z",
    ...overrides,
  };
}

function guide() {
  return {
    slug: "bridge-safety-guide",
    title: "Bridge safety guide",
    eyebrow: "Guide",
    summary: "A complete guide used to verify that normal Guide editing cannot change homepage visibility.",
    updatedAt: "2026-07-15",
    imageUrl: "",
    imageAlt: "",
    quickFacts: [{ label: "Area", value: "Solent" }],
    sections: [{ heading: "Planning", body: [longGuideBody] }],
    checklist: ["Check the tide"],
    sourceLinks: [],
    status: "draft",
    noindex: true,
    showOnHomepage: true,
    homepageOrder: 7,
    seoTitle: "Bridge safety guide",
    seoDescription: "Guide isolation verification.",
    tags: [],
    imageCaption: "",
    imageCredit: "",
    featuredMediaId: "",
    inlineImages: [],
  };
}

function baseStore() {
  return {
    version: 1,
    stories: [featuredStory(), story()],
    guides: [guide()],
    media: [media()],
    galleryCategories: [],
    galleryItems: [],
    instagramImports: [],
    ads: [],
    settings: {
      homepageLeadStoryId: "homepage-lead",
      homepageLeadStorySlug: "solent-regatta-lead-2026",
      homepageLatestStoryIds: "[\"homepage-lead\"]",
      homepageEditorsChoiceStoryIds: "[]",
      homepageHiddenStoryIds: "[]",
    },
    socialEvents: [],
    pressReleases: [],
    blockedSenders: [],
    publicationOverrides: [],
    updatedAt: "2026-07-15T08:00:00.000Z",
  };
}

async function resetStore() {
  await fs.writeFile(storePath, `${JSON.stringify(baseStore(), null, 2)}\n`, "utf8");
}

async function readStore() {
  return JSON.parse(await fs.readFile(storePath, "utf8"));
}

function homepageSnapshot(store) {
  return {
    leadId: store.settings.homepageLeadStoryId,
    leadSlug: store.settings.homepageLeadStorySlug,
    latest: store.settings.homepageLatestStoryIds,
    editorsChoice: store.settings.homepageEditorsChoiceStoryIds,
    hidden: store.settings.homepageHiddenStoryIds,
    featured: store.stories.filter((item) => item.isFeatured).map((item) => item.id).sort(),
  };
}

async function post(body, headers = {}) {
  return fetch(`${baseUrl}/api/editor`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function confirmPublicationOverrides(value, reason = "Reviewed by integration test editor.") {
  return {
    ...value,
    publicationOverride: {
      confirm: true,
      confirmImageRights: true,
      confirmEditorialWarnings: true,
      editorNote: reason,
    },
  };
}

async function expectHomepageUnchanged(action) {
  const before = homepageSnapshot(await readStore());
  const response = await action();
  const after = homepageSnapshot(await readStore());
  assert.deepEqual(after, before);
  return response;
}

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Bridge safety server exited before becoming ready.\n${serverOutput}`);
    try {
      await fetch(`${baseUrl}/api/editor?view=dashboard`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Bridge safety server did not start.");
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-bridge-safety-"));
  storePath = path.join(dataDir, "editor-store.json");
  await resetStore();
  workerController = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: {
      NODE_ENV: "production",
      OLDSEADOGS_RUNTIME: "node",
    },
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

test("Bridge CMS save paths cannot mutate homepage state", async (t) => {
  for (const technicalFailure of [
    { name: "empty headline", patch: { title: "", body: ["A non-empty story body."], imageUrl: "" }, error: /proper headline/ },
    { name: "empty body", patch: { body: [], imageUrl: "" }, error: /body text/ },
  ]) {
    await t.test(`${technicalFailure.name} remains a genuine technical blocker without changing homepage`, async () => {
      await resetStore();
      const response = await expectHomepageUnchanged(() => post({
        action: "saveStory",
        story: story({ ...technicalFailure.patch, status: "published" }),
      }));
      assert.equal(response.ok, false);
      assert.match((await response.json()).error, technicalFailure.error);
    });
  }

  for (const example of [
    { name: "vague headline", patch: { title: "The Next Generation Sets Sail", imageUrl: "" }, warning: /Improve the headline|Vague promotional headline wording/ },
    { name: "promotional and blocked wording", patch: { title: "Exciting sailing opportunity revealed", body: ["According to the press release, this exciting launch is delighted to showcase a game-changing experience."], imageUrl: "" }, warning: /Blocked wording|PR or marketing language|Improve the headline/ },
    { name: "low style score", patch: { sourceType: "Press Release", body: ["We are delighted to announce this unique world-class experience."], imageUrl: "" }, warning: /style score|PR or marketing language/ },
    { name: "short non-empty story", patch: { body: ["A short but complete sailing update."], imageUrl: "" }, warning: /under 300 words|short/ },
    { name: "missing Old Sea Dogs View", patch: { sourceType: "Email press release", oldSeaDogsView: "", imageUrl: "" }, warning: /Old Sea Dogs View/ },
    { name: "imported email wording", patch: { sourceType: "Email press release", title: "Amazing New Sailing Experience", body: ["According to the supplied email, the company is delighted to announce a unique new sailing experience."], oldSeaDogsView: "", imageUrl: "" }, warning: /Improve the headline|Blocked wording|Old Sea Dogs View/ },
  ]) {
    await t.test(`${example.name} requires an override and preserves story and homepage`, async () => {
      await resetStore();
      const submitted = story({ ...example.patch, status: "published" });
      const warningResponse = await expectHomepageUnchanged(() => post({ action: "saveStory", story: submitted }));
      assert.equal(warningResponse.status, 409);
      const warningPayload = await warningResponse.json();
      assert.equal(warningPayload.requiresPublicationOverride, true);
      assert.match(warningPayload.editorialWarnings.join(" "), example.warning);
      const response = await expectHomepageUnchanged(() => post({
        action: "saveStory",
        story: confirmPublicationOverrides(submitted),
      }));
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.ok, true);
      assert.equal(payload.story.status, "published");
      assert.equal(payload.story.title, submitted.title);
      assert.deepEqual(payload.story.body, submitted.body);
      assert.match(payload.editorialWarnings.join(" "), example.warning);
      if (example.name === "vague headline") assert.match(payload.editorialWarnings.join(" "), /Suggested:/);
      const stored = await readStore();
      const audit = stored.publicationOverrides.find((item) => item.kind === "editorial");
      assert.ok(audit);
      assert.equal(audit.storyId, "draft-story");
      assert.equal(audit.headline, submitted.title);
      assert.equal(audit.storyStatus, "published");
      assert.equal(audit.action, "editorial_override");
      assert.deepEqual(audit.warnings, payload.editorialWarnings);
      assert.equal(audit.editorNote, "Reviewed by integration test editor.");
      assert.equal(audit.user, "Bridge editor");
      assert.match(audit.time, /^\d{4}-\d{2}-\d{2}T/);
      assert.match(audit.validationOverridden, example.warning);
      assert.equal(audit.reason, "Reviewed by integration test editor.");
    });
  }

  await t.test("unknown copyright remains advisory, is audited, and does not change homepage", async () => {
    await resetStore();
    const warningResponse = await expectHomepageUnchanged(() => post({ action: "saveStory", story: story({ status: "published" }) }));
    assert.equal(warningResponse.status, 409);
    const response = await expectHomepageUnchanged(() => post({
      action: "saveStory",
      story: confirmPublicationOverrides(story({ status: "published" }), "Rights confirmed by editor."),
    }));
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.story.status, "published");
    assert.equal(payload.copyrightWarnings[0].message, "Image rights information is incomplete. Confirm your right to publish before continuing.");
    assert.equal(payload.copyrightWarnings[0].filename, "Ellie Driver.jpg");
    assert.equal(payload.copyrightWarnings[0].mediaId, "incomplete-photo");
    assert.equal(payload.rightsDiagnostics[0].filename, "Ellie Driver.jpg");
    assert.equal(payload.rightsDiagnostics[0].mediaId, "incomplete-photo");
    assert.equal(payload.rightsDiagnostics[0].copyrightOwnership, "unknown");
    assert.equal(payload.rightsDiagnostics[0].rightsEvidenceResult, "No valid rights evidence");
    assert.equal(payload.rightsDiagnostics[0].blockingRule, "None (advisory only)");
    assert.equal(payload.rightsDiagnostics[0].validationSource, "server-side");
    assert.match(payload.rightsDiagnostics[0].validationPath, /persist submitted metadata.*reload record.*advisory validateMediaRights.*publish/);
    assert.equal(payload.rightsDiagnostics[0].homepageWorkflowInvolved, false);
    const stored = await readStore();
    assert.equal(stored.media[0].copyrightOwnership, "unknown");
    assert.equal(stored.publicationOverrides[0].kind, "media-rights");
    assert.equal(stored.publicationOverrides[0].mediaId, "incomplete-photo");
    assert.equal(stored.publicationOverrides[0].editorNote, "Rights confirmed by editor.");
  });

  await t.test("publishing an existing featured draft persists published status and timestamp", async () => {
    const store = baseStore();
    store.stories = store.stories.map((item) => item.id === "draft-story"
      ? { ...item, isFeatured: true }
      : { ...item, isFeatured: false });
    store.settings.homepageLeadStoryId = "draft-story";
    store.settings.homepageLeadStorySlug = "cowes-harbour-safety-update-2026";
    await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");

    const submitted = confirmPublicationOverrides(story({
      status: "published",
      publishedAt: "",
      isFeatured: true,
      imageUrl: "",
    }));
    const response = await post(
      { action: "saveStory", story: submitted },
      { "x-openai-authenticated-user-role": "owner" }
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.story.status, "published");
    assert.match(payload.story.publishedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(payload.story.isFeatured, true);

    const saved = (await readStore()).stories.find((item) => item.id === "draft-story");
    assert.equal(saved.status, "published");
    assert.match(saved.publishedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(saved.isFeatured, true);
  });

  await t.test("Do Not Publish and explicit copyright infringement remain hard blocks", async () => {
    for (const rights of [
      { copyrightOwnership: "do-not-publish" },
      { usageRestrictions: "Explicit copyright infringement — do not distribute." },
    ]) {
      await resetStore();
      const response = await expectHomepageUnchanged(() => post({
        action: "saveStory",
        mediaRightsUpdates: [{ id: "incomplete-photo", media: rights }],
        story: confirmPublicationOverrides(story({ status: "published" })),
      }));
      assert.equal(response.status, 400);
      assert.match((await response.json()).error, /Do Not Publish|copyright infringement/i);
      assert.equal((await readStore()).stories.find((item) => item.id === "draft-story").status, "draft");
    }
  });

  await t.test("Story Editor isFeatured mutation is rejected and does not change homepage", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(() => post({ action: "saveStory", story: story({ status: "draft", isFeatured: true }) }));
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Story Editor cannot change Homepage Lead/);
    assert.equal((await readStore()).stories.find((item) => item.id === "draft-story").isFeatured, false);
  });

  await t.test("Story Editor cannot clear the existing Homepage Lead flag", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(() => post({
      action: "saveStory",
      story: featuredStory({ isFeatured: false }),
    }));
    assert.equal(response.status, 400);
  });

  await t.test("media upload does not change homepage", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(async () => {
      const form = new FormData();
      form.append("action", "uploadMedia");
      form.append("photo", new Blob([png], { type: "image/png" }), "bridge-safety.png");
      form.append("alt", "Bridge safety test photograph");
      return fetch(`${baseUrl}/api/editor/media/upload`, { method: "POST", body: form });
    });
    assert.equal(response.status, 200);
  });

  await t.test("email import does not change homepage", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(() => post({
      action: "importPressReleaseEmail",
      pressRelease: {
        senderName: "Harbour Office",
        senderEmail: "news@example.com",
        subject: "Cowes harbour notice for visiting yachts",
        bodyText: longBody,
        receivedAt: "2026-07-15T09:00:00.000Z",
      },
    }));
    assert.equal(response.status, 200);
  });

  await t.test("guide save preserves guide homepage visibility and story homepage state", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(() => post({ action: "saveGuide", guide: { ...guide(), showOnHomepage: false, homepageOrder: 1 } }));
    assert.equal(response.status, 200);
    const storedGuide = (await readStore()).guides.find((item) => item.slug === "bridge-safety-guide");
    assert.equal(storedGuide.showOnHomepage, true);
    assert.equal(storedGuide.homepageOrder, 7);
  });

  await t.test("Homepage API rejects requests without the Homepage Manager Save source", async () => {
    await resetStore();
    const homepage = {
      leadStoryId: "homepage-lead",
      homepageLatestStoryIds: "[]",
      homepageEditorsChoiceStoryIds: "[]",
      homepageHiddenStoryIds: "[]",
    };
    const rejected = await expectHomepageUnchanged(() => post({ action: "saveHomepage", homepage }));
    assert.equal(rejected.status, 403);
    assert.match((await rejected.json()).error, /only from Homepage Manager/);
    const accepted = await expectHomepageUnchanged(() => post({
      action: "saveHomepage",
      homepageSource: "homepage-manager-save",
      homepage: { ...homepage, homepageLatestStoryIds: "[\"homepage-lead\"]", allowMissingImage: true },
    }));
    assert.equal(accepted.status, 200);
  });

  await t.test("valid rights metadata allows publication without changing homepage", async () => {
    await resetStore();
    const metadataResponse = await post({
      action: "updateMedia",
      id: "incomplete-photo",
      media: { permissionNote: "Permission supplied by the photographer for Old Sea Dogs publication." },
    });
    assert.equal(metadataResponse.status, 200);
    const response = await expectHomepageUnchanged(() => post({ action: "saveStory", story: story({ status: "published" }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).story.status, "published");
  });

  for (const example of [
    { name: "ownership set to Michael Hodges", rights: { copyrightOwnership: "michael-hodges" } },
    { name: "Press / supplied image with credit", rights: { copyrightOwnership: "press-supplied", credit: "Supplied by Cowes Harbour", creditLine: "Supplied by Cowes Harbour" } },
    { name: "Licensed image with licence details", rights: { copyrightOwnership: "licensed", licence: "Editorial web licence 2026" } },
    { name: "named copyright owner plus permission note", rights: { copyrightOwner: "Ellie Driver", permissionNote: "Approved for this Old Sea Dogs story." } },
  ]) {
    await t.test(`${example.name} allows publication`, async () => {
      await resetStore();
      const response = await expectHomepageUnchanged(() => post({
        action: "saveStory",
        mediaRightsUpdates: [{ id: "incomplete-photo", media: example.rights }],
        story: story({ status: "published" }),
      }));
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.story.status, "published");
      assert.equal(payload.rightsDiagnostics[0].metadataSavedBeforeValidation, true);
      assert.equal(payload.rightsDiagnostics[0].validationRecordMatches, true);
      const stored = await readStore();
      assert.deepEqual(
        Object.fromEntries(Object.keys(example.rights).map((key) => [key, stored.media[0][key]])),
        example.rights,
      );
    });
  }

  await t.test("unknown ownership with no evidence publishes with an advisory", async () => {
    await resetStore();
    const response = await post({ action: "saveStory", story: confirmPublicationOverrides(story({ status: "published" })) });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.copyrightWarnings[0].missingField, "Copyright Ownership or Rights Evidence");
    assert.equal((await readStore()).stories.find((item) => item.id === "draft-story").status, "published");
  });

  await t.test("draft and schedule are never blocked by rights or editorial warnings", async () => {
    await resetStore();
    const scheduledPublishAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const draftResponse = await expectHomepageUnchanged(() => post({ action: "saveStory", story: story({ title: "Amazing New Sailing Experience", body: ["Short promotional draft."], sourceType: "Email press release", status: "draft" }) }));
    assert.equal(draftResponse.status, 200);
    const scheduledWarningResponse = await expectHomepageUnchanged(() => post({
      action: "saveStory",
      story: story({ title: "Amazing New Sailing Experience", body: ["Short promotional schedule."], sourceType: "Email press release", status: "scheduled", scheduledPublishAt }),
    }));
    assert.equal(scheduledWarningResponse.status, 409);
    const scheduledResponse = await expectHomepageUnchanged(() => post({
      action: "saveStory",
      story: confirmPublicationOverrides(story({ title: "Amazing New Sailing Experience", body: ["Short promotional schedule."], sourceType: "Email press release", status: "scheduled", scheduledPublishAt })),
    }));
    assert.equal(scheduledResponse.status, 200);
    const scheduledPayload = await scheduledResponse.json();
    assert.equal(scheduledPayload.story.status, "scheduled");
    assert.equal(scheduledPayload.copyrightWarnings.length, 1);
    assert.ok(scheduledPayload.editorialWarnings.length > 0);
  });

  await t.test("Story Media metadata persists and is returned after refresh", async () => {
    await resetStore();
    const save = await post({
      action: "updateMedia",
      id: "incomplete-photo",
      media: { copyrightOwner: "Michael Hodges", permissionReceivedAt: "2026-07-15" },
    });
    assert.equal(save.status, 200);
    const refresh = await fetch(`${baseUrl}/api/editor?view=media`);
    assert.equal(refresh.status, 200);
    const refreshed = await refresh.json();
    const item = refreshed.media.find((candidate) => candidate.id === "incomplete-photo");
    assert.equal(item.copyrightOwner, "Michael Hodges");
    assert.equal(item.permissionReceivedAt, "2026-07-15");
  });

  await t.test("Publish saves media metadata first and validates the current stored record", async () => {
    await resetStore();
    const response = await post({
      action: "saveStory",
      mediaRightsUpdates: [{
        id: "incomplete-photo",
        media: { copyrightOwnership: "licensed", licence: "Current persisted licence" },
      }],
      story: story({ status: "published" }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.rightsDiagnostics[0].metadataSavedBeforeValidation, true);
    assert.equal(payload.rightsDiagnostics[0].validationRecordMatches, true);
    assert.match(payload.rightsDiagnostics[0].rightsEvidenceResult, /Licence/);
    assert.equal((await readStore()).media[0].licence, "Current persisted licence");
  });

  await t.test("failed rights metadata save cannot stop publication", async () => {
    await resetStore();
    const response = await post({
      action: "saveStory",
      mediaRightsUpdates: [{ id: "missing-photo", media: { copyrightOwnership: "michael-hodges" } }],
      story: story({ imageUrl: "/api/media/missing-photo", status: "published" }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.story.status, "published");
    assert.match(payload.mediaPersistenceWarnings[0], /publication continued/);
  });

  await t.test("rights confirmation is audited without changing ownership", async () => {
    await resetStore();
    const response = await expectHomepageUnchanged(() => post({
      action: "saveStory",
      story: confirmPublicationOverrides(story({ status: "published" }), ""),
    }));
    assert.equal(response.status, 200);
    const stored = await readStore();
    assert.equal(stored.media[0].copyrightOwnership, "unknown");
    const audit = stored.publicationOverrides[0];
    assert.equal(audit.kind, "media-rights");
    assert.equal(audit.storyId, "draft-story");
    assert.equal(audit.mediaId, "incomplete-photo");
    assert.equal(audit.editorIdentity, "Bridge editor");
    assert.match(audit.timestamp, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(audit.editorNote, "");
    assert.equal(audit.user, "Bridge editor");
    assert.equal(audit.time, audit.timestamp);
    assert.match(audit.validationOverridden, /Image rights information incomplete/);
    assert.equal(audit.reason, "");
  });
});

test("email conversion uses the same full Story Editor", async () => {
  const source = await fs.readFile(path.join(projectDir, "app/editor/BridgeCms.tsx"), "utf8");
  assert.match(source, /window\.location\.assign\(`\/editor\/write\?story=/);
  assert.match(source, /<WriteStoryEditor[\s\S]*initialStory=/);
  for (const capability of ["Story Media", "Video URL", "Noindex", "Schedule", "Preview", "Publish Now"]) {
    assert.match(source, new RegExp(capability), `Standard Story Editor must retain ${capability}.`);
  }
});

test("normal story completes draft, media, preview, publish, unpublish and republish", async () => {
  await resetStore();
  const inlineBlock = "[image:/api/media/incomplete-photo|Cowes harbour|Ellie Driver|Yacht entering Cowes harbour]";
  const draft = story({
    imageUrl: "/api/media/incomplete-photo",
    body: [longBody, inlineBlock],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoCaption: "Harbour briefing",
    videoPosition: "bottom",
    status: "draft",
  });
  let response = await post({ action: "saveStory", story: draft });
  assert.equal(response.status, 200);
  const savedDraft = (await response.json()).story;
  assert.equal(savedDraft.status, "draft");
  assert.equal(savedDraft.id, "draft-story");
  assert.ok(savedDraft.body.includes(inlineBlock));

  const preview = await fetch(`${baseUrl}/editor/preview/draft-story`);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /Cowes harbour safety update/);

  for (const status of ["published", "unpublished", "published"]) {
    const nextStory = { ...savedDraft, status };
    response = await post({
      action: "saveStory",
      story: status === "published" ? confirmPublicationOverrides(nextStory) : nextStory,
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.story.status, status);
    assert.equal(payload.story.id, "draft-story");
  }
  assert.equal((await readStore()).stories.filter((item) => item.id === "draft-story").length, 1);
});

test("one canonical story can publish to News and Races without duplication", async () => {
  await resetStore();
  const submitted = story({
    category: "News",
    sectionSlugs: ["news", "races"],
    imageUrl: "",
    status: "published",
  });
  let response = await post({ action: "saveStory", story: submitted });
  assert.equal(response.status, 200);
  let payload = await response.json();
  assert.equal(payload.story.id, "draft-story");
  assert.deepEqual(payload.story.sectionSlugs, ["news", "races"]);
  assert.equal((await readStore()).stories.filter((item) => item.id === "draft-story").length, 1);

  for (const section of ["news", "races"]) {
    const listing = await fetch(`${baseUrl}/${section}`);
    assert.equal(listing.status, 200);
    assert.match(await listing.text(), /\/stories\/cowes-harbour-safety-update-2026/);
  }
  const canonical = await fetch(`${baseUrl}/stories/cowes-harbour-safety-update-2026`);
  assert.equal(canonical.status, 200);

  response = await post({ action: "saveStory", story: { ...payload.story, sectionSlugs: ["news"] } });
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.deepEqual(payload.story.sectionSlugs, ["news"]);
  assert.match(await (await fetch(`${baseUrl}/news`)).text(), /\/stories\/cowes-harbour-safety-update-2026/);
  assert.doesNotMatch(await (await fetch(`${baseUrl}/races`)).text(), /\/stories\/cowes-harbour-safety-update-2026/);
});
