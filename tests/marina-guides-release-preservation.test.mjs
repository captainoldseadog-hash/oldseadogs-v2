import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const hash = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

const protectedFiles = {
  // Option C, the prefetched lead, and the canonical desktop Marina Guide navigation.
  "app/page.tsx": "b13fd12247a3cb0414b9b0d4f0f8b2eea919df6dc990d8442f1fc4a9da44c67c",
  "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
  "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
  "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  "app/editor/EditorDashboard.tsx": "1b27dbaf3ca5b50efc95bf14fd7cedf74ae1b841acfdb820d96064d8c9dcc08c",
  // Helm health: retain the approved route plus creation sorting and protected Draft cleanup.
  "app/api/editor/route.ts": "0d8b53c3a9d979f569866b31e566692bc546d3fb6469deb944fbd0b6b5dd6f59",
  "scripts/story-scheduler-hook.mjs": "6403da7b36da7f4943ae6895af3c8fb3f65c74c3ea9f4cf357cbfed052dd31cf",
  // Discover audit plus the canonical desktop Marina Guide navigation.
  "app/stories/[slug]/page.tsx": "fe5aadc1390a6864698cc1703f7dadc48b8bc7e847dd5093e7010a5772534cc7",
  // Guide audit cleanup: only named geographic regions receive collection sitemap entries.
  "app/sitemap.ts": "b27526b586863be7ae4b82ef26b0c2465bc7f14958f662ed4bd6673d8dd28418",
  "app/api/search/route.ts": "ec4b5361aba63a21b250b0963aaeb04fdea5fba84ffac7046a3335628522ff75",
  "ecosystem.config.cjs": "fe3383626bfe201588151db888b621e50f0bb8825226d317b7611c5c9e1ccfbc",
  // Mobile persistence follow-up: retain legacy recovery and add the server-issued durable cookie path.
  "components/CookieConsent.tsx": "cac08a3a3b15f64064a576eddcafb338b99b3a4f250a9b153b53e39c2bb75748",
  "package.json": "807aec43bfaf6df71bb8217b527b547aeafa31dc369244e7e7f5d8c5bb30a8ef",
};

test("homepage, story, editor, scheduler, search and consent logic match production", async () => {
  for (const [relative, expected] of Object.entries(protectedFiles)) {
    const contents = await fs.readFile(path.join(projectDir, relative));
    assert.equal(hash(contents), expected, relative);
  }
});

test("site-content preserves the approved Guide seeds and editor-store derived-data reuse", async () => {
  const source = await fs.readFile(path.join(projectDir, "lib/site-content.ts"), "utf8");
  assert.equal((source.match(/solentMarinaGuideSeeds/g) || []).length, 2);
  const reconstructedBaseline = source
    .replace('import { solentMarinaGuideSeeds } from "../content/solent-marina-guides.ts";\n', "")
    .replace("[...guideProductSeeds, ...solentMarinaGuideSeeds, ...flagshipGuides]", "[...guideProductSeeds, ...flagshipGuides]");
  // Phase 1 retains static Guide merging while keeping stored rows raw until an explicit Guide operation.
  // Poole keeps an intentionally empty pending hero and an empty optional parent relationship.
  assert.equal(hash(reconstructedBaseline), "47d7408a0b581ef70c4448683849680a9f0f267f7af3e76932019fc8fa2d6fcc");
});

test("the release tree contains no production data or uploads and retains the external data path", async () => {
  for (const relative of ["editor-store.json", ".oldseadogs-data", "oldseadogs-data", "public/uploads"]) {
    await assert.rejects(fs.access(path.join(projectDir, relative)), relative);
  }
  const ecosystem = await fs.readFile(path.join(projectDir, "ecosystem.config.cjs"), "utf8");
  assert.match(ecosystem, /OLDSEADOGS_DATA_DIR:[^\n]+\/var\/www\/oldseadogs-data/);
  assert.doesNotMatch(ecosystem, /staging-data|editor-store\.json/);
});

test("approved cookie persistence and primary presentation are preserved", async () => {
  const [component, css] = await Promise.all([
    fs.readFile(path.join(projectDir, "components/CookieConsent.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/globals.css"), "utf8"),
  ]);
  assert.equal(hash(component), protectedFiles["components/CookieConsent.tsx"]);
  assert.match(css, /\.cookie-actions \.cookie-action-primary \{\s*border-color: #b84b2c;\s*background: #b84b2c;\s*color: #ffffff;\s*\}/);
});
