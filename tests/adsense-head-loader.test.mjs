import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { isAdsenseLoaderPath } from "../lib/route-boundaries.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");
test("the AdSense loader follows the production env switch and the known publisher id", async () => {
  const seo = await read("lib/seo.ts");
  assert.match(seo, /adsensePublisherId = "ca-pub-7278382533036873"/);
  assert.match(seo, /OLDSEADOGS_ENABLE_ADSENSE/);
  assert.match(seo, /NEXT_PUBLIC_ENABLE_ADSENSE/);
  assert.match(seo, /export const adsenseEnabled = adsenseEnvironmentEnabled/);
  assert.doesNotMatch(seo, /export const adsenseEnabled = false/);
  assert.match(seo, /const adsenseEnvironmentEnabled =\n  isProduction &&/);
  assert.match(seo, /adsenseLoaderSrc = `https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=\$\{adsenseLoaderClientId\}`/);
});

test("public pages can render the async loader and editor or admin pages cannot", async () => {
  const layout = await read("app/layout.tsx");
  assert.ok(layout.includes('</noscript><script async src="${adsenseLoaderSrc}" crossorigin="anonymous"></script><noscript>'));
  assert.match(layout, /shouldRenderAdsenseLoader/);
  assert.match(layout, /isAdsenseLoaderPath\(pathname\)/);
  assert.equal(isAdsenseLoaderPath("/"), true);
  assert.equal(isAdsenseLoaderPath("/guides/solent/port-hamble-marina"), true);
  assert.equal(isAdsenseLoaderPath("/stories/example"), true);
  assert.equal(isAdsenseLoaderPath("/editor"), false);
  assert.equal(isAdsenseLoaderPath("/editor/stories"), false);
  assert.equal(isAdsenseLoaderPath("/admin"), false);
  assert.equal(isAdsenseLoaderPath("/admin/settings"), false);
  assert.equal(isAdsenseLoaderPath("/api/consent"), false);
});

test("visible AdSense units stay suspended and the loader is not injected twice", async () => {
  const [unit, consent] = await Promise.all([
    read("components/AdSenseUnit.tsx"),
    read("components/CookieConsent.tsx"),
  ]);
  assert.match(unit, /adsenseUnitsSuspendedForQualityRecovery = true/);
  assert.match(consent, /script\[src="\$\{adsenseSrc\}"\]/);
  assert.match(consent, /choice\.ads && adsenseEnabled && adsenseClientId/);
});
