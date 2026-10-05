import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIVATE_CACHE_CONTROL,
  PUBLIC_DOCUMENT_CACHE_CONTROL,
  PUBLIC_SHARED_CACHE_CONTROL,
  cacheHeadersForPolicyRequest,
  publicCacheDisposition,
} from "../lib/public-cache-policy.ts";

function request({
  method = "GET",
  pathname = "/",
  headers = {},
  search = [],
} = {}) {
  const headerMap = new Map(Object.entries({ accept: "text/html", ...headers }).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    method,
    pathname,
    searchParams: { has: (name) => search.includes(name) },
    header: (name) => headerMap.get(name.toLowerCase()) || null,
  };
}

test("anonymous public documents are shared-cacheable", () => {
  for (const pathname of ["/", "/guides", "/guides/solent/hamble-point-marina", "/stories/a-story", "/search", "/sitemap.xml", "/robots.txt"]) {
    const headers = cacheHeadersForPolicyRequest(request({ pathname }));
    assert.equal(publicCacheDisposition(request({ pathname })), "public-document", pathname);
    assert.equal(headers["Cache-Control"], PUBLIC_DOCUMENT_CACHE_CONTROL);
    assert.equal(headers["CDN-Cache-Control"], PUBLIC_SHARED_CACHE_CONTROL);
    assert.equal(headers["Cloudflare-CDN-Cache-Control"], PUBLIC_SHARED_CACHE_CONTROL);
    assert.match(headers["Cache-Control"], /s-maxage=120/);
    assert.match(headers["Cache-Control"], /stale-while-revalidate=300/);
    assert.doesNotMatch(headers["CDN-Cache-Control"], /s-maxage/);
  }
});

test("editor, preview, API and flight requests are never stored", () => {
  const cases = [
    request({ pathname: "/editor" }),
    request({ pathname: "/editor/stories" }),
    request({ pathname: "/editor/preview/guide/hamble-point-marina" }),
    request({ pathname: "/api/editor" }),
    request({ pathname: "/api/search", search: ["q"] }),
    request({ pathname: "/api/consent", method: "POST" }),
    request({ pathname: "/api/social/track", method: "POST" }),
    request({ pathname: "/", method: "POST" }),
    request({ pathname: "/", headers: { RSC: "1" } }),
    request({ pathname: "/guides/solent/hamble-point-marina.rsc" }),
    request({ pathname: "/guides/solent/hamble-point-marina", headers: { accept: "*/*" } }),
    request({ pathname: "/", headers: { accept: "" } }),
    request({ pathname: "/", headers: { "sec-fetch-dest": "empty" } }),
    request({ pathname: "/", headers: { Accept: "text/x-component" } }),
    request({ pathname: "/", headers: { "X-Vinext-Rsc-Render-Mode": "prefetch" } }),
    request({ pathname: "/", headers: { "Next-Router-Prefetch": "1" } }),
    request({ pathname: "/", headers: { "Next-Router-Segment-Prefetch": "1" } }),
    request({ pathname: "/guides", search: ["preview"] }),
    request({ pathname: "/", headers: { authorization: "Basic abc" } }),
    request({ pathname: "/", headers: { "oai-authenticated-user-email": "captainoldseadog@gmail.com" } }),
  ];
  for (const item of cases) {
    const headers = cacheHeadersForPolicyRequest(item);
    assert.equal(headers["Cache-Control"], PRIVATE_CACHE_CONTROL, item.pathname);
    assert.equal(headers["CDN-Cache-Control"], "no-store");
    assert.equal(headers["Cloudflare-CDN-Cache-Control"], "no-store");
  }
});

test("consent and editor cookies are never stored, unrelated cookies still allow a public document", () => {
  for (const cookie of [
    "oldseadogs_cookie_consent_v2=abc",
    "oldseadogs_cookie_consent=abc",
    "oldseadogs_editor_staging=abc",
    "theme=dark; oldseadogs_cookie_consent_v2=abc",
  ]) {
    const headers = cacheHeadersForPolicyRequest(request({
      pathname: "/guides/solent/hamble-point-marina",
      headers: { cookie },
    }));
    assert.equal(headers["Cache-Control"], PRIVATE_CACHE_CONTROL, cookie);
  }

  const headers = cacheHeadersForPolicyRequest(request({
    pathname: "/",
    headers: { cookie: "__cf_bm=edge; _ga=1" },
  }));
  assert.equal(headers["Cache-Control"], PUBLIC_DOCUMENT_CACHE_CONTROL);
});

test("image and media responses keep their own cache headers", () => {
  for (const pathname of [
    "/api/media/example",
    "/img/1200/images/guides/guides-marina-hamble-point-hero-v1.png",
    "/images/guides/guides-marina-hamble-point-hero-v1.png",
    "/legacy-photos/example.webp",
    "/_next/static/chunk.js",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/manifest.webmanifest",
    "/ads.txt",
  ]) {
    assert.equal(publicCacheDisposition(request({ pathname })), "omit", pathname);
    assert.equal(cacheHeadersForPolicyRequest(request({ pathname })), null);
  }
});
