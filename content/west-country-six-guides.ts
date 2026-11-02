import type { FlagshipGuide, GuideSection } from "./flagship-guides.ts";

/**
 * West Country core six harbour drafts (unpublished).
 * Shape matches the Dartmouth west-country-guides patch helpers.
 * Salcombe visitor fees from Guide 2026 PDF (re-check 27 Oct 2026).
 * Tide figures are not copied in; pages link official tables.
 * Plymouth = one page (Sutton/Barbican) + brief Mayflower + Yacht Haven.
 * Helford is honest about no statutory harbour office.
 */

const checkedOn = "2026-10-27";
const artworkCredit = "Artwork supplied by Old Sea Dogs";
const easyTide = "https://easytide.admiralty.co.uk/";

const bbcTorquay = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/25";
const bbcSalcombe = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/20";
const bbcDevonport = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/14";
const bbcFowey = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/8";
const bbcFalmouth = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/5";
const bbcHelford = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/4a";

const salcombeTidal = "https://www.salcombeharbour.co.uk/tidal-information";
const foweyTides = "https://foweyharbour.co.uk/weather-tides/";

function section(
  heading: string,
  body: string[],
  extras: { listItems?: string[]; links?: GuideSection["links"]; kind?: GuideSection["kind"] } = {},
): GuideSection {
  return {
    heading,
    anchor: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    kind: extras.kind ?? (heading === "Old Sea Dogs View" || heading === "Skipper's Notes" ? "callout" : "prose"),
    body,
    listItems: extras.listItems,
    links: extras.links,
  };
}

