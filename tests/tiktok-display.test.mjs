import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTikTokViewCount,
  officialEmbedUrl,
  sanitizePublicTikTokVideo,
  toPublicTikTokCatalog,
  toPublicTikTokVideo,
} from "../lib/tiktok-display.js";
import { assembleTikTokCatalog, listAuthorizedTikTokVideos } from "../lib/tiktok-display-api.js";

const videoId = "7080213458555737986";
const olderId = "7077642457847994444";

function rawVideo(id, extra = {}) {
  return {
    id,
    title: `Harbour ${id}`,
    video_description: "A waterfront clip",
    view_count: 1890,
    share_url: `https://www.tiktok.com/@oldseadogs8/video/${id}?utm_source=display`,
    embed_link: `https://www.tiktok.com/static/profile-video?id=${id}&hide_author=1`,
    embed_html: "<blockquote><script async src=\"https://www.tiktok.com/embed.js\"></script></blockquote>",
    cover_image_url: `https://p16-sign.tiktokcdn-us.com/tos-useast5/${id}~tplv-noop.image`,
    ...extra,
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("view counts stay readable and official players reject foreign URLs", () => {
  assert.equal(formatTikTokViewCount(979), "979");
  assert.equal(formatTikTokViewCount(1890), "1890");
  assert.equal(formatTikTokViewCount(10000), "10K");
  assert.equal(formatTikTokViewCount(19180), "19.2K");
  assert.equal(formatTikTokViewCount(-1), "");
  assert.equal(officialEmbedUrl(videoId, "javascript:alert(1)"), `https://www.tiktok.com/embed/v2/${videoId}`);
  assert.equal(officialEmbedUrl(videoId, "https://evil.example/embed"), `https://www.tiktok.com/embed/v2/${videoId}`);
  assert.equal(
    officialEmbedUrl(videoId, `https://www.tiktok.com/static/profile-video?id=${videoId}`),
    `https://www.tiktok.com/static/profile-video?id=${videoId}`,
  );
  const video = toPublicTikTokVideo(rawVideo(videoId, { cover_image_url: "https://evil.example/cover.jpg" }));
  assert.equal(video.coverPath, `/api/social/tiktok/cover/${videoId}`);
  assert.equal("embed_html" in video, false);
  assert.equal("cover_image_url" in video, false);
  assert.equal(sanitizePublicTikTokVideo({ ...video, embedUrl: "https://evil.example/player", watchUrl: "https://evil.example/watch" }).embedUrl, `https://www.tiktok.com/embed/v2/${videoId}`);
});

test("video list pages through the Display API and keeps only official covers", async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url: String(url), init });
    const body = JSON.parse(init.body);
    if (body.cursor === undefined) {
      return jsonResponse({
        data: { videos: [rawVideo(videoId), rawVideo(videoId), { id: "nope", title: "skip" }], cursor: 1643332803000, has_more: true },
        error: { code: "ok", message: "" },
      });
    }
    return jsonResponse({
      data: { videos: [rawVideo(olderId, { view_count: 505, cover_image_url: "https://evil.example/secret.jpg" })], cursor: 1643330000000, has_more: false },
      error: { code: "ok", message: "" },
    });
  };

  const listed = await listAuthorizedTikTokVideos({ accessToken: "act.secret", fetchImpl });
  assert.equal(listed.complete, true);
  assert.deepEqual(listed.videos.map((video) => video.id), [videoId, olderId]);
  assert.equal(listed.videos[0].viewCount, 1890);
  assert.equal(listed.videos[1].viewCount, 505);
  assert.equal(listed.covers[videoId].includes("tiktokcdn-us.com"), true);
  assert.equal(listed.covers[olderId], undefined);
  assert.equal(requests.length, 2);
  assert.equal(requests.every((request) => new URL(request.url).hostname === "open.tiktokapis.com"), true);
  assert.equal(JSON.parse(requests[1].init.body).cursor, 1643332803000);
  assert.equal(requests.some((request) => JSON.stringify(request.init).includes("www.tiktok.com/@")), false);
  const published = toPublicTikTokCatalog({ available: true, complete: true, videos: listed.videos, covers: listed.covers, refresh: { accessToken: "act.secret" } });
  assert.equal(JSON.stringify(published).includes("act.secret"), false);
  assert.equal(JSON.stringify(published).includes("tiktokcdn"), false);
  assert.equal(JSON.stringify(published).includes("embed.js"), false);
});

test("a repeated cursor stops the list instead of looping", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse({
      data: { videos: [rawVideo(videoId)], cursor: 50, has_more: true },
      error: { code: "ok", message: "" },
    });
  };
  const listed = await listAuthorizedTikTokVideos({ accessToken: "act.secret", fetchImpl, maxPages: 5 });
  assert.equal(listed.complete, false);
  assert.equal(calls, 2);
  assert.equal(listed.videos.length, 1);
});

test("the catalog uses the authorized channel and refreshes a rejected token once", async () => {
  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    const href = String(url);
    requests.push({ href, authorization: init.headers?.Authorization || "", body: init.body });
    if (href.includes("/user/info/") && init.headers?.Authorization === "Bearer act.expired") {
      return jsonResponse({ error: { code: "access_token_invalid", message: "token" } }, 401);
    }
    if (href.includes("/oauth/token/")) {
      assert.equal(init.body.get("grant_type"), "refresh_token");
      assert.equal(init.body.get("client_secret"), "secret");
      return jsonResponse({ access_token: "act.fresh", refresh_token: "rft.fresh", expires_in: 86400, open_id: "open-1" });
    }
    if (href.includes("/user/info/")) {
      return jsonResponse({ data: { user: { username: "oldseadogs8" } }, error: { code: "ok", message: "" } });
    }
    return jsonResponse({
      data: { videos: [rawVideo(videoId)], cursor: 10, has_more: false },
      error: { code: "ok", message: "" },
    });
  };

  const catalog = await assembleTikTokCatalog({
    credentials: { clientKey: "key", clientSecret: "secret", accessToken: "act.expired", refreshToken: "rft.old" },
    fetchImpl,
  });
  assert.equal(catalog.available, true);
  assert.equal(catalog.videos[0].id, videoId);
  assert.equal(catalog.refresh.accessToken, "act.fresh");
  assert.equal(requests.some((request) => request.href.includes("/v2/video/list/") && request.authorization === "Bearer act.fresh"), true);
  assert.equal(requests.some((request) => request.href.includes("www.tiktok.com")), false);

  const wrongAccount = await assembleTikTokCatalog({
    credentials: { accessToken: "act.other" },
    fetchImpl: async (url) => {
      assert.equal(String(url).includes("/video/list/"), false);
      return jsonResponse({ data: { user: { username: "someoneelse" } }, error: { code: "ok", message: "" } });
    },
  });
  assert.equal(wrongAccount.available, false);
  assert.equal(wrongAccount.videos.length, 0);
});
