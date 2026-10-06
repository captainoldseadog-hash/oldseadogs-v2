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

test("public gallery and sitemap stay behind rollout, and the TikTok grid renders without the creator embed", async () => {
  const [page, sitemap, social, tiktok, grid, tiles, cookie, displayApi, footer, sections, header, mobile] = await Promise.all([
    fs.readFile(new URL("../app/through-the-lens/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/social/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokProfileEmbed.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokVideoGrid.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokVideoTiles.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/cookie-policy/page.tsx", import.meta.url), "utf8"),
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
  assert.match(page, /<Suspense fallback=\{<TikTokVideoGridFallback \/>\}>\s*<TikTokVideoGrid \/>/);
  assert.doesNotMatch(page, /Show TikTok videos|Videos stay unloaded/);
  assert.doesNotMatch(page, /newsroom|waiting for review|pending review/i);
  assert.doesNotMatch(social, /newsroom|waiting for review|pending review|approved photographs/i);
  assert.match(sitemap, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(sitemap, /\/through-the-lens/);
  assert.match(social, /export const dynamic = "force-dynamic"/);
  assert.match(social, /<Suspense fallback=\{<TikTokVideoGridFallback \/>\}>\s*<TikTokVideoGrid \/>/);
  assert.match(grid, /await connection\(\)/);
  assert.match(grid, /loadPublicTikTokCatalog\(\)/);
  assert.match(grid, /<TikTokVideoTiles complete=\{complete\} videos=\{videos\} \/>/);
  assert.match(grid, /No videos to show yet/);
  assert.match(grid, /<TikTokProfileEmbed \/>/);
  assert.doesNotMatch(grid, /startLoaded|Show TikTok videos|fetch\("\/api\/social\/tiktok"\)/);
  assert.doesNotMatch(grid, /embed\.js|embedUrl|open\.tiktokapis\.com|newsroom|waiting for review|pending review/i);
  assert.match(tiles, /export const TIKTOK_GRID_PAGE_SIZE = 12/);
  assert.match(tiles, /href=\{video\.watchUrl\}/);
  assert.match(tiles, /loading="lazy"/);
  assert.match(tiles, /Show \{nextCount\} more videos/);
  assert.doesNotMatch(tiles, /embed\.js|embedUrl|tiktok\.com\/embed/i);
  assert.doesNotMatch(cookie, /Show TikTok videos/);
  assert.match(cookie, /Load TikTok profile/);
  assert.match(displayApi, /https:\/\/open\.tiktokapis\.com\/v2\/video\/list\//);
  assert.doesNotMatch(displayApi, /www\.tiktok\.com\/@|oembed|cheerio|scrape/i);
  assert.match(social, /galleryIsPublic/);
  assert.match(footer, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(tiktok, /if \(!loaded\) return/);
  assert.match(tiktok, /data-embed-type="creator"/);
  assert.match(tiktok, /data-unique-id=\{uniqueId\}/);
  assert.match(tiktok, /https:\/\/www\.tiktok\.com\/embed\.js/);
  assert.match(tiktok, /Load TikTok profile/);
  assert.match(tiktok, /oldseadogs8/);
  assert.doesNotMatch(tiktok, /<script/);
  assert.doesNotMatch(sections, /marinaGuideNavigationLink|label: "Marina Guide"|solent-marina-guide/);
  assert.match(header, /publicNavigationLinks/);
  assert.doesNotMatch(header, /through-the-lens|Marina Guide|solent-marina-guide/);
  assert.doesNotMatch(mobile, /marinaGuideNavigationLink|Marina Guide|solent-marina-guide|through-the-lens/);
});
