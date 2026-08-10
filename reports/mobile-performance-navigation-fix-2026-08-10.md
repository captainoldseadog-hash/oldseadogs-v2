# Old Sea Dogs mobile, navigation and consent fix

Date: 10 August 2026  
Branch: `codex/fix-mobile-story-consent-performance`

## Root causes

1. The homepage rendered story, section and advert photographs as CSS background images. Twelve images were therefore eager candidates in the baseline homepage HTML, including a 400 KB legacy photograph and a 535 KB advert. The lead image was not distinguished from off-screen images. The server also rebuilt the normalized 2,000-plus-story archive repeatedly even when the parsed editor store had not changed.
2. Story cards had fragmented navigation: the image, title and summary were separate links, while some compact-card images were plain, unlinked spans. There was no global click handler or router redirect causing the fault; the reproducible defect was that substantial touch/card areas had no single canonical story destination. Each card is now one normal `/stories/<slug>` link.
3. Consent was written to local storage and a cookie, but only local storage was read. The stored value had no enforced schema or expiry, and the cookie was host-only and lacked `Secure`. Storage blocking, an invalid value, or crossing between `www` and the canonical bare host therefore reopened the banner.
4. Dynamic HTML advertised `max-age=60, stale-while-revalidate=300`, which could hide a newly changed editor store even though the file cache itself invalidated. Dynamic responses now require revalidation; immutable media and static asset rules remain separate.

## Performance measurements

Live pre-fix samples from London:

| Route | TTFB | Total | HTML |
| --- | ---: | ---: | ---: |
| Homepage | 2.247 s | 2.258 s | 69,059 B |
| Current story | 1.302 s | 2.949 s | 92,297 B |
| Guides | 2.304 s | 2.313 s | 64,322 B |

The live public shell also served 180,024 B of CSS and about 292 KB of public JavaScript. Those are remaining optimization opportunities; the fault-specific change avoids adding another client runtime.

Apples-to-apples local production builds using the same isolated editor-store fixture:

| Route | Pre-fix | Candidate | Change |
| --- | ---: | ---: | ---: |
| Homepage, cold | 496.7 ms | 328.6 ms | -33.8% |
| Homepage, warm mean | 239.8 ms | 216.2 ms | -9.9% |
| Story, mean | 214.9 ms | 187.1 ms | -12.9% |
| Guides, mean | 14.3 ms | 14.0 ms | effectively unchanged |

Homepage image behavior changed from 12 CSS background images and no lazy images to one eager lead image, 11 lazy images and no content background images. Uploaded card media uses the existing 480 px thumbnail variant; the lead keeps the 1,600 px web image.

## Validation

- TypeScript: pass.
- ESLint: 0 errors; 3 existing warnings in `EditorDashboard.tsx` and `site-content.ts`.
- Focused consent/navigation/performance tests: 19 passed.
- Full Node test selection: passed.
- Homepage/Guides safety suite: 36 passed.
- Story media, Bridge workflow and controlled-media checks: passed.
- Production build: pass; DigitalOcean compatibility check passed.
- Official production start: served HTTP 200 on isolated port 4319.
- Five viewport screenshots and navigation checks: pass at 390x844, 375x667, 768x1024, 1024x768 and 1440x900.
- Four distinct homepage story destinations, direct URL loading and browser back navigation: pass.
- Story anchors are native, keyboard-focusable links (`tabIndex=0`) with visible focus styling.
- Consent Accept, Reject and mixed-preference flows persisted through reload; Accept also persisted in a new tab.
- CMS opened and read the isolated authoritative store with 2,143 published records; the fixture file remained byte-for-byte unchanged.
- Guides remained present: 24 unique published Guide destinations and 64 Guide link instances.
- Homepage Manager order was protected by the existing preservation suite; no homepage setting or story record was mutated.

Two repository checks are not standalone pass/fail checks: `check:stories` requires explicit before/after store paths, and `check:launch` requires the absent `deploy/oldseadogs.env.example`. Neither condition was introduced by this branch.

## Rollback

Revert the fix commit and rebuild the prior release. Do not touch `/var/www/oldseadogs-data`; the release contains no editor store or uploaded production media. The consent schema is versioned, so rollback may show the older banner once but does not grant optional consent.
