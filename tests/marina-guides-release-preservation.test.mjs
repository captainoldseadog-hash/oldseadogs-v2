import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const hash = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

const protectedFiles = {
  // c9e5068: approved responsive/lazy story images and one canonical link per story card.
  "app/page.tsx": "4f65e1c5f48d91b05bbc8914b94e9a4eb5c12ce2385ba4c082ba5d522e0b5342",
  "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
  "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
  "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  "app/editor/EditorDashboard.tsx": "1b27dbaf3ca5b50efc95bf14fd7cedf74ae1b841acfdb820d96064d8c9dcc08c",
  "app/api/editor/route.ts": "7e23efa26c359894b45a2cee5167110b32a4592e7e0c85e20eeb74f3ee174b9c",
  "scripts/story-scheduler-hook.mjs": "6403da7b36da7f4943ae6895af3c8fb3f65c74c3ea9f4cf357cbfed052dd31cf",
  // c9e5068: approved responsive/lazy related-story images and one canonical link per card.
  "app/stories/[slug]/page.tsx": "915ea6f48a019eefece8cab35aab86ed9c9a0ba2fd566e6d5571af5644fa0aa0",
  "app/sitemap.ts": "2defc59937202d0aabc6b441ee790fd8bf8c613146b53e70431112e74a5cd3b8",
  "app/api/search/route.ts": "ec4b5361aba63a21b250b0963aaeb04fdea5fba84ffac7046a3335628522ff75",
  "ecosystem.config.cjs": "fe3383626bfe201588151db888b621e50f0bb8825226d317b7611c5c9e1ccfbc",
  // c9e5068: approved versioned local storage with secure first-party cookie fallback.
  "components/CookieConsent.tsx": "1d47afe6695c04493b4cb37355ab6402e188143cd56a7e4fd6ce01af3a905872",
  "package.json": "20996dd1befedd6511126c8f53469bf55a649eba8467096a44d4c86f2abce686",
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
  // c9e5068: approved reuse of normalized static stories and cached local published stories.
  assert.equal(hash(reconstructedBaseline), "eadf6a2b774f78a1d4dd81d9434154505535f2f2408c91b818960dd0eef1ab06");
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
