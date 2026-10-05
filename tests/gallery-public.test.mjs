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
  const [page, sitemap, social, tiktok, footer, sections, header, mobile] = await Promise.all([
    fs.readFile(new URL("../app/through-the-lens/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/social/page.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/TikTokProfileEmbed.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/SiteFooter.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../content/sections.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../components/MobileSiteHeader.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /if \(!\(await galleryIsPublic\(\)\)\) notFound\(\)/);
  assert.match(page, /getApprovedPublicGalleryPhotos\(\)/);
  assert.match(page, /<TikTokProfileEmbed \/>/);
  assert.match(sitemap, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(sitemap, /\/through-the-lens/);
  assert.match(social, /<TikTokProfileEmbed \/>/);
  assert.match(social, /galleryIsPublic/);
  assert.match(footer, /isGalleryPublicRolloutEnabled\(settings\.galleryPublicRollout\)/);
  assert.match(tiktok, /if \(!loaded\) return/);
  assert.match(tiktok, /data-embed-type="creator"/);
  assert.match(tiktok, /data-unique-id=\{uniqueId\}/);
  assert.match(tiktok, /https:\/\/www\.tiktok\.com\/embed\.js/);
  assert.match(tiktok, /oldseadogs8/);
  assert.doesNotMatch(tiktok, /<script/);
  assert.match(sections, /href: "\/guides\/solent-marina-guide"/);
  assert.match(sections, /label: "Marina Guide"/);
  assert.match(header, /publicNavigationLinks/);
  assert.doesNotMatch(header, /through-the-lens/);
  assert.match(mobile, /marinaGuideNavigationLink/);
  assert.doesNotMatch(mobile, /through-the-lens/);
});
