import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { saveEditorStoryRequest } from "../lib/editor-publication.js";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("publication persists current rights metadata before saveStory", async () => {
  const requests = [];
  const currentRights = {
    copyrightOwnership: "unknown",
    copyrightOwner: "Ellie Driver",
    credit: "Photo: Ellie Driver",
    licence: "Editorial permission",
    permissionNote: "Approved for Old Sea Dogs publication.",
  };
  const fetcher = async (_url, init) => {
    const payload = JSON.parse(init.body);
    requests.push(payload);
    if (payload.action === "updateMedia") return jsonResponse({ media: { id: payload.id, ...payload.media } });
    return jsonResponse({ story: payload.story });
  };

  const result = await saveEditorStoryRequest({
    fetcher,
    mediaRightsUpdates: [{ id: "incomplete-photo", media: currentRights }],
    story: { id: "draft-story", status: "published" },
  });

  assert.equal(result.response.status, 200);
  assert.deepEqual(requests.map((request) => request.action), ["updateMedia", "saveStory"]);
  assert.equal(requests[0].id, "incomplete-photo");
  assert.deepEqual(requests[0].media, currentRights);
  assert.equal(requests[1].story.status, "published");
});

test("stale unknown ownership cannot block the client publication request", async () => {
  const requests = [];
  const fetcher = async (_url, init) => {
    const payload = JSON.parse(init.body);
    requests.push(payload);
    return payload.action === "updateMedia"
      ? jsonResponse({ media: { id: payload.id, ...payload.media } })
      : jsonResponse({ story: payload.story });
  };

  await saveEditorStoryRequest({
    fetcher,
    mediaRightsUpdates: [{
      id: "photo-1",
      media: {
        copyrightOwnership: "unknown",
        photographer: "Ellie Driver",
        credit: "Photo: Ellie Driver",
      },
    }],
    story: { id: "story-1", status: "published" },
  });

  assert.equal(requests.at(-1).action, "saveStory");
});

test("the server advisory is returned with a successful publication", async () => {
  const diagnostic = {
    story: { id: "draft-story", status: "published" },
    copyrightWarnings: [{
      message: "Image rights information is incomplete. You may publish now and update the rights details later.",
      filename: "Ellie Driver.jpg",
      mediaId: "incomplete-photo",
      missingField: "Copyright Ownership or Rights Evidence",
    }],
  };
  const result = await saveEditorStoryRequest({
    fetcher: async (_url, init) => {
      const payload = JSON.parse(init.body);
      assert.equal(payload.action, "saveStory");
      return jsonResponse(diagnostic);
    },
    story: { id: "draft-story", status: "published" },
  });

  assert.equal(result.response.status, 200);
  assert.deepEqual(result.payload, diagnostic);
});

test("rights metadata persistence failure cannot prevent saveStory", async () => {
  const requests = [];
  const result = await saveEditorStoryRequest({
    fetcher: async (_url, init) => {
      const payload = JSON.parse(init.body);
      requests.push(payload);
      return payload.action === "updateMedia"
        ? jsonResponse({ error: "Rights metadata store unavailable." }, 500)
        : jsonResponse({ story: payload.story, copyrightWarnings: [] });
    },
    mediaRightsUpdates: [{ id: "photo-1", media: { copyrightOwnership: "unknown" } }],
    story: { id: "story-1", status: "published" },
  });
  assert.deepEqual(requests.map((request) => request.action), ["updateMedia", "saveStory"]);
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.mediaPersistenceWarnings, ["Rights metadata store unavailable."]);
});

test("draft saves persist media metadata before saveStory", async () => {
  const requests = [];
  await saveEditorStoryRequest({
    fetcher: async (_url, init) => {
      const payload = JSON.parse(init.body);
      requests.push(payload);
      return jsonResponse({ story: payload.story });
    },
    mediaRightsUpdates: [{ id: "photo-1", media: { copyrightOwner: "Current owner" } }],
    story: { id: "draft-story", status: "draft" },
  });
  assert.deepEqual(requests.map((request) => request.action), ["updateMedia", "saveStory"]);
});

test("Bridge and Classic Editor share the same publication request path", async () => {
  const bridge = await fs.readFile(path.join(projectDir, "app/editor/BridgeCms.tsx"), "utf8");
  const classic = await fs.readFile(path.join(projectDir, "app/editor/EditorDashboard.tsx"), "utf8");

  assert.match(bridge, /onClick=\{\(\) => void saveStory\("published"\)\}/);
  assert.match(bridge, /<button disabled=\{saving\} onClick=\{\(\) => void saveStory\("published"\)\} type="button">Publish Now<\/button>/);
  assert.match(bridge, /Editorial suggestions are available\. You may publish now or review them first\./);
  assert.match(bridge, />Review Suggestions<\/button>/);
  assert.match(bridge, /Publish Anyway/);
  assert.match(bridge, /I confirm I have the rights to publish this image\./);
  assert.match(bridge, /Reason for publishing anyway \(optional\)/);
  assert.match(bridge, /confirmImageRights:/);
  assert.match(bridge, /confirmEditorialWarnings:/);
  assert.match(bridge, /saveEditorStoryRequest[\s\S]*mediaRightsUpdates/);
  assert.match(classic, /publishStoryNow[\s\S]*saveStoryRecord/);
  assert.match(classic, /saveEditorStoryRequest<[\s\S]*?\(\{ story: storyToSave \}\)/);
  assert.doesNotMatch(bridge, /Make this the Homepage Lead Story\?/);
  assert.doesNotMatch(classic, /Make this the Homepage Lead Story\?/);
  assert.doesNotMatch(bridge, /disabled=\{saving \|\| !rewritten\}|Required editor note/);
  assert.doesNotMatch(classic, /Cannot publish yet:/);
  assert.doesNotMatch(classic, /Add a photo credit before publishing/);
  assert.match(bridge, /Image rights information is incomplete\./);
});

test("the generic editorial publication blocker is absent from runtime source", async () => {
  const editorialQuality = await fs.readFile(path.join(projectDir, "lib/editorial-quality.ts"), "utf8");
  const siteContent = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  const api = await fs.readFile(path.join(projectDir, "app/api/editor/route.ts"), "utf8");
  assert.doesNotMatch(editorialQuality, /This story cannot be published yet|assertStoryPublishable/);
  assert.doesNotMatch(siteContent, /assertStoryPublishable/);
  assert.doesNotMatch(api, /This story cannot be published yet/);
  assert.match(siteContent, /StoryTechnicalValidationError/);
  assert.match(api, /editorialWarnings/);
});

test("Homepage Manager makes headline-story selection explicit and remains the only commit path", async () => {
  const bridge = await fs.readFile(path.join(projectDir, "app/editor/BridgeCms.tsx"), "utf8");
  assert.match(bridge, /Homepage Headline Story/);
  assert.match(bridge, /Choose as Headline Story/);
  assert.match(bridge, /Nothing changes publicly until you press Save Homepage/);
  assert.match(bridge, /homepageSource: "homepage-manager-save"/);
  assert.doesNotMatch(bridge, /saveStory\([^)]*isFeatured/);
});
