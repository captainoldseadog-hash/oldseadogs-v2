# Old Sea Dogs URL Mapping Report

Generated: 2026-06-10

## Scope

This report maps the imported old OldSeaDogs article archive to the new site structure. The old live sitemap could not be reached from this environment, so the old article URLs preserved in `content/legacy-stories.json` are used as the source of truth for article-level redirects.

## Summary

- Old article URLs mapped: 2,142
- Old article paths with missing source URLs: 0
- Duplicate old article paths found: 0
- New article pattern: `/stories/{new-slug}`
- Recommended redirect status: `301 Permanent Redirect`
- Full mapping CSV: `reports/oldseadogs-url-mapping.csv`

## Main Redirect Rules

| Old path | New path | Status | Notes |
| --- | --- | --- | --- |
| /boat-shows/ | /shows | 301 | Section name changed |
| /racing/ | /races | 301 | Section name changed |
| /boat-reviews/ | /reviews | 301 | Section name changed |
| /news/ | /news | 301 or normalize | Section kept |
| /gear/ | /gear | 301 or normalize | Section kept |
| /destinations/ | /destinations | 301 or normalize | Section kept |
| /masterclass/ | /masterclass | 301 or normalize | Section kept |
| /lifestyle/ | /lifestyle | 301 or normalize | Section kept |
| /clubs/ | /clubs | 301 or normalize | Section kept |
| /ports/ | /ports | 301 or normalize | Section kept |
| /about/ | /about | 301 or normalize | Page kept |
| /privacy/ | /privacy | 301 or normalize | Page kept |

## Article URL Groups

| Old article folder | Article count | New section landing page |
| --- | ---: | --- |
| /news/ | 864 | /news |
| /racing/ | 418 | /races |
| /boat-reviews/ | 400 | /reviews |
| /boat-shows/ | 143 | /shows |
| /lifestyle/ | 113 | /lifestyle |
| /gear/ | 79 | /gear |
| /masterclass/ | 39 | /masterclass |
| /ports/ | 37 | /ports |
| /clubs/ | 36 | /clubs |
| /destinations/ | 13 | /destinations |

All individual article URLs should redirect to their new `/stories/...` URL, not just to the section landing page. This preserves old search value and avoids dumping readers onto broad category pages.

## Sample Article Redirects

| Old path | New path | Status |
| --- | --- | --- |
| /news/monaco-grand-prix-2026-where-superyachts-stole-the-show/ | /stories/news-monaco-grand-prix-2026-where-superyachts-stole-the-show | 301 |
| /boat-reviews/bering-yachts-reveals-interior-designs-of-its-new-explorer-yacht/ | /stories/boat-reviews-bering-yachts-reveals-interior-designs-of-its-new-explorer-yacht | 301 |
| /racing/aco-musto-skiff-world-championship-2026-pre-worlds-showdown-at-carnac/ | /stories/racing-aco-musto-skiff-world-championship-2026-pre-worlds-showdown-at-carnac | 301 |
| /news/ulyssia-a-new-dimension-of-ocean-luxury-set-for-2031/ | /stories/news-ulyssia-a-new-dimension-of-ocean-luxury-set-for-2031 | 301 |
| /news/d%C3%B6rries-yachts-confirms-new-lease-at-volkswerft-stralsund-shipyard/ | /stories/news-dorries-yachts-confirms-new-lease-at-volkswerft-stralsund-shipyard | 301 |
| /news/superyacht-sales-surge-ahead-of-summer-season/ | /stories/news-superyacht-sales-surge-ahead-of-summer-season | 301 |
| /racing/victorious-amidst-controversy-the-87th-bol-dor-du-l%C3%A9man-saga/ | /stories/racing-victorious-amidst-controversy-the-87th-bol-dor-du-leman-saga | 301 |
| /gear/zhik-outlet-introduces-innovative-styles-to-its-collection/ | /stories/gear-zhik-outlet-introduces-innovative-styles-to-its-collection | 301 |
| /boat-reviews/alpha-custom-yachts-unveils-fourth-squalo-100-vessel/ | /stories/boat-reviews-alpha-custom-yachts-unveils-fourth-squalo-100-vessel | 301 |
| /racing/diverse-fleet-converge-for-friday-series-1-at-plym-yacht-club/ | /stories/racing-diverse-fleet-converge-for-friday-series-1-at-plym-yacht-club | 301 |
| /boat-shows/isa-yachts-begins-builds-on-third-unica-45m-steel-superyacht/ | /stories/boat-shows-isa-yachts-begins-builds-on-third-unica-45m-steel-superyacht | 301 |
| /racing/santa-maria-cup-2026-decisive-day-3-sees-semifinals-taking-shape/ | /stories/racing-santa-maria-cup-2026-decisive-day-3-sees-semifinals-taking-shape | 301 |
| /news/worlds-first-fossil-fuel-free-sailing-yacht-revealed-by-vripack/ | /stories/news-worlds-first-fossil-fuel-free-sailing-yacht-revealed-by-vripack | 301 |
| /masterclass/navigating-safely-the-ultimate-guide-for-skippers/ | /stories/masterclass-navigating-safely-the-ultimate-guide-for-skippers | 301 |
| /lifestyle/navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth/ | /stories/lifestyle-navigating-the-seas-of-work-family-loyalty-chronicles-of-captain-guy-booth | 301 |

## New Pages With No Old Equivalent

These should be indexable after launch, but do not need redirects unless the old site had matching pages discovered later:

- /contact
- /cookie-policy
- /terms
- /authors/michael-hodges
- /sitemap.xml
- /robots.txt

## Redirect Implementation Notes

1. Use exact 301 redirects for all 2,142 article paths in the CSV.
2. Add section redirects for old folder names that changed: `/boat-shows/`, `/boat-reviews/`, and `/racing/`.
3. Preserve query strings only if the platform does so automatically; the target content does not require them.
4. Avoid redirect chains. Old article URL should go directly to the final `https://www.oldseadogs.com/stories/...` URL.
5. Before launch, crawl or export the old live sitemap if network access becomes available. Any old pages not in the imported archive should be added to this mapping before switching DNS.
6. Keep `/editor` blocked/private and never include it in redirect targets or the public sitemap.

## Risks / Items To Verify Before DNS Switch

- The live old sitemap was not reachable from this environment, so non-article pages outside the imported archive may still exist.
- Some old URLs contain encoded accented characters; the CSV preserves the original old URL/path exactly.
- The new site currently has launch protection/noindex switched on. Flip that only when redirects and DNS are ready.
