import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const hash = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

const protectedFiles = {
  // Option C, the prefetched lead, one homepage H1, the Substack signup,
  // responsive image derivatives, the Boats for Sale teaser, and the two-row site header.
  "app/page.tsx": "5ad532741b671264d2479206bd58db464237ed340f341d61eda736e36a103ff3",
  "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
  "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
  "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  "app/editor/EditorDashboard.tsx": "1b27dbaf3ca5b50efc95bf14fd7cedf74ae1b841acfdb820d96064d8c9dcc08c",
  // Helm health: retain the approved route plus creation sorting and protected Draft cleanup.
  "app/api/editor/route.ts": "0d8b53c3a9d979f569866b31e566692bc546d3fb6469deb944fbd0b6b5dd6f59",
  // Story publication plus the Boats for Sale lifecycle tick.
  "scripts/story-scheduler-hook.mjs": "ebf8268ec50718e77408237950df4baa98066ec570fd342e93e78ce8d6db746d",
  // Discover audit, Boats for Sale, the shared two-row site header,
  // story share images pointed at the 1,200px derivative, and the
  // Cowes Yacht Haven / Berthon Lymington guide notices.
  "app/stories/[slug]/page.tsx": "f0db1356f804c8de070e6ab7edbe4fe0c523b6083b66556e766b5c5b7c3c0c02",
  // Guide audit cleanup: only named geographic regions receive collection sitemap entries.
  // Boats for Sale browse, list-your-boat, and live listing URLs are included.
  // Superseded port stories whose canonical URL is a Guide are omitted.
  "app/sitemap.ts": "cc67dc65c4fac5d17ea84fc0b31993478c319cd6c33e4a90ebe642eae7b5082f",
  "app/api/search/route.ts": "ec4b5361aba63a21b250b0963aaeb04fdea5fba84ffac7046a3335628522ff75",
  "ecosystem.config.cjs": "fe3383626bfe201588151db888b621e50f0bb8825226d317b7611c5c9e1ccfbc",
  // Mobile persistence follow-up: retain legacy recovery and add the server-issued durable cookie path.
  "components/CookieConsent.tsx": "cac08a3a3b15f64064a576eddcafb338b99b3a4f250a9b153b53e39c2bb75748",
  "package.json": "860c0b4b1b8a85d9911806e8dba42e4e8269876a6e11571602d05ea13180fcf6",
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
  // Public alt fallback and the in-memory guide, settings, and advert caches are included.
  assert.equal(hash(reconstructedBaseline), "d19dafd2d304165b75594a66ccb9d0762d110968344b0ad535cea6087d5053ef");
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
