import assert from "node:assert/strict";
import test from "node:test";
import { guideArticleJsonLd } from "../lib/guides.ts";
import {
  isNeedlesHeroImage,
  needlesHeroImageUrl,
  shareImageDimensions,
  shareImageUrl,
} from "../lib/responsive-image.ts";
import { createPageMetadata } from "../lib/seo.ts";

const hamble = "/images/guides/guides-marina-hamble-point-hero-v1.png";
const needles = "/images/guides/guides-solent-needles-hero-v1.png";
const oceanRace = "/api/media/media_0b593c022df942ef86c371c58165250c?variant=original";

function pathname(url) {
  return new URL(url).pathname;
}

function openGraphImage(metadata) {
  const images = metadata.openGraph?.images;
  const first = Array.isArray(images) ? images[0] : images;
  if (!first || typeof first === "string") return { url: String(first || ""), width: undefined, height: undefined };
  return first;
}

test("share images use the existing 1200px derivative instead of the original file", () => {
  assert.equal(shareImageUrl(hamble), "/img/1200/images/guides/guides-marina-hamble-point-hero-v1.png");
  assert.equal(shareImageUrl(needles), "/img/1200/images/guides/guides-solent-needles-hero-v1.png");
  assert.equal(
    shareImageUrl(oceanRace),
    "/img/1200/media/media_0b593c022df942ef86c371c58165250c",
  );
  assert.equal(shareImageUrl("/images/old-sea-dogs-logo.png"), "/images/old-sea-dogs-logo.png");
  assert.equal(shareImageUrl("https://example.com/photo.png"), "https://example.com/photo.png");
  assert.deepEqual(shareImageDimensions(2044, 1370), { width: 1200, height: 804 });
  assert.deepEqual(shareImageDimensions(1600, 900), { width: 1200, height: 675 });
  assert.deepEqual(shareImageDimensions(1280, 853), { width: 1200, height: 800 });
  assert.deepEqual(shareImageDimensions(undefined, undefined), { width: undefined, height: undefined });
});

test("Needles hero points at the 1200px derivative and other heroes stay addressable", () => {
  assert.equal(isNeedlesHeroImage(needles), true);
  assert.equal(isNeedlesHeroImage(hamble), false);
  assert.equal(needlesHeroImageUrl(needles), "/img/1200/images/guides/guides-solent-needles-hero-v1.png");
  assert.equal(needlesHeroImageUrl(hamble), hamble);
});

test("page metadata publishes the 1200px image on Open Graph and Twitter", () => {
  const hamblePage = createPageMetadata({
    title: "Hamble Point Marina",
    description: "A Solent marina guide",
    path: "/guides/solent/hamble-point-marina",
    image: { url: hamble, alt: "Hamble Point" },
    type: "article",
  });
  const hambleImage = openGraphImage(hamblePage);
  assert.equal(pathname(hambleImage.url), "/img/1200/images/guides/guides-marina-hamble-point-hero-v1.png");
  assert.deepEqual(hamblePage.twitter?.images, [hambleImage.url]);

  const story = createPageMetadata({
    title: "Ocean Race Atlantic",
    description: "A race story",
    path: "/stories/ocean-race-atlantic-2026-new-york-lorient-imoca",
    image: { url: oceanRace, width: 2044, height: 1370, alt: "The start" },
    type: "article",
  });
  const storyImage = openGraphImage(story);
  assert.equal(pathname(storyImage.url), "/img/1200/media/media_0b593c022df942ef86c371c58165250c");
  assert.equal(storyImage.width, 1200);
  assert.equal(storyImage.height, 804);
  assert.deepEqual(story.twitter?.images, [storyImage.url]);
  assert.doesNotMatch(storyImage.url, /variant=original/);

  const home = createPageMetadata({
    title: "Old Sea Dogs",
    description: "Boating stories",
    path: "/",
  });
  assert.equal(pathname(openGraphImage(home).url), "/images/old-sea-dogs-logo.png");
});

test("guide structured data uses the same 1200px share image", () => {
  const jsonLd = guideArticleJsonLd({
    slug: "the-solent",
    regionKey: "solent",
    canonicalPath: "/guides/solent/the-solent",
    guideType: "Cruising Area",
    parentGuideSlug: "",
    title: "The Solent",
    summary: "The western entrance",
    seoDescription: "",
    introduction: "The Needles",
    updatedAt: "2026-10-05T00:00:00.000Z",
    author: "Michael Hodges",
    imageUrl: needles,
    regionName: "The Solent",
    location: {},
  });
  assert.equal(pathname(jsonLd.image[0]), "/img/1200/images/guides/guides-solent-needles-hero-v1.png");
});
