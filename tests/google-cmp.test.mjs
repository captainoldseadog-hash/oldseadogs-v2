import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  analyticsDecisionFromConsentModeStatus,
  analyticsStorageFromConsentCommand,
  eeaUkAndSwitzerlandRegions,
  fundingChoicesMessageSrc,
  googleCmpConsentDefaultScript,
  googleFcPresentSnippet,
  isGoogleCmpEnabled,
} from "../lib/google-cmp.ts";
import { isAdsenseLoaderPath } from "../lib/route-boundaries.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("the Google CMP switch stays off unless the env value is exactly true", () => {
  assert.equal(isGoogleCmpEnabled(undefined), false);
  assert.equal(isGoogleCmpEnabled(""), false);
  assert.equal(isGoogleCmpEnabled("false"), false);
  assert.equal(isGoogleCmpEnabled("TRUE"), false);
  assert.equal(isGoogleCmpEnabled("true"), true);
});

test("Funding Choices loads the account consent-message script", () => {
  assert.equal(
    fundingChoicesMessageSrc(),
    "https://fundingchoicesmessages.google.com/i/pub-7278382533036873?ers=1",
  );
  assert.equal(
    fundingChoicesMessageSrc("ca-pub-7278382533036873"),
    "https://fundingchoicesmessages.google.com/i/pub-7278382533036873?ers=1",
  );
});

test("Consent Mode v2 stays denied for the EEA, UK and Switzerland until the CMP updates it", () => {
  const script = googleCmpConsentDefaultScript();
  for (const purpose of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
    assert.equal(script.split(`${purpose}:"denied"`).length - 1, 2, purpose);
  }
  assert.equal((script.match(/window\.gtag\("consent","default"/g) || []).length, 2);
  assert.match(script, /wait_for_update:500/);
  assert.match(script, /window\.googlefc\.callbackQueue=window\.googlefc\.callbackQueue\|\|\[\]/);
  for (const region of ["GB", "DE", "FR", "IE", "CH", "NO"]) {
    assert.match(script, new RegExp(`"${region}"`));
  }
  assert.equal(eeaUkAndSwitzerlandRegions.includes("US"), false);
  assert.equal(new Set(eeaUkAndSwitzerlandRegions).size, eeaUkAndSwitzerlandRegions.length);
  assert.equal(eeaUkAndSwitzerlandRegions.length, 32);
  assert.match(googleFcPresentSnippet, /googlefcPresent/);
});

test("public pages can load the CMP and editor or admin pages cannot", async () => {
  const [layout, loader, seo, ecosystem] = await Promise.all([
    read("app/layout.tsx"),
    read("components/GoogleCmpLoader.tsx"),
    read("lib/seo.ts"),
    read("ecosystem.config.cjs"),
  ]);
  assert.match(seo, /OLDSEADOGS_USE_GOOGLE_CMP/);
  assert.match(seo, /isGoogleCmpEnabled\(runtimeProcess\?\.env\?\.OLDSEADOGS_USE_GOOGLE_CMP\)/);
  assert.doesNotMatch(seo, /export const useGoogleCmp = true/);
  assert.match(ecosystem, /OLDSEADOGS_USE_GOOGLE_CMP: process\.env\.OLDSEADOGS_USE_GOOGLE_CMP \|\| "false"/);
  assert.match(layout, /const shouldRenderGoogleCmp = useGoogleCmp && isAdsenseLoaderPath\(pathname\)/);
  assert.match(layout, /shouldRenderGoogleCmp \? googleCmpConsentDefaultScript\(\) : googleConsentDefaults/);
  assert.match(layout, /id="oldseadogs-google-cmp" src="\$\{fundingChoicesScriptSrc\}"/);
  assert.match(layout, /googleFcPresentSnippet/);
  const consentTag = layout.indexOf('id="oldseadogs-google-consent-default"');
  const cmpTag = layout.indexOf('id="oldseadogs-google-cmp"');
  const adsTag = layout.indexOf('src="${adsenseLoaderSrc}"');
  assert.ok(consentTag > 0 && cmpTag > consentTag && adsTag > cmpTag);
  assert.match(layout, /<GoogleCmpLoader enabled=\{useGoogleCmp\} src=\{fundingChoicesScriptSrc\} \/>/);
  assert.match(layout, /useGoogleCmp=\{useGoogleCmp\}/);
  assert.match(loader, /enabled && isAdsenseLoaderPath\(pathname\)/);
  assert.match(loader, /removeGoogleCmp\(src\)/);
  assert.equal(isAdsenseLoaderPath("/"), true);
  assert.equal(isAdsenseLoaderPath("/privacy"), true);
  assert.equal(isAdsenseLoaderPath("/cookie-policy"), true);
  assert.equal(isAdsenseLoaderPath("/stories/example"), true);
  assert.equal(isAdsenseLoaderPath("/editor"), false);
  assert.equal(isAdsenseLoaderPath("/editor/stories"), false);
  assert.equal(isAdsenseLoaderPath("/admin"), false);
  assert.equal(isAdsenseLoaderPath("/admin/settings"), false);
  assert.equal(isAdsenseLoaderPath("/api/consent"), false);
});

test("the home-made banner stays hidden while Google's message is on, and the footer control can reopen it", async () => {
  const [consent, footer] = await Promise.all([
    read("components/CookieConsent.tsx"),
    read("components/SiteFooter.tsx"),
  ]);
  assert.match(consent, /if \(googleCmpOnThisPage && !showPreferences\) \{\s*return null;\s*\}/);
  assert.match(consent, /if \(!choice \|\| isEditorRoute \|\| googleCmpOnThisPage\) return;/);
  assert.match(consent, /showRevocationMessage/);
  assert.match(consent, /if \(window\.__oldSeaDogsUseGoogleCmp\)/);
  assert.match(consent, /useGoogleCmp = false/);
  assert.match(footer, /<PrivacyChoicesButton \/>/);
  assert.match(footer, /href: "\/privacy", label: "Privacy Policy"/);
  assert.match(footer, /href: "\/cookie-policy", label: "Cookie Policy"/);
});

test("analytics still loads only for a granted choice and withdrawal still removes cookies", () => {
  assert.equal(analyticsDecisionFromConsentModeStatus(undefined), "wait");
  assert.equal(analyticsDecisionFromConsentModeStatus(0), "wait");
  assert.equal(analyticsDecisionFromConsentModeStatus(1), "granted");
  assert.equal(analyticsDecisionFromConsentModeStatus(2), "denied");
  assert.equal(analyticsDecisionFromConsentModeStatus(3), "use-stored-choice");
  assert.equal(analyticsDecisionFromConsentModeStatus(4), "use-stored-choice");
  assert.equal(analyticsDecisionFromConsentModeStatus(9), "wait");
  assert.equal(
    analyticsDecisionFromConsentModeStatus(7, {
      CONSENT_MODE_PURPOSE_STATUS_GRANTED: 7,
      CONSENT_MODE_PURPOSE_STATUS_DENIED: 8,
    }),
    "granted",
  );
  assert.equal(analyticsStorageFromConsentCommand(["consent", "update", { analytics_storage: "granted" }]), true);
  assert.equal(analyticsStorageFromConsentCommand(["consent", "update", { analytics_storage: "denied" }]), false);
  assert.equal(analyticsStorageFromConsentCommand(["consent", "update", { ad_storage: "granted" }]), null);
  assert.equal(analyticsStorageFromConsentCommand(["event", "page_view"]), null);
});
