import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  consentCookieAttributes,
  consentLifetimeSeconds,
  createConsentChoice,
  parseConsentChoice,
} from "../lib/cookie-consent.js";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("consent persists for 365 days and expires without granting optional services", () => {
  const now = Date.UTC(2026, 7, 10, 12);
  const accepted = createConsentChoice({ analytics: true, ads: true }, now);
  assert.deepEqual(parseConsentChoice(JSON.stringify(accepted), now + 1), accepted);
  assert.equal(parseConsentChoice(JSON.stringify(accepted), now + consentLifetimeSeconds * 1000 + 1), null);
  assert.equal(consentLifetimeSeconds, 31_536_000);
  assert.equal(parseConsentChoice(null, now), null);
  assert.equal(parseConsentChoice(JSON.stringify({ analytics: true, ads: true }), now), null);
});

test("the consent cookie spans bare and www hosts with secure first-party attributes", () => {
  const attributes = consentCookieAttributes({ hostname: "www.oldseadogs.com", protocol: "https:" });
  assert.match(attributes, /Max-Age=31536000/);
  assert.match(attributes, /Path=\//);
  assert.match(attributes, /SameSite=Lax/);
  assert.match(attributes, /Domain=\.oldseadogs\.com/);
  assert.match(attributes, /Secure/);
  assert.doesNotMatch(
    consentCookieAttributes({ hostname: "localhost", protocol: "http:" }),
    /Domain=|Secure/,
  );
});

test("privacy defaults stay denied until a valid current-schema choice exists", async () => {
  const [layout, consent] = await Promise.all([
    read("app/layout.tsx"),
    read("components/CookieConsent.tsx"),
  ]);
  for (const purpose of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
    assert.match(layout, new RegExp(`${purpose}:\\"denied\\"`));
  }
  assert.match(consent, /const \[analytics, setAnalytics\] = useState\(false\)/);
  assert.match(consent, /const \[ads, setAds\] = useState\(false\)/);
  assert.match(consent, /parseConsentChoice\(decodeURIComponent\(raw\)\)/);
  assert.match(consent, /parseConsentChoice\(window\.localStorage\.getItem\(consentStorageKey\)\)/);
  assert.match(consent, /consentCookieAttributes\(window\.location, consentMaxAgeSeconds\)/);
});

test("homepage story cards expose one canonical native link across image, title and summary", async () => {
  const [homepage, css] = await Promise.all([read("app/page.tsx"), read("app/globals.css")]);
  assert.match(homepage, /<Link className="story-card-link" href=\{`\/stories\/\$\{story\.slug\}`\}>/);
  assert.match(homepage, /<Link className="compact-card-link" href=\{`\/stories\/\$\{story\.slug\}`\}>/);
  assert.doesNotMatch(homepage, /onClick=|preventDefault|router\.push|window\.location/);
  assert.match(css, /\.story-card-link,[\s\S]*?\.compact-card-link[\s\S]*?display: flex/);
  assert.match(css, /\.story-card-link:focus-visible/);
});

test("off-screen homepage images are lazy native images and the lead image stays eager", async () => {
  const [homepage, image] = await Promise.all([
    read("app/page.tsx"),
    read("components/ResponsiveStoryImage.tsx"),
  ]);
  assert.doesNotMatch(homepage, /style=\{\{ backgroundImage:/);
  assert.match(homepage, /className="hero-image"[\s\S]*?eager/);
  assert.match(image, /loading=\{eager \? "eager" : "lazy"\}/);
  assert.match(image, /fetchPriority=\{eager \? "high" : "auto"\}/);
  assert.match(image, /variant=thumbnail/);
});

test("dynamic HTML revalidates while immutable asset rules remain separate", async () => {
  const config = await read("next.config.ts");
  assert.match(config, /source: "\/:path\*"[\s\S]*?value: "no-cache, must-revalidate"/);
  assert.match(config, /source: "\/images\/:path\*"[\s\S]*?max-age=86400/);
  assert.match(config, /source: "\/legacy-photos\/:path\*"[\s\S]*?max-age=86400/);
});
