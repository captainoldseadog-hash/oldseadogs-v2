import assert from "node:assert/strict";
import test from "node:test";
import { readImageTraits } from "../lib/image-derivatives.ts";
import {
  dedupeCredit,
  focalPointStyle,
  readGraphicSample,
  resolveImagePresentation,
} from "../lib/image-fit.ts";

test("large photographs keep the cover crop", () => {
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 2000,
    height: 1333,
    slot: "hero",
  }), "cover");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1600,
    height: 900,
    slot: "hero",
  }), "cover");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1600,
    height: 1067,
    slot: "app-lead",
  }), "cover");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1600,
    height: 1067,
    slot: "story-card",
  }), "cover");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1280,
    height: 854,
    slot: "article",
  }), "cover");
});

test("small, square, and flat graphics use the whole-image frame", () => {
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 640,
    height: 480,
    slot: "hero",
  }), "contain");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 900,
    height: 900,
    slot: "hero",
  }), "contain");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1280,
    height: 704,
    slot: "hero",
    graphic: true,
  }), "contain");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1280,
    height: 704,
    slot: "app-lead",
    graphic: true,
  }), "contain");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: 1280,
    height: 704,
    slot: "story-card",
    graphic: true,
  }), "contain");
});

test("an editor choice overrides automatic detection", () => {
  assert.equal(resolveImagePresentation({
    fit: "fill",
    width: 400,
    height: 400,
    slot: "hero",
    graphic: true,
    logoLike: true,
  }), "cover");
  assert.equal(resolveImagePresentation({
    fit: "contain",
    width: 2400,
    height: 1600,
    slot: "hero",
  }), "contain");
  assert.equal(resolveImagePresentation({ fit: "Show whole image", width: 2400, height: 1600, slot: "article" }), "contain");
});

test("repeated photo credits collapse to one line", () => {
  assert.equal(
    dedupeCredit("© Island Sailing Club / Henri Lloyd · © Island Sailing Club / Henri Lloyd"),
    "© Island Sailing Club / Henri Lloyd",
  );
  assert.equal(
    dedupeCredit("Photo: Island Sailing Club / Henri Lloyd · © Island Sailing Club / Henri Lloyd"),
    "Photo: Island Sailing Club / Henri Lloyd",
  );
  assert.equal(dedupeCredit("Island Sailing Club · Henri Lloyd"), "Island Sailing Club · Henri Lloyd");
  assert.equal(dedupeCredit("  "), "");
});

test("an empty or centred focal point keeps the existing crop anchor", () => {
  assert.equal(focalPointStyle(""), undefined);
  assert.equal(focalPointStyle("50% 50%"), undefined);
  assert.equal(focalPointStyle("center"), undefined);
  assert.equal(focalPointStyle("30% 40%"), "30% 40%");
});

test("a flat colour sample reads as a graphic and a noisy sample does not", () => {
  const flat = new Uint8Array(24 * 24 * 4);
  for (let index = 0; index < flat.length; index += 4) {
    flat[index] = 18;
    flat[index + 1] = 57;
    flat[index + 2] = 68;
    flat[index + 3] = 255;
  }
  const noisy = new Uint8Array(24 * 24 * 4);
  for (let index = 0; index < noisy.length; index += 4) {
    noisy[index] = (index * 17) % 256;
    noisy[index + 1] = (index * 29) % 256;
    noisy[index + 2] = (index * 43) % 256;
    noisy[index + 3] = 255;
  }
  const transparent = new Uint8Array(24 * 24 * 4);
  transparent.fill(255);
  for (let index = 3; index < transparent.length; index += 16) transparent[index] = 0;

  assert.equal(readGraphicSample(flat).flat, true);
  assert.equal(readGraphicSample(noisy).flat, false);
  assert.equal(readGraphicSample(transparent).hasAlpha, true);
});

test("stored club logos are contained and a harbour photograph still covers", async () => {
  const [logo, photo] = await Promise.all([
    readImageTraits("/legacy-photos/36695f83c7e3-chicago-yacht-club-logo-1.webp"),
    readImageTraits("/legacy-photos/1d4dedd66ffb-cowes.webp"),
  ]);
  assert.ok(logo);
  assert.ok(photo);
  assert.equal(logo.flat || logo.hasAlpha, true);
  assert.equal(photo.flat, false);
  assert.equal(photo.hasAlpha, false);
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: logo.width,
    height: logo.height,
    slot: "hero",
    graphic: logo.flat || logo.hasAlpha,
  }), "contain");
  assert.equal(resolveImagePresentation({
    fit: "auto",
    width: photo.width,
    height: photo.height,
    slot: "hero",
    graphic: photo.flat || photo.hasAlpha,
  }), "cover");
});
