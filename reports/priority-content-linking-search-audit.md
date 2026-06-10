# Old Sea Dogs Priority 1-3 Audit

Generated: 2026-06-10

## Priority 1: Content Migration

Status: **Covered locally and ready for launch review.**

Every major article category exists in the new site:

| Site section | Migrated stories |
| --- | ---: |
| News | 864 |
| Shows | 143 |
| Races / Racing | 418 |
| Boat Reviews | 400 |
| Gear | 79 |
| Destinations | 13 |
| Masterclass | 39 |
| Lifestyle | 113 |
| Clubs | 36 |
| Ports | 37 |

Key migration checks:

| Check | Result |
| --- | --- |
| Club profiles | 36 club stories migrated; 36 currently have credited photos. |
| Marina / port pages | 37 port or marina stories migrated; 37 currently have credited photos. |
| Boat reviews | 400 boat review stories migrated; 26 currently have credited photos. |
| Old story URLs | 2,142 old source URLs captured from the imported stories. |
| Redirect mapping rows | 2,161 rows in the redirect CSV/report. |
| Duplicate old URLs | 0. |
| Live redirect layer | Implemented in the worker before page rendering, including old article paths and old section paths. |

URL preservation files:

- Mapping report: `reports/oldseadogs-url-mapping-report.md`
- Redirect CSV: `reports/oldseadogs-url-mapping.csv`
- Redirect code: `lib/redirects.ts` and `worker/index.ts`

Launch note: because the live old site could not be crawled from this environment while network access is blocked, this audit verifies the imported archive data and the local redirect mapping. A live crawl should still be run before DNS is changed.

Redirect samples verified from the local archive mapping:

| Old path | New path |
| --- | --- |
| `/boat-shows/` | `/shows` |
| `/racing/` | `/races` |
| `/boat-reviews/` | `/reviews` |
| `/news/monaco-grand-prix-2026-where-superyachts-stole-the-show/` | `/stories/news-monaco-grand-prix-2026-where-superyachts-stole-the-show` |
| `/news/d%C3%B6rries-yachts-confirms-new-lease-at-volkswerft-stralsund-shipyard/` | `/stories/news-dorries-yachts-confirms-new-lease-at-volkswerft-stralsund-shipyard` |

## Priority 2: Internal Linking

Status: **Implemented in the new story pages.**

The story template now adds automatic connected-reading blocks:

| Linking rule | Where it appears |
| --- | --- |
| Related articles | Every story can show related stories based on matching title, summary, category and tags. |
| Club articles link to marina articles | Club stories add a related ports and marinas block, with a fallback list so the block does not disappear. |
| Marina / port articles link to club articles | Port stories add related yacht and sailing club links, also with fallback links. |
| Boat reviews link to manufacturer pages | Boat reviews detect the builder name and link to new manufacturer pages such as `/manufacturers/sunseeker`. |
| Race reports link to regatta topics | Race/news stories detect topics such as Cowes Week, Rolex Fastnet, RORC and SailGP and link to matching search pages. |

New supporting routes:

- `/search`
- `/api/search`
- `/manufacturers/[manufacturer]`

## Priority 3: Search

Status: **Implemented and tested against the key examples.**

The new search checks titles, categories, authors, summaries, tags and article body text, with stronger weighting for exact title, tag and summary matches. Multi-word searches are intentionally stricter so common words like "yacht" or "club" do not swamp the results.

| Example search | Matching stories | Top matches from the local archive |
| --- | ---: | --- |
| Cowes Week | 21 | Cowes Week began under a light north‑westerly breeze; Bolney Wine Estate Joins Cowes Week 2025; 199th Cowes Week |
| Rolex Fastnet | 32 | Could a maxi yacht achieve the Rolex Fastnet Race triple?; Rolex Fastnet Race Class40 top guns; The 100th Rolex Fastnet Race |
| Sunseeker | 349 | Sunseeker Superhawk 34 – the Spirit of James Bond; Sunseeker Manhattan 52 - Flybridge; Sunseeker Martinique 36 - An Owner's Review |
| Royal Thames Yacht Club | 4 | Nautical Triumph: Royal Thames Yacht Club Ascends to Greatness in the 2025 Greenwich Women's Cup; Excitement Sets Sail on Day 1 of the Cumberland Cup 2025 at Royal Thames Yacht Club; Royal Thames Yacht Club (RTYC) |

The search page also shows these four examples as easy one-click searches so visitors can immediately test the archive.

## Build Checks

- Lint: passed.
- Full site build: passed.
- Build output includes the search page, search API, story pages, section pages and manufacturer pages.
- Local browser preview: not available in this sandbox because opening a localhost port is blocked, but the route build and archive search scoring were verified locally.

## Remaining Pre-Live SEO Work

- Run a final live redirect smoke test after deployment/network access is working.
- Run a live crawl of `oldseadogs.com` and compare it with `reports/oldseadogs-url-mapping.csv`.
- Keep the dev site blocked from Google until the real site is ready.
