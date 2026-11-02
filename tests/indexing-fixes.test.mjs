import assert from "node:assert/strict";
import test from "node:test";
import { llmsText } from "../lib/llms-txt.ts";
import { resolvePublicPage } from "../lib/public-page.ts";

test("listing pages keep in-range numbers and reject the rest", () => {
  assert.equal(resolvePublicPage(undefined, 13), 1);
  assert.equal(resolvePublicPage("", 13), 1);
  assert.equal(resolvePublicPage("1", 13), 1);
  assert.equal(resolvePublicPage("13", 13), 13);
  assert.equal(resolvePublicPage("2", 13), 2);
  assert.equal(resolvePublicPage("14", 13), null);
  assert.equal(resolvePublicPage("999", 13), null);
  assert.equal(resolvePublicPage("0", 13), null);
  assert.equal(resolvePublicPage("-1", 13), null);
  assert.equal(resolvePublicPage("01", 13), null);
  assert.equal(resolvePublicPage("2.5", 13), null);
  assert.equal(resolvePublicPage("page", 13), null);
  assert.equal(resolvePublicPage("2", 0), null);
});

test("llms.txt names the guides, story sections, boats and about", () => {
  const text = llmsText({
    summary: "Boating stories and cruising guides.",
    guidesIndex: "https://oldseadogs.com/guides",
    areas: [{ label: "The Solent", url: "https://oldseadogs.com/guides/solent" }],
    storySections: [{ label: "News", url: "https://oldseadogs.com/news" }],
    boatsForSale: "https://oldseadogs.com/boats-for-sale",
    about: "https://oldseadogs.com/about",
  });
  assert.match(text, /^# Old Sea Dogs/);
  assert.match(text, /Boating stories and cruising guides\./);
  assert.match(text, /https:\/\/oldseadogs\.com\/guides\n/);
  assert.match(text, /The Solent: https:\/\/oldseadogs\.com\/guides\/solent/);
  assert.match(text, /News: https:\/\/oldseadogs\.com\/news/);
  assert.match(text, /https:\/\/oldseadogs\.com\/boats-for-sale/);
  assert.match(text, /https:\/\/oldseadogs\.com\/about/);
  assert.doesNotMatch(text, /cdn-cgi/);
});