const brixhamTideLinks: GuideSection["links"] = [
  { label: "BBC Weather tide tables — Torquay (nearest Tor Bay station; no separate Brixham row)", guideSlug: "", href: bbcTorquay },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

const salcombeTideLinks: GuideSection["links"] = [
  { label: "Salcombe Harbour — tidal information", guideSlug: "", href: salcombeTidal },
  { label: "BBC Weather tide tables — Salcombe (UKHO / ADMIRALTY)", guideSlug: "", href: bbcSalcombe },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

const plymouthTideLinks: GuideSection["links"] = [
  { label: "BBC Weather tide tables — Plymouth (Devonport)", guideSlug: "", href: bbcDevonport },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
  { label: "King’s Harbour Master Plymouth", guideSlug: "", href: "https://www.royalnavy.mod.uk/khm/plymouth/" },
];

const foweyTideLinks: GuideSection["links"] = [
  { label: "Fowey Harbour — weather & tides", guideSlug: "", href: foweyTides },
  { label: "BBC Weather tide tables — Fowey", guideSlug: "", href: bbcFowey },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

const falmouthTideLinks: GuideSection["links"] = [
  { label: "BBC Weather tide tables — Falmouth", guideSlug: "", href: bbcFalmouth },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

const helfordTideLinks: GuideSection["links"] = [
  { label: "BBC Weather tide tables — Helford River (Entrance)", guideSlug: "", href: bbcHelford },
  { label: "BBC Weather tide tables — Falmouth (bay)", guideSlug: "", href: bbcFalmouth },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

const brixhamSources = [
  { label: "Tor Bay Harbour Authority — Contact", href: "https://www.tor-bay-harbour.co.uk/about/contact/" },
  { label: "Tor Bay Harbour Authority — Visitors", href: "https://www.tor-bay-harbour.co.uk/visitors/" },
  { label: "Tor Bay Harbour Authority — Visitor moorings", href: "https://www.tor-bay-harbour.co.uk/visitors/visitor-moorings/" },
  { label: "Tor Bay Harbour Authority — Brixham harbour facilities", href: "https://www.tor-bay-harbour.co.uk/our-harbours/brixham/harbour-facilities/" },
  { label: "Tor Bay Harbour Maritime Guide (PDF)", href: "https://www.tor-bay-harbour.co.uk/media/1080/harbour-guide.pdf" },
  { label: "MDL Brixham Marina — directions", href: "https://www.mdlmarinas.co.uk/marinas/mdl-brixham-marina/directions/" },
  { label: "BBC / UKHO Torquay tide tables", href: bbcTorquay },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

const salcombeSources = [
  { label: "Salcombe Harbour Authority", href: "https://www.salcombeharbour.co.uk/" },
  { label: "Salcombe Harbour — Contact", href: "https://www.salcombeharbour.co.uk/contact-us" },
  { label: "Salcombe Harbour — Rates / charges", href: "https://www.salcombeharbour.co.uk/rates-charges" },
  { label: "Salcombe Harbour Guide 2026 (PDF)", href: "https://www.salcombeharbour.co.uk/_files/ugd/ab704c_e5c6dd064b114c75bc3cdf278eb9c52d.pdf" },
  { label: "Salcombe Harbour — Pilotage", href: "https://www.salcombeharbour.co.uk/pilotage" },
  { label: "Salcombe Harbour — Tidal information", href: salcombeTidal },
  { label: "Salcombe Harbour — Fuel barge", href: "https://www.salcombeharbour.co.uk/bunkering-fuel-barge" },
  { label: "BBC / UKHO Salcombe tide tables", href: bbcSalcombe },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

const plymouthSources = [
  { label: "King’s Harbour Master Plymouth — Using the port for recreation", href: "https://www.royalnavy.mod.uk/khm/plymouth/using-the-port-for-recreation" },
  { label: "King’s Harbour Master Plymouth", href: "https://www.royalnavy.mod.uk/khm/plymouth/" },
  { label: "Plymouth MPA — Entering Plymouth by boat", href: "https://www.plymouth-mpa.uk/entering-plymouth-by-boat" },
  { label: "Sutton Harbour Marina", href: "https://suttonharbourgroup.com/sutton-harbour-marina/" },
  { label: "Sutton Harbour — Visitor berths", href: "https://suttonharbourgroup.com/visitor-berths-sutton-harbour-plymouth/" },
  { label: "Mayflower Marina handbook (PDF)", href: "https://mayflowermarina.co.uk/wp-content/uploads/2023/06/MM-Handbook-2025-web-LINKED.pdf" },
  { label: "Plymouth Yacht Haven — visitor berthing", href: "https://www.yachthavens.com/plymouth-yacht-haven/berthing/visitor-berthing" },
  { label: "BBC / UKHO Plymouth (Devonport) tide tables", href: bbcDevonport },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

const foweySources = [
  { label: "Fowey Harbour Commissioners — Visitor facilities", href: "https://foweyharbour.co.uk/visitor-facilities/" },
  { label: "Fowey Harbour — Contact", href: "https://foweyharbour.co.uk/contact/" },
  { label: "Fowey Harbour — Safety", href: "https://foweyharbour.co.uk/safety/" },
  { label: "Fowey Harbour — Weather & tides", href: foweyTides },
  { label: "Fowey Harbour Guide 2026 (PDF)", href: "https://foweyharbour.co.uk/wp-content/uploads/2026/04/HarbourGuideFinal-Web.pdf" },
  { label: "BBC / UKHO Fowey tide tables", href: bbcFowey },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

const falmouthSources = [
  { label: "Falmouth Harbour — Visitors’ moorings and anchoring", href: "https://falmouthharbour.co.uk/visitors/visitors-moorings-and-anchoring/" },
  { label: "Falmouth Harbour — Contact", href: "https://falmouthharbour.co.uk/contact/" },
  { label: "Falmouth Haven Visitors Guide (PDF)", href: "https://falmouthharbour.co.uk/wp-content/uploads/2025/12/FH_VisGuide2021-amendments-V4-Final.pdf" },
  { label: "Port Pendennis Marina — location", href: "https://www.portpendennis.co.uk/location" },
  { label: "BBC / UKHO Falmouth tide tables", href: bbcFalmouth },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

const helfordSources = [
  { label: "Helford River Moorings — Visitor moorings", href: "https://www.helfordrivermoorings.co.uk/visitor-moorings" },
  { label: "Helford River Moorings — Pilotage", href: "https://www.helfordrivermoorings.co.uk/pilotage" },
  { label: "Helford River Moorings — Local services", href: "https://www.helfordrivermoorings.co.uk/local-services" },
  { label: "Helford River Moorings — FAQs", href: "https://www.helfordrivermoorings.co.uk/faqs" },
  { label: "BBC / UKHO Helford River (Entrance) tide tables", href: bbcHelford },
  { label: "BBC / UKHO Falmouth tide tables", href: bbcFalmouth },
  { label: "ADMIRALTY EasyTide", href: easyTide },
];

export const westCountrySixGuideSeeds: FlagshipGuide[] = [
  {
    internalId: "OSD-G182",
    slug: "brixham",
    title: "Brixham",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A working Tor Bay fishing port under Berry Head — Authority visitor pontoon first-come, MDL marina on Channel 80, and a colourful town within a short walk of the quay.",
    introduction:
      "Brixham is the Tor Bay stop east of Dartmouth: breakwater and fishing fleet character, colourful houses on the hill, and a harbour that still earns its living. Tor Bay Harbour Authority runs the visitor pontoon on a first-come basis; MDL Brixham Marina is the private full-service option on Channel 80. Call Brixham Harbour on VHF Channel 14 for Authority berthing advice before you commit.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "South Devon · Tor Bay",
    parentGuideSlug: "west-country",
    editorialOrder: 3,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-brixham-v1.png",
    imageAlt: "Painting of Brixham harbour with colourful hillside houses and boats in the outer harbour.",
    imageFocalPoint: "48% 44%",
    imageCaption: "Brixham, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · South Devon · Tor Bay" },
      { label: "Harbour Authority", value: "Tor Bay Harbour Authority (Torbay Council)" },
      { label: "Harbour Office", value: "New Fish Quay, Brixham, Devon TQ5 8AW" },
      { label: "Telephone", value: "01803 208443" },
      { label: "Email", value: "harbour.authority@torbay.gov.uk" },
      { label: "Harbour VHF", value: "Channel 14 — call sign Brixham Harbour" },
      { label: "Private marina VHF", value: "Channel 80 — call Brixham Marina (MDL)" },
      { label: "Office hours", value: "Typically 08:00–16:00 Mon–Fri — confirm seasonally" },
      { label: "Out of hours (urgent)", value: "Tor Bay Harbour security 07768 553881" },
      { label: "Coastguard / emergency", value: "VHF Ch 16 · 999 → Coastguard" },
      { label: "Visitor pontoon", value: "Not bookable; first-come. Free short stay for the first two hours, then daily Authority rates." },
      { label: "Depths & tides", value: "Confirm with the harbour office or marina. BBC lists Torquay (no separate Brixham row) plus EasyTide." },
    ],
    sections: [
      section("Setting & Character", [
        "Brixham sits under Berry Head on the south side of Tor Bay — a proper fishing port with the fish quay still busy, colourful houses cascading down the hillside, and the breakwater giving shelter from westerlies. It is a natural Tor Bay night before or after the Dart hop, and a useful fuel and provisions stop when the fleet is not filling every gap.",
      ]),
      section("Arrival by Sea", [
        "Close Tor Bay on a current chart with Berry Head as the coastal landmark. Inside the enclosed harbour the Authority’s approach outline is: follow the main fairway with the MDL marina to port and the fishing basin to starboard; the Authority visitor pontoon is the one to the right of the pair ahead. Keep clear of MFVs and fish-market traffic.",
        "Call Brixham Harbour on VHF Ch 14 for berthing instructions. If you are aiming for MDL Brixham Marina, call Brixham Marina on Ch 80 before entering. Tor Bay gives shelter from westerlies; the enclosed harbour still wants local advice in strong easterlies or swell.",
      ]),
      section("Berthing Experience", [
        "The Tor Bay Harbour Authority visitor pontoon (Town / Authority pontoon) is not bookable — first-come, limited space, and rafting is common when busy. Short stays on the visitor pontoons are free for the first two hours; after that daily rates apply. Confirm the current tariff on the Authority visitors pages before arrival rather than relying on an old figure.",
        "Anchorage in Tor Bay is free for private vessels; avoid seagrass and do not anchor inside the enclosed harbours or approaches. Seasonal visitor buoys at Fishcombe Cove support seagrass protection — follow Authority advice.",
        "Drying berths and scrub facilities in the Inner Harbour are bookable with the office; published drying figures are orientation only — confirm depths and tide times with harbour staff before you use them.",
        "MDL Brixham Marina (Berry Head Road, TQ5 9BW) is the private marina option: telephone 01803 882929, VHF Ch 80. Call before entering. Diesel is listed at the marina fuel station — confirm products and hours with the marina. Harbour dues and marina berthing are separate matters; check both.",
      ]),
      section("Facilities Afloat", [
        "Water and electricity are available on the Authority visitor pontoon; electricity cards come from the Harbour or Fish Quay security office — card prices change, so confirm on the day. Town shops and pubs are about a ten-minute walk from the quay. MDL offers the usual full-service marina set — confirm showers, laundry and Wi-Fi with them if that is your plan.",
      ]),
      section("Marine Services", [
        "Fuel for Authority visitors is best confirmed with Tor Bay Harbour or MDL on the day. Engineers, chandlery and yard services sit around the fishing port and marina — always confirm insurance and harbour requirements with Tor Bay Harbour Authority before arrival.",
      ]),
      section("Ashore", [
        "Brixham town has shops, fish restaurants and the working quay atmosphere that makes Tor Bay feel different from the quieter river harbours further west. Berry Head country park and the coast path are the natural walk if the crew wants stretch after a passage.",
      ]),
      section("Best For", [
        "A Tor Bay working-harbour stop with town within walking distance.",
      ], {
        listItems: [
          "Crews hopping between Torbay and the Dart",
          "Skippers who want a fishing-port night rather than a marina-only scene",
          "Short stays on the Authority pontoon (first two hours free)",
          "Full-service berthing at MDL when the Authority pontoon is full",
        ],
      }),
      section("Less Suitable For", [
        "It is a busy commercial fishing harbour, and Authority space is limited.",
      ], {
        listItems: [
          "Skippers expecting a quiet empty pontoon in peak season without rafting",
          "Anyone treating drying Inner Harbour berths as all-tide without office advice",
          "Crews who want a deep wooded river night — that is Dartmouth or Salcombe",
        ],
      }),
      section("History & Local Character", [
        "Brixham grew as Tor Bay’s fishing capital and still lands the catch that shapes the harbour. The breakwater, Berry Head and the colourful hillside streets are the postcard; the fish quay is the working heart.",
      ]),
      section("Nearby Cruising", [
        "Dartmouth on the River Dart lies west-southwest after Start Bay / the coast hop. Torbay, Torquay and Paignton share the bay. Further west the West Country chain runs Salcombe, Plymouth, Fowey, Falmouth and the Helford.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Dartmouth", guideSlug: "dartmouth" },
          { label: "Salcombe", guideSlug: "salcombe" },
        ],
      }),
      section("Skipper's Notes", [
        "Radio, fishing traffic and the Torquay tide tables are the plan.",
      ], {
        listItems: [
          "Call Brixham Harbour Ch 14 early; MDL visitors also call Ch 80 before entry.",
          "Keep clear of MFVs and the fish-market fairway.",
          "Authority pontoon is first-come — expect rafting when busy.",
          "BBC has Torquay tides, not a separate Brixham row — use that plus EasyTide.",
          "Confirm drying berths and electricity-card prices with the office.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Brixham is Tor Bay done properly: fishing boats, colourful houses, and a harbour voice on Ch 14 before you slot onto the pontoon.",
      ]),
      section("Tides & Weather", [
        "There is no separate BBC Brixham tide row. Use the BBC Torquay tables (nearest listed Tor Bay UKHO station), ADMIRALTY EasyTide, and Tor Bay Harbour advice for local timing. Pair the official tide links with a current forecast before you leave Dartmouth or the Channel coast.",
      ], { links: brixhamTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026. Operational details can change — confirm with the harbour office or marina before arrival."],
        { listItems: brixhamSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Call Brixham Harbour on VHF Ch 14 before you commit to the Authority pontoon.",
      "If aiming for MDL, call Brixham Marina on Ch 80 before entering.",
      "Keep clear of fishing vessels and fish-quay traffic.",
      "Use BBC Torquay tide tables and EasyTide — there is no separate BBC Brixham row.",
      "Confirm Authority daily rates after the free first two hours on the visitors page.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: brixhamSources,
    verifiedFacilities: [],
    location: { latitude: 50.400, longitude: -3.514, mapZoom: 14 },
    relatedGuideSlugs: ["torquay", "west-country", "dartmouth", "salcombe"],
    cruiseOnGuideSlugs: ["dartmouth", "west-country"],
    previousGuideSlug: "torquay",
    nextGuideSlug: "dartmouth",
    seoTitle: "Brixham Guide | Old Sea Dogs",
    seoDescription:
      "A working Tor Bay fishing port under Berry Head — Authority visitor pontoon first-come, MDL marina on Channel 80, and a colourful town within a short walk of the quay.",
    socialTitle: "Brixham — Old Sea Dogs Guides",
    socialDescription: "Brixham and Tor Bay: Brixham Harbour on Ch 14, first-come Authority pontoon, and MDL on Ch 80.",
    canonicalPath: "/guides/west-country/brixham",
    editorialNotes: "Torquay BBC tide station is intentional — no BBC Brixham listing.",
    researchNotes: "Authority tariff bands snapshotted 27 Oct 2026 but draft points skippers to the live tariff page rather than hard-coding £ figures.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Fees, office hours and electricity-card prices change. Confirm on the day.",
    sourceNotes: "Tide links only (Torquay BBC + EasyTide). No UKHO heights stored on this page.",
    draftComments: "",
  },
  {
    internalId: "OSD-G183",
    slug: "salcombe",
    title: "Salcombe",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A steep wooded Devon estuary west of Start Point — visitor buoys and pontoons under the town, Whitestrand walk-ashore by arrangement, and a bar that wants respect in onshore swell.",
    introduction:
      "Salcombe is the classic next river harbour west of Dartmouth: green hills, the town climbing above Whitestrand, and visitor moorings between Mill Bay and the fuel barge. Salcombe Harbour Authority runs the harbour on VHF Channel 14. Visitors from the sea generally cannot pre-book, except overnight walk-ashore on Whitestrand when available. Call early in the season — it fills.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "South Devon",
    parentGuideSlug: "west-country",
    editorialOrder: 4,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-salcombe-v1.png",
    imageAlt: "Painting of Salcombe harbour with wooded hills and boats off the town.",
    imageFocalPoint: "50% 42%",
    imageCaption: "Salcombe, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · South Devon" },
      { label: "Harbour Authority", value: "Salcombe Harbour Authority (South Hams / SW Devon)" },
      { label: "Harbour Office", value: "Whitestrand, Salcombe, Devon TQ8 8BU" },
      { label: "Telephone", value: "01548 843791" },
      { label: "Email", value: "salcombe.harbour@swdevon.gov.uk" },
      { label: "Harbour VHF", value: "Channel 14 — Harbour / Boatman" },
      { label: "Water taxi VHF", value: "Channel 12 · 07807 643879" },
      { label: "Office hours (2026)", value: "Mon–Thu 09:00–16:45, Fri 09:00–16:15; 4 Apr–20 Sep also Sat 09:00–16:15, Sun 09:00–13:00" },
      { label: "Out of hours (critical harbour)", value: "01803 861539" },
      { label: "Charts", value: "Admiralty 28 & 1613 (Guide 2026); Imray Y48, Y43 & C6" },
      { label: "Bar", value: "Least depth 0.5 m LAT (Guide 2026) — do not cross on an ebb with strong onshore wind or swell" },
      { label: "HW Salcombe", value: "05 h 23 min before Dover (Guide 2026)" },
      { label: "Insurance", value: "Third-party £3,000,000 required (Guide 2026)" },
      { label: "Coastguard / emergency", value: "VHF Ch 16 · 999 → Coastguard" },
    ],
    sections: [
      section("Setting & Character", [
        "Salcombe sits in a steep wooded estuary opening to the Channel west of Start Point and Prawle. The town climbs above the waterfront; East Portlemouth faces it across the reach; further up, The Bag and the Kingsbridge stretch turn the harbour into a proper Devon river night. In high summer it is one of the busiest leisure harbours on the south coast.",
      ]),
      section("Arrival by Sea", [
        "Use Admiralty charts 28 and 1613 (Guide 2026). The bar has a least depth of 0.5 m LAT — do not negotiate it on an ebb with strong onshore wind or swell. The entrance leading line is 000°T; the rear beacon Dir Fl WRG.2s has a white sector 357°–002°T. Once Blackstone Rock is abeam to starboard, the fairway runs 042°T on the transit lights near Scoble Point. Harbour pilotage pages and the Guide 2026 PDF are the references to keep open.",
        "Call Salcombe Harbour on VHF Ch 14 for berthing advice. Speed limits are 6 or 8 knots (minimise wake). Vessels over 14 m should contact the Harbour Office in advance.",
      ]),
      section("Berthing Experience", [
        "Visitors from the sea use swinging moorings and isolated pontoons. From-sea moorings generally cannot be pre-booked, except overnight or restricted-hours walk-ashore on Whitestrand (extra charge; typically about two vessels, 19:00–08:00, draught and tide dependent).",
        "Visitor “V” buoys between Mill Bay and the Fuel Barge are orange up to 10 m LOA and yellow over 10 m. A large visitors’ pontoon with yellow pile caps lies in The Bag, northwest of Scoble Point. Anchoring is allowed off Town/Fishermans Beach and Smalls Cove (avoid the yacht-club start when in use), and further up near Saltstone north of The Bag — not in mid-fairway or ferry/cable crossings.",
        "Normandy Pontoon (east side) is short-stay water and provisions — about half an hour at busy times. Tenders from sea visitors up to 3.65 m may use the west (shoreside) Normandy face, not overnight. Unattended overnight needs prior Harbour Master permission and is not guaranteed. Stays beyond 14 days without a break need the Harbour Office.",
        "Kingsbridge, upriver, is a tide-planned hop — roughly 2½ hours either side of high water, for draft under about 2 m and LOA under about 11 m if prepared to take the ground. It is not available October–March; check the office. Fees and dues remain payable.",
        "Visitor-from-sea charges (Salcombe Harbour Guide 2026, inc VAT; length rounded up to the nearest metre; overnight charged day by day with no weekly discount): anchorage year-round £1.15 per metre (harbour dues only). Moorings on swinging buoys and isolated pontoons (may be rafted) — 1 October–31 March £1.15 per metre (dues only); 1 April–31 May and 1 September–30 September £1.84 per metre (dues and discounted mooring); 1 June–31 August £2.30 per metre (dues and mooring). Alongside or walk-ashore when available, with no rafting, is an extra £1 per metre on top of the band above. Short-stay pricing is available — confirm the amount with the Harbour Office (Guide 2026 does not list the short-stay figure on the Visitors Charges page).",
      ]),
      section("Facilities Afloat", [
        "Water and provisions runs use Normandy Pontoon on a short-stay basis. The harbour water taxi runs on VHF Ch 12 (07807 643879); Guide 2026 lists seasonal hours and per-person charges — confirm on the day. Batson Boat Park supports trailer and yard activity on published seasonal hours.",
      ]),
      section("Marine Services", [
        "Diesel and petrol come from the Fuel Barge — VHF Channel 6, call sign Fuel Barge, telephone 07801 798862. Guide 2026 lists hours as seven days, 08:30–17:00, April–September. October–March hours are not stated in the Guide — call the barge or Harbour Office before relying on winter fuel.",
        "Local yards, engineers and chandlery serve the estuary; confirm insurance (£3,000,000 third-party required by the Guide) and harbour requirements before arrival.",
      ]),
      section("Ashore", [
        "Salcombe town has shops, pubs and restaurants above Whitestrand and along the steep streets. East Portlemouth and the ferry crossing are part of the harbour scene. Further up, The Bag and the Kingsbridge run are quieter once you leave the town reach.",
      ]),
      section("Best For", [
        "A classic Devon estuary night west of Dartmouth.",
      ], {
        listItems: [
          "Crews hopping west from Dartmouth after Start Point / Prawle",
          "Skippers happy on swinging “V” buoys or The Bag pontoon",
          "Walk-ashore Whitestrand overnight when booked and tide allows",
          "A tide-aware run toward Kingsbridge in season",
        ],
      }),
      section("Less Suitable For", [
        "The bar, the crowds and the no-pre-book rule shape who it suits.",
      ], {
        listItems: [
          "Deep-draught arrivals planning to cross the bar on an ebb in onshore swell",
          "Skippers who need a guaranteed pre-booked town berth in August without Whitestrand arrangement",
          "Unattended overnight without prior Harbour Master permission",
        ],
      }),
      section("History & Local Character", [
        "Salcombe grew as a sheltered estuary port and later as one of the West Country’s favourite yacht harbours. The wooded banks, Whitestrand and the Bag still set the scene; Kingsbridge at the head of the navigation is a different, tide-critical outing.",
      ]),
      section("Nearby Cruising", [
        "Dartmouth and Start Bay lie to the east; Plymouth Sound is the next major hop west. Prawle Point National Coastwatch (01548 511259 / VHF 65 per Guide useful numbers) watches the coastwise stretch.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Dartmouth", guideSlug: "dartmouth" },
          { label: "Plymouth", guideSlug: "plymouth" },
        ],
      }),
      section("Skipper's Notes", [
        "Bar, radio and Guide 2026 fees are the plan.",
      ], {
        listItems: [
          "Charts 28 & 1613; leading line 000°T; respect the 0.5 m LAT bar.",
          "Call Harbour Ch 14. Over 14 m — phone ahead.",
          "From-sea moorings are not pre-booked except Whitestrand overnight walk-ashore.",
          "Fuel barge Ch 6, Apr–Sep 08:30–17:00; winter hours — ask.",
          "HW Salcombe 05 h 23 min before Dover; use harbour tidal info + BBC + EasyTide.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Salcombe is the Devon river postcard west of the Dart: wooded banks, a careful bar crossing, and supper ashore once you are on a “V” buoy under the town.",
      ]),
      section("Tides & Weather", [
        "Guide 2026 gives HW Salcombe 05 h 23 min before Dover, with a maximum range of 5.7 m (mean springs about 4.7 m, mean neaps about 2.2 m). Use the harbour tidal-information page, BBC Salcombe tables and ADMIRALTY EasyTide rather than copied heights. The Harbour Office posts a daily weather note outside; NCI Prawle Point is on the coastwise stretch.",
      ], { links: salcombeTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026, including the Salcombe Harbour Guide 2026 PDF. Operational details can change — confirm with the harbour office before arrival."],
        { listItems: salcombeSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Use Admiralty 28 & 1613; respect the bar (0.5 m LAT) in onshore swell on the ebb.",
      "Call Salcombe Harbour on VHF Ch 14 for berthing advice.",
      "Treat from-sea moorings as unbookable except Whitestrand overnight walk-ashore.",
      "Confirm visitor bands from Guide 2026; ask the office for short-stay pricing.",
      "Fuel barge Apr–Sep hours only in Guide 2026 — call for winter.",
      "Use Salcombe tidal information, BBC Salcombe and EasyTide.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: salcombeSources,
    verifiedFacilities: [],
    location: { latitude: 50.239, longitude: -3.768, mapZoom: 14 },
    relatedGuideSlugs: ["yealm", "west-country", "dartmouth", "plymouth"],
    cruiseOnGuideSlugs: ["plymouth", "dartmouth"],
    previousGuideSlug: "dartmouth",
    nextGuideSlug: "yealm",
    seoTitle: "Salcombe Guide | Old Sea Dogs",
    seoDescription:
      "A steep wooded Devon estuary west of Start Point — visitor buoys and pontoons under the town, Whitestrand walk-ashore by arrangement, and a bar that wants respect in onshore swell.",
    socialTitle: "Salcombe — Old Sea Dogs Guides",
    socialDescription: "Salcombe Harbour: Ch 14, Guide 2026 visitor bands, and official tide links.",
    canonicalPath: "/guides/west-country/salcombe",
    editorialNotes: "Fees from Guide 2026 re-check 27 Oct 2026. Short-stay £ and Oct–Mar fuel hours omitted as exact figures.",
    researchNotes: "PDF saved locally as salcombe-harbour-guide-2026.pdf; fees recheck notes in salcombe-fees-recheck-2026-10-27.md.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Short-stay amount and winter fuel hours uncertain. Confirm Whitestrand availability on the day.",
    sourceNotes: "Tide links only. Guide Dover offset quoted; no UKHO height table stored on the page.",
    draftComments: "",
  },

  {
    internalId: "OSD-G184",
    slug: "plymouth",
    title: "Plymouth",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A naval sound with a leisure arrival at Sutton Harbour’s Barbican lock — Mayflower Marina and Plymouth Yacht Haven as brief alternatives, under King’s Harbour Master control of the Dockyard Port.",
    introduction:
      "Plymouth Sound is the major hop west of Salcombe: Drake’s Island, commercial and naval traffic, and a choice of leisure berths. This guide focuses on Sutton Harbour at the Barbican — the historic lock into the Mayflower Steps waterfront — with short notes on Mayflower Marina and Plymouth Yacht Haven. Keep a listening watch for Longroom Port Control and do not impede large vessels constrained to the channel.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "South Devon · Plymouth Sound",
    parentGuideSlug: "west-country",
    editorialOrder: 5,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-plymouth-v1.png",
    imageAlt: "Painting of Plymouth Sound (or the Barbican lock) with boats and the historic waterfront.",
    imageFocalPoint: "48% 46%",
    imageCaption: "Plymouth, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · Plymouth Sound" },
      { label: "Dockyard Port", value: "King’s Harbour Master (KHM) Plymouth" },
      { label: "VTS / movements", value: "Longroom Port Control — VHF Ch 13 & 14" },
      { label: "Recreational watch", value: "Keep VHF tuned to Ch 14; emergency / unsure → Ch 14 or 16" },
      { label: "Primary leisure focus", value: "Sutton Harbour Marina — Barbican / lock (VHF Ch 12)" },
      { label: "Sutton Marina telephone", value: "01752 204702 · marina@sutton-harbour.co.uk" },
      { label: "Chart", value: "Admiralty Chart 30 (Plymouth Sound and Approaches) — current edition" },
      { label: "Coastguard / emergency", value: "VHF Ch 16" },
      { label: "Depths & tides", value: "Confirm with marina / lock and BBC Devonport + EasyTide. Lock free-flow windows are tide-dependent." },
    ],
    sections: [
      section("Setting & Character", [
        "Plymouth mixes naval dockyard, commercial shipping and leisure berths around a wide sound. Drake’s Island and Mount Edgcumbe frame the western approaches; the Barbican and Mayflower Steps sit behind Sutton lock on the Cattewater side. One harbour pin is enough for Old Sea Dogs — this page does not stub every marina in the Sound.",
      ]),
      section("Arrival by Sea", [
        "Admiralty Chart 30 is the master for Plymouth Sound and Approaches. Watch tankers and bulk carriers in the Cattewater approaches to the eastern marinas; on the western side expect Millbay ferries, Devonport naval traffic and strong streams in The Narrows. The Bridge (Drake’s Island–Mount Edgcumbe shortcut) is narrow, well lit and strongly tidal — marina advice is favourable conditions, often under power; use the chart for depths and obstructions.",
        "Call Longroom Port Control on VHF Ch 13 or 14 as required for movements information. Keep Ch 14 for recreational awareness. Do not impede large vessels constrained to the channel (COLREGS Rule 9).",
        "For Sutton Harbour, call Sutton Lock / the marina on VHF Ch 12. The lock is double-gated, published about 44 m by 12 m, free of charge and staffed 24 hours; free flow is commonly about three hours either side of high water when the gates are open — confirm on the day. Flood-gate procedures at extreme high levels should be confirmed with the lock.",
      ]),
      section("Berthing Experience", [
        "Sutton Harbour Marina is the practical visitor focus of this guide: historic Barbican waterfront, Mayflower Steps character, and guaranteed depth inside the lock. Marina office hours are often published around 08:00–18:00 daily while the lock remains 24/7 — confirm both. Telephone 01752 204702; lock phone numbers are widely published for out-of-hours — confirm the current number with the marina before you rely on it.",
        "Mayflower Marina (west / Millbay side) is a brief alternative: VHF Ch 80 call Mayflower Marina (handbook notes a working channel after contact), telephone 01752 556633. Full-tide access with strong streams in the approaches. Charts cited in the marina handbook include Admiralty 30, Stanford and Imray C14.",
        "Plymouth Yacht Haven at Mount Batten is the other brief alternative: VHF Ch 80 call Plymouth Yacht Haven, telephone 01752 404231, plymouth@yachthavens.com. All-tide access with no lock; visitor berths and a fuel station are published — confirm products and hours. Queen Anne’s Battery, King Point / Millbay and Royal William Yard are named only so you know they exist — not as separate Old Sea Dogs pages.",
      ]),
      section("Facilities Afloat", [
        "Sutton publishes fuel and pump-out on site in visitor material — confirm products and hours with the marina. Mayflower and Yacht Haven offer full-service marina facilities; Yacht Haven cites diesel availability on its visitor pages — confirm before arrival.",
      ]),
      section("Marine Services", [
        "Plymouth has extensive yard, engineering and chandlery support around the Sound. Always confirm insurance and any Dockyard Port requirements via KHM notices before arrival.",
      ]),
      section("Ashore", [
        "The Barbican and Mayflower Steps are the historic shore for Sutton visitors — pubs, restaurants and the old harbour streets within a short walk of the marina. The Hoe and the wider city are easy if the crew wants a longer run ashore.",
      ]),
      section("Best For", [
        "A Sound arrival with a lock-in town berth at the Barbican.",
      ], {
        listItems: [
          "Crews crossing from Salcombe or eastbound from Fowey who want a city / historic harbour night",
          "Skippers happy to work a tidal lock (Sutton) or an all-tide marina (Mayflower / Yacht Haven)",
          "Anyone who will keep a proper VHF watch in a Dockyard Port",
        ],
      }),
      section("Less Suitable For", [
        "It is a busy naval and commercial sound, not a quiet creek.",
      ], {
        listItems: [
          "Skippers unwilling to share water with ships and ferries",
          "Anyone treating The Bridge as a casual shortcut without chart and stream awareness",
          "Crews wanting a single quiet river buoy under trees — use Helford or Fowey upriver instead",
        ],
      }),
      section("History & Local Character", [
        "Plymouth’s harbour story runs from the Mayflower Steps and Barbican merchants through the Dockyard Port to today’s mix of naval, commercial and yacht traffic. Sutton lock keeps the historic basin alive for visiting yachts without pretending the Sound is a sleepy river.",
      ]),
      section("Nearby Cruising", [
        "Salcombe lies east; Fowey is the first classic Cornish river harbour to the west. Inside the Sound, treat every marina approach as its own pilotage problem on Chart 30.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Salcombe", guideSlug: "salcombe" },
          { label: "Fowey", guideSlug: "fowey" },
        ],
      }),
      section("Skipper's Notes", [
        "Chart 30, Ch 14 and the lock call are the plan.",
      ], {
        listItems: [
          "Listen on Ch 14; call Longroom as required; never impede channel-bound ships.",
          "Sutton: Ch 12 for the lock — confirm free-flow and flood-gate status.",
          "Mayflower or Yacht Haven: Ch 80, and allow for streams.",
          "Use BBC Devonport tides and EasyTide; pair with marina lock advice.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Plymouth is the Sound done for visitors: keep clear of the big ships, call the lock on Ch 12, and step ashore at the Barbican.",
      ]),
      section("Tides & Weather", [
        "Use BBC Plymouth (Devonport) tide tables and ADMIRALTY EasyTide. Pair heights and streams with King’s Harbour Master notices and marina advice for Sutton lock free-flow windows. Shipping movements and local Notices to Mariners sit on the KHM Plymouth pages.",
      ], { links: plymouthTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026. Operational details can change — confirm with KHM, the lock or the marina before arrival. Admiralty Chart 30 is the chart to work from."],
        { listItems: plymouthSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Work Admiralty Chart 30; keep a listening watch on VHF Ch 14.",
      "Call Sutton Lock on Ch 12 if that is your berth; confirm free-flow timing.",
      "Do not impede large vessels constrained to the channel.",
      "Use BBC Devonport tide tables and EasyTide.",
      "Treat Mayflower and Yacht Haven as brief alternatives — call Ch 80.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: plymouthSources,
    verifiedFacilities: [],
    location: { latitude: 50.365, longitude: -4.133, mapZoom: 13 },
    relatedGuideSlugs: ["yealm", "west-country", "salcombe", "fowey"],
    cruiseOnGuideSlugs: ["fowey", "salcombe"],
    previousGuideSlug: "yealm",
    nextGuideSlug: "fowey",
    seoTitle: "Plymouth Guide | Old Sea Dogs",
    seoDescription:
      "A naval sound with a leisure arrival at Sutton Harbour’s Barbican lock — Mayflower Marina and Plymouth Yacht Haven as brief alternatives, under King’s Harbour Master control of the Dockyard Port.",
    socialTitle: "Plymouth — Old Sea Dogs Guides",
    socialDescription: "Plymouth Sound for visitors: Sutton lock on Ch 12, KHM on Ch 14, and official Devonport tides.",
    canonicalPath: "/guides/west-country/plymouth",
    editorialNotes: "One page only. No QAB / King Point / RWY stubs.",
    researchNotes: "Lock dimensions and free-flow windows from MPA / Sutton material — confirm on the day.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Lock OOH phone and flood-gate triggers need day-of confirmation.",
    sourceNotes: "Tide links only (Devonport BBC + EasyTide + KHM).",
    draftComments: "",
  },
  {
    internalId: "OSD-G185",
    slug: "fowey",
    title: "Fowey",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A deep Cornish river harbour between Fowey and Polruan — blue visitor moorings on the east side, Harbour Patrol on Channel 12, and a fuel pontoon that works all tides.",
    introduction:
      "Fowey is the first classic Cornish river harbour west of Plymouth Sound: steep wooded banks, Polruan opposite the town, and blue visitor swinging moorings in the lower harbour. Fowey Harbour Commissioners run a busy commercial and leisure port. Call Harbour Patrol on VHF Channel 12 as you enter — berths are not pre-booked except for rallies and events.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "Cornwall",
    parentGuideSlug: "west-country",
    editorialOrder: 6,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-fowey-v1.png",
    imageAlt: "Painting of Fowey harbour entrance with Polruan and boats in the lower harbour.",
    imageFocalPoint: "50% 42%",
    imageCaption: "Fowey, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · Cornwall" },
      { label: "Harbour Authority", value: "Fowey Harbour Commissioners" },
      { label: "Harbour Office", value: "Albert Quay, Fowey, Cornwall PL23 1AJ" },
      { label: "Telephone", value: "+44 (0)1726 832471" },
      { label: "Email", value: "reception@foweyharbour.co.uk" },
      { label: "Harbour VHF", value: "Channel 12 — Harbour Office / Patrol" },
      { label: "Water taxi", value: "Independent — VHF Ch 6 or 07774 906730 (summer)" },
      { label: "Chart", value: "Admiralty Chart 31 (Harbour Guide 2026 reference) — current edition" },
      { label: "Speed limit", value: "6 knots, minimal wash, from St Catherine’s Castle–Punches Cross limit up to Lostwithiel" },
      { label: "Coastguard / emergency", value: "VHF Ch 16; office phone diverts to duty officer out of hours" },
      { label: "Visitor booking", value: "Not pre-booked (except rallies/events); prenotify if over 20 m" },
    ],
    sections: [
      section("Setting & Character", [
        "Fowey and Polruan face each other across a deep natural harbour that still works commercial ships as well as yachts. The lower harbour holds the blue visitor moorings; further up, Pont Pill, Underhills, Grid Irons and Penmarlam offer pontoon options, with Wiseman’s Reach as a quieter overnight before the estuary starts to dry.",
      ]),
      section("Arrival by Sea", [
        "The Authority describes entry day and night at all tides — still use Admiralty Chart 31 and the Harbour Guide. The entrance and lower harbour can be rough on an ebb with a strong southwesterly; berths upriver (Grid Irons, Penmarlam, Wiseman’s) are more sheltered. Keep clear of commercial ships and obey Patrol (blue flashing light).",
        "Call Harbour Patrol on VHF Ch 12 on entry for advice. Vessels over 20 m should prenotify; vessels over 37.5 m LOA require a Pilot; vessels over 20 m north of Prime Cellars may need assistance — call the office. Speed limit 6 knots with minimal wash from the harbour limit up to Lostwithiel.",
      ]),
      section("Berthing Experience", [
        "Blue visitor swinging moorings lie mainly on the east side of the lower harbour. Visitor pontoons include two at the mouth of Pont Pill, three at Underhills, and Grid Irons upstream of the car ferry (outside of pontoon only). Penmarlam (Mixtow) has shore-linked visitor berths on the south side with toilets, showers and a café. Three blue visitor moorings sit at Wiseman’s Reach.",
        "Overnight on the shore-linked Berrill’s Yard pontoon near the lifeboat is published 16:00–08:00 at the nightly rate. Short stays (about one hour) use Albert Quay, Berrill’s Yard and Polruan pontoons outside those hours. Confirm current fees on the harbour’s published rates — this guide does not invent tariff bands.",
        "Above Wiseman’s Reach the estuary dries — treat upriver trips as tide-planned with local knowledge.",
      ]),
      section("Facilities Afloat", [
        "The fuel pontoon just upstream of the Bodinnick car ferry sells diesel and petrol, pay-at-pump, 24/7, all tides (Authority). Freshwater is at Albert Quay, Berrill’s Yard and Penmarlam (no washdown). Shore power is at Berrill’s Yard and Penmarlam. Showers are at RFYC, Fowey Gallants SC and Penmarlam Boat Park (coins). Pump-out is at Berrill’s Yard via office code/payment. Refuse and recycling sit on visitor pontoons.",
      ]),
      section("Marine Services", [
        "An independent water taxi works summer on VHF Ch 6 (07774 906730). Local yards and chandlery serve the harbour; confirm insurance and harbour requirements with Fowey Harbour Commissioners before arrival.",
      ]),
      section("Ashore", [
        "Fowey town climbs the west bank with shops, pubs and the ferry links to Polruan. Polruan has its own quay character and short-stay pontoon. The harbour’s commercial traffic is part of the scenery — give ships room.",
      ]),
      section("Best For", [
        "A first Cornish river night after Plymouth Sound.",
      ], {
        listItems: [
          "Crews wanting deep-water visitor moorings under wooded banks",
          "Skippers who will call Ch 12 and take Patrol advice",
          "All-tide fuel stops on the Authority fuel pontoon",
          "Quieter nights at Penmarlam or Wiseman’s when the lower harbour is lively",
        ],
      }),
      section("Less Suitable For", [
        "Commercial traffic and a lively entrance in SW ebb conditions shape the caveats.",
      ], {
        listItems: [
          "Skippers who want a pre-booked private marina berth without talking to Patrol",
          "Anyone treating the drying estuary above Wiseman’s as an all-tide dash",
          "Large vessels that skip the prenotify / pilot rules",
        ],
      }),
      section("History & Local Character", [
        "Fowey’s deep harbour made it a medieval and later commercial port; china-clay and other trades still move on the river. Polruan opposite keeps the twin-town feel that visiting yachts remember.",
      ]),
      section("Nearby Cruising", [
        "Plymouth Sound lies east; Falmouth and the Helford are the next major hops west along the Cornish coast.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Plymouth", guideSlug: "plymouth" },
          { label: "Falmouth", guideSlug: "falmouth" },
        ],
      }),
      section("Skipper's Notes", [
        "Ch 12, Chart 31 and the harbour tide page are the plan.",
      ], {
        listItems: [
          "Call Harbour Patrol Ch 12 on entry; prenotify if over 20 m.",
          "Blue visitors mainly east side; upriver for shelter in SW ebb.",
          "Fuel pontoon upstream of Bodinnick — 24/7 all tides.",
          "6 knots, minimal wash, to Lostwithiel.",
          "Use Fowey Harbour weather & tides, BBC Fowey and EasyTide.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Fowey is Cornwall’s river doorway after the Sound: blue buoys under the trees, Polruan opposite, and Patrol on Ch 12.",
      ]),
      section("Tides & Weather", [
        "Fowey Harbour publishes BST-adjusted tide tables on its weather and tides page; printed tables are sold at the Harbour Office. Springs are about 5.5 m range (up to about 6 m at equinoxes); streams often exceed 1 knot and about 1.75–2 knots at springs, higher after heavy rain. Pair the harbour page with BBC Fowey and ADMIRALTY EasyTide.",
      ], { links: foweyTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026. Operational details can change — confirm with the harbour office before arrival. Admiralty Chart 31 is the chart the Harbour Guide refers skippers to."],
        { listItems: foweySources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Call Harbour Patrol on VHF Ch 12 on entry.",
      "Prenotify the office if you are over 20 m LOA.",
      "Use Admiralty Chart 31 and respect the 6-knot limit.",
      "Confirm visitor fees on the harbour’s published rates.",
      "Use Fowey Harbour tides, BBC Fowey and EasyTide.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: foweySources,
    verifiedFacilities: [],
    location: { latitude: 50.335, longitude: -4.633, mapZoom: 14 },
    relatedGuideSlugs: ["mevagissey", "west-country", "plymouth", "falmouth"],
    cruiseOnGuideSlugs: ["falmouth", "plymouth"],
    previousGuideSlug: "plymouth",
    nextGuideSlug: "mevagissey",
    seoTitle: "Fowey Guide | Old Sea Dogs",
    seoDescription:
      "A deep Cornish river harbour between Fowey and Polruan — blue visitor moorings on the east side, Harbour Patrol on Channel 12, and a fuel pontoon that works all tides.",
    socialTitle: "Fowey — Old Sea Dogs Guides",
    socialDescription: "Fowey Harbour: Ch 12 Patrol, blue visitor moorings, and official tide links.",
    canonicalPath: "/guides/west-country/fowey",
    editorialNotes: "No invented fee bands — point to harbour rates.",
    researchNotes: "Harbour Guide 2026 PDF referenced for chart 31 and facilities.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Office weekend hours and taxi seasonality change — confirm.",
    sourceNotes: "Tide links only (harbour + BBC + EasyTide).",
    draftComments: "",
  },
  {
    internalId: "OSD-G186",
    slug: "falmouth",
    title: "Falmouth",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "Carrick Roads’ Atlantic gateway harbour — Falmouth Haven visitors’ marina and green/yellow swinging moorings under the town, with commercial docks still very much in the mix.",
    introduction:
      "Falmouth is the major Cornish stop west of Fowey: a deep natural harbour on Carrick Roads, Falmouth Haven’s visitors’ marina at the town waterfront, and deep-water visitor swinging moorings marked green and yellow. Call Falmouth Haven on VHF Channel 12. Watch commercial shipping, and treat anchorage between Custom House Quay and the docks as dues-paying and attended.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "Cornwall",
    parentGuideSlug: "west-country",
    editorialOrder: 7,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-falmouth-v1.png",
    imageAlt: "Painting of Falmouth Haven and the town waterfront with visiting yachts.",
    imageFocalPoint: "48% 44%",
    imageCaption: "Falmouth, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · Cornwall" },
      { label: "Harbour Authority", value: "Falmouth Harbour Commissioners" },
      { label: "Main harbour office", value: "44 Arwenack Street, Falmouth TR11 3JQ · 01326 213537" },
      { label: "Falmouth Haven", value: "Main 01326 310990 · Marina 01326 310991" },
      { label: "Fuel barge", value: "01326 310993" },
      { label: "Harbour VHF", value: "Channel 12 — call sign Falmouth Haven; seasonal launch Arwenack" },
      { label: "Private marina VHF", value: "Channel 80 — Port Pendennis Marina" },
      { label: "Coastguard / emergency", value: "VHF Ch 16" },
      { label: "Visitors’ marina (published)", value: "Up to about 16 m LOA / about 2.5 m draught — confirm; rafting customary" },
      { label: "Depths & tides", value: "Confirm with Falmouth Haven. Use BBC Falmouth and EasyTide." },
    ],
    sections: [
      section("Setting & Character", [
        "Falmouth sits on one of the world’s larger natural harbours — Carrick Roads opening to the Atlantic — with docks, Falmouth Haven’s leisure marina and the town waterfront sharing the same stage. Custom House Quay, the visitors’ marina and the green/yellow swinging moorings are the leisure heart; commercial shipping still moves close by.",
      ]),
      section("Arrival by Sea", [
        "Close Carrick Roads on a current Admiralty chart for Falmouth Harbour and approaches (confirm the current chart number and edition before you sail). Busy docks and leisure traffic mix — watch shipping, obey harbour directions, and call Falmouth Haven on VHF Ch 12 for marina or mooring advice. The seasonal launch call sign is Arwenack.",
        "If you are aiming for Port Pendennis Marina, call on Ch 80 (01326 211211). Outer berths are all-tide; the inner dock gate is tide-windowed — confirm the sill and timing with the marina.",
      ]),
      section("Berthing Experience", [
        "Falmouth Haven Visitors’ Marina is cited at around 100 craft, with visitors typically up to about 16 m LOA and about 2.5 m maximum draught in the Visitors Guide — confirm on the day; rafting is customary. Contact ahead by phone, VHF Ch 12, Arwenack or marina staff. Published hours are commonly about 08:00–18:00 in summer and 09:00–17:00 in winter; out of hours, pick a berth or mooring and report by 10:00 the next morning (Guide).",
        "Twenty-two deep-water visitors’ swinging moorings (green/yellow buoys, strop through the top ring) break down as nine up to 12.2 m, nine up to 18.2 m and four up to 24.3 m. Tender landing is at a dedicated marina area.",
        "Anchorage between Custom House Quay and Falmouth Docks is allowed with harbour dues payable. You must have a working engine, leave contact details, and not leave the boat unattended overnight; you may be moved for commercial shipping at short notice. Check Notices, Falmouth Haven Ch 12 and the marina notice board for movements.",
        "Seasonal stay offers (for example marina nights or mooring multi-night deals) change and often exclude July/August — confirm current offers rather than hard-coding them.",
      ]),
      section("Facilities Afloat", [
        "Falmouth Haven lists fuel barge, Wi-Fi, showers, laundry, water and electricity among visitor facilities. Fuel barge telephone 01326 310993 — confirm products and hours with the Haven.",
      ]),
      section("Marine Services", [
        "Port Pendennis Marina (landmark: National Maritime Museum tower) is the brief private-marina mention: VHF Ch 80, 01326 211211, marina@portpendennis.com. Commercial pilots are on 01326 211395 / 07836 661668 (24/7) for shipping — leisure skippers stay clear and listen for harbour directions.",
      ]),
      section("Ashore", [
        "Falmouth town, Custom House Quay and the National Maritime Museum sit within walking distance of the Haven. Pubs, shops and the docks skyline are the harbour’s dual character — leisure and commercial in the same view.",
      ]),
      section("Best For", [
        "A deep-water Cornish harbour night with marina or swinging options.",
      ], {
        listItems: [
          "Crews arriving from Fowey or crossing Falmouth Bay from the Helford",
          "Skippers who want Haven marina facilities or deep-water visitor moorings",
          "Anyone comfortable sharing a commercial harbour and watching Ch 12",
        ],
      }),
      section("Less Suitable For", [
        "It is not a quiet creek, and anchorage rules are strict.",
      ], {
        listItems: [
          "Unattended overnight anchoring between the quay and the docks",
          "Skippers who want a silent empty harbour in peak season without rafting",
          "Deep-draught vessels assuming the published ~2.5 m marina window without calling",
        ],
      }),
      section("History & Local Character", [
        "Falmouth grew as a packet and docks harbour on Carrick Roads. The visitors’ marina and swinging moorings now sit alongside working docks — that mix is the point of the place.",
      ]),
      section("Nearby Cruising", [
        "Fowey lies east; the Helford River is the quiet wooded pair across Falmouth Bay. Further west the Cornish coast opens toward the Lizard.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Fowey", guideSlug: "fowey" },
          { label: "Helford", guideSlug: "helford" },
        ],
      }),
      section("Skipper's Notes", [
        "Ch 12, shipping and the official tide links are the plan.",
      ], {
        listItems: [
          "Call Falmouth Haven Ch 12; Port Pendennis visitors also use Ch 80.",
          "Confirm marina LOA/draught and expect rafting.",
          "Anchoring: dues, working engine, attended overnight, ready to move for shipping.",
          "Use BBC Falmouth and EasyTide; watch harbour Notices.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Falmouth is Carrick Roads for yachts: Haven on Ch 12, green and yellow moorings under the town, and the docks still earning their keep.",
      ]),
      section("Tides & Weather", [
        "Use BBC Falmouth tide tables and ADMIRALTY EasyTide. Check Falmouth Harbour Notices for shipping and operational notes that affect leisure berthing and anchorage.",
      ], { links: falmouthTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026. Operational details can change — confirm with Falmouth Haven or the marina before arrival. Use a current Admiralty chart for Falmouth Harbour / Carrick Roads."],
        { listItems: falmouthSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Call Falmouth Haven on VHF Ch 12 for marina or mooring advice.",
      "Confirm visitors’ marina LOA/draught limits on the day; expect rafting.",
      "If anchoring, pay dues, stay aboard overnight and watch shipping notices.",
      "Use BBC Falmouth tide tables and EasyTide.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: falmouthSources,
    verifiedFacilities: [],
    location: { latitude: 50.153, longitude: -5.065, mapZoom: 14 },
    relatedGuideSlugs: ["mevagissey", "st-mawes", "west-country", "fowey", "helford"],
    cruiseOnGuideSlugs: ["helford", "fowey"],
    previousGuideSlug: "mevagissey",
    nextGuideSlug: "st-mawes",
    seoTitle: "Falmouth Guide | Old Sea Dogs",
    seoDescription:
      "Carrick Roads’ Atlantic gateway harbour — Falmouth Haven visitors’ marina and green/yellow swinging moorings under the town, with commercial docks still very much in the mix.",
    socialTitle: "Falmouth — Old Sea Dogs Guides",
    socialDescription: "Falmouth Haven on Ch 12, visitor moorings, and official Falmouth tide links.",
    canonicalPath: "/guides/west-country/falmouth",
    editorialNotes: "Chart number left as confirm-current — research did not lock a single edition.",
    researchNotes: "Visitors Guide PDF LOA/draught figures are published maxima — always reconfirm.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Seasonal offers and OOH berthing report-by-10:00 rule can change.",
    sourceNotes: "Tide links only (BBC Falmouth + EasyTide).",
    draftComments: "",
  },
  {
    internalId: "OSD-G187",
    slug: "helford",
    title: "Helford",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A quiet wooded Cornish river opposite Falmouth Bay — green visitor moorings run by Helford River Moorings, with voluntary seasonal marks and no statutory harbour office.",
    introduction:
      "The Helford River is the quiet pair to busy Falmouth: deeply wooded banks, green visitor moorings, and a slower pace once you are inside. There is no Tor Bay / Dart / Fowey-style statutory harbour office running the whole river. Day-to-day visitor moorings and leisure advice come from Helford River Moorings (commercial); seasonal navigation marks are maintained by the voluntary HRNAC. Call the Mooring Officer on VHF Channel 37.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "Cornwall · Helford River",
    parentGuideSlug: "west-country",
    editorialOrder: 8,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-helford-v1.png",
    imageAlt: "Painting of the wooded Helford River with green visitor moorings.",
    imageFocalPoint: "50% 45%",
    imageCaption: "Helford River, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · Cornwall · Helford River" },
      { label: "Statutory harbour office", value: "None — not a Tor Bay / Dart / Fowey-style harbour authority" },
      { label: "Visitor moorings", value: "Helford River Moorings (commercial)" },
      { label: "Telephone", value: "01326 250749 · mooring officer mobile 07808 071485" },
      { label: "VHF", value: "Channel 37 — call sign Mooring Officer" },
      { label: "Water taxi", value: "Call sign Helford Ferry · Ch 37 (via mooring officer)" },
      { label: "Payment", value: "Moored Solutions app / QR on buoy tag (e.g. HEL-AAA)" },
      { label: "Seasonal marks", value: "Voluntary HRNAC (Helford River Navigational Aids Committee) — not Trinity House obligation" },
      { label: "Charts (operator-stated)", value: "BA 147, SC 5603.6; Stanford 13; Imray Y57 — confirm current editions" },
      { label: "Speed limit", value: "6 knots, minimal wash in the moorings" },
      { label: "Coastguard / emergency", value: "VHF Ch 16" },
    ],
    sections: [
      section("Setting & Character", [
        "The Helford is a deeply wooded tidal river opening to Falmouth Bay — oyster beds, quiet reaches and green visitor moorings instead of docks and Channel 12 harbour control. Helford River Sailing Club and Port Navas Yacht Club welcome visitors (book meals in high season). It is the West Country bubble’s western river contrast to Falmouth’s commercial energy.",
      ]),
      section("Arrival by Sea", [
        "Use the charts the operator cites (BA 147 / SC 5603.6, Stanford 13, Imray Y57 — confirm editions) and the Helford River Moorings pilotage page. Hazards include Car Croc Rock, Voose Rock, the Gedges/August Rock area (seasonal marks), bar and shallows on the north shore, pot and net buoys west of Voose, drying upper reaches and oyster beds. The approach can be rough in a strong east wind on the ebb. Gillan Creek is largely drying — shallow-draught only.",
        "Streams reach about 2 knots at springs in the river. Seasonal marks are voluntarily funded — they are not a Trinity House or local-authority obligation. Call the Mooring Officer on VHF Ch 37 for advice.",
      ]),
      section("Berthing Experience", [
        "Overnight visitors pick up green visitor moorings (with pick-up buoys). Pre-booking is recommended in high season if your vessel is under 6.5 m; the operator cannot reserve visitor moorings for vessels over 6.5 m. Do not leave unattended for more than two weeks without contacting the mooring officer first.",
        "Do not anchor in the main moorings concentration — pick up a spare visitor mooring instead. An anchor box at the west end of the main moorings (Calamansack) is marked; otherwise prefer the Durgan Bay area or west of Groyne Point per operator pilotage, noting eelgrass voluntary restrictions near Toll Point–Porth Saxon.",
        "Fees are published on the visitor moorings page (overnight after 17:00 by LOA band, day rate, short stay under two hours). Confirm the current tariff before arrival — this guide does not invent bands.",
      ]),
      section("Facilities Afloat", [
        "There is no Fowey/Falmouth-style harbour fuel barge on the Helford River Moorings pages — plan fuel at Falmouth (or confirm a local boatyard). Water taxi is Helford Ferry on Ch 37 via the mooring officer. Clubs ashore welcome visitors.",
      ]),
      section("Marine Services", [
        "Local repairs are listed via Cellar Marine, Michael Wright Marine and Gweek Quay Boatyard on the operator’s local-services page — confirm contacts and availability. Payment for moorings is typically via the Moored Solutions app or the QR on the buoy tag.",
      ]),
      section("Ashore", [
        "The Shipwrights Arms and the Ferry Boat Inn are the classic river pubs. Helford village and the ferry crossing keep the shore side simple — this is a quiet river night, not a city run ashore.",
      ]),
      section("Best For", [
        "A quiet wooded river night after Falmouth’s docks.",
      ], {
        listItems: [
          "Crews who want green visitor moorings under trees",
          "Skippers happy calling Ch 37 (no Ch 12 harbour control)",
          "Smaller boats that can pre-book in high season (under 6.5 m)",
          "A Falmouth Bay pair with Falmouth itself",
        ],
      }),
      section("Less Suitable For", [
        "There is no statutory harbour office, and the river has real drying and rock hazards.",
      ], {
        listItems: [
          "Skippers who need a staffed harbour authority on Ch 12",
          "Vessels over 6.5 m expecting a reserved visitor mooring",
          "Anyone anchoring in the main moorings field or ignoring eelgrass guidance",
          "Deep-draught arrivals treating Gillan Creek or the upper river as all-tide",
        ],
      }),
      section("History & Local Character", [
        "The Helford has long been a sheltered Cornish river of oysters, creeks and quiet villages. Leisure moorings are a commercial and club affair here, not a municipal harbour empire — and that is part of its character.",
      ]),
      section("Nearby Cruising", [
        "Falmouth and Carrick Roads lie across the bay to the north-east. Fowey is the next deep river harbour east along the coast.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Falmouth", guideSlug: "falmouth" },
          { label: "Fowey", guideSlug: "fowey" },
        ],
      }),
      section("Skipper's Notes", [
        "Ch 37, green moorings and honesty about the authority story are the plan.",
      ], {
        listItems: [
          "No statutory harbour office — call Helford River Moorings / Mooring Officer Ch 37.",
          "Pick up green visitors; do not anchor in the main mooring concentration.",
          "Under 6.5 m can try to pre-book; over 6.5 m cannot reserve.",
          "Seasonal marks are voluntary HRNAC — still use the chart.",
          "Use BBC Helford Entrance (and Falmouth for the bay) plus EasyTide.",
          "Plan fuel before you leave Falmouth.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Helford is the quiet last river on the West Country chain: green moorings under the trees, Ch 37 instead of a harbour empire, and supper at the Ferry Boat when the bay goes still.",
      ]),
      section("Tides & Weather", [
        "Use BBC Helford River (Entrance) tide tables and ADMIRALTY EasyTide. The Falmouth BBC station is also useful for Falmouth Bay. The operator publishes local range notes on the pilotage page — still plan from the official tables. Strong east wind on the ebb makes the approach uncomfortable.",
      ], { links: helfordTideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 27 October 2026. There is no statutory harbour authority for the whole river — confirm with Helford River Moorings before arrival. Seasonal marks are voluntary."],
        { listItems: helfordSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Call the Mooring Officer on VHF Ch 37 — there is no statutory harbour office.",
      "Pick up a green visitor mooring; do not anchor in the main moorings field.",
      "Confirm current mooring fees on the operator’s visitor page.",
      "Use BBC Helford Entrance (and Falmouth for the bay) plus EasyTide.",
      "Plan fuel at Falmouth unless a local yard confirms otherwise.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: helfordSources,
    verifiedFacilities: [],
    location: { latitude: 50.097, longitude: -5.130, mapZoom: 14 },
    relatedGuideSlugs: ["newlyn", "west-country", "falmouth", "fowey"],
    cruiseOnGuideSlugs: ["falmouth"],
    previousGuideSlug: "st-mawes",
    nextGuideSlug: "newlyn",
    seoTitle: "Helford Guide | Old Sea Dogs",
    seoDescription:
      "A quiet wooded Cornish river opposite Falmouth Bay — green visitor moorings run by Helford River Moorings, with voluntary seasonal marks and no statutory harbour office.",
    socialTitle: "Helford — Old Sea Dogs Guides",
    socialDescription: "Helford River: Mooring Officer on Ch 37, green visitors, and official tide links.",
    canonicalPath: "/guides/west-country/helford",
    editorialNotes: "Must stay honest about no statutory harbour office.",
    researchNotes: "Fee bands snapshotted on site 27 Oct 2026 but draft points to live tariff page.",
    reviewDue: "2027-10-27",
    accuracyConcerns: "Voluntary marks and commercial mooring rules can change seasonally.",
    sourceNotes: "Tide links only (BBC Helford Entrance + Falmouth + EasyTide).",
    draftComments: "",
  },
];
