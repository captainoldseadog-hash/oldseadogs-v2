import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { fetchSourceText, SourceFetchError } from "../lib/safe-source-fetch.ts";

test("source fetch accepts ordinary HTML with Open Graph/image metadata intact", async () => {
  const html = '<html><head><meta property="og:title" content="Safe test"><meta property="og:image" content="https://example.test/photo.jpg"></head><body><p>Article text</p></body></html>';
  const result = await fetchSourceText("https://example.test/article", {
    accept: "text/html",
    fetchImpl: async () => new Response(html, { status: 200, headers: { "content-type": "text/html" } }),
  });
  assert.equal(result.text, html);
  assert.match(result.text, /og:image/);
});

test("invalid and unsupported URLs return useful errors", async () => {
  await assert.rejects(() => fetchSourceText("not a url", { accept: "text/html" }), (error) => error instanceof SourceFetchError && error.code === "invalid-url");
  await assert.rejects(() => fetchSourceText("file:///tmp/story", { accept: "text/html" }), /Only HTTP and HTTPS/);
});

test("blocked responses and unsupported content are reported", async () => {
  await assert.rejects(() => fetchSourceText("https://example.test/blocked", {
    accept: "text/html",
    fetchImpl: async () => new Response("blocked", { status: 403 }),
  }), (error) => error instanceof SourceFetchError && error.code === "http" && /403/.test(error.message));
  await assert.rejects(() => fetchSourceText("https://example.test/file", {
    accept: "text/html",
    fetchImpl: async () => new Response("binary", { status: 200, headers: { "content-type": "application/pdf" } }),
  }), (error) => error instanceof SourceFetchError && error.code === "content-type");
});

test("unreachable requests and oversized responses fail clearly", async () => {
  await assert.rejects(() => fetchSourceText("https://example.test/down", {
    accept: "text/html",
    fetchImpl: async () => { throw new TypeError("connect ECONNREFUSED"); },
  }), (error) => error instanceof SourceFetchError && error.code === "network" && /ECONNREFUSED/.test(error.message));
  await assert.rejects(() => fetchSourceText("https://example.test/huge", {
    accept: "text/html",
    maxBytes: 4,
    fetchImpl: async () => new Response("too large", { status: 200, headers: { "content-type": "text/html" } }),
  }), (error) => error instanceof SourceFetchError && error.code === "too-large");
});

test("timeouts are classified instead of hanging silently", async () => {
  await assert.rejects(() => fetchSourceText("https://example.test/slow", {
    accept: "text/html",
    timeoutMs: 5,
    fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(init.signal.reason));
    }),
  }), (error) => error instanceof SourceFetchError && error.code === "timeout");
});

test("the Helm uses preview-first scraping and an explicit private-Draft action", async () => {
  const [ui, route, runner] = await Promise.all([
    fs.readFile(new URL("../app/editor/BridgeCms.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../lib/source-watch-runner.ts", import.meta.url), "utf8"),
  ]);
  assert.match(ui, /Fetch preview/);
  assert.match(ui, /Create private Draft/);
  assert.match(route, /action === "scrapeStoryUrl"/);
  assert.match(runner, /saveStory\(\{ \.\.\.generated\.story, status: "draft", editorialStatus: "Needs Review" \}\)/);
  assert.doesNotMatch(runner.slice(runner.indexOf("export async function scrapeStoryUrl")), /status: "published"/);
});
