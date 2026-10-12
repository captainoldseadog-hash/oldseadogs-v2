import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { publicOpenSourceUrl } from "../lib/public-source-link.ts";
import { getLegacyRedirectPath } from "../lib/redirects.ts";

const coniston = "/stories/racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northe";
const sundancer = "/stories/boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-perfo";

test("Open source stays hidden when it is missing or already this story", () => {
  assert.equal(publicOpenSourceUrl("", coniston), "");
  assert.equal(publicOpenSourceUrl("   ", coniston), "");
  assert.equal(publicOpenSourceUrl("pending", coniston), "");
  assert.equal(publicOpenSourceUrl("javascript:alert(1)", coniston), "");
  assert.equal(publicOpenSourceUrl(`https://oldseadogs.com${coniston}`, coniston), "");
  assert.equal(publicOpenSourceUrl(`https://www.oldseadogs.com${coniston}/`, coniston), "");
  assert.equal(publicOpenSourceUrl(coniston, coniston), "");
  assert.equal(
    publicOpenSourceUrl(
      "https://oldseadogs.com/stories/racing-championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026",
      coniston,
    ),
    "",
  );
  assert.equal(
    publicOpenSourceUrl(
      "https://oldseadogs.com/stories/boat-reviews-sea-ray-sundancer-455-the-ultimate-45foot-cruiser-for-comfort-performance/",
      sundancer,
    ),
    "",
  );
  assert.equal(
    publicOpenSourceUrl(
      "https://oldseadogs.com/racing/championship-victory-at-coniston-sailing-clubs-osprey-scottish-and-northern-2026/",
      coniston,
      getLegacyRedirectPath,
    ),
    "",
  );
  assert.equal(
    publicOpenSourceUrl("https://www.rya.org.uk/racing", coniston),
    "https://www.rya.org.uk/racing",
  );
});

test("story photos ignore values that are not URLs or paths", async () => {
  const source = await readFile(new URL("../lib/site-content.ts", import.meta.url), "utf8");
  assert.match(source, /return isRenderableImageReference\(imageUrl\) && !placeholderStoryImages\.has\(imageUrl\)/);
  assert.match(source, /const placeholderStoryImages = new Set\(\["", "\/images\/marina-hero\.png"\]\)/);
});
