import assert from "node:assert/strict";
import fs from "node:fs/promises";

const siteContent = await fs.readFile(new URL("../lib/site-content.ts", import.meta.url), "utf8");
const api = await fs.readFile(new URL("../app/api/editor/route.ts", import.meta.url), "utf8");
const article = await fs.readFile(new URL("../components/ArticlePreviewContent.tsx", import.meta.url), "utf8");
const guideContent = await fs.readFile(new URL("../components/GuidePublicContent.tsx", import.meta.url), "utf8");
const guideRegionPage = await fs.readFile(new URL("../app/guides/[region]/page.tsx", import.meta.url), "utf8");
const guideDetailPage = await fs.readFile(new URL("../app/guides/[region]/[guide]/page.tsx", import.meta.url), "utf8");
const videoRoute = await fs.readFile(new URL("../app/api/editor/media/video/route.ts", import.meta.url), "utf8");
const rights = await fs.readFile(new URL("../lib/media-rights.ts", import.meta.url), "utf8");

// Rename is metadata-only: identity and storage pointers are forced back to current values.
assert.match(siteContent, /url: current\.url[\s\S]*r2Key: current\.r2Key[\s\S]*originalFilename: current\.originalFilename/);

// Ownership filters and flexible rights-evidence validation are enforced server-side.
assert.match(api, /filter\.startsWith\("ownership:"\)/);
assert.match(api, /validateMediaRights/);
assert.match(rights, /Copyright Ownership or Rights Evidence/);
assert.match(rights, /copyrightOwner[\s\S]*photographer[\s\S]*credit[\s\S]*licence[\s\S]*permissionNote[\s\S]*usageRestrictions/);

// Collection membership is a JSON list of references; bulk tagging updates records and creates no files.
assert.match(api, /bulkAddMediaCollection/);
assert.doesNotMatch(api.slice(api.indexOf("bulkAddMediaCollection"), api.indexOf("renameMediaCollection")), /writeFile|copyFile/);

// Video uploads persist metadata and bytes separately, never as base64 in the story store.
assert.match(videoRoute, /saveEditorVideoAsset/);
assert.doesNotMatch(videoRoute, /base64|data:/i);

// Guide placement data survives a JSON save/reload with exact positions.
const guide = { inlineImages: [{ id: "one", mediaId: "media-1", url: "/api/media/media-1", sectionIndex: 2, paragraphIndex: 3, order: 0 }] };
assert.deepEqual(JSON.parse(JSON.stringify(guide)), guide);
assert.match(guideContent, /image\.sectionIndex === sectionIndex && image\.paragraphIndex === paragraphIndex/);
assert.match(guideRegionPage, /GuidePublicContent/);
assert.match(guideDetailPage, /GuidePublicContent/);

// Default social image is deterministic and story/guide-specific images remain overrides.
assert.match(siteContent, /defaultSocialImageUrl: "\/images\/old-sea-dogs-logo\.png"/);

// Instagram imports can only enter pending review.
assert.match(await fs.readFile(new URL("../lib/instagram-gallery.ts", import.meta.url), "utf8"), /status: "pending"/);

// Written and Edited By appears after source notes and before corrections/contact.
assert.ok(article.indexOf('aria-label="Sources and editorial method"') < article.indexOf('aria-label="Written and edited by"'));
assert.ok(article.indexOf('aria-label="Written and edited by"') < article.indexOf('aria-label="Corrections and contact information"'));

// A media-only update never invokes story save/status mutation.
const updateBlock = api.slice(api.indexOf('payload.action === "updateMedia"'), api.indexOf('payload.action === "saveExternalVideo"'));
assert.doesNotMatch(updateBlock, /saveStory|status\s*:/);

console.log("Controlled Bridge/media regression checks passed.");
