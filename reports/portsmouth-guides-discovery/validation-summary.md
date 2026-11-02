# Portsmouth Guides discovery and interlinking validation

Validated: 4 September 2026  
Branch: `codex/portsmouth-guides-discovery`  
Base: `18db6e3`

## Delivered locally

- Redesigned `/guides` as a relationship-driven discovery page headed “Where do you want to sail?”.
- Generated cruising-area, harbour, river, marina and destination hierarchy from Guide records instead of a named-area list.
- Added search plus cruising-area and Guide-type filters.
- Added crawlable contextual links for the first safe occurrence of a uniquely named published Guide.
- Added published-only parent, child and sibling Guide navigation.
- Preserved explicit Guide links in the V2 Guide contract, importer and Helm editor.
- Added an authenticated, `noindex` hierarchy preview that can show drafts without exposing them publicly.

## Public-surface audit

The temporary local fixture contained 32 published product Guides (23 Solent and 9 Poole) plus three Portsmouth-area draft records used only to exercise private preview behaviour.

| Check | Result |
| --- | ---: |
| Published Guides without any rendered Guide link | 0 |
| Broken rendered Guide routes | 0 |
| Rendered body/editorial Guide links | 129 |
| Rendered relationship-navigation links | 196 |
| Draft Portsmouth names/slugs visible on `/guides` | 0 |
| Draft Portsmouth names/slugs visible in `/sitemap.xml` | 0 |
| Tested public routes for the three drafts returning 404 | 6 / 6 |

Ambiguous or unavailable targets remain plain text. For example, Cowes Yacht Haven and Shepards Marina are not auto-linked because no matching published Guide exists.

The local Portsmouth draft fixtures were IDs `OSD-G034` to `OSD-G036`. These are test-only records, not production IDs. The recoverable fixture was moved outside the release tree to `/private/tmp/oldseadogs-preview-fixture-20260904-1019/data` after capture.

## Regression and build checks

- Focused Guide and release-preservation tests: 27 passed, 0 failed.
- TypeScript typecheck: passed.
- Production build: passed.
- Focused lint of changed files: passed.
- `git diff --check`: passed.
- Screenshot dimensions: 1440×900, 834×1112 and 390×844; private hierarchy full-page capture 1440×3368.

## Production reconciliation status

Production was not modified. The existing published Portsmouth collection remains the baseline:

- Portsmouth Harbour — `OSD-G007`
- Haslar Marina — `OSD-G018`
- Gosport Marina — `OSD-G019`
- Port Solent Marina — `OSD-G020`

The three requested production drafts were not created because the exact required hero files were not present in the supplied attachments or permitted local paths, and both SSH and live editor authentication were unavailable. No production backup was made because the write phase did not begin.

Required files:

- `guides-royal-clarence-marina-hero-v1.png`
- `guides-southsea-marina-hero-v1.png`
- `guides-gunwharf-quays-hero-v1(1).png`

Southsea Marina is accurately described in the local draft as a Portsmouth-area marina in Langstone Harbour, while retaining the requested Portsmouth parent relationship for collection discovery.

## Release state

No deploy, publish, production CMS write or production asset upload was performed.
