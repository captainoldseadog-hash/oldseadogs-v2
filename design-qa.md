# Old Sea Dogs Option C design QA

- Source visual truth: `/Users/driftwood/.codex/generated_images/01a00f60-9f58-7512-ad05-dbc5daf337e7/exec-f58641e3-f4d6-452c-8ab2-ca7807a06046.png`
- Source pixels: 1448 × 1086 design board containing labelled 390 × 844 mobile and 834 × 1194 iPad reference states
- Live implementation evidence: `/Users/driftwood/.codex/visualizations/2026/08/17/01a00f60-9f58-7512-ad05-dbc5daf337e7/old-sea-dogs-runtime-gate/`
- Comparison viewport and density: 390 × 844, 430 × 932, 834 × 1194, 1024 × 768, 1280 × 900, 1440 × 900, and 1920 × 1080; deviceScaleFactor 1
- States: homepage, current story, Hamble Point Marina Guide, open navigation, cookie preferences, and desktop footer

## Findings

- [P1] The mobile and iPad story share panel displaced the lead image from the intended opening composition.
  - Location: `ArticlePreviewContent`, immediately after story metadata.
  - Evidence: the approved reference places the lead image directly after the story header, while the first live 390 × 844 and 834 × 1194 captures put a large share panel before it.
  - Impact: the main editorial image falls below the mobile fold and the article opening no longer matches the selected Option C hierarchy.
  - Fix applied: retain the existing desktop share placement, but move the responsive share instance after the lead figure.

- [P1] The iPad Guide highlight title inherited white text on the white responsive surface.
  - Location: homepage Guide highlight, `.mobile-guide-copy > strong`.
  - Evidence: `ipad-834-home.png` shows “The Solent” with effectively no contrast; the reference uses dark editorial text.
  - Impact: the Guide title is difficult to read and fails the intended hierarchy and contrast.
  - Fix applied: explicitly apply the ink token to the responsive Guide title.

- [P2] Mobile pages requested desktop-weight image assets that were not visible or needed.
  - Location: homepage/story/Guide hero and footer brand mark.
  - Evidence: live page inventories showed the 599,921-byte desktop logo on all mobile routes, the 373,602-byte Monaco hero, and the 3,857,343-byte Hamble Point PNG.
  - Impact: avoidable mobile transfer and decode cost, especially severe on the Guide page.
  - Fix applied: add 144,634-byte and 167,848-byte responsive WebP derivatives, use picture sources at 1024px and below, and reuse the existing 10,196-byte mobile logo in the responsive footer.

- [P2] The 834–1024px Latest Stories sidebar retained the desktop section's two-column grid inside its narrow tablet grid cell.
  - Location: homepage `.site-shell > .lead-section` in the 768–1024px media query.
  - Evidence: the live 1024px capture measured the inner Latest content column at zero pixels wide, producing min-content word wrapping and a 1,440px-tall story grid inside the clipped 620px panel.
  - Impact: current production headlines wrap word-by-word and the iPad Latest Stories hierarchy becomes fragile and difficult to scan.
  - Fix applied: make the tablet `.lead-section` a block formatting context while retaining the intended hero/sidebar placement; a responsive regression assertion now protects this override.
  - Post-fix evidence: the rebuilt port-3003 runtime measures the inner Latest column at 297px at 1024px, restores normal headline wrapping, and has no horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: Georgia editorial display and system UI hierarchy match the Option C direction. The responsive Guide contrast defect above was the only blocking typography/color finding.
- Spacing and layout rhythm: homepage, Guide, navigation and consent spacing are coherent at 390 and 834. Story hierarchy required the share-panel relocation above.
- Colors and visual tokens: harbour, ink, signal and paper tokens are consistent with the source. Guide title contrast required the explicit ink token above.
- Image quality and asset fidelity: source imagery and crops are preserved; new files are responsive derivatives of the existing CMS/static assets, not replacements or invented artwork.
- Copy and content: current CMS story and Guide content are intentionally different from the concept board's illustrative copy but follow the same layout roles.

## Full-view comparison evidence

- Mobile and iPad implementation captures were opened alongside the Option C board in `reference-vs-final-comparison.png`.
- The 1440 × 900 pre-change desktop baseline and current capture were combined in `compare-desktop-1440-baseline-left-current-right.png`; the visible desktop frame is unchanged.
- 1280 and 1920 captures show no horizontal overflow or breakpoint regression.

## Focused-region comparison evidence

- Header/menu: menu moves focus to News, Escape closes it, and focus returns to the Menu button.
- Story opening: post-fix 390 and 834 captures place the lead image directly after the metadata, preserving the intended opening hierarchy.
- Guide highlight: post-fix 834 and 1024 captures use the ink token on the white surface and retain readable editorial hierarchy.
- Cookie controls: 48–50px action heights, readable status treatment, and single-column responsive actions were verified.

## Primary interactions tested

