import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const configuredPort = 3417;
const configuredBaseUrl = `http://127.0.0.1:${configuredPort}`;
const appSecret = "integration-app-secret-value";
const syncSecret = "integration-sync-secret-value";
let configuredServer;
let nativeFetch;
const workerServers = new Map();

async function startServer(port, overrides = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-instagram-routes-"));
  await fs.writeFile(path.join(dataDir, "editor-store.json"), JSON.stringify({
    version: 1,
    stories: [],
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
    updatedAt: "2026-07-24T00:00:00.000Z",
  }));
  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    NODE_ENV: "production",
    OLDSEADOGS_ENV: "production",
    OLDSEADOGS_RUNTIME: "node",
    INSTAGRAM_CONNECTOR_MODE: "instagram-login",
    INSTAGRAM_APP_ID: "integration-app-id",
    INSTAGRAM_APP_SECRET: appSecret,
    INSTAGRAM_REDIRECT_URI: `http://127.0.0.1:${port}/api/editor/instagram/callback`,
    INSTAGRAM_SYNC_SECRET: syncSecret,
    INSTAGRAM_GRAPH_VERSION: "v23.0",
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }

  const controller = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env,
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = {
    child: controller.child,
    controller,
    dataDir,
    output: controller.output,
  };
  workerServers.set(baseUrl, server);
  return server;
}

async function waitForServer(server, baseUrl) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) throw new Error(`Vinext server exited early.\n${server.output()}`);
    try {
      await fetch(`${baseUrl}/api/editor/instagram/callback`, { redirect: "manual" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Vinext server did not start.\n${server.output()}`);
}

async function stopServer(server) {
  if (!server) return;
  for (const [baseUrl, candidate] of workerServers) {
    if (candidate === server) workerServers.delete(baseUrl);
  }
  await server.controller.stop();
  await fs.rm(server.dataDir, { recursive: true, force: true });
}

function cookiePair(setCookie) {
  return setCookie.split(";", 1)[0];
}

async function assertNoSecrets(response) {
  const body = await response.clone().text();
  const headers = JSON.stringify([...response.headers.entries()]);
  for (const secret of [appSecret, syncSecret]) {
    assert.equal(body.includes(secret), false);
    assert.equal(headers.includes(secret), false);
  }
}

async function connect(baseUrl = configuredBaseUrl) {
  return fetch(`${baseUrl}/api/editor/instagram/connect`, { redirect: "manual" });
}

before(async () => {
  nativeFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const server = workerServers.get(url.origin);
    return server ? server.controller.fetch(input, init) : nativeFetch(input, init);
  };
  configuredServer = await startServer(configuredPort);
  await waitForServer(configuredServer, configuredBaseUrl);
});

after(async () => {
  await stopServer(configuredServer);
  globalThis.fetch = nativeFetch;
});

test("connect route returns a mutable redirect and sets a short-lived secure state cookie", async () => {
  const response = await connect();
  assert.equal(response.status, 302);
  assert.match(response.headers.get("location") || "", /^https:\/\/www\.instagram\.com\/oauth\/authorize/);
  const setCookie = response.headers.get("set-cookie") || "";
  assert.match(setCookie, /^oldseadogs_instagram_state=[a-f0-9]{64}\.instagram-login;/);
  assert.match(setCookie, /Path=\/api\/editor\/instagram\/callback/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /Max-Age=600/);
  await assertNoSecrets(response);
});

test("callback with missing state redirects safely and clears the state cookie", async () => {
  const response = await fetch(`${configuredBaseUrl}/api/editor/instagram/callback`, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.notEqual(response.status, 500);
  assert.match(response.headers.get("location") || "", /instagram_error=/);
  const setCookie = response.headers.get("set-cookie") || "";
  assert.match(setCookie, /^oldseadogs_instagram_state=;/);
  assert.match(setCookie, /Path=\/api\/editor\/instagram\/callback/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /Max-Age=0/);
  await assertNoSecrets(response);
});

test("callback with mismatched state redirects safely", async () => {
  const connectResponse = await connect();
  const cookie = cookiePair(connectResponse.headers.get("set-cookie") || "");
  const response = await fetch(`${configuredBaseUrl}/api/editor/instagram/callback?state=wrong-state`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  assert.notEqual(response.status, 500);
  assert.match(new URL(response.headers.get("location")).searchParams.get("instagram_error") || "", /security state did not match/);
  await assertNoSecrets(response);
});

test("callback with error_description redirects safely, redacts secrets and clears state", async () => {
  const description = `diagnostic_cancelled client_secret=${appSecret}`;
  const response = await fetch(`${configuredBaseUrl}/api/editor/instagram/callback?error_description=${encodeURIComponent(description)}`, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.notEqual(response.status, 500);
  assert.match(response.headers.get("location") || "", /diagnostic_cancelled/);
  assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/);
  await assertNoSecrets(response);
});

test("callback with matching state but missing code redirects safely", async () => {
  const connectResponse = await connect();
  const authorization = new URL(connectResponse.headers.get("location"));
  const cookie = cookiePair(connectResponse.headers.get("set-cookie") || "");
  const response = await fetch(`${configuredBaseUrl}/api/editor/instagram/callback?state=${encodeURIComponent(authorization.searchParams.get("state") || "")}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  assert.equal(response.status, 302);
  assert.notEqual(response.status, 500);
  assert.match(new URL(response.headers.get("location")).searchParams.get("instagram_error") || "", /usable authorization code/);
  assert.match(response.headers.get("set-cookie") || "", /Max-Age=0/);
  await assertNoSecrets(response);
});

test("connect route reports missing configuration without returning 500", async () => {
  const port = 3418;
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = await startServer(port, {
    INSTAGRAM_APP_ID: undefined,
    INSTAGRAM_APP_SECRET: undefined,
    INSTAGRAM_REDIRECT_URI: undefined,
  });
  try {
    await waitForServer(server, baseUrl);
    const response = await connect(baseUrl);
    assert.equal(response.status, 302);
    assert.notEqual(response.status, 500);
    assert.match(new URL(response.headers.get("location")).searchParams.get("instagram_error") || "", /Add INSTAGRAM_APP_ID/);
    await assertNoSecrets(response);
  } finally {
    await stopServer(server);
  }
});
