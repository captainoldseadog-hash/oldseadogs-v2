import assert from "node:assert/strict";
import test from "node:test";
import { metaDescription, pageTitle } from "../lib/seo.ts";

test("meta descriptions lose invisible characters and stay within 160 characters on a word boundary", () => {
  const dirty = "Sesca’s regatta report\u0007 from Antigua\u200B with a long account of the fleet, the weather and the prizegiving that keeps going well past the search snippet limit so the rendered description must stop before a word is cut in half.";
  const description = metaDescription(dirty);
  assert.equal(description.length <= 160, true, description);
  assert.equal(/\u0007|\u200B/.test(description), false);
  assert.equal(description.endsWith(" "), false);
  assert.match(description, /prizegiving|fleet|weather/);
  assert.equal(description.slice(-1) === "t" && description.endsWith("cut"), false);
});

test("short public descriptions gain a useful default without rewriting a long one", () => {
  const short = metaDescription("Photographs from the Old Sea Dogs waterfront.");
  assert.equal(short.length >= 70, true, short);
  assert.equal(short.length <= 160, true, short);
  const longEnough = "Ports, marinas, waterfronts and the practical harbour information sailors actually need.";
  assert.equal(metaDescription(longEnough), longEnough);
});

test("long story titles drop the site suffix and then trim on a word boundary", () => {
  const medium = "Boot Düsseldorf press tour";
  assert.equal(pageTitle(medium), "Boot Düsseldorf press tour | Old Sea Dogs");

  const bare = "French boatbuilders gather for the Boot Düsseldorf press tour";
  const titled = pageTitle(bare);
  assert.equal(titled.includes("|"), false, titled);
  assert.equal(titled.length <= 60, true, titled);
  assert.equal(titled.endsWith("press"), true, titled);

  const huge = "French boatbuilders press tour confirms a packed Boot Düsseldorf diary for the 2027 season ahead";
  const trimmed = pageTitle(huge);
  assert.equal(trimmed.length <= 60, true, trimmed);
  assert.equal(trimmed.endsWith(" "), false);
  assert.match(trimmed, /^French boatbuilders/);

  assert.equal(pageTitle("Contact"), "Contact | Old Sea Dogs");
  assert.equal(pageTitle("Old Sea Dogs"), "Old Sea Dogs | Boating, Yachting & Sea Stories");
});
