import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const hash = (contents) => crypto.createHash("sha256").update(contents).digest("hex");

const protectedFiles = {
  // Desktop homepage sections, the prefetched lead, the Substack signup,
  // responsive image derivatives, the Boats for Sale teaser, and the two-row site header.
  // The app-style mobile homepage is an extra block, hidden from 1024px up.
  "app/page.tsx": "d121b702b9b1fcd61be8bc0710b9f44ce0e496c6495fea482b502f9a3b40f4dc",
  "lib/homepage-content-provider.ts": "35ec2f84464b12337b80611532a507673e9061221d4508f26fa111d2f71546f7",
  "lib/editor-publication.js": "c5c4377dc76886a536edfa05a9135985d1eb455b22d395d40d9e9f11f64d8c56",
  "lib/editor-publication.d.ts": "98ca74fe051dbb9bcb5b6505c39518b58f5ca02475f184bdd92bf521343c6c6b",
  "app/editor/EditorDashboard.tsx": "a902cbd0127b18924de95d04d39192447fa37fa449f39f3f70fd5011887d6237",
  // Helm health: retain the approved route plus creation sorting and protected Draft cleanup.
  // Through the Lens rollout reads galleryPublicRollout instead of a hardcoded false.
  "app/api/editor/route.ts": "0d9bbf88e1ea9c01f6e9cdfead0fefd8e975912246f205ad849a8c3658748f34",
  // Story publication plus the Boats for Sale lifecycle tick.
  "scripts/story-scheduler-hook.mjs": "ebf8268ec50718e77408237950df4baa98066ec570fd342e93e78ce8d6db746d",
  // Discover audit, Boats for Sale, the shared two-row site header,
  // story share images pointed at the 1,200px derivative, the
  // Cowes Yacht Haven / Berthon Lymington guide notices, and the
  // data-driven Related guides block.
  "app/stories/[slug]/page.tsx": "54448e849b30709170ecf9b9651793300a376843f9c4e473c31a6e3c9d4c215b",
  // Guide audit cleanup: only named geographic regions receive collection sitemap entries.
  // Boats for Sale browse, list-your-boat, and live listing URLs are included.
  // Superseded port stories whose canonical URL is a Guide are omitted.
  // /through-the-lens is listed only while galleryPublicRollout is true.
  // Retired Solent Marina Guide overview URLs redirect to /guides/solent and are omitted.
  // Thin-story triage slugs and redirected duplicates are omitted.
  "app/sitemap.ts": "36a6c90278370d0f4a773f1cb621be381ecf2f6b114a12a397bf44ab59538f69",
  "app/api/search/route.ts": "ec4b5361aba63a21b250b0963aaeb04fdea5fba84ffac7046a3335628522ff75",
  "ecosystem.config.cjs": "81ada662f64f60d544641e74e1397c01345a829cb1ca03771c9a15164fcfffad",
  // Mobile persistence follow-up: retain legacy recovery and add the server-issued durable cookie path.
  "components/CookieConsent.tsx": "cac08a3a3b15f64064a576eddcafb338b99b3a4f250a9b153b53e39c2bb75748",
  // heic-convert turns iPhone HEIC photographs into JPEG when the image library cannot decode HEVC.
  "package.json": "6736523cb9ceb37802bb1f415e74b72cdf3c4a2d795e76a543060336ee183684",
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
  // Public alt fallback, the in-memory guide, settings, and advert caches, and galleryPublicRollout are included.
  // A section with only editorial links is kept so area-hub links are not dropped on read.
  // Story search indexing also skips the active thin-story triage wave unless an editor has approved the story.
  assert.equal(hash(reconstructedBaseline), "3798a244019bf4dfda78129ab400c9766f2ffef502f92db669163c43d24a2592");
});

test("node production start trusts nginx X-Forwarded-Proto for redirect Locations", async () => {
  const [packageJson, ecosystem] = await Promise.all([
    fs.readFile(path.join(projectDir, "package.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(projectDir, "ecosystem.config.cjs"), "utf8"),
  ]);
  assert.match(packageJson.scripts["start:do"], /(?:^|\s)VINEXT_TRUST_PROXY=1(?:\s|$)/);
  assert.match(ecosystem, /VINEXT_TRUST_PROXY:\s*"1"/);
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
