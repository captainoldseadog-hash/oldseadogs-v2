# OldSeaDogs continuation validation — 2026-09-09

## Safety and scope

- Source worktree: `/Users/driftwood/Documents/Codex/oldseadogs-portsmouth-discovery`
- Branch reviewed and extended: `codex/portsmouth-guides-discovery`
- Starting commit: `54785a3b4a38798d59cb9fda1d7a0be2609b03a4`
- No application deployment, SSH, upload, PM2 restart, Nginx change, release-symlink change, production CMS access, or production media access was performed.

## 1. Portsmouth production CMS status

The production CMS work was stopped before identity checks, backup, conflict checks, media upload, or any CMS write because the three user-supplied hero files were not available to this task:

- `guides-royal-clarence-marina-hero-v1.png`
- `guides-southsea-marina-hero-v1.png`
- `guides-gunwharf-quays-hero-v1(1).png`

No substitute media IDs or paths were invented. Consequently:

- no Royal Clarence Marina, Southsea Marina, or Gunwharf Quays / Portsmouth draft was created;
- there are no new draft IDs/slugs or Hero Media IDs to report;
- there is no production backup path or before/after production SHA-256, because production was not accessed;
- the task made no change to Portsmouth Harbour, Haslar Marina, Gosport Marina, or Port Solent Marina. Their published state in the previously captured validation evidence is unchanged by this task, but it was not freshly queried against production.

## 2. Commit `54785a3` and Guide discovery review

The implementation is suitable for continuation:

- `/guides` supports search, cruising-area filtering, Guide-type filtering, and responsive desktop/tablet/mobile layouts.
- Hierarchy and discovery are relationship-driven through Guide identity, `regionKey`, `parentGuideId`, and `parentGuideSlug`; the discovery/interlinking logic is not Portsmouth- or Poole-specific.
- Parent, child, sibling, related, manual, and automatic public links are filtered to published Guides.
- Draft Guide detail routes return 404; drafts are excluded from `/guides`, public navigation, and the sitemap.
- Existing manually authored links remain intact. Automatic linking uses unique aliases, links only a bounded safe occurrence, and does not replace ambiguous place names blindly.
- Public Guide links render as ordinary crawlable anchors.
- The captured corpus had 32 published product Guides: 23 Solent and 9 Poole. Published orphan count was 0, broken public Guide routes 0, body links 129, and relationship links 196.
- The captured corpus contained 3 drafts; leakage was 0 on `/guides`, 0 in the sitemap, and 0/6 tested draft detail routes (all six returned 404).
- Cowes regression coverage confirmed that unavailable/ambiguous targets such as Cowes Yacht Haven and Shepards were not incorrectly auto-linked.

Existing responsive evidence was complete, so it was not recaptured:

- `reports/portsmouth-guides-discovery/guides-1440x900.jpg`
- `reports/portsmouth-guides-discovery/guides-834x1112.jpg`
- `reports/portsmouth-guides-discovery/guides-390x844.jpg`
- `reports/portsmouth-guides-discovery/private-hierarchy-1440-full.jpg`
- `reports/portsmouth-guides-discovery/validation-summary.md`

## 3. Google Discover/Search readiness

Audit authority was current Google Search Central guidance for Discover, Article structured data, canonicalisation, and Google Images. No invented Discover schema was added.

Already correct:

- indexable Stories expose `max-image-preview:large`, a self-referencing canonical, Article JSON-LD, headline, description, author identity, published/modified dates, publisher, Open Graph metadata, and Twitter metadata;
- Media Library originals are public and crawlable, while responsive rendered images continue to use appropriately sized variants;
- the normal tested Story hero was 1280×960, exceeding Google's 1200-pixel-width and 300,000-pixel thresholds;
- mobile article text is server-rendered and does not wait for the hero image to load.

The real local gap was that social and structured metadata pointed at a transformed web variant without recorded dimensions, and Article JSON-LD exposed only a URL array. The local fix now:

- exposes the crawlable original Media Library variant in Open Graph, Twitter, and Article metadata;
- emits the CMS-recorded width and height in Open Graph metadata;
- emits a Schema.org `ImageObject` with URL and available dimensions in Article JSON-LD.

The normal Story test case was `pace-line-honours-rorc-round-britain-ireland-race-2026`. Runtime checks found `index, follow`, `max-image-preview:large`, its self canonical, a 1280×960 original hero, complete Article data, and HTTP 200 immutable JPEG media. The 4:3 test hero is technically large enough but not the approximately 16:9 editorial ideal; choosing a strong landscape crop remains an editorial recommendation rather than an application-code change.

No Musto/iQFOiL Story was altered or published. The isolated current CMS snapshot did not contain such a current Story; legacy archive material was not treated as current-content evidence.

## 4. Mobile cookie-consent persistence

Root cause: the Option C component had regressed compatibility with valid version-2 consent records and wrote a host-only cookie. Visitors carrying the earlier local-storage record could therefore be treated as undecided, and bare-domain/`www` transitions could lose the cookie even though a valid choice existed.

