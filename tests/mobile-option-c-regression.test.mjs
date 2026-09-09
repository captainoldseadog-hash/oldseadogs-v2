import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { consentCookieAttributes, parseConsentChoice, consentMaxAgeSeconds } from "../lib/cookie-consent.ts";
import { isEditorPath, isPublicPagePath } from "../lib/route-boundaries.ts";
import { publicMediaVariantUrl } from "../lib/public-media.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFile(path.join(projectDir, file), "utf8");

test("editor auth boundary protects only the editor root and descendants", async () => {
  assert.equal(isEditorPath("/editor"), true);
  assert.equal(isEditorPath("/editor/stories"), true);
  assert.equal(isEditorPath("/editorial-standards"), false);
  assert.equal(isPublicPagePath("/editorial-standards"), true);

  for (const file of [
    "deploy/nginx/oldseadogs-production.conf",
    "deploy/nginx/oldseadogs-staging.conf",
  ]) {
    const nginx = await read(file);
    assert.doesNotMatch(nginx, /location \^~ \/editor\s*\{/);
    assert.match(nginx, /location ~ \^\/editor\(\?:\/\|\$\) \{/);
    assert.match(nginx, /location ~ \^\/api\/editor\(\?:\/\|\$\) \{/);
    assert.doesNotMatch(nginx, /location[^\n]*editorial-standards[^\n]*\{[\s\S]*?auth_basic/);
  }
});

test("consent parser accepts current and legacy valid choices and expires stale ones", () => {
  const now = Date.parse("2026-08-17T10:00:00.000Z");
  const valid = JSON.stringify({ analytics: true, ads: false, decidedAt: "2026-08-16T10:00:00.000Z", version: 1 });
  const legacy = JSON.stringify({ analytics: false, ads: false, decidedAt: "2026-08-16T10:00:00.000Z" });
  const priorV2 = JSON.stringify({ analytics: true, ads: false, decidedAt: "2026-08-16T10:00:00.000Z", expiresAt: "2026-09-16T10:00:00.000Z", version: 2 });
  const stale = JSON.stringify({ analytics: true, ads: true, decidedAt: new Date(now - (consentMaxAgeSeconds + 1) * 1000).toISOString(), version: 1 });

  assert.deepEqual(parseConsentChoice(valid, now), {
    analytics: true,
    ads: false,
    decidedAt: "2026-08-16T10:00:00.000Z",
    version: 1,
  });
  assert.equal(parseConsentChoice(legacy, now)?.version, 1);
  assert.equal(parseConsentChoice(priorV2, now)?.version, 1);
  assert.equal(parseConsentChoice(JSON.stringify({ ...JSON.parse(priorV2), expiresAt: "2026-08-17T09:59:59.000Z" }), now), null);
  assert.equal(parseConsentChoice(stale, now), null);
  assert.equal(parseConsentChoice("not json", now), null);
  assert.equal(parseConsentChoice(JSON.stringify({ analytics: "yes", ads: false, decidedAt: "2026-08-16T10:00:00.000Z" }), now), null);
});

test("Option C consent survives canonical bare/www host changes", () => {
  assert.match(consentCookieAttributes({ hostname: "www.oldseadogs.com", protocol: "https:" }), /Domain=\.oldseadogs\.com/);
  assert.match(consentCookieAttributes({ hostname: "oldseadogs.com", protocol: "https:" }), /Domain=\.oldseadogs\.com/);
  assert.doesNotMatch(consentCookieAttributes({ hostname: "127.0.0.1", protocol: "http:" }), /Domain=|Secure/);
});

test("mobile media requests use existing CMS variants and a lightweight legacy Guide derivative", () => {
  assert.equal(publicMediaVariantUrl("/api/media/example", "web"), "/api/media/example?variant=web");
  assert.equal(publicMediaVariantUrl("/api/media/example", "thumbnail"), "/api/media/example?variant=thumbnail");
  assert.equal(
    publicMediaVariantUrl("/images/guides/guides-solent-needles-hero-v1.png", "thumbnail"),
    "/images/guides/guides-solent-needles-mobile.webp"
  );
  assert.equal(
    publicMediaVariantUrl("/legacy-photos/c35532d15601-port-hercules-during-the-2026-monaco-grand-prix-while-kimi-anton.webp", "mobile"),
    "/legacy-photos/c35532d15601-port-hercules-during-the-2026-monaco-grand-prix-while-kimi-anton-mobile.webp"
  );
  assert.equal(
    publicMediaVariantUrl("/images/guides/guides-marina-hamble-point-hero-v1.png", "mobile"),
    "/images/guides/guides-marina-hamble-point-hero-mobile.webp"
  );
  assert.equal(publicMediaVariantUrl("/api/media/example", "mobile"), "/api/media/example?variant=web");
});

test("Option C remains a responsive layer over the existing content pipeline", async () => {
  const [homepage, layout, header, css] = await Promise.all([
    read("app/page.tsx"),
    read("app/layout.tsx"),
    read("components/MobileSiteHeader.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(homepage, /new HomepageContentProvider\(stories, settings\)\.getContent\(\)/);
  assert.match(homepage, /mobile-hero-content/);
  assert.match(homepage, /featuredStory\.title/);
  assert.match(homepage, /mobile-guide-highlight/);
  assert.match(layout, /<MobileSiteHeader \/>/);
  assert.match(header, /oldSeaDogsSections\.map/);
  assert.match(header, /aria-expanded=\{open\}/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(css, /\.mobile-site-header,[\s\S]*?display: none/);
  assert.match(css, /@media \(max-width: 1024px\)[\s\S]*?\.mobile-site-header \{[\s\S]*?display: block/);
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1024px\)/);
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1024px\)[\s\S]*?\.site-shell > \.lead-section \{[\s\S]*?display: block/
  );
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
