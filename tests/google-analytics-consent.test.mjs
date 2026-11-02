import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

async function readProductionCss() {
  const assetsDir = path.join(projectDir, "dist/client/assets");
  const assetNames = await fs.readdir(assetsDir);
  const cssAssets = assetNames.filter((name) => name.endsWith(".css"));
  assert.ok(cssAssets.length > 0, "the production build must emit at least one CSS asset");
  return Promise.all(cssAssets.map((name) => read(`dist/client/assets/${name}`)))
    .then((assets) => assets.join("\n"));
}

function cssDeclarations(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `expected the production CSS to contain ${selector}`);
  return match[1];
}

test("GA4 uses the approved measurement ID once through the global consent component", async () => {
  const [layout, cookieConsent, seo, ecosystem] = await Promise.all([
    read("app/layout.tsx"),
    read("components/CookieConsent.tsx"),
    read("lib/seo.ts"),
    read("ecosystem.config.cjs"),
  ]);

  assert.match(seo, /defaultGa4MeasurementId = "G-88HT8MHR7T"/);
  assert.doesNotMatch(`${seo}\n${ecosystem}`, /G-K3WM9K6X45/);
  assert.match(layout, /<CookieConsent[\s\S]*ga4Id=\{ga4MeasurementId\}/);
  assert.equal((cookieConsent.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 1);
  assert.equal((layout.match(/oldseadogs-google-consent-default/g) || []).length, 1);
});

test("Consent Mode defaults every optional Google storage purpose to denied", async () => {
  const layout = await read("app/layout.tsx");
  for (const consentType of [
    "analytics_storage",
    "ad_storage",
    "ad_user_data",
    "ad_personalization",
  ]) {
    assert.match(layout, new RegExp(`${consentType}:\\"denied\\"`));
  }
  assert.match(layout, /window\.gtag\("consent","default"/);
  assert.match(layout, /wait_for_update:500/);
});

test("saved choices grant, deny and withdraw analytics through the existing banner", async () => {
  const cookieConsent = await read("components/CookieConsent.tsx");
  assert.match(cookieConsent, /window\.localStorage\.setItem\(storageKey/);
  assert.match(cookieConsent, /window\.gtag.*"consent", "update"/s);
  assert.match(cookieConsent, /analytics_storage: choice\.analytics \? "granted" : "denied"/);
  assert.match(cookieConsent, /setGoogleAnalyticsDisabled\(ga4Id, !choice\.analytics\)/);
  assert.match(cookieConsent, /removeGoogleAnalyticsCookies\(\)/);
  assert.match(cookieConsent, /if \(choice\.analytics && ga4Id\)/);
});

test("the initial banner offers accessible Accept, Reject and Manage actions in that order", async () => {
  const cookieConsent = await read("components/CookieConsent.tsx");
  const accept = cookieConsent.indexOf("Accept all");
  const reject = cookieConsent.indexOf("Reject non-essential");
  const manage = cookieConsent.indexOf("Manage choices");

  assert.ok(accept >= 0 && accept < reject && reject < manage);
  assert.match(cookieConsent, /<button className="cookie-action-primary" type="button" onClick=\{\(\) => void acceptAll\(\)\}>/);
  assert.doesNotMatch(cookieConsent, /<button[^>]*className="cookie-action-primary"[^>]*(?:disabled|aria-disabled)/);
  assert.match(cookieConsent, /<button type="button" onClick=\{\(\) => void rejectAll\(\)\}>/);
  assert.match(cookieConsent, /<button type="button" onClick=\{\(\) => setShowPreferences\(true\)\}>/);
  assert.equal((cookieConsent.match(/>\s*Accept all\s*</g) || []).length, 1);
});

test("Accept all persists every optional category and closes the panel", async () => {
  const cookieConsent = await read("components/CookieConsent.tsx");
  const acceptAll = cookieConsent.match(/async function acceptAll\(\) \{[\s\S]*?\n  \}/)?.[0] || "";

  assert.match(acceptAll, /saveChoice\(\{ analytics: true, ads: true \}\)/);
  assert.match(acceptAll, /setChoice\(nextChoice\)/);
  assert.match(acceptAll, /setAnalytics\(true\)/);
  assert.match(acceptAll, /setAds\(true\)/);
  assert.match(acceptAll, /setShowPreferences\(false\)/);
  assert.match(cookieConsent, /window\.localStorage\.setItem\(storageKey, JSON\.stringify\(nextChoice\)\)/);
  assert.match(cookieConsent, /document\.cookie = `\$\{legacyConsentCookieName\}=/);
});

test("Reject, preference management and consent withdrawal remain available", async () => {
  const cookieConsent = await read("components/CookieConsent.tsx");
  const rejectAll = cookieConsent.match(/async function rejectAll\(\) \{[\s\S]*?\n  \}/)?.[0] || "";

  assert.match(rejectAll, /saveChoice\(\{ analytics: false, ads: false \}\)/);
  assert.match(rejectAll, /setShowPreferences\(false\)/);
  assert.match(cookieConsent, /checked=\{analytics\}/);
  assert.match(cookieConsent, /checked=\{ads\}/);
  assert.match(cookieConsent, /async function savePreferences\(\)/);
  assert.match(cookieConsent, /setGoogleAnalyticsDisabled\(ga4Id, !choice\.analytics\)/);
  assert.match(cookieConsent, /if \(!choice\.analytics\) removeGoogleAnalyticsCookies\(\)/);
});

test("the three-action banner is responsive, touch-friendly and keyboard-visible", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /\.cookie-actions \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.cookie-actions button \{[\s\S]*?min-height: 44px/);
  assert.match(css, /\.cookie-actions \.cookie-action-primary \{[\s\S]*?background: #b84b2c/);
  assert.match(css, /\.cookie-actions button:focus-visible \{[\s\S]*?outline: 3px solid var\(--sea\)/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.cookie-actions \{[\s\S]*?grid-template-columns: 1fr/);
  assert.doesNotMatch(css, /\.cookie-actions[^}]*overflow-x:\s*(?:auto|scroll)/);
});

test("the production build preserves a visible, contrasting Accept all primary action", async () => {
  const productionCss = await readProductionCss();
  const primary = cssDeclarations(productionCss, ".cookie-actions .cookie-action-primary");

  assert.match(primary, /border-color:\s*#b84b2c/);
  assert.match(primary, /background:\s*#b84b2c/);
  assert.match(primary, /color:\s*#fff(?:fff)?/);
  assert.doesNotMatch(primary, /(?:^|;)\s*opacity:\s*0(?:\D|$)/);
  assert.doesNotMatch(primary, /(?:^|;)\s*visibility:\s*hidden(?:;|$)/);
  assert.doesNotMatch(primary, /(?:^|;)\s*display:\s*none(?:;|$)/);
});

test("client navigation sends one sanitized manual page view and disables the automatic one", async () => {
  const cookieConsent = await read("components/CookieConsent.tsx");
  assert.match(cookieConsent, /send_page_view:false/);
  assert.match(cookieConsent, /lastTrackedPath\.current === pathname/);
  assert.match(cookieConsent, /"event", "page_view"/);
  assert.match(cookieConsent, /page_location: `\$\{window\.location\.origin\}\$\{pathname\}`/);
  assert.match(cookieConsent, /page_path: pathname/);
  assert.doesNotMatch(cookieConsent, /page_location:\s*window\.location\.href/);
});