- Menu open/close, focus movement, Escape close, and focus return passed.
- Reject, custom analytics-only choice, Accept all, reload persistence, route-change persistence, and new-tab persistence passed.
- Browser console checks for homepage, story and Guide returned no errors or warnings.

## Current-content pipeline gate

- Desktop, mobile, and tablet all resolve homepage content through the same `getPublishedStories()` result and the same `HomepageContentProvider`; the responsive layout does not introduce a second content query, fixture, cache, or mobile-only array.
- A new isolated-store integration test publishes a disposable story through the canonical editor API, confirms that it enters the shared mobile Latest Stories feed under the existing rules, then unpublishes it and confirms that it is removed. Homepage Manager lead selection remains authoritative throughout.
- The current-content preflight now passes against `.oldseadogs-data/editor-store.json` with `OLDSEADOGS_REQUIRE_EXISTING_STORE=true`: version 1, 209 stories, 46 published stories, modified `2026-08-17T13:31:38.832Z`.
- The generated homepage snapshot and old staging/regression stores were explicitly excluded as evidence of current-content correctness.
- `npm run check:current-content` is now the mandatory current-content approval preflight. It requires both an explicit `OLDSEADOGS_DATA_DIR` and `OLDSEADOGS_REQUIRE_EXISTING_STORE=true`, verifies that `editor-store.json` is readable, and reports store/version/count/newest-published metadata. It cannot silently accept the bundled fallback archive. Normal development fallback behavior is unchanged outside this approval command.
- Runtime currentness and parity now pass: desktop 1440, tablet 834, and mobile 390 resolve Homepage Manager lead `RORC Round Britain and Ireland Race 2026: Pace Finds the Fast Lane North` (`rorc-round-britain-ireland-race-2026-day-four-pace`, published `2026-08-15T05:10:00.000Z`) and first Latest item `From Lone Star to Beau Geste: The Sailors Who Conquered the Solent at Cowes Week 2026` (`cowes-week-2026-winners-champions-bicentenary-results`, published `2026-08-14T05:02:00.000Z`) from the same records. Kimi Antonelli is absent from all three rendered homepages.
- The matching Media Library is present locally. The lead/story image `media_c382568df8344d629a4d7c92a8c7c469` renders at 1280 × 852 on mobile, tablet and desktop; the Hamble Point Guide derivative renders at 1000 × 667 on responsive layouts. No broken images were found on the checked homepage, story or Guide routes.
- Responsive parity and current-content correctness are separate gates: fixture-backed tests may prove responsive pipeline behavior, but only the explicit current production-matching editor store may prove current-content correctness.

## Comparison history

- Initial live pass: found the two P1 visual defects and one P2 mobile transfer defect above.
- Corrective implementation: responsive share placement, Guide title token, responsive hero variants, and responsive footer logo were added; typecheck, touched-file lint (zero errors), focused regression tests, build, and diff check passed.
- Current-store pass: the rebuilt process is reading the copied production-matching store and the responsive record parity gate passes.
- Restored-media pass: the production-matching Media Library is present locally (285 files, 62 MB); the current lead and story image render at 1280 × 852 and the responsive Guide hero renders at 1000 × 667.
- Current-content visual pass: all requested pre-fix mobile/iPad captures plus the 1280/1440/1920 desktop frames were captured. The tablet Latest Stories zero-width nested-grid defect above was found and fixed.
- Post-fix pass: the restarted production-mode runtime serves the rebuilt CSS. All requested mobile/iPad/desktop captures were recaptured, opened and compared with the Option C board.

## Runtime and release gate

- Cookie runtime: reject, accept-all and analytics-only choices persist across reloads and route changes; reject and accept-all also persist in a fresh tab. Google Analytics loads only when analytics is allowed.
- Route boundary: `/editorial-standards` renders the public Editorial Standards page and the production/staging nginx rules do not attach `auth_basic` to it. The anchored `/editor(?:/|$)` and `/api/editor(?:/|$)` locations remain protected. Direct localhost editor rendering is the existing intentional `isLocalRequest` bypass, not a production auth bypass.
- Browser/network: mobile homepage/story/Guide inventories contain 22/17/15 observed assets respectively. The story uses the current CMS `?variant=web` image; the Guide uses `guides-marina-hamble-point-hero-mobile.webp`; rejected consent produces no external scripts. No console errors or warnings were recorded.
- Accessibility/runtime: one main landmark per checked route, labelled navigation regions, no missing image alt attributes, no duplicate IDs, no broken images, no horizontal overflow, 44px primary mobile controls, 24px minimum footer/privacy targets, and menu focus/Escape restoration all pass. Reduced-motion and keyboard-focus styles remain covered by regression tests.
- Validation: `npm run check:current-content`, 201 serial tests, typecheck, touched-file lint, `npm run build:do`, DigitalOcean build validation, and `git diff --check` pass. The editor-store modification time remains `2026-08-17T13:31:38.832Z` and its final SHA-256 is `d6cd3d292ad68f8886023a87a4562a27bca37b1955f39820040dda890685f706`.

final result: passed
