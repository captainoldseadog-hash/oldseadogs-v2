import type { FlagshipGuide, GuideSection } from "./flagship-guides.ts";

/**
 * West Country area and the first harbour inside it.
 * Salcombe, Fowey, Falmouth and Plymouth are named as later hops only.
 * Noss on Dart is a short Kingswear mention, not its own page.
 * Depths are the 2026 online-booking draught windows only.
 * Tide figures are not copied in; the pages link the official tables.
 */

const checkedOn = "2026-10-26";
const artworkCredit = "Artwork supplied by Old Sea Dogs";

const dartHarbourForecasts = "https://www.dartharbour.org/forecasts/";
const bbcDartmouthTides = "https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/10/23";
const easyTide = "https://easytide.admiralty.co.uk/";
const dartHarbourVisitors = "https://www.dartharbour.org/visitors/";

const tideLinks: GuideSection["links"] = [
  { label: "Dart Harbour forecasts (UKHO predictions for Dartmouth)", guideSlug: "", href: dartHarbourForecasts },
  { label: "BBC Weather tide tables — Dartmouth (UKHO / ADMIRALTY)", guideSlug: "", href: bbcDartmouthTides },
  { label: "ADMIRALTY EasyTide", guideSlug: "", href: easyTide },
];

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

const areaSources = [
  { label: "Dart Harbour — Visitors / berth booking (2026)", href: dartHarbourVisitors },
  { label: "Dart Harbour — Sailing directions", href: "https://www.dartharbour.org/annual-berth-holders/sailing-directions/" },
  { label: "Dart Harbour — Forecasts / tides", href: dartHarbourForecasts },
  { label: "BBC / UKHO Dartmouth tide tables", href: bbcDartmouthTides },
];

const harbourSources = [
  ...areaSources,
  { label: "Dart Harbour — Charges (leisure schedule)", href: "https://www.dartharbour.org/annual-berth-holders/charges/" },
  { label: "Dart Harbour — Fuel barge", href: "https://www.dartharbour.org/harbour-information/port-facilities/fuel-barge/" },
  { label: "Dart Harbour — Water and electricity", href: "https://www.dartharbour.org/harbour-information/port-facilities/water-plugging-in/" },
  { label: "Dart Harbour — Yacht taxi", href: "https://www.dartharbour.org/harbour-information/port-facilities/yacht-taxi/" },
  { label: "Darthaven Marina — facilities", href: "https://darthaven.co.uk/marina/facilities/" },
  { label: "Darthaven Marina — rates (harbour dues excluded)", href: "https://darthaven.co.uk/marina/marina-rates-charges/" },
  { label: "Premier Marinas — Dartmouth Marina", href: "https://www.premiermarinas.com/marinas/dartmouth-marina" },
  { label: "Dart Marina", href: "https://dartmarina.com/yacht-harbour-marina/" },
];

