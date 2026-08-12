import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const hash = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

const protectedFiles = {
  // c9e5068: approved responsive/lazy story images and one canonical link per story card.
  "app/page.tsx": "45c3ee792bc21b08cdb6d0892b9bd565ab3a9c2910a820356ff0ecbb87bcc169",
  "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
  "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
  "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  "app/editor/EditorDashboard.tsx": "1b27dbaf3ca5b50efc95bf14fd7cedf74ae1b841acfdb820d96064d8c9dcc08c",
  // Phase 3 adds only authenticated Guide Draft import validation/confirmation to the approved editor route.
  "app/api/editor/route.ts": "9ddae5f3be2432c410afc80a1ed3c528e796b0fd8a484a8ba70ab8ee34883cbc",
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
  // Phase 1 retains static Guide merging while keeping stored rows raw until an explicit Guide operation.
  assert.equal(hash(reconstructedBaseline), "7c7aefd720460292f196895bfe6e7287988f06f16db5a0a0a84e1c63fe2c33ae");
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