The local fix:

- reads the current storage key, the legacy version-2 key, and the first-party cookie;
- validates version-2 expiry, normalises supported records to version 1, persists the normalised current record, and removes the legacy storage key;
- writes `Path=/`, `SameSite=Lax`, a one-year `Max-Age`, `Secure` on HTTPS, and `Domain=.oldseadogs.com` on the bare and `www` production hosts;
- preserves local-host development behaviour and the existing choice/withdrawal UI;
- does not change GA4 `G-88HT8MHR7T`, denied-by-default Consent Mode, accept/refuse semantics, or analytics loading rules.

Browser runtime proof at mobile viewport:

1. clean origin: banner appeared;
2. Accept: banner closed;
3. reload: banner remained absent;
4. navigate to the lead Story and back: banner remained absent;
5. reopen Privacy choices and reject: rejected state persisted after reload;
6. separate clean origin, Refuse, then reload: refusal persisted;
7. withdrawal/reselection remained available through Privacy choices.

The same state machine and attributes are covered for desktop. Browser console checks during acceptance and refusal recorded zero warnings and zero errors.

## 5. Mobile top-Story performance

Test path: mobile homepage to the current Homepage Manager lead Story, using the 41-paragraph normal Story above as the long-article route. Measurement used the production build on localhost with a 400 KB/s transfer cap. HTML was approximately 106 KB and the responsive web hero approximately 170 KB.

Identified server-side root cause: related-Story ranking rebuilt the current Story token set for every one of 2,143 candidate records, then the article page ran the complete ranking operation twice—once for related cards and again for internal-link groups. The click, route, article text, and hero-loading architecture were otherwise functioning normally.

Local fix: compute the current Story token set once per ranking pass and reuse the already-ranked related list when building internal-link groups. Output and desktop presentation are unchanged.

- Before, warm Story TTFB: 0.506–0.526 seconds; mean approximately 0.515 seconds.
- After, cold Story TTFB: 1.299 seconds; six warm samples: 0.395, 0.345, 0.337, 0.512, 0.390, and 0.302 seconds; warm mean 0.380 seconds.
- Result: approximately 26% lower warm TTFB. The 170 KB responsive hero transferred in approximately 0.253 seconds under the same cap and did not block server-rendered article text.

## 6. Current-content and local-data note

Application runtime validation used an isolated copy of the available local production-matching snapshot, not the legacy archive and not production. It contained 209 Stories, 47 published Stories, and reported the newest published Story as **Pace Completes a Great Lap of Britain and Ireland** (`pace-line-honours-rorc-round-britain-ireland-race-2026`, `2026-08-18T05:02:00.000Z`). Homepage Manager continued to supply the separate lead selection **RORC Round Britain and Ireland Race 2026: Pace Finds the Fast Lane North**.

During initial local startup, the application's due-schedule hook unexpectedly published one due Story and rewrote only the QA copy at `/Users/driftwood/Documents/Codex/2026-06-09/sites-plugin-sites-openai-bundled-create/.oldseadogs-data/editor-store.json` (published count 46 to 47). The process was stopped immediately. No production store or media was accessed or changed. All subsequent runtime work used an isolated temporary copy and started the built app without that scheduler wrapper.

## 7. Validation results

- Full suite: 209 tests, 209 passed, 0 failed.
- Focused preservation suite: 13 passed, 0 failed.
- Focused Guide, SEO, consent, route-boundary, current-content, Homepage Manager, Guide CMS/media, GA4/Consent Mode, sitemap/indexing, and responsive regression coverage passed as part of the full suite.
- TypeScript: passed.
- Production build (`npm run build:do`): passed, including all five build stages.
- Touched-file ESLint: passed.
- `git diff --check`: passed.
- Runtime accessibility inspection exposed semantic headings, links, buttons, and dialog controls at the tested mobile view; no runtime console errors were observed.
- `/editorial-standards`: HTTP 200 with no `WWW-Authenticate` header in the local runtime.
- `/editor`, `/editor/...`, and `/api/editor` protection is intentionally enforced at the Nginx boundary. Anchored rules match `^/editor(?:/|$)` and `^/api/editor(?:/|$)`, leaving `/editorial-standards` public. The direct local application server does not emulate Nginx authentication.

## 8. Local files changed

- `app/stories/[slug]/page.tsx`
- `components/CookieConsent.tsx`
- `lib/cookie-consent.ts`
- `lib/internal-links.ts`
- `lib/public-media.ts`
- `lib/structured-data.ts`
- `tests/future-story-seo.integration.test.mjs`
- `tests/marina-guides-release-preservation.test.mjs`
- `tests/mobile-navigation-consent-performance.test.mjs`
- `tests/mobile-option-c-regression.test.mjs`
- `tests/solent-marina-guides.test.mjs`
- `reports/continuation-validation-2026-09-09.md`

These changes remain local pending separate review and deployment approval.
