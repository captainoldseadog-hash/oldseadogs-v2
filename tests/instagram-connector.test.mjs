import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
  hashOAuthState,
  mediaChildren,
  normalizeMediaForImport,
  redactSecret,
  shouldRefreshToken,
  tokenExpiryStatus,
  validOAuthState,
} from "../lib/instagram-connector-core.js";

test("OAuth state validation rejects missing and altered values", () => {
  const state = "secure-random-state";
  assert.equal(validOAuthState(hashOAuthState(state), state), true);
  assert.equal(validOAuthState(hashOAuthState(state), `${state}-altered`), false);
  assert.equal(validOAuthState("", state), false);
});

test("token redaction reveals only the final four characters", () => {
  assert.equal(redactSecret("EAAB-secret-1234"), "••••1234");
  assert.equal(redactSecret(""), "");
});

test("expiry warnings and refresh eligibility are deterministic", () => {
  const now = Date.parse("2026-07-14T12:00:00Z");
  assert.equal(tokenExpiryStatus("2026-07-13T12:00:00Z", now).state, "expired");
  assert.equal(tokenExpiryStatus("2026-07-20T12:00:00Z", now).state, "warning-7");
  assert.equal(tokenExpiryStatus("2026-07-27T12:00:00Z", now).state, "warning-14");
  assert.equal(shouldRefreshToken("2026-07-27T12:00:00Z", "2026-07-12T12:00:00Z", now), true);
  assert.equal(shouldRefreshToken("2026-07-13T12:00:00Z", "", now), false);
});

test("carousel children are retained with their media fields", () => {
  const media = normalizeMediaForImport({ id: "parent", media_type: "CAROUSEL_ALBUM", children: { data: [{ id: "one", media_type: "IMAGE", media_url: "https://example.test/one.jpg" }, { id: "two", media_type: "VIDEO", media_url: "https://example.test/two.mp4", thumbnail_url: "https://example.test/two.jpg" }] } });
  assert.equal(mediaChildren({ media_type: "CAROUSEL_ALBUM", children: { data: [{ id: "one" }] } }).length, 1);
  assert.deepEqual(media.children.map((item) => item.id), ["one", "two"]);
  assert.equal(media.children[1].thumbnailUrl, "https://example.test/two.jpg");
});

test("connector keeps tokens server-only, deduplicates IDs and forces pending review", async () => {
  const [credentials, gallery, bridge] = await Promise.all([
    fs.readFile(new URL("../lib/instagram-credentials.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../lib/instagram-gallery.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/editor/BridgeCms.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(credentials, /instagram-credentials\.json/);
  assert.match(credentials, /0o600/);
  assert.doesNotMatch(bridge, /accessToken\s*[:=]/);
  assert.match(gallery, /known\.has\(item\.id\)/);
  assert.match(gallery, /status: "pending"/);
  assert.match(gallery, /carouselChildren: item\.children/);
  assert.match(gallery, /shouldRefreshToken/);
  assert.match(gallery, /Existing imports were preserved/);
});

test("public rollout remains disabled", async () => {
  const route = await fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8");
  assert.match(route, /publicRollout: false/);
});

test("safe deploy loads the private environment before PM2 reload", async () => {
  const deploy = await fs.readFile(new URL("../scripts/oldseadogs-ops.mjs", import.meta.url), "utf8");
  const sourceEnvironment = deploy.indexOf("&& . ${shellQuote(defaultEnvironmentFile)}");
  const reloadPm2 = deploy.indexOf("pm2 reload ${shellQuote(pm2Name)} --update-env");
  assert.match(deploy, /defaultEnvironmentFile = "\/etc\/oldseadogs\/oldseadogs\.env"/);
  assert.match(deploy, /test -r \$\{shellQuote\(defaultEnvironmentFile\)\}/);
  assert.ok(sourceEnvironment >= 0 && reloadPm2 > sourceEnvironment);
});

test("Instagram environment diagnostics never print secret values", async () => {
  const diagnostics = await fs.readFile(new URL("../scripts/check-instagram-env.mjs", import.meta.url), "utf8");
  assert.match(diagnostics, /INSTAGRAM_APP_SECRET configured/);
  assert.match(diagnostics, /INSTAGRAM_SYNC_SECRET configured/);
  assert.doesNotMatch(diagnostics, /process\.env\.INSTAGRAM_APP_SECRET\s*\}/);
  assert.doesNotMatch(diagnostics, /process\.env\.INSTAGRAM_SYNC_SECRET\s*\}/);
});
