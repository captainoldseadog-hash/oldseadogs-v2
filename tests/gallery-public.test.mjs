import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { isGalleryPublicRolloutEnabled, toPublicGalleryPhoto } from "../lib/gallery-public.js";

const approved = {
  id: "gallery-approved",
  mediaId: "media_approved",
  status: "approved",
  contentType: "image/jpeg",
  title: "Cowes start",
  caption: "The fleet leaving the line",
  alt: "Yachts leaving Cowes",
  credit: "Michael Hodges",
  location: "Cowes",
  sourceUrl: "https://private.example/original",
  rejectionReason: "not used",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

test("gallery rollout is on only for the true site setting", () => {
  assert.equal(isGalleryPublicRolloutEnabled(undefined), false);
  assert.equal(isGalleryPublicRolloutEnabled(""), false);
  assert.equal(isGalleryPublicRolloutEnabled("false"), false);
  assert.equal(isGalleryPublicRolloutEnabled(" FALSE "), false);
  assert.equal(isGalleryPublicRolloutEnabled("1"), false);
  assert.equal(isGalleryPublicRolloutEnabled("true"), true);
  assert.equal(isGalleryPublicRolloutEnabled(" TRUE "), true);
});

test("public gallery photos keep approved image fields only", () => {
  const photo = toPublicGalleryPhoto(approved);
  assert.deepEqual(photo, {
    id: "gallery-approved",
    title: "Cowes start",
    caption: "The fleet leaving the line",
    alt: "Yachts leaving Cowes",
    credit: "Michael Hodges",
    location: "Cowes",
    imageUrl: "/api/media/media_approved",
    updatedAt: "2026-10-01T00:00:00.000Z",
  });
  assert.equal("sourceUrl" in photo, false);
  assert.equal("rejectionReason" in photo, false);
  assert.equal(toPublicGalleryPhoto({ ...approved, status: "pending" }), null);
  assert.equal(toPublicGalleryPhoto({ ...approved, status: "rejected" }), null);
  assert.equal(toPublicGalleryPhoto({ ...approved, contentType: "video/mp4" }), null);
  assert.equal(toPublicGalleryPhoto({ ...approved, contentType: "" }), null);
  assert.equal(toPublicGalleryPhoto({ ...approved, mediaId: "../secret" }), null);
  assert.equal(toPublicGalleryPhoto({ ...approved, title: "Same", caption: "Same" }).caption, "");
});

test("public gallery, sitemap and TikTok embed stay behind rollout and a click", async () => {
  const [page, sitemap, social, tiktok, grid, displayApi, footer, sections, header, mobile] = await Promise.all([
    fs.readFile(new URL("../app/through-the-lens/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/social/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokProfileEmbed.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokVideoGrid.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../lib/tiktok-display-api.js", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/SiteFooter.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../content/sections.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/MobileSiteHeader.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /if \(!\(await galleryIsPublic\(\)\)\) notFound\(\)/);
  assert.match(page, /getApprovedPublicGalleryPhotos\(\)/);
  assert.match(page, /Photographs from the Old Sea Dogs waterfront/);
  assert.match(page, /Pictures from the waterfront will appear here/);
  assert.doesNotMatch(page, /newsroom|waiting for review|pending review|Approved photographs|Approved pictures/i);
  assert.match(page, /<TikTokVideoGrid \/>/);
  assert.doesNotMatch(page, /newsroom|waiting for review|pending review/i);
  assert.doesNotMatch(social, /newsroom|waiting for review|pending review|approved photographs/i);
  assert.match(sitemap, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(sitemap, /\/through-the-lens/);
  assert.match(social, /<TikTokVideoGrid \/>/);
  assert.match(grid, /Show TikTok videos/);
  assert.match(grid, /fetch\("\/api\/social\/tiktok"\)/);
  assert.match(grid, /\{active \? \(/);
  assert.match(grid, /src=\{active\.embedUrl\}/);
  assert.doesNotMatch(grid, /embed\.js|open\.tiktokapis\.com|newsroom|waiting for review|pending review/i);
  assert.match(displayApi, /https:\/\/open\.tiktokapis\.com\/v2\/video\/list\//);
  assert.doesNotMatch(displayApi, /www\.tiktok\.com\/@|oembed|cheerio|scrape/i);
  assert.match(social, /galleryIsPublic/);
  assert.match(footer, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(tiktok, /if \(!loaded\) return/);
  assert.match(tiktok, /data-embed-type="creator"/);
  assert.match(tiktok, /data-unique-id=\{uniqueId\}/);
  assert.match(tiktok, /https:\/\/www\.tiktok\.com\/embed\.js/);
  assert.match(tiktok, /oldseadogs8/);
  assert.doesNotMatch(tiktok, /<script/);
  assert.doesNotMatch(sections, /marinaGuideNavigationLink|label: "Marina Guide"|solent-marina-guide/);
  assert.match(header, /publicNavigationLinks/);
  assert.doesNotMatch(header, /through-the-lens|Marina Guide|solent-marina-guide/);
  assert.doesNotMatch(mobile, /marinaGuideNavigationLink|Marina Guide|solent-marina-guide|through-the-lens/);
});
