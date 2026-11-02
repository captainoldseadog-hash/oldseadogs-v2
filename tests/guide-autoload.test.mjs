import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { consentAccepted } from "../components/useMapConsent.ts";
test("map auto-loads only after consent is accepted; tides load without a button", async () => {
  assert.equal(consentAccepted(null), false);
  assert.equal(consentAccepted({ analytics: false, ads: false }), false);
  assert.equal(consentAccepted({ analytics: true, ads: false }), true);
  assert.equal(consentAccepted({ analytics: true, ads: true }), true);
  const map = await fs.readFile(new URL("../components/GuideGoogleMap.tsx", import.meta.url), "utf8");
  assert.match(map, /useConsentAccepted\(\)/); assert.match(map, /Load Google Map/);
  const tides = await fs.readFile(new URL("../components/GuideTideTimes.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(tides, /Show tide times|onClick/); assert.match(tides, /useEffect/);
  const panel = await fs.readFile(new URL("../components/GuideConditionsPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /Not for navigation/); assert.match(panel, /guide-conditions-official/);
});
