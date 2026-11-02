import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { POST } from "../app/api/consent/route.ts";
import {
  consentCookieName,
  consentMaxAgeSeconds,
  consentStorageKey,
  parseConsentChoice,
} from "../lib/cookie-consent.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

async function save(choice, host = "oldseadogs.com", protocol = "https", forwardedProtocol = protocol) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-host": host,
  });
  if (forwardedProtocol) headers.set("x-forwarded-proto", forwardedProtocol);
  return POST(new Request(`${protocol}://${host}/api/consent`, {
    method: "POST",
    headers,
    body: JSON.stringify(choice),
  }));
}

async function withOldSeaDogsEnvironment(value, task) {
  const previous = process.env.OLDSEADOGS_ENV;
  if (value === undefined) delete process.env.OLDSEADOGS_ENV;
  else process.env.OLDSEADOGS_ENV = value;
  try {
    return await task();
  } finally {
    if (previous === undefined) delete process.env.OLDSEADOGS_ENV;
    else process.env.OLDSEADOGS_ENV = previous;
  }
}

function cookieChoice(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  const encoded = setCookie.match(new RegExp(`^${consentCookieName}=([^;]+)`))?.[1];
  return { setCookie, choice: parseConsentChoice(encoded ? decodeURIComponent(encoded) : null) };
}

test("Accept is issued as a durable first-party server cookie", async () => {
  const response = await save({ analytics: true, ads: true });
  assert.equal(response.status, 200);
  const { setCookie, choice } = cookieChoice(response);
  assert.deepEqual({ analytics: choice?.analytics, ads: choice?.ads, version: choice?.version }, { analytics: true, ads: true, version: 1 });
  assert.match(setCookie, new RegExp(`Max-Age=${consentMaxAgeSeconds}`));
  assert.match(setCookie, /Domain=\.oldseadogs\.com/);
  assert.match(setCookie, /Path=\//);
  assert.match(setCookie, /SameSite=Lax/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /HttpOnly/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Reject and later preference withdrawal use the same durable cookie contract", async () => {
  const rejected = cookieChoice(await save({ analytics: false, ads: false })).choice;
  assert.deepEqual({ analytics: rejected?.analytics, ads: rejected?.ads }, { analytics: false, ads: false });
  const withdrawn = cookieChoice(await save({ analytics: false, ads: true })).choice;
  assert.deepEqual({ analytics: withdrawn?.analytics, ads: withdrawn?.ads }, { analytics: false, ads: true });
});

test("www and bare-domain responses share one consent scope", async () => {
  for (const host of ["oldseadogs.com", "www.oldseadogs.com"]) {
    assert.match(cookieChoice(await save({ analytics: true, ads: false }, host)).setCookie, /Domain=\.oldseadogs\.com/);
  }
});

test("production forces Secure when the origin request appears to be HTTP", async () => {
  const response = await withOldSeaDogsEnvironment(
    "production",
    () => save({ analytics: true, ads: true }, "oldseadogs.com", "http", null),
  );
  assert.match(cookieChoice(response).setCookie, /(?:^|; )Secure(?:;|$)/);
});

test("production HTTPS retains Secure while local development HTTP remains usable", async () => {
  const productionResponse = await withOldSeaDogsEnvironment(
    "production",
    () => save({ analytics: false, ads: false }),
  );
  assert.match(cookieChoice(productionResponse).setCookie, /(?:^|; )Secure(?:;|$)/);

  const localResponse = await withOldSeaDogsEnvironment(
    "development",
    () => save({ analytics: true, ads: false }, "127.0.0.1:3003", "http", null),
  );
  assert.doesNotMatch(cookieChoice(localResponse).setCookie, /(?:^|; )Secure(?:;|$)/);
});

test("invalid or partial consent cannot create a cookie", async () => {
  const response = await save({ analytics: true });
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("client waits for storage resolution and does not renew a valid cookie on every visit", async () => {
  const source = await fs.readFile(path.join(projectDir, "components/CookieConsent.tsx"), "utf8");
  assert.match(source, /if \(!isReady\) \{\s*return null;/);
  assert.match(source, /const cookieChoice = readCookieChoice\(\)/);
  assert.match(source, /const choice = serverChoice \|\| localChoice \|\| cookieChoice/);
  assert.match(source, /if \(choice && \(migrateServerChoice \|\| \(!serverChoice && !readCookieChoice\(\)\)\)\)/);
  assert.doesNotMatch(source, /if \(choice\) \{\s*persistChoiceLocally\(choice\)/);
  assert.match(source, new RegExp(`localStorage\\.setItem\\(storageKey`));
  assert.equal(consentStorageKey, "oldseadogs_cookie_consent_v1");
});

test("legacy and current schema choices remain readable after a new browser session", () => {
  const decidedAt = new Date(Date.now() - 86_400_000).toISOString();
  for (const persisted of [
    { analytics: true, ads: true, decidedAt, version: 1 },
    { analytics: false, ads: false, decidedAt },
    { analytics: true, ads: false, decidedAt, version: 2, expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
  ]) {
    assert.ok(parseConsentChoice(JSON.stringify(persisted)));
  }
});
