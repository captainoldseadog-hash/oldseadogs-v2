import assert from "node:assert/strict";
import test from "node:test";
import { isFilenameLikeAlt, publicImageAlt } from "../lib/public-image-alt.ts";

test("filename-like alt text is recognised without treating descriptions as files", () => {
  assert.equal(isFilenameLikeAlt("Monaco 1.png"), true);
  assert.equal(isFilenameLikeAlt("The Ocean Race.jpg"), true);
  assert.equal(isFilenameLikeAlt("boot26.JPEG"), true);
  assert.equal(isFilenameLikeAlt("RIBS at the Monaco Yacht Show 26.png"), true);
  assert.equal(isFilenameLikeAlt("40 Years - MarineWare.webp"), true);
  assert.equal(isFilenameLikeAlt("Sailing yachts passing the Needles."), false);
  assert.equal(isFilenameLikeAlt("New York Yacht Club (NYYC)"), false);
  assert.equal(isFilenameLikeAlt("Version 2.0"), false);
  assert.equal(isFilenameLikeAlt(""), false);
});

test("public alt text keeps a real CMS alt and otherwise uses caption or title", () => {
  assert.equal(publicImageAlt({
    alt: "Racing yachts at sea",
    caption: "A caption",
    title: "Story title",
  }), "Racing yachts at sea");

  assert.equal(publicImageAlt({
    alt: "Monaco 1.png",
    caption: "Monaco - Jeddah in 2027 © Michael Hodges",
    title: "A New Winter Harbour",
  }), "Monaco - Jeddah in 2027 © Michael Hodges");

  assert.equal(publicImageAlt({
    alt: "boot26.jpg",
    caption: "boot26.jpg",
    title: "boot Düsseldorf 2027: The Great Indoor Harbour Prepares to Open Again",
  }), "boot Düsseldorf 2027: The Great Indoor Harbour Prepares to Open Again");

  assert.equal(publicImageAlt({
    alt: "",
    caption: "",
    title: "Hamble Point Marina",
  }), "Hamble Point Marina");

  assert.equal(publicImageAlt({
    alt: "tender.png",
    caption: "",
    title: "",
    fallback: "Old Sea Dogs story image",
  }), "Old Sea Dogs story image");
});
