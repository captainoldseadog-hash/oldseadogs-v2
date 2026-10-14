import assert from "node:assert/strict";
import test from "node:test";
import { derivativeImageUrl, derivativeSrcSet, isRenderableImageReference, resizedPublicImageUrl } from "../lib/responsive-image.ts";

test("static guide artwork is served as a sized derivative and the original path is not replaced", () => {
  const original = "/images/guides/guides-marina-hamble-point-hero-v1.png";
  assert.equal(
    derivativeImageUrl(original, 1600),
    "/img/1600/images/guides/guides-marina-hamble-point-hero-v1.png",
  );
  assert.match(derivativeSrcSet(original, [480, 1200, 1600]), /\/img\/480\/images\/guides\/guides-marina-hamble-point-hero-v1\.png 480w/);
  assert.match(derivativeSrcSet(original), /1600w$/);
});

test("CMS media heroes use resized derivative URLs rather than the full web variant", () => {
  assert.equal(derivativeImageUrl("/api/media/photo-1", 480), "/img/480/media/photo-1");
  assert.equal(derivativeImageUrl("/api/media/photo-1", 1600), "/img/1600/media/photo-1");
  assert.equal(derivativeImageUrl("/api/media/photo-1", 768), "/img/768/media/photo-1");
  assert.doesNotMatch(derivativeSrcSet("/api/media/photo-1"), /variant=web|data:/);
  assert.equal(derivativeImageUrl("https://example.com/photo.png", 768), "https://example.com/photo.png");
  assert.equal(derivativeSrcSet("https://example.com/photo.png"), "");
  assert.equal(derivativeImageUrl("pending", 768), "");
  assert.equal(derivativeImageUrl("Monaco 1.png", 768), "");
  assert.equal(isRenderableImageReference("Monaco 1.png"), false);
  assert.equal(isRenderableImageReference("javascript:alert(1)"), false);
  assert.equal(isRenderableImageReference("/images/guides/guides-river-hamble-hero-v1.png"), true);
});

test("homepage heroes without a dedicated mobile file use a resized WebP derivative", () => {
  assert.equal(
    resizedPublicImageUrl("/images/guides/guides-river-hamble-hero-v1.png"),
    "/img/768/images/guides/guides-river-hamble-hero-v1.png",
  );
  assert.equal(
    resizedPublicImageUrl("/images/racing-yachts.png", 768),
    "/img/768/images/racing-yachts.png",
  );
  assert.equal(
    resizedPublicImageUrl("/images/guides/guides-solent-needles-hero-v1.png"),
    "/images/guides/guides-solent-needles-mobile.webp",
  );
  assert.equal(
    resizedPublicImageUrl("/images/guides/guides-marina-hamble-point-hero-v1.png"),
    "/images/guides/guides-marina-hamble-point-hero-mobile.webp",
  );
  assert.equal(resizedPublicImageUrl("pending"), "");
});
