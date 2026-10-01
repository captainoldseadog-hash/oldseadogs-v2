import assert from "node:assert/strict";
import test from "node:test";
import { derivativeImageUrl, derivativeSrcSet } from "../lib/responsive-image.ts";

test("static guide artwork is served as a sized derivative and the original path is not replaced", () => {
  const original = "/images/guides/guides-marina-hamble-point-hero-v1.png";
  assert.equal(
    derivativeImageUrl(original, 1600),
    "/img/1600/images/guides/guides-marina-hamble-point-hero-v1.png",
  );
  assert.match(derivativeSrcSet(original, [480, 1200, 1600]), /\/img\/480\/images\/guides\/guides-marina-hamble-point-hero-v1\.png 480w/);
  assert.match(derivativeSrcSet(original), /1600w$/);
});

test("CMS media keeps the existing web and thumbnail files and only fills the gap widths", () => {
  assert.equal(derivativeImageUrl("/api/media/photo-1", 480), "/api/media/photo-1?variant=thumbnail");
  assert.equal(derivativeImageUrl("/api/media/photo-1", 1600), "/api/media/photo-1?variant=web");
  assert.equal(derivativeImageUrl("/api/media/photo-1", 768), "/img/768/media/photo-1");
  assert.equal(derivativeImageUrl("https://example.com/photo.png", 768), "https://example.com/photo.png");
  assert.equal(derivativeSrcSet("https://example.com/photo.png"), "");
});
