export type GuideConditionsConfig = {
  tide: string;
  tideNote: string;
  tideLink?: { href: string; label: string };
};

export const guideConditions: Record<string, GuideConditionsConfig> = {
  "st-helier": { tide: "none", tideNote: "Official St Helier tide times for the week ahead from Jersey Met.", tideLink: { href: "https://www.gov.je/weather/tidetimes/", label: "Jersey Met tide times" } },
  // West Country: free Admiralty feed not used for this slug — official Dart Harbour tables (checked 26 Oct 2026).
  "dartmouth": { tide: "none", tideNote: "Official Dartmouth tide tables via Dart Harbour (UKHO-based). The forecast graph is in GMT — add an hour in British Summer Time.", tideLink: { href: "https://www.dartharbour.org/forecasts/", label: "Dart Harbour forecasts / tides" } },
  // West Country core six (checked 27 Oct 2026). Free Admiralty feed not used for these slugs — official BBC/UKHO + harbour pages.
  "brixham": {
    tide: "none",
    tideNote: "No separate BBC Brixham row — use Torquay (nearest Tor Bay UKHO station) plus ADMIRALTY EasyTide, and ask Tor Bay Harbour for local advice.",
    tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/25", label: "BBC Weather tide tables — Torquay (UKHO / ADMIRALTY)" },
  },
  "salcombe": {
    tide: "none",
    tideNote: "Official Salcombe tide tables via Salcombe Harbour tidal information, BBC Salcombe, and ADMIRALTY EasyTide. Guide 2026: HW Salcombe 05 h 23 min before Dover.",
    tideLink: { href: "https://www.salcombeharbour.co.uk/tidal-information", label: "Salcombe Harbour — tidal information" },
  },
  "plymouth": {
    tide: "none",
    tideNote: "Official Plymouth (Devonport) tide tables via BBC / UKHO and ADMIRALTY EasyTide. Pair with KHM / marina advice for Sutton lock free-flow windows.",
    tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/14", label: "BBC Weather tide tables — Plymouth (Devonport)" },
  },
  "fowey": {
    tide: "none",
    tideNote: "Official Fowey tide tables via Fowey Harbour (BST-adjusted) plus BBC Fowey and ADMIRALTY EasyTide.",
    tideLink: { href: "https://foweyharbour.co.uk/weather-tides/", label: "Fowey Harbour — weather & tides" },
  },
  "falmouth": {
    tide: "none",
    tideNote: "Official Falmouth tide tables via BBC / UKHO and ADMIRALTY EasyTide. Check Falmouth Harbour Notices for shipping / operational notes.",
    tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/5", label: "BBC Weather tide tables — Falmouth" },
  },
  "helford": {
    tide: "none",
    tideNote: "Official Helford River (Entrance) tide tables via BBC / UKHO and ADMIRALTY EasyTide. Falmouth BBC station is also useful for the bay.",
    tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/4a", label: "BBC Weather tide tables — Helford River (Entrance)" },
  },
  // West Country second wave (checked 28 Oct 2026).
  "torquay": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/25", label: "BBC Weather tide tables — Torquay (UKHO / ADMIRALTY)" } },
  "yealm": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/17", label: "BBC Weather tide tables — River Yealm Entrance" } },
  "mevagissey": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/7", label: "BBC Weather tide tables — Mevagissey" } },
  "st-mawes": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/5", label: "BBC Weather tide tables — Falmouth (nearest station; no St Mawes row)" } },
  "newlyn": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/2", label: "BBC Weather tide tables — Penzance (Newlyn)" } },
  "padstow": { tide: "none", tideNote: "Official tide tables via BBC / UKHO and ADMIRALTY EasyTide. Confirm local advice with the harbour office.", tideLink: { href: "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/545", label: "BBC Weather tide tables — Padstow" } },
  "wroxham-hoveton": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:30 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "horning": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "ranworth": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences. Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "how-hill-ludham": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "stalham": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +5:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "hickling": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences. Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "potter-heigham": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "acle": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +3:30 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "great-yarmouth": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +1:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "reedham": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +2:30 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "brundall": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "norwich": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:30 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "beccles": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "oulton-broad": {tide: "none", tideNote: "Broads Authority tide table for Gorleston plus inland differences (HW about +4:00 here). Not for navigation — confirm with Broads Control on 01603 756056.", tideLink: {href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information"}},
  "norfolk-broads": { tide: "none", tideNote: "Broads Authority tide table for Gorleston (Yarmouth Bar) plus inland high-water differences. Confirm with Broads Control on 01603 756056.", tideLink: { href: "https://www.broads-authority.gov.uk/boating/navigating-the-broads/tide-information", label: "Broads Authority — Tide information" } },
};
