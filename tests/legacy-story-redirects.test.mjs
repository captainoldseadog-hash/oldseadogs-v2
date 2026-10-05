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
