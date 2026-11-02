import assert from "node:assert/strict";
import test from "node:test";
import { getLegacyRedirectPath } from "../lib/redirects.ts";

const conistonLivePath = "/stories/racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northe";
const conistonLegacyStoryPath = "/stories/racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026";
const sundancerLivePath = "/stories/boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-perfo";
const sundancerLegacyStoryPath = "/stories/boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance";

test("Coniston Osprey legacy Open source path redirects to the live story", () => {
  assert.equal(
    getLegacyRedirectPath("/racing/championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026/"),
    conistonLivePath,
  );
  assert.equal(
    getLegacyRedirectPath("/racing/championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026"),
    conistonLivePath,
  );
  assert.equal(getLegacyRedirectPath(conistonLegacyStoryPath), conistonLivePath);
  assert.equal(getLegacyRedirectPath(conistonLivePath), null);
});

test("Sea Ray Sundancer 455 legacy Open source path redirects to the live story", () => {
  assert.equal(
    getLegacyRedirectPath("/boat-reviews/sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance/"),
    sundancerLivePath,
  );
  assert.equal(
    getLegacyRedirectPath("/boat-reviews/sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance"),
    sundancerLivePath,
  );
  assert.equal(getLegacyRedirectPath(sundancerLegacyStoryPath), sundancerLivePath);
  assert.equal(getLegacyRedirectPath(sundancerLivePath), null);
});

test("other long archive slugs still redirect to the full story path", () => {
  assert.equal(
    getLegacyRedirectPath("/lifestyle/navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth/"),
    "/stories/lifestyle-navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth",
  );
  assert.equal(
    getLegacyRedirectPath("/stories/lifestyle-navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth"),
    null,
  );
});

test("section redirects are unchanged", () => {
  assert.equal(getLegacyRedirectPath("/racing"), "/races");
  assert.equal(getLegacyRedirectPath("/boat-reviews/"), "/reviews");
});

test("unprefixed story slugs redirect to the prefixed story and unknowns stay missing", () => {
  assert.equal(
    getLegacyRedirectPath("/stories/navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth"),
    "/stories/lifestyle-navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth",
  );
  assert.equal(
    getLegacyRedirectPath("/stories/lymington-marina"),
    "/stories/ports-lymington-marina",
  );
  assert.equal(getLegacyRedirectPath("/stories/not-a-real-story-zzz"), null);
  assert.equal(
    getLegacyRedirectPath("/stories/the-ocean-race-2027"),
    "/stories/racing-the-ocean-race-2027",
  );
});

test("uppercase story slugs and repeated slashes redirect to the canonical path", () => {
  assert.equal(
    getLegacyRedirectPath("/stories/Lymington-Marina"),
    "/stories/ports-lymington-marina",
  );
  assert.equal(
    getLegacyRedirectPath("//stories//ports-lymington-marina"),
    "/stories/ports-lymington-marina",
  );
  assert.equal(
    getLegacyRedirectPath("/STORIES/NOT-A-REAL-STORY-ZZZ"),
    "/stories/not-a-real-story-zzz",
  );
  assert.equal(getLegacyRedirectPath("/stories/ports-lymington-marina"), null);
});

test("seller confirm, manage and keep links keep the token's capital letters", () => {
  const token = "AbC123_-xY";
  assert.equal(getLegacyRedirectPath(`/boats-for-sale/verify/${token}`), null);
  assert.equal(getLegacyRedirectPath(`/boats-for-sale/manage/${token}`), null);
  assert.equal(getLegacyRedirectPath(`/boats-for-sale/keep/${token}`), null);
  assert.equal(getLegacyRedirectPath(`/boats-for-sale/relist/${token}`), null);
  assert.equal(getLegacyRedirectPath(`/Boats-for-sale/VERIFY/${token}`), `/boats-for-sale/verify/${token}`);
  assert.equal(getLegacyRedirectPath(`/BOATS-FOR-SALE/Manage/${token}/`), `/boats-for-sale/manage/${token}`);
  assert.equal(getLegacyRedirectPath(`//boats-for-sale//keep/${token}`), `/boats-for-sale/keep/${token}`);
  assert.equal(getLegacyRedirectPath(`/boats-for-sale/verify/${token.toLowerCase()}`), null);
});
