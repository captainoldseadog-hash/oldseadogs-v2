import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { developmentHomepageFixturePolicy } from "../lib/homepage-fixture-policy.js";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

async function read(relative) {
  return fs.readFile(path.join(projectDir, relative), "utf8");
}

async function packagedFiles(current = projectDir) {
  const output = [];
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    if (["node_modules", ".git", ".next", ".wrangler"].includes(entry.name)) continue;
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) output.push(...await packagedFiles(full));
    else if (entry.isFile()) output.push(path.relative(projectDir, full).split(path.sep).join("/"));
  }
  return output;
}

test("normal production build and start cannot enable the development homepage fixture", async () => {
  const [packageJson, ecosystem, policySource] = await Promise.all([
    read("package.json").then(JSON.parse),
    read("ecosystem.config.cjs"),
    read("lib/homepage-fixture-policy.js"),
  ]);

  assert.doesNotMatch(packageJson.scripts.build, /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.doesNotMatch(packageJson.scripts["build:do"], /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.doesNotMatch(packageJson.scripts.start, /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.doesNotMatch(packageJson.scripts["start:do"], /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.doesNotMatch(ecosystem, /OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE/);
  assert.match(policySource, /explicitlyEnabled === "true"/);

  assert.equal(developmentHomepageFixturePolicy({
    nodeEnv: "production",
    oldSeaDogsEnv: "production",
    explicitlyEnabled: "true",
    authoritativeStoryCount: 0,
  }).active, false);
  assert.equal(developmentHomepageFixturePolicy({
    nodeEnv: "development",
    oldSeaDogsEnv: "development",
    explicitlyEnabled: undefined,
    authoritativeStoryCount: 0,
  }).active, false);
  assert.equal(developmentHomepageFixturePolicy({
    nodeEnv: "development",
    oldSeaDogsEnv: "development",
    explicitlyEnabled: "true",
    authoritativeStoryCount: 1,
  }).active, false);
});

test("runtime production data remains external and no bundled editor store is available", async () => {
  const [releaseCommon, ecosystem, siteContent] = await Promise.all([
    read("deploy/release-common.sh"),
    read("ecosystem.config.cjs"),
    read("lib/site-content.ts"),
  ]);
  assert.match(releaseCommon, /DATA_DIR=.*\/var\/www\/oldseadogs-data/);
  assert.match(releaseCommon, /export OLDSEADOGS_DATA_DIR="\$DATA_DIR"/);
  assert.match(ecosystem, /OLDSEADOGS_DATA_DIR:[^\n]+\/var\/www\/oldseadogs-data/);
  assert.match(siteContent, /OLDSEADOGS_DATA_DIR/);
  assert.match(siteContent, /path\.join\(dataDir, "editor-store\.json"\)/);

  const files = await packagedFiles();
  assert.deepEqual(files.filter((file) => /(^|\/)editor-store\.json$/i.test(file)), []);
  assert.deepEqual(files.filter((file) => /(^|\/)\.oldseadogs-data(?:\/|$)/i.test(file)), []);
  assert.deepEqual(files.filter((file) => /(^|\/)(?:database|editor-store|homepage|stories?)[^/]*(?:dump|export|backup)[^/]*\.(?:json|sql|sqlite|db)$/i.test(file)), []);
  assert.deepEqual(files.filter((file) => /^(?:uploads|media|public\/uploads|dist\/client\/uploads)(?:\/|$)/i.test(file)), []);
});

test("cookie consent code has no homepage or editor-record mutation path", async () => {
  const cookie = await read("components/CookieConsent.tsx");
  assert.doesNotMatch(cookie, /site-content|editor-store|saveHomepage|homepageSource|homepageLeadStory|homepageLatestStory|homepageEditorsChoice|homepageHiddenStory/i);
  assert.doesNotMatch(cookie, /\/api\/editor|fetch\s*\(|XMLHttpRequest|WebSocket/);
});

test("Homepage Manager remains the sole homepage commit path", async () => {
  const [bridge, route, siteContent, homepage] = await Promise.all([
    read("app/editor/BridgeCms.tsx"),
    read("app/api/editor/route.ts"),
    read("lib/site-content.ts"),
    read("app/page.tsx"),
  ]);
  assert.match(bridge, /homepageSource: "homepage-manager-save"/);
  assert.match(bridge, /Nothing changes publicly until you press Save Homepage/);
  assert.match(route, /payload\.homepageSource !== "homepage-manager-save"/);
  assert.match(siteContent, /Homepage settings can only be changed in Homepage Manager by pressing Save Homepage/);
  assert.match(homepage, /new HomepageContentProvider\(stories, settings\)\.getContent\(\)/);
});