export const westCountryGuideSeeds: FlagshipGuide[] = [
  {
    internalId: "OSD-G180",
    slug: "west-country",
    title: "West Country",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "Devon and Cornwall’s south coast — deep river harbours, Start Bay and the long hop west from Portland Bill, starting with Dartmouth on the River Dart.",
    introduction: [
      "West of Portland Bill the character of the cruise changes. The chalk and racing streams of the Channel give way to the green hills and deep river mouths of south Devon and, further on, Cornwall. Distances stretch, shelter is often up a tidal river rather than behind a breakwater, and the best nights are spent under wooded banks with a steam railway or a castle on the hill.",
      "This Old Sea Dogs West Country area opens with Dartmouth on the River Dart — the natural first stop for boats coming down-Channel from Weymouth, Portland or the Channel Islands. Later harbour guides will cover Salcombe, Plymouth, Fowey and Falmouth as those pages are written; they are named here only as the cruising chain ahead, not as live pages yet.",
      "On the way west, Durdle Door is well worth seeing: the great limestone arch on Dorset’s Jurassic Coast, just west of Lulworth Cove and a few miles east of Weymouth. Boats coming down from the Solent pass it before Portland Bill, so in settled weather it is worth slowing down for a look before the long hop on toward Start Point and the Dart. It is a landmark to enjoy from the water, not a harbour.",
    ].join("\n\n"),
    guideType: "Cruising Area",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "South Devon / Cornwall",
    editorialOrder: 1,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-west-country-durdle-door-v1.png",
    imageAlt: "Painting of Durdle Door, the limestone arch on Dorset’s Jurassic Coast, with a yacht and the cliffs beyond.",
    imageFocalPoint: "42% 46%",
    imageCaption: "Durdle Door, Dorset Jurassic Coast, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Area guide" },
      { label: "Region", value: "South Devon / Cornwall (English Channel coast)" },
      { label: "Country", value: "England, United Kingdom" },
      { label: "First harbour", value: "Dartmouth (River Dart) — Dart Harbour & Navigation Authority" },
      { label: "VHF (Dartmouth)", value: "Dartnav Ch 11 · private marinas commonly Ch 80" },
      { label: "Coastguard / emergency", value: "VHF Ch 16" },
      { label: "Chart (Dartmouth)", value: "Admiralty Chart 2253 (Dartmouth Harbour / River Dart) — current edition" },
      { label: "Depths & tides", value: "Check with the harbour office or marina before arrival. Use the official Dartmouth tide links; do not rely on copied heights." },
    ],
    sections: [
      section("Choosing a Berth", [
        "Dartmouth: Harbour Authority walk-ashore pontoons (Town Jetty, DA) and island Deep Water pontoons, Mainstream fore-and-aft buoys, plus private marina berths at Darthaven (Kingswear) and Dart Marina (Premier, Dartmouth side). Call Dartnav on Ch 11 on arrival; exact allocation is confirmed by the river patrol even when you have pre-booked for 2026.",
        "Further west, later guides will cover Salcombe, Plymouth Sound, Fowey and Falmouth — each with its own harbour authority and marina options. Berthing detail for those places waits until the pages are researched.",
      ], {
        links: [{ label: "Dartmouth", guideSlug: "dartmouth" }],
      }),
      section("Tides & Passage Planning", [
        "From Portland Bill westbound, most leisure boats either work the inshore passage carefully in settled weather or stand off for a clear run toward Start Point and the Dart. The Dart entrance is well marked once close in (Daymark tower east of the entrance; Castle Ledge and Checkstone buoys), but the entrance does not advertise itself from far offshore — close the coast with a proper chart and a fair stream.",
        "Durdle Door is worth seeing on the way west. Use your own chart and pilotage for that stretch; this guide gives no inshore directions for it.",
        "Tidal streams in the Dart entrance seldom exceed about 2 knots flood or ebb, except after heavy rain or strong northerly winds when the ebb can run up to about 3.5 knots (Dart Harbour sailing directions). Upstream toward Totnes the river dries extensively at springs — treat upriver trips as a separate, tide-planned expedition.",
        "Use free official tide sources for Dartmouth rather than copied heights. The site-wide conditions panel shows local wind; pair it with the tide-table links, in the same way as the Channel Islands guides. The Dart Harbour graph is in GMT.",
      ], { links: tideLinks }),
      section("In This Area", [
        "Dartmouth, on the River Dart, is the first harbour guide in the West Country. Later pages will cover Salcombe, Plymouth, Fowey and Falmouth; they are not published yet. To the east lie the Weymouth & Portland guides.",
      ], {
        links: [
          { label: "Dartmouth", guideSlug: "dartmouth" },
          { label: "Weymouth & Portland", guideSlug: "weymouth-portland" },
        ],
      }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 26 October 2026. Operational details can change — confirm with the harbour office or marina before arrival."],
        { listItems: areaSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Plan the hop west of Portland Bill with a current chart, the tide and a settled forecast.",
      "Treat Durdle Door as a landmark to see from the water, not as a harbour.",
      "For Dartmouth, call Dartnav on VHF Ch 11 and use the 2026 visitors page if you want to pre-book.",
      "Use the official Dartmouth tide links. Do not copy tide heights into the plan.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: areaSources,
    verifiedFacilities: [],
    location: {},
    relatedGuideSlugs: ["dartmouth", "weymouth-portland"],
    cruiseOnGuideSlugs: ["dartmouth"],
    previousGuideSlug: "",
    nextGuideSlug: "dartmouth",
    seoTitle: "West Country Guide | Old Sea Dogs",
    seoDescription:
      "Devon and Cornwall’s south coast — deep river harbours, Start Bay and the long hop west from Portland Bill, starting with Dartmouth on the River Dart.",
    socialTitle: "West Country — Old Sea Dogs Guides",
    socialDescription:
      "The West Country cruise, from Durdle Door and Portland Bill west to Dartmouth, the first harbour in the area.",
    canonicalPath: "/guides/west-country",
    editorialNotes: "First harbour in the area is Dartmouth. Do not stub Salcombe, Fowey, Falmouth or Plymouth.",
    researchNotes: "Draft approved by Michael Hodges for publication on 26 October 2026. 2026 Dart Harbour visitors page is authoritative over any older FAQ that still says moorings are first-come with no booking.",
    reviewDue: "2027-10-26",
    accuracyConcerns: "Operational information may change. Navigation, depths and vessel suitability always need the harbour office, the marina and a current chart.",
    sourceNotes: "Tide links only: Dart Harbour forecasts and BBC/UKHO Dartmouth tables, plus ADMIRALTY EasyTide. No heights copied into the guide.",
    draftComments: "",
  },
  {
    internalId: "OSD-G181",
    slug: "dartmouth",
    title: "Dartmouth",
    eyebrow: "Old Sea Dogs Guides",
    summary:
      "A deep, wooded river harbour between twin castles — walk-ashore pontoons in town, island pontoons and Mainstream buoys, and full-service marinas on both banks.",
    introduction:
      "Dartmouth is the classic West Country river arrival: castles on either shore, the Daymark on the eastern hill, and a busy, well-run harbour that still feels like a proper Devon port. Visitors lie on Dart Harbour Authority pontoons and buoys, or in private marinas at Darthaven on the Kingswear side and Dart Marina on the Dartmouth side. Call Dartnav on VHF Channel 11 as you come in — the river patrol will place you, even if you have already booked online for 2026.",
    guideType: "Harbour",
    regionKey: "west-country",
    regionName: "West Country",
    subregion: "South Devon",
    parentGuideSlug: "west-country",
    editorialOrder: 2,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: "/images/guides/guides-dartmouth-v1.png",
    imageAlt: "Painting of the Dart entrance at Dartmouth, with the castle, wooded hills and boats in the reach.",
    imageFocalPoint: "50% 42%",
    imageCaption: "Dartmouth, illustrated for Old Sea Dogs Guides.",
    imageCredit: "",
    artworkCredit,
    quickFacts: [
      { label: "Guide Type", value: "Harbour Guide" },
      { label: "Region", value: "West Country · South Devon" },
      { label: "Harbour Authority", value: "Dart Harbour & Navigation Authority (DHNA)" },
      { label: "Harbour Office", value: "6 Oxford Street, Dartmouth, Devon, TQ6 9AL" },
      { label: "Telephone", value: "01803 832337" },
      { label: "Harbour VHF", value: "Channel 11 — call sign DARTNAV" },
      { label: "Private marinas VHF", value: "Commonly Channel 80 (Darthaven; Dart Marina / Premier Dartmouth)" },
      { label: "Chart", value: "Admiralty Chart 2253 (Dartmouth Harbour / River Dart) — current edition" },
      { label: "Speed limit", value: "6 knots from the harbour limit (Castle Ledge) inward — strictly enforced" },
      { label: "Visitor booking (2026)", value: "Pre-book selected berths up to two weeks ahead on the Dart Harbour visitors page. Exact mooring is still decided on the day." },
      { label: "Depths", value: "Online booking windows only: Inside Town Jetty 1.8 m, DA Pontoon 2 m. Confirm the berth and approach with Dartnav or the marina." },
      { label: "Harbour dues", value: "Payable in addition to mooring fees (DHNA charges schedule)." },
      { label: "Coastguard / emergency", value: "VHF Ch 16" },
    ],
    sections: [
      section("Setting & Character", [
        "The harbour sits in a steep-sided reach of the River Dart, with Dartmouth’s embankments and old streets on the west bank and Kingswear — steam railway, pubs and the sunny side — on the east. It is a working leisure harbour: ferries cross the channel, Britannia Royal Naval College sits above the town, and in summer the pontoons fill with visiting yachts. Upriver the Dart runs for miles through wooded bends toward Dittisham, Greenway and Totnes — a different, quieter cruise once you leave the harbour proper.",
      ]),
      section("Arrival by Sea", [
        "From seaward the entrance is not obvious until you are closer in. The stone Daymark tower on the hill east of the entrance is the usual landmark. Approaches from east and west carry coastal rocks and ledges (including the Mewstone and Homestone areas) — leave the relevant cardinal and lateral marks to the correct hand and keep a good offing until you have identified Castle Ledge.",
        "Dart Harbour sailing directions and the current Admiralty Chart 2253 are the references to use. In outline: leave Castle Ledge buoy (starboard-hand, Fl G 5s) to starboard — it marks the harbour limit and the start of the 6-knot limit — then shape up the entrance leaving Checkstone (port-hand) to port, with Dartmouth Castle to the west and Kingswear Castle to the east. Sectored lights (including Kingswear) assist at night; stay in the published white sectors.",
        "Streams in the entrance seldom exceed about 2 knots either way, except after heavy rainfall or strong northerlies when the ebb can reach about 3.5 knots (DHNA sailing directions). Give way to the lower car ferries (tug-and-float, restricted in ability to manoeuvre) and the chain Higher Ferry; submerged wires exist in the Higher Ferry’s vicinity. Ferries can be hard to spot when berthed high on their slips at high water.",
        "Call Dartnav on VHF Ch 11 for berthing instructions before you commit to a pontoon or buoy. If you are aiming for a private marina, call them on Ch 80 as well once Dartnav has cleared your intentions.",
      ]),
      section("Berthing Experience", [
        "New for 2026, DHNA lets visitors pre-book a limited number of berths up to two weeks ahead. The 2026 visitors page is the authority for that pre-book. Booked or not, the harbour states it still has space when the online slots show full, and that they never turn anyone away. Exact location is confirmed on the day; smaller boats booked on DA may be assigned to the Yacht Club or Double Steps pontoons. Arrive after 19:00 only if you have told the office — otherwise the berth may not be held. Rafting is likely when busy.",
        "Mooring fees are per metre per night, and harbour dues are extra. Confirm the current schedule rather than an old figure. Commercial, sail-training, multihull, large and deep-draught vessels should not book online — call the harbour office on 01803 832337. Vessels needing advice above the online length or draught windows should also call. The harbour lists Town Jetty office capacity up to 60 m LOA / 5 m draft, and Mainstream buoys up to 200 m; confirm both with the office.",
        "Inside Town Jetty is Dartmouth town centre, walk-ashore, with water and electricity included. Online booking is typically 8–18 m, and the max draught for online booking is 1.8 m. An accessible berth with hoist and ramp is available. Larger vessels call the office.",
        "DA Pontoon is on the North Embankment, just south of the Higher Ferry, and is walk-ashore. Water and electricity are not included on the DA line. Online booking is typically 5–14 m, and the max draught for online booking is 2 m.",
        "Deep Water island pontoons are on the Kingswear side, just south of the Higher Ferry. They are not walk-ashore; use the yacht taxi or a tender. Mainstream buoys are fore-and-aft buoys off Dartmouth, also not walk-ashore. The online booking window is listed for larger LOA (14–24 m); call the office for bigger craft.",
        "Visitor pontoons and dinghy landings are marked with blue flags and visitors’ signage. Most harbour mooring buoys are blue; visitors’ swinging buoys are white with a black V. There are no formal visitors’ landing points south of the Lower Ferry (DHNA).",
        "Darthaven Marina is the private marina on the eastern (Kingswear) bank. Darthaven publishes about 270 fully serviced pontoon berths on four sheltered pontoons, with visitor berthing on the main marina or a dedicated visitor pontoon, water and electricity, showers, laundry, Wi-Fi, pump-out, recycling and an on-site chandlery. The marina states access with no tidal restrictions, at all states of tide — confirm approach and berth depths with them before arrival. Telephone 01803 752242, VHF Ch 80. Harbour dues are not included in marina berthing rates. Summer visitor demand is high; call ahead and check the current visitor tariffs on the Darthaven rates page.",
        "Dart Marina, Premier’s Dartmouth Marina, is on the Dartmouth (west) bank above the Higher Ferry area. It offers deep-water serviced pontoons, washrooms, laundry, Wi-Fi and 24/7 secure access beside the Dart Marina Hotel. Visitor space is typically when resident berths are free — Premier asks you to call on arrival or at short notice rather than expecting advance summer reservations. Telephone 01803 837161, VHF Ch 80, dartmouth@premiermarinas.com, Sandquay Road, Dartmouth, TQ6 9PH. Reception hours are published as 08:00–17:00 — confirm on the day.",
        "White visitor buoys at Dittisham (18 buoys, marked with max LOA), plus limited buoys at Galmpton, Stoke Gabriel and Bow Creek, are bookable for 2026 via the same visitors page. They are peaceful overnight stops, and a run up toward Greenway or Totnes wants a rising tide. Treat drying reaches and Totnes quays as tide-critical and confirm with Dartnav. This guide stays on Dartmouth and Kingswear harbour berthing.",
      ]),
      section("Facilities Afloat", [
        "Water is on the DHNA waste and water pontoon mid-river and on the Town Jetty (bring your own hose), with taps on the embankments by the Yacht Club pontoon and the Dartmouth Grid. Marina berths have water on the pontoon at Darthaven and Dart Marina.",
        "Electricity is included for Town Jetty visitors (inside; the outer edge on summer nights is 17:00–08:45). It is not included on DA, Deep Water or Mainstream in the 2026 booking table. The marinas have shore power on the berths.",
        "Showers, toilets, laundry and Wi-Fi are the full shoreside set at Darthaven and Dart Marina. Town Jetty is the harbour’s premium walk-ashore option, with power and water included.",
        "Waste and pump-out: the mid-river waste pontoon is DHNA’s, and Darthaven lists a blackwater pump-out station.",
        "The yacht taxi is a year-round ship-to-shore service between Noss and One Gun Point. It cannot pick up or drop at Premier Noss on Dart. Harbour-guide material lists it on VHF Ch 69, call sign Yacht Taxi — confirm the channel and the hours with DHNA before relying on it. Operating hours vary by season; see the Dart Harbour yacht taxi page.",
        "Dinghy landing is at Double Steps, Mayor’s Avenue and the Yacht Club pontoons on the Dartmouth side, and at the Kingswear dinghy rack and Darthaven.",
      ]),
      section("Marine Services", [
        "Fuel is the MV Dart Crusader fuel barge on the Kingswear side of the main channel — diesel and unleaded. VHF Ch 6, call sign Fuel Barge, telephone 07801 798861. Summer (Easter–30 September) the published hours are daily 08:30–18:00. Winter (1 October–Easter) they are Monday, Wednesday, Friday and Saturday 11:00–16:00, closed Tuesday, Thursday and Sunday. Confirm the current hours.",
        "Darthaven publishes a travel hoist — marina materials cite a 40-tonne hoist available at all states of the tide — plus engineering and chandlery. Confirm capacity and booking with the marina.",
        "Chandlery, engineers, riggers and sailmakers are around the river. Dart Marina notes a full range of professional yacht services close at hand. Always confirm insurance and harbour requirements with DHNA before arrival.",
      ]),
      section("Ashore", [
        "Dartmouth has shops, boutiques, pubs and restaurants along the embankments and up into town, Tourist Information on Mayor’s Avenue, Dartmouth Castle (English Heritage) by walk or ferry, Britannia Royal Naval College tours, the museum and the Newcomen engine. Ferries link to Kingswear, the Castle, Noss, Dittisham, Greenway and Totnes in season.",
        "Kingswear has the passenger and car ferries to Dartmouth, the Dartmouth Steam Railway to Paignton, pubs and cafés on the village side, and Darthaven and Noss for chandlery and berthing.",
        "The Higher Ferry (chain) and the Lower Ferry (tug-and-float) are part of the harbour scenery. Give them room and expect them when you are shaping up the channel.",
      ]),
      section("Best For", [
        "Dartmouth suits a first West Country night, a town berth, or a tide-planned run upriver.",
      ], {
        listItems: [
          "A first West Country night after Portland Bill or a Channel Islands return",
          "Crews who want walk-ashore town berths (Town Jetty or DA) or a full-service marina",
          "Families and food-minded crews — a strong ashore offering on both banks",
          "A base for a tide-planned run upriver to Dittisham or Greenway",
        ],
      }),
      section("Less Suitable For", [
        "It is a busy summer harbour, and the drying river above it is a separate plan.",
      ], {
        listItems: [
          "Skippers who want a quiet empty harbour in peak Regatta or high summer without rafting",
          "Deep-draught or very large vessels booking only online without calling the office first",
          "Anyone treating Totnes or the drying creeks as an all-tide dash without tide tables and local advice",
        ],
      }),
      section("History & Local Character", [
        "Dartmouth grew as a protected deep-water port behind its castles, later as a Royal Naval training town (Britannia Royal Naval College) and a favourite of visiting yachts. Kingswear’s steam railway and the twin-castle entrance still set the scene. Upriver, Greenway carries the Agatha Christie association; the river’s villages — Dittisham especially — are as much part of the Dart’s character as the town quay.",
      ]),
      section("Nearby Cruising", [
        "Start Bay and the coast toward Salcombe lie to the west; Torbay and Brixham to the east-northeast. Portland Bill and Weymouth & Portland sit up-Channel for the passage east. Within the river: Dittisham visitor buoys, Greenway, and a tide-aware trip toward Totnes. Future Old Sea Dogs West Country harbour pages will cover Salcombe, Plymouth, Fowey and Falmouth.",
      ], {
        links: [
          { label: "West Country", guideSlug: "west-country" },
          { label: "Weymouth & Portland", guideSlug: "weymouth-portland" },
        ],
      }),
      section("Skipper's Notes", [
        "The entrance, the radio and the official tide links are the plan.",
      ], {
        listItems: [
          "Close the entrance on Admiralty 2253; Daymark, Castle Ledge, Checkstone — then 6 knots.",
          "Call Dartnav on Ch 11 early. Pre-book 2026 berths online if you want a preferred pontoon, but still check in on the radio.",
          "Over about 14 m, multihull, commercial or deep draught — phone 01803 832337 rather than trusting the online form.",
          "Watch both ferries and the Higher Ferry wires.",
          "Fuel barge Ch 6. Yacht taxi is commonly Ch 69 — confirm. Marina visitors: Ch 80.",
          "Use the official Dartmouth tide links. Do not paste guessed heights into the log.",
        ],
      }),
      section("Old Sea Dogs View", [
        "Dartmouth is the proper door into the West Country: castles at the mouth, a helpful voice on Ch 11, and supper ashore before the river goes quiet under the trees.",
      ]),
      section("Tides", [
        "Do not copy tide heights into this guide. Use the official tables, and remember the Dart Harbour forecast graph is in GMT. The conditions panel on the live page is the same wind panel as the other guides; the tide half is these links, as on the Channel Islands harbour pages.",
      ], { links: tideLinks }),
      section(
        "Information checked against official sources",
        ["The practical information in this Guide was checked against the source records below on 26 October 2026. Operational details can change — confirm with the harbour office or marina before arrival. Admiralty Chart 2253 is the chart DHNA’s sailing directions refer skippers to."],
        { listItems: harbourSources.map((source) => source.label) },
      ),
    ],
    checklist: [
      "Call Dartnav on VHF Ch 11 before you commit to a pontoon or buoy.",
      "If you pre-book, use the 2026 Dart Harbour visitors page, then still check in on the radio.",
      "Treat 1.8 m (Town Jetty) and 2 m (DA Pontoon) as online-booking draught windows only.",
      "Give the ferries and the Higher Ferry wires room.",
      "Use the official Dartmouth tide links and a current Admiralty Chart 2253.",
      "Use every map in this Guide for orientation only, never for navigation.",
    ],
    sourceLinks: harbourSources,
    verifiedFacilities: [],
    location: {
      latitude: 50.3518,
      longitude: -3.5789,
      mapZoom: 14,
    },
    relatedGuideSlugs: ["west-country", "weymouth-portland"],
    cruiseOnGuideSlugs: ["west-country"],
    previousGuideSlug: "west-country",
    nextGuideSlug: "",
    seoTitle: "Dartmouth Guide | Old Sea Dogs",
    seoDescription:
      "A deep, wooded river harbour between twin castles — walk-ashore pontoons in town, island pontoons and Mainstream buoys, and full-service marinas on both banks.",
    socialTitle: "Dartmouth — Old Sea Dogs Guides",
    socialDescription:
      "Dartmouth and the Dart entrance: Dartnav on Ch 11, 2026 visitor booking, and marinas on both banks.",
    canonicalPath: "/guides/west-country/dartmouth",
    editorialNotes: "Noss on Dart is a short mention under Kingswear only. No separate page.",
    researchNotes: "2026 visitors page is authoritative over any stale FAQ that still says moorings are first-come with no booking. Yacht taxi Ch 69 is from harbour-guide material and should be confirmed with DHNA.",
    reviewDue: "2027-10-26",
    accuracyConcerns: "Fees, opening hours, fuel-barge hours and the yacht-taxi channel can change. Confirm on the day. No charted depths are stated beyond the published online-booking draught windows.",
    sourceNotes: "Tide links only. No UKHO heights are stored on this page.",
    draftComments: "",
  },
];
