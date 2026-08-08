import type { FlagshipGuide, GuideSection, GuideType } from "./flagship-guides.ts";

const solentHero = "/images/guides/guides-solent-needles-hero-v1.png";
const checkedOn = "2026-07-30";

const navigationChecklist = [
  "Plan with current charts, almanacs, forecasts, tides and official notices.",
  "Check harbour authority information before entering controlled or unfamiliar water.",
  "Keep an alternative destination that suits the crew, weather and remaining daylight.",
  "Use every map in this Guide for orientation only, never for navigation.",
];

function section(
  heading: string,
  body: string[],
  links: Array<{ label: string; guideSlug: string }> = [],
): GuideSection {
  return {
    heading,
    anchor: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    kind: heading === "Old Sea Dogs View" || heading === "Skipper’s Notes" ? "callout" : "prose",
    body,
    links,
  };
}

export const guideProductSeeds: FlagshipGuide[] = [
  {
    internalId: "OSD-G001",
    slug: "the-solent",
    title: "The Solent",
    eyebrow: "Old Sea Dogs Guides",
    summary: "Britain’s most concentrated cruising ground: compact, tidal, crowded with choices and never quite mastered.",
    introduction:
      "There comes a point in almost every Solent passage when the shore stops being a boundary. The tide starts making decisions, a ferry alters the geometry of the water, and a modest line on the chart opens into half a dozen possible voyages. Chalk, salt marsh, dockyard walls and forests of masts remain close at hand, yet this sheltered channel can still feel wonderfully large. Beginners learn their first cruising habits here; old hands continue to be caught thinking they know it. Between the Needles and Spithead lies a gateway to the Channel, a working waterway and one of the central landscapes of British sailing.",
    guideType: "Cruising Area",
    regionKey: "solent",
    regionName: "The Solent",
    subregion: "South Coast",
    editorialOrder: 1,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: solentHero,
    imageAlt: "Sailing yachts passing the Needles at the western entrance to the Solent.",
    imageFocalPoint: "50% 48%",
    imageCaption: "The Solent: a compact sea room with a lifetime of choices.",
    imageCredit: "",
    artworkCredit: "",
    quickFacts: [
      { label: "Region", value: "South Coast, England" },
      { label: "Guide type", value: "Cruising Area" },
      { label: "Principal waters", value: "The Needles, Hurst Narrows, the central Solent and Spithead" },
      { label: "Cruising character", value: "Tidal, varied and intensely maritime" },
      { label: "Plan for", value: "Strong streams, shallow margins, ferries and commercial traffic" },
      { label: "Best suited to", value: "Weekends, family cruises, club sailing and longer itineraries" },
    ],
    sections: [
      section("Why the Solent Matters", [
        "The Solent is larger in the mind than it is on the chart. A straight-line passage between mainland England and the Isle of Wight may be short, but the water is crowded with alternatives: rivers that become sailing communities, island harbours with their own rhythms, wooded creeks, naval water and the western gate to the Channel. Few cruising grounds offer so many distinct days afloat within one tide’s reach.",
        "Its value is not convenience alone. Generations of sailors have learned here how wind and tide turn distance into judgement. A young crew may make its first independent crossing to Cowes while, a mile away, an offshore team tests sails before an ocean race. Dinghies, traditional craft, pilot boats, ferries and deep-draught ships all use the same landscape. That mixture demands courtesy and gives the place its extraordinary energy.",
        "Familiarity can hide the achievement of sailing it well. The Solent is sometimes treated as a training pond or a corridor to somewhere more adventurous. In truth, it condenses many of coastal cruising’s serious questions: when to wait, where to find shelter, how to cross traffic, what the tide will do at a headland and whether the crew is still enjoying the plan. Those lessons travel far beyond Hurst or Bembridge.",
        "It also matters because British maritime life is visible rather than abstract. Portsmouth’s naval presence, Southampton’s merchant shipping, Cowes racing, Hamble boatbuilding and the old western defences are not separate museum subjects. They occupy the water around you. A Solent cruise becomes richer when each movement is understood as part of that long, continuing story.",
        "For a weekend sailor, this concentration is freedom. A plan can be ambitious without requiring a long delivery, and a deteriorating forecast need not end the cruise when another shore offers a sounder idea. For a visitor on a longer passage, the same concentration provides rest, repair and a choice of onward gates. The water welcomes many kinds of voyage without becoming blandly universal.",
      ]),
      section("Understanding the Solent", [
        "Geographically, the Solent is the strait between Hampshire and the Isle of Wight. Its western entrance lies between the Needles and Hurst, where the sea room narrows and tidal streams can be forceful. Eastward it broadens past Lymington, Yarmouth and Newtown, tightens in the busy central waters around Cowes and Southampton Water, then opens across Spithead towards Portsmouth, Ryde and the eastern approaches.",
        "The mainland shore is cut by rivers and working harbours. The Lymington River, Beaulieu River, Southampton Water and River Hamble each lead into a different world. Across the water, the island coast offers Yarmouth, Newtown Creek, Cowes and the Medina, Ryde and the route towards Bembridge. The Isle of Wight is not merely the far bank; it shapes wind, sea state, traffic and the entire cruising imagination of the area.",
        "Tide is the organising force. Streams accelerate around the western entrance and prominent points, while eddies and inshore effects can make the actual water disagree with a simple hourly arrow. Wind against tide produces short, steep seas that are disproportionately tiring. A fair stream can make a passage effortless, but it can also shorten decision time at an entrance. Current charts and a tide atlas belong beside observation, not in place of it.",
        "Shelter is relative. Land is close and another harbour is often available, yet a fresh wind aligned with a long reach of water can build an uncomfortable sea. Visibility, squalls and winter cold alter familiar places quickly. The sensible Solent skipper plans the next safe choice as carefully as the preferred destination, then briefs the crew before traffic and sail handling claim everybody’s attention.",
        "Names can also mislead newcomers. ‘Western’, ‘central’ and ‘eastern’ are convenient editorial divisions, not separate basins with hard edges. A decision made off Cowes may be governed by the western stream, an arriving Southampton ship and weather building from the Channel at once. Think in connected routes and consequences rather than treating each harbour as a pin isolated on a map.",
      ]),
      section("The Western Solent", [
        "The western Solent has the clearest sense of a gate. The Needles rise beyond the island shore, Hurst Castle extends from the mainland spit and the water between them carries the promise—or warning—of the Channel. Hurst Narrows can be busy, fast and rough when stream and wind oppose. A crew heading through should understand the timing, sea state and options well before the landscape begins to close around the boat.",
        "Lymington makes a natural mainland base. It combines a lived-in coastal town, a working river and immediate access to the western waters. Ferries impose their own discipline, and the river deserves proper preparation rather than a hurried turn off the Solent. Across the channel, Yarmouth is compact and unmistakably insular: harbour and town belong together, with the Needles and Hurst close enough to influence every onward plan.",
        "Newtown Creek changes the tempo. Its wooded branches, mudflats and salt-marsh edges seem improbably quiet after the open water outside. It is a place for restraint, careful anchoring or mooring and respect for wildlife and other crews. Depth, shelter, room and access must be judged from current information. Its charm is not a promise that every boat can or should enter on every tide.",
        "Farther along the mainland shore, the Beaulieu River winds into a landscape that feels removed from the central Solent. Access is governed by its own pilotage considerations and current local guidance. It rewards crews who arrive unhurried. Together, Beaulieu, Newtown, Yarmouth and Lymington make the west unusually good for short cruises in which each leg changes the character of the day.",
      ]),
      section("The Central Solent", [
        "Cowes is the hinge. The Medina divides the town, ferries cross the entrance and racing fleets spread into the central Solent. West leads towards Newtown and Hurst; east towards Ryde and Spithead; north opens Southampton Water and the River Hamble. On a moderate day almost every compass point suggests a plausible cruise, which is precisely why the traffic picture can become complicated.",
        "The harbour’s berthing choices reflect its many identities. Cowes Yacht Haven and Shepards Marina place visitors close to West Cowes; East Cowes Marina changes the shoreside perspective; Island Harbour lies farther up the Medina. The river also serves industry, local craft and ferry traffic. Marina bookings and operational details belong with their official sources, but the evergreen truth is that lines and fenders should be prepared before the final approach becomes busy.",
        "Southampton Water is not merely the top of the Solent. It is a major commercial route with an immense maritime horizon: container ships, vehicle carriers, cruise ships, tugs and local traffic share the water. Ocean Village, Town Quay, Shamrock Quay, Saxon Wharf and Hythe each connect with a different part of the waterfront. Leisure crews must understand the traffic system and follow current ABP Southampton guidance.",
        "The River Hamble enters from the east side of Southampton Water. Hamble Point Marina sits near the river entrance, while Port Hamble, Mercury Yacht Harbour, Universal Marina and Swanwick Marina illustrate the density of the sailing and marine trades farther in. Short distances do not mean casual pilotage. The river is a working community, and its current harbour directions govern the way visitors move through it.",
      ], [
        { label: "Read the River Hamble Guide", guideSlug: "river-hamble" },
        { label: "Visit Hamble Point Marina", guideSlug: "hamble-point-marina" },
        { label: "Explore Cowes", guideSlug: "cowes" },
        { label: "Understand Southampton Water", guideSlug: "southampton-water" },
      ]),
      section("The Eastern Solent", [
        "East of Cowes the scale opens. Spithead is broad water with a naval memory, defined by Portsmouth, the island shore and the line of sea forts. The apparent space is crossed by ferries, commercial routes and naval movements. A boat under sail can feel small here, not because the water is remote but because so much serious business has passed across it.",
        "Portsmouth Harbour is the dominant destination. Its narrow entrance, working naval role and controlled movements demand early preparation and obedience to current King’s Harbour Master information. Gosport and Haslar provide the western-harbour perspective; Port Solent lies within the greater harbour system. Once secured, the dockyard, preserved ships and fortifications turn a visit into an encounter with living naval history.",
        "Ryde is conspicuous from the water, with its pier reaching over extensive shallows. Bembridge offers another island character farther east, but neither should be approached from a vague memory of the chart. Drying ground, local marks, traffic and conditions require current references. The eastern Solent rewards crews who resist the impression that broad water automatically means a simple arrival.",
        "This end of the cruising ground is well suited to a history-led itinerary or a passage continuing east, but it is also a fine destination in its own right. Portsmouth’s scale, Ryde’s long shoreline and the quieter island approaches form a useful counterpoint to the tight western gate. The seamanship is different, not lesser.",
      ], [{ label: "Read the Portsmouth Harbour Guide", guideSlug: "portsmouth-harbour" }]),
      section("Rivers and Creeks", [
        "The Solent’s rivers are where sailing becomes social infrastructure. The Hamble is lined with yards, clubs, pontoons, training boats and businesses that send craft towards every kind of voyage. The Medina joins Cowes to East Cowes and carries ferry, leisure and commercial movements. Lymington’s river binds the town to the water, while Beaulieu moves through a quieter and more rural landscape.",
        "A river passage asks for a change of mental gear. Speed limits, cross traffic, narrow channels, moorings and small ferries replace the open-water calculations of the Solent. Sail handling should be anticipated; wash matters; another boat’s constrained movement may not be obvious. Current harbour directions take precedence over inherited habits, particularly in water that feels familiar.",
        "Creeks offer another kind of seamanship. Newtown’s branches and salt marsh reward quiet observation, but shallow water and ecological sensitivity leave little room for entitlement. Established anchorages and moorings still require a suitable forecast, adequate depth and consideration for swing, noise and shore access. The right decision may be to enjoy the entrance and continue elsewhere.",
        "These waterways are not appendices to the main cruising ground. They explain it. Boats are designed, repaired, raced and lived aboard on their banks; knowledge travels from yard to club bar and back to the pontoons. To cruise only the open Solent is to read the title and miss several of the best chapters.",
      ], [
        { label: "Follow the River Hamble", guideSlug: "river-hamble" },
        { label: "Explore Beaulieu River", guideSlug: "beaulieu-river" },
        { label: "Slow down in Newtown Creek", guideSlug: "newtown-creek" },
      ]),
      section("Harbours and Marinas", [
        "A Solent berth is part of the passage plan, not simply the place where sailing stops. Cowes puts a crew inside the central crossroads. Yarmouth serves the western gate. Portsmouth offers naval scale and transport connections. Lymington opens the west from the mainland, while the Hamble and Southampton waterfront offer dense concentrations of services and boats.",
        "Marinas within the same river are not interchangeable. Hamble Point’s position near the river entrance suits crews who value quick access to Southampton Water and the Solent. Port Hamble is closer to the village; Mercury, Universal and Swanwick occupy different reaches and working contexts. Official marina information should settle current facilities, visitor arrangements and contact procedures rather than hearsay or a remembered visit.",
        "Southampton’s marina landscape has its own industrial character. Ocean Village lies near the city centre, while Shamrock Quay and Saxon Wharf are associated with the marine trades and yard activity. Hythe faces the commercial water from the western shore. Town Quay is relevant to some visiting plans, but operational suitability and access must be checked rather than assumed from its name.",
        "The best choice depends on what follows. A crew change, dog walk, early tide, repair, rail connection or need for a quiet night may outweigh the shortest distance. Old Sea Dogs Marina Guides describe atmosphere and strategic setting, then point back to the official operator for the facts that can change. That division keeps editorial judgement useful without pretending to be a live directory.",
        "Booking has changed the psychology of short cruising. A confirmed berth can settle a nervous crew, but it can also tempt a skipper to press on when the kindly choice is elsewhere. Treat a reservation as an option with terms, not a command from shore. Tell the marina if plans change, arrive within the agreed procedure and keep the crew’s safety ahead of sunk cost or embarrassment.",
      ], [
        { label: "Hamble Point Marina Guide", guideSlug: "hamble-point-marina" },
        { label: "Cowes Guide", guideSlug: "cowes" },
        { label: "Yarmouth Guide", guideSlug: "yarmouth" },
      ]),
      section("Anchorages", [
        "Dropping the hook changes the measure of a Solent cruise. Engines recede, shore lights acquire distance and the crew becomes responsible for its own patch of water. Newtown Creek is the celebrated example, but other established possibilities exist around the island and mainland shores when wind, depth, holding, access and local guidance align.",
        "No paragraph can make an anchorage safe. Bottom conditions, swinging room, tide, weather and the number of other boats must be assessed on arrival using current charts and appropriate pilotage information. A place that was tranquil on a weekday morning may be crowded by supper. A wind shift can turn a comfortable stop into a lee shore. Arrive with daylight and a usable alternative.",
        "Good anchoring is also good manners. Allow for different scopes, keep sound down, protect salt-marsh edges and avoid disturbing wildlife or restricting a navigable channel. Tender landings need the same care. Protected sites may have current access or conservation guidance, so check the responsible authority rather than relying on an old cruising anecdote.",
        "The reward is not a free berth. It is a different relationship with the place: breakfast while the tide writes patterns around the hull, an evening watched by waders, or the silence after the last passing boat. In a crowded cruising ground, that change of pace is valuable enough to deserve patience.",
      ], [{ label: "Newtown Creek anchorage context", guideSlug: "newtown-creek" }]),
      section("Pilotage and Seamanship", [
        "The Solent is generous with landmarks and unforgiving of divided attention. A skipper may be handling a tide gate, a crossing ferry, a race fleet and a sail change within the same short leg. The answer is not drama but preparation: identify the next decision, brief the crew, keep a proper lookout and leave enough sea room for somebody else to be unpredictable.",
        "Commercial shipping deserves particular respect in Southampton Water and its approaches. Large vessels may be constrained, moving faster than they appear and working with tugs or escorts. Portsmouth has its own controls and naval considerations. ABP Southampton, the King’s Harbour Master Portsmouth and local harbour authorities publish the instructions that matter; consult their current material before sailing.",
        "At Hurst and the Needles, timing and sea state dominate. Elsewhere, shallow margins, ferry tracks and wind-against-tide chop create the problems. Reefing early is often kinder than asking a tired crew to do it in confined water. The shortest route may not be the most comfortable or sensible, especially when the least experienced person aboard is still finding confidence.",
        "Electronic navigation improves awareness but does not abolish pilotage. Buoys move, displays fail and AIS is not a complete picture. Use the view from the cockpit, depth, chart, tide and official information together. This Guide provides cruising context only. It never replaces current charts, almanacs, forecasts, Notices to Mariners or harbour-master directions.",
      ]),
      section("Sailing and Racing Heritage", [
        "The Solent is one of the homes of organised yacht racing. Cowes Week gives that heritage its most visible annual expression, but the culture runs through club starts, evening series, youth training, offshore campaigns and the quiet winter work that makes summer competition possible. The Royal Yacht Squadron’s position above Cowes is a physical reminder of how deeply racing has shaped the town.",
        "Racing changed boats as well as calendars. Designers, sailmakers and builders gathered where fleets could be tested quickly in varied conditions. The central Solent became a laboratory of tide calls, close manoeuvres and boat speed. Offshore crews still leave the Hamble and Cowes to prepare for waters far beyond the island, carrying habits learned during short, exacting local races.",
        "The River Hamble has its own contribution: one-design building, training, yards and generations of crews. Its pontoons can hold family cruisers beside machines prepared for major campaigns. That coexistence is typical of the Solent. Excellence is rarely sealed away; it appears in the neighbouring berth, on the same start line or in advice given over a mug of tea.",
        "Cruising sailors benefit from this inheritance even without crossing a start. Reliable gear, skilled marine trades, rescue knowledge and an alert sailing culture all grow from repeated use. The less attractive inheritance is congestion and occasional impatience. Racing rights do not erase the ordinary obligations of seamanship, and a cruising boat should neither obstruct blindly nor panic at a fleet.",
      ]),
      section("Maritime History", [
        "Portsmouth tells the naval story most forcefully. The harbour, dockyard and approaches were shaped by the need to build, supply, defend and deploy fleets. Spithead’s forts and the defences at Hurst show how the Solent itself became strategic ground. From a yacht’s cockpit, these structures make sense as parts of a controlled maritime landscape rather than isolated monuments.",
        "Southampton Water carries the merchant story. Its sheltered reach and connection to the wider world supported liners, cargo, shipbuilding and the modern port. Today’s enormous ships continue that history in a form that leisure sailors must accommodate practically. Watching one turn or pass is impressive; understanding the space and constraints it needs is seamanship.",
        "Cowes developed through royal association, yacht design, racing and marine manufacture. The Medina’s working banks complicate the polished regatta image in the best way. Likewise, Hamble’s history is not only famous boats but a network of builders, yards, clubs and training organisations. Boatbuilding here joined skill, experiment and the demands of sailors who would soon test the result outside.",
        "History survives in ordinary routines. Ferry routes repeat old connections. Harbour walls preserve earlier priorities. A tide that carries a modern cruiser past Hurst is the same force faced by naval, merchant and fishing craft with fewer instruments and less reliable forecasts. The past is useful when it sharpens attention rather than becoming decorative nostalgia.",
      ]),
      section("Wildlife and Landscape", [
        "The Solent’s hard infrastructure can obscure how much of its character comes from soft ground. Salt marshes, mudflats, estuaries and intertidal edges absorb tide and light, creating feeding and resting places for birds and other wildlife. Newtown is the most obvious quiet landscape, but the same ecological fabric appears around rivers, creeks and sheltered shores.",
        "At low water, mudflats reveal the scale of the tidal system. Waders work the margins while channels contract into precise lines. Salt marsh may look empty from a passing boat, yet it is both habitat and a fragile boundary between land and sea. Responsible access means more than avoiding litter: wash, noise, anchoring, tender landings and dogs can all matter.",
        "The rules and sensitivities are not uniform. Protected areas have responsible bodies and guidance that may change with seasons or conservation needs. Check current information from the relevant harbour authority, land manager or conservation organisation. Do not assume that a quiet patch of shore is free for landing simply because another crew used it before.",
        "Landscape also affects seamanship. The chalk of the Needles makes the western entrance legible; wooded creeks conceal scale; low salt-marsh shores can be difficult to judge in poor visibility. Attention to birds, water colour and the shape of the land is not separate from navigation. It is part of learning what the cruising ground is doing.",
      ]),
      section("Suggested Cruises", [
        "A Solent weekend might begin in the Hamble, cross to Cowes and use the second day for Newtown or Beaulieu before returning. Treat that as a frame, not an instruction. Newtown may be unsuitable, Beaulieu may not fit the tide or Cowes may be the wiser sheltered stop. The pleasure lies in keeping the legs manageable enough to make a good decision on the day.",
        "Three days in the western Solent can link Lymington, Yarmouth, Newtown Creek and Beaulieu River. There is no virtue in collecting all four. Choose two or three according to wind and crew, then leave time for the towns, river walks and quiet hours that distinguish them. A well-timed western leg teaches more than an ambitious schedule completed under engine.",
        "For a family cruise, favour short passages, interesting shore access and destinations with several fallback options. Cowes, the Hamble and Yarmouth can provide variety without asking young or inexperienced crew to endure a long exposed day. Build the itinerary around shelter, meals, sleep and curiosity. Confidence grows when plans bend without feeling like failure.",
        "A maritime-history cruise might connect Portsmouth, Cowes, Hurst and Southampton Water. Naval power, racing, defence and merchant shipping then become parts of one voyage. Every suggested route must be rebuilt with current charts, forecasts, tides, Notices to Mariners and official harbour information. These are invitations to think, not fixed navigation plans.",
      ], [
        { label: "Start with River Hamble", guideSlug: "river-hamble" },
        { label: "Cross to Cowes", guideSlug: "cowes" },
        { label: "Shape a western stop at Yarmouth", guideSlug: "yarmouth" },
      ]),
      section("Skipper’s Notes", [
        "Decide what will make the day successful before choosing the farthest destination. For a new crew, that may be an orderly river departure and a confident island landfall. For an experienced one, it might be reaching a tide gate without rushing. Distance is a poor substitute for a clear purpose.",
        "Brief traffic as well as sails. Explain where ferries cross, how commercial vessels will be treated and who is watching which sector during manoeuvres. Prepare fenders and warps away from the entrance. In confined water, slow thinking usually begins with tasks that should have been completed outside.",
        "Keep shore plans flexible. A berth near supper may be noisy; a quiet mooring may make landing awkward; a dog, child or crew change can alter what ‘convenient’ means. Confirm current arrangements with the harbour or marina, especially where booking, access or operational details matter.",
        "Most importantly, preserve an exit. Enough daylight, fuel, battery, food and patience allow a skipper to abandon an anchorage or change harbours without turning prudence into an emergency. The Solent offers alternatives generously, but only to crews that have left themselves time to use them.",
        "Write down what surprised you. Tide observed off a headland, wash in an unexpected reach, the point at which a child became cold or the harbour that worked particularly well for an elderly crewmate are all useful. Check those observations against current sources before relying on them, but keep them. Local knowledge begins as honest attention, not certainty repeated in a bar.",
      ]),
      section("Old Sea Dogs View", [
        "The Solent is occasionally dismissed for being familiar, crowded and close to home. That is a mistake. Familiar water reveals poor habits quickly, and crowded water asks for more courtesy and awareness, not less adventure. Few places allow a sailor to meet such different conditions, histories and destinations in so compact an area.",
        "It can be gentle: a quiet reach to Newtown, a child’s first crossing, tea in a river berth. The next day it can be exacting, with a foul stream, a hard breeze and traffic compressing every decision. That changeability is the education. It keeps experienced crews attentive and lets beginners build judgement without pretending the sea has become harmless.",
        "The place has shaped generations of sailors because it rewards repetition. Cross the same water at another state of tide and it becomes a new passage. Enter the same harbour during a regatta or on a winter afternoon and it tells a different story. The Solent is best explored slowly, with curiosity and a willingness to turn aside.",
        "Do not merely cross it on the way to somewhere that sounds farther away. Follow a river upstream, wait for the right western tide, spend a night where birds replace engines and look back at Portsmouth from the water. The variety is the voyage, and it remains extraordinary.",
      ]),
    ],
    checklist: navigationChecklist,
    sourceLinks: [
      { label: "ABP Southampton Marine Leisure Guide", href: "https://www.southamptonvts.co.uk/yachting_leisure/marine_leisure_guide/" },
      { label: "King’s Harbour Master Portsmouth", href: "https://www.royalnavy.mod.uk/khm/portsmouth" },
      { label: "River Hamble Harbour Authority", href: "https://www.hants.gov.uk/thingstodo/hambleharbour" },
      { label: "Solent Forum habitat information", href: "https://www.solentforum.org/services/Information_Hubs/Habitat_Restoration/" },
    ],
    location: { latitude: 50.77, longitude: -1.3, mapZoom: 10, what3words: "", osGridReference: "" },
    relatedGuideSlugs: ["river-hamble", "cowes", "newtown-creek", "yarmouth", "portsmouth-harbour"],
    cruiseOnGuideSlugs: ["river-hamble", "cowes", "newtown-creek", "yarmouth"],
    previousGuideSlug: "",
    nextGuideSlug: "river-hamble",
    seoTitle: "The Solent Cruising Guide | Old Sea Dogs",
    seoDescription: "Explore the Solent’s harbours, rivers, anchorages, tides, sailing history and maritime character with the flagship Old Sea Dogs cruising Guide.",
    socialTitle: "The Solent — Old Sea Dogs Guides",
    socialDescription: "A deep, story-led cruising Guide to Britain’s most concentrated sailing waters.",
    canonicalPath: "/guides/solent/the-solent",
    editorialNotes: "First editorial edition. Preserve the division between evergreen context and current official navigation information.",
    researchNotes: "Geographic and operational context checked against official harbour sources listed below. Named marinas are contextual references, not facility claims.",
    reviewDue: "2027-07-30",
    accuracyConcerns: "Review any operational wording if harbour traffic schemes or conservation guidance change.",
    sourceNotes: `Official ABP Southampton, KHM Portsmouth, River Hamble Harbour Authority and Solent Forum pages checked ${checkedOn}.`,
    draftComments: "",
  },
  createRiverHamble(),
  createHamblePoint(),
  createCowes(),
  createNewtownCreek(),
  createYarmouth(),
  createPortsmouth(),
  createSouthamptonWater(),
  createBeaulieuRiver(),
];

function createNewtownCreek(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G005",
    slug: "newtown-creek",
    title: "Newtown Creek Guide",
    guideType: "Anchorage",
    order: 5,
    image: {
      url: "/images/guides/guides-newtown-creek-hero-v1.png",
      alt: "Newtown Creek and its surrounding salt marsh viewed from above.",
      focalPoint: "50% 48%",
    },
    summary: "A practical anchorage reference for approaching Newtown Creek, using its moorings and protecting its sensitive natural setting.",
    introduction: "Newtown Creek is one of the finest natural anchorages in the Solent. Sheltered, peaceful and almost entirely undeveloped, it provides a striking contrast to the busy marinas and harbours elsewhere on the South Coast.\n\nProtected as a National Nature Reserve and managed by the National Trust, the creek is valued as much for its wildlife as for its sheltered waters. For many cruising sailors it is the ideal overnight stop, where the emphasis shifts from marinas and shore facilities to quiet anchorages, careful pilotage and respect for a sensitive natural environment.",
    sections: [],
    related: ["the-solent", "cowes", "yarmouth", "beaulieu-river"],
    cruiseOn: ["yarmouth", "cowes", "beaulieu-river", "river-hamble", "portsmouth-harbour"],
    previous: "cowes",
    next: "yarmouth",
    subregion: "Newtown Creek",
  });

  guide.quickFacts = [
    { label: "Guide type", value: "Anchorage Guide" },
    { label: "Classification", value: "Anchorage" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "Newtown Creek" },
    { label: "Management", value: "National Trust" },
    { label: "Nature reserve", value: "Newtown National Nature Reserve" },
    { label: "Visitor moorings", value: "Available" },
    { label: "Anchoring", value: "Permitted in designated areas" },
    { label: "Fuel", value: "None" },
    { label: "Water", value: "None" },
    { label: "Electricity", value: "None" },
    { label: "Pump-out", value: "None" },
    { label: "Shore facilities", value: "Very limited" },
    { label: "Best for", value: "Quiet cruising, wildlife, overnight anchorage" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body),
    listItems,
  });

  guide.sections = [
    section("Arrival from the Solent", [
      "Approach from the Western Solent using the buoyed entrance.",
      "Remain within the marked channel.",
      "Depths reduce quickly outside the channel.",
      "Allow for tidal state when entering or leaving.",
    ]),
    withList("Entrance & Navigation", ["The entrance and creek require slow, careful navigation."], [
      "Narrow entrance",
      "Buoyed channel",
      "Shallow water outside the channel",
      "Tidal streams influence manoeuvring",
      "Slow speed",
      "No wash",
    ]),
    section("Anchoring", [
      "Anchoring is permitted in suitable designated areas.",
      "Use appropriate scope.",
      "Avoid obstructing channels or visitor moorings.",
      "Respect environmentally sensitive seabed where identified.",
    ]),
    section("Visitor Moorings", [
      "Visitor moorings are available on a first-come basis where provided.",
      "Do not occupy private moorings.",
      "Follow National Trust and harbour guidance.",
    ]),
    section("Landing Ashore", [
      "Dinghy landings are available at designated landing points.",
      "Respect tidal conditions.",
      "Do not obstruct pontoons or slipways.",
    ]),
    withList("Wildlife & Conservation", [
      "Keep wash to an absolute minimum, avoid disturbing nesting birds and take litter home.",
    ], [
      "National Nature Reserve",
      "Saltmarsh",
      "Birdlife",
      "Seagrass",
      "Protected habitats",
    ]),
    withList("Walking", ["Walking opportunities around Newtown Creek include:"], [
      "National Trust footpaths",
      "Bird hides",
      "Woodland",
      "Historic salt workings",
      "Views across the Solent",
    ]),
    withList("Best For", ["Newtown Creek is particularly well suited to:"], [
      "Quiet overnight stops",
      "Families",
      "Nature lovers",
      "Photography",
      "Traditional cruising",
    ]),
    withList("Less Suitable For", ["A different destination may suit crews seeking:"], [
      "Nightlife",
      "Fuel stops",
      "Provisioning",
      "High-speed boating",
      "Large wash",
    ]),
    withList("Nearby Cruising", ["Newtown Creek is well placed for onward cruising around the western and central Solent."], [
      "Yarmouth",
      "Cowes",
      "Beaulieu River",
      "Lymington",
      "River Hamble",
      "Portsmouth Harbour",
    ]),
    section("Old Sea Dogs View", [
      "There are places in the Solent where the day's sailing ends with a marina berth, shore power and a busy waterfront. Newtown Creek offers something very different.",
      "Once the anchor is down and the tide begins to ease, the only sounds are often the curlew, the halyards and the gentle movement of boats lying quietly to their moorings. It is one of the few places where modern cruising still feels connected to the rhythms of the natural world.",
      "The facilities are intentionally limited, but that is precisely its appeal. Newtown rewards skippers who arrive prepared, navigate with care and are content to spend an evening watching the light fade across the marshes rather than searching for the nearest marina bar.",
    ]),
    withList("Information checked against official sources", ["Primary sources"], [
      "National Trust",
      "Newtown National Nature Reserve",
      "Relevant Admiralty and harbour navigation guidance",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Newtown Creek Guide | Old Sea Dogs";
  guide.seoDescription = "A practical Newtown Creek anchorage Guide covering tidal access, anchoring, visitor moorings, shore landings, conservation and nearby cruising.";
  guide.socialTitle = "Newtown Creek Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Newtown Creek is an Anchorage Guide managed principally by the National Trust; do not present it as a marina, harbour or river Guide.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational and conservation information with the National Trust and relevant navigation guidance before future substantive updates.";
  guide.sourceNotes = "National Trust; Newtown National Nature Reserve; relevant Admiralty and harbour navigation guidance.";
  return guide;
}

function createSouthamptonWater(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G008",
    slug: "southampton-water",
    title: "Southampton Water Guide",
    guideType: "Cruising Area",
    order: 8,
    image: {
      url: "/images/guides/guides-southampton-water-hero.png",
      alt: "A sailing yacht crossing Southampton Water with commercial shipping in the distance.",
      focalPoint: "55% 50%",
    },
    summary: "A professional cruising reference for commercial traffic, VTS procedures, marina access and passage planning on Southampton Water.",
    introduction: "Southampton Water is one of Britain's busiest and most important commercial waterways. Stretching from Calshot to the City of Southampton, it serves one of Europe's leading deep-water ports while also providing access to some of the country's best-known marinas and sailing centres.\n\nCommercial shipping, cruise liners, container ships, ferries, naval vessels and recreational craft all share the same water. Safe navigation depends on good planning, maintaining a listening watch on Southampton VTS and understanding the movement of large commercial vessels.",
    sections: [],
    related: ["the-solent", "river-hamble", "hamble-point-marina", "portsmouth-harbour"],
    cruiseOn: ["river-hamble", "beaulieu-river", "cowes", "portsmouth-harbour", "newtown-creek", "yarmouth"],
    previous: "portsmouth-harbour",
    next: "beaulieu-river",
    subregion: "Southampton Water",
    sourceLinks: [{ label: "Southampton VTS", href: "https://www.southamptonvts.co.uk" }],
  });

  guide.quickFacts = [
    { label: "Guide type", value: "Estuary & Commercial Waterway Guide" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "Southampton Water" },
    { label: "Port authority", value: "Associated British Ports" },
    { label: "VTS", value: "Channel 12" },
    { label: "Call sign", value: "Southampton VTS" },
    { label: "Commercial traffic", value: "Heavy" },
    { label: "Cruise ships", value: "Regular" },
    { label: "Container port", value: "Yes" },
    { label: "Oil terminals", value: "Yes" },
    { label: "Visitor marinas", value: "Multiple" },
    { label: "Fuel", value: "Available" },
    { label: "Marine services", value: "Extensive" },
    { label: "Best for", value: "Passage making, cruising, marina access" },
  ];

  const withList = (heading: string, body: string[], listItems: string[], links?: Array<{ label: string; guideSlug: string }>) => ({
    ...section(heading, body, links),
    listItems,
  });

  guide.sections = [
    section("Arrival from the Solent", [
      "Approach via the central Solent shipping channel.",
      "Maintain a listening watch on Southampton VTS, VHF Channel 12.",
      "Large commercial vessels may have restricted manoeuvrability.",
      "Cross the main shipping channel only when safe to do so.",
    ]),
    section("Southampton VTS", [
      "Southampton VTS monitors vessel movements throughout Southampton Water.",
      "Recreational craft should maintain a listening watch on VHF Channel 12 when navigating the waterway.",
      "Follow instructions from Southampton VTS where applicable.",
    ]),
    withList("Commercial Shipping", [
      "Large commercial vessels have priority within the navigation channel.",
    ], [
      "Container ships",
      "Cruise liners",
      "Car carriers",
      "Oil tankers",
      "Vehicle carriers",
      "Naval vessels",
      "Ferries",
    ]),
    withList("Navigation", ["Navigate Southampton Water with close attention to commercial traffic and current local directions."], [
      "Remain clear of the main shipping channel where possible.",
      "Avoid impeding commercial traffic.",
      "Cross shipping lanes at right angles where safe.",
      "Observe harbour speed limits and local navigation directions.",
    ]),
    section("Tides & Currents", [
      "Southampton Water is fully tidal.",
      "Strong tidal streams may be experienced, particularly near Calshot and river entrances.",
      "Plan passages with tidal flow where practical.",
    ]),
    withList("Marinas & Visitor Berthing", [
      "Southampton Water and its connected waterways provide multiple marina and visitor-berthing options. Availability and arrival arrangements are managed by each operator.",
    ], [
      "Hamble Point Marina",
      "Port Hamble Marina",
      "Mercury Yacht Harbour",
      "Universal Marina",
      "Ocean Village Marina",
      "Town Quay Marina",
      "Hythe Marina Village",
      "Swanwick Marina",
    ], [
      { label: "Read the Hamble Point Marina Guide", guideSlug: "hamble-point-marina" },
      { label: "Explore the River Hamble Guide", guideSlug: "river-hamble" },
    ]),
    section("Fuel", [
      "Diesel and petrol are available at several marinas on Southampton Water, including Hythe Marina Village, Ocean Village Marina, Port Hamble Marina and other riverside facilities.",
      "Availability and opening hours vary by operator.",
      "Fresh water is available at the principal marinas.",
      "Electricity is available on serviced visitor berths where provided.",
    ]),
    withList("Marine Services", ["Southampton Water supports an extensive concentration of marine services."], [
      "Boatyards",
      "Travel lifts",
      "Engineers",
      "Riggers",
      "Chandlers",
      "Brokerage",
      "Sailmakers",
      "Electronics",
      "Storage",
      "RYA Training",
    ]),
    withList("Cruise & Commercial Terminals", ["Major commercial and passenger operations around Southampton Water include:"], [
      "Southampton Cruise Terminals",
      "Container Port",
      "Vehicle Terminal",
      "Oil Terminal",
      "Marchwood Military Port",
      "Red Funnel Ferries",
    ]),
    withList("Ashore", ["Shore destinations and practical connections include:"], [
      "Southampton Old Town",
      "Ocean Village",
      "Hythe",
      "Royal Victoria Country Park",
      "West Quay",
      "Rail connections",
    ]),
    withList("Best For", ["Southampton Water is particularly well suited to:"], [
      "Cruising",
      "Passage planning",
      "Marine services",
      "Training",
      "Channel crossings",
    ]),
    withList("Less Suitable For", ["A different waterway may suit:"], [
      "Inexperienced skippers unfamiliar with heavy commercial traffic",
    ]),
    withList("Nearby Cruising", ["Southampton Water connects directly with destinations across the Solent."], [
      "River Hamble",
      "Beaulieu River",
      "Cowes",
      "Portsmouth Harbour",
      "Newtown Creek",
      "Yarmouth",
      "Lymington",
    ]),
    section("Old Sea Dogs View", [
      "Few stretches of water in Britain demonstrate the coexistence of commercial shipping and recreational boating as successfully as Southampton Water. A yacht under sail may find itself sharing the same channel with a cruise ship, container vessel or tanker, yet with good seamanship and an understanding of the navigation rules, the waterway is remarkably straightforward to use.",
      "Beyond the commercial activity lies a thriving leisure scene. Marinas line both shores, yacht clubs are among the busiest in the country and the entrances to the Hamble and Beaulieu rivers are only minutes apart. Southampton Water is not simply a route to somewhere else; it is one of the great maritime gateways of southern England.",
    ]),
    withList("Information checked against official sources", ["Primary sources"], [
      "Associated British Ports (ABP)",
      "Southampton VTS",
      "UK Harbour Authorities",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Southampton Water Guide | Old Sea Dogs";
  guide.seoDescription = "A professional Southampton Water Guide covering VTS procedures, commercial shipping, navigation, tides, marinas, fuel and onward cruising.";
  guide.socialTitle = "Southampton Water Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Southampton Water is the parent Estuary & Commercial Waterway Guide; do not present it as a marina, harbour or river Guide.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational information with Associated British Ports and Southampton VTS before future substantive updates.";
  guide.sourceNotes = "Associated British Ports (ABP); Southampton VTS; UK Harbour Authorities.";
  return guide;
}

function createBeaulieuRiver(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G009",
    slug: "beaulieu-river",
    title: "Beaulieu River Guide",
    guideType: "River",
    order: 9,
    image: {
      url: "/images/guides/guides-beaulieu-river-hero.png",
      alt: "Boats moored along the wooded Beaulieu River.",
      focalPoint: "50% 48%",
    },
    summary: "A practical cruising reference for entering the Beaulieu River, finding visitor moorings and exploring Buckler’s Hard.",
    introduction: "The Beaulieu River is one of the most beautiful and best-preserved rivers on the South Coast. Flowing through the New Forest before reaching the Solent, it combines outstanding natural scenery with centuries of maritime history.\n\nUnlike the River Hamble, the Beaulieu remains largely undeveloped. Visitor moorings, quiet anchorages, wooded banks and the historic shipbuilding village of Buckler's Hard create a cruising destination that rewards slow, careful navigation and an appreciation of its unique character.",
    sections: [],
    related: ["the-solent", "newtown-creek", "yarmouth", "river-hamble"],
    cruiseOn: ["cowes", "newtown-creek", "yarmouth", "river-hamble", "portsmouth-harbour"],
    previous: "southampton-water",
    next: "",
    subregion: "Beaulieu River",
  });

  guide.quickFacts = [
    { label: "Guide type", value: "River Guide" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "Beaulieu River" },
    { label: "River authority", value: "Beaulieu Estate" },
    { label: "Harbour office", value: "Buckler's Hard Yacht Harbour Office, Buckler's Hard, Beaulieu, SO42 7XB" },
    { label: "Telephone", value: "01590 616200" },
    { label: "Harbour VHF", value: "Channel 68" },
    { label: "VHF", value: "68" },
    { label: "Visitor moorings", value: "Available" },
    { label: "Fuel", value: "Available at Buckler's Hard" },
    { label: "Water", value: "Available" },
    { label: "Electricity", value: "Available on serviced berths where provided" },
    { label: "Pump-out", value: "Where available through harbour facilities" },
    { label: "Historic site", value: "Buckler's Hard" },
    { label: "Best for", value: "Cruising, history, quiet weekends" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body),
    listItems,
  });

  guide.sections = [
    section("Arrival from the Solent", [
      "Approach the river entrance with care, identifying Gins Farm and the entrance beacons before committing to the buoyed channel.",
      "The entrance is straightforward in settled conditions but strong cross-tides can be experienced across the river mouth, particularly during spring tides.",
      "Maintain a listening watch on VHF Channel 68.",
      "Follow the marked channel throughout the approach.",
    ]),
    withList("Navigation", ["Navigate the Beaulieu River with care and consideration for its confined water and other users."], [
      "The river is narrow in places.",
      "Remain within the buoyed channel.",
      "Observe posted speed limits.",
      "Minimise wash.",
      "Give consideration to moorings, wildlife and other river users.",
    ]),
    section("Tides and River Conditions", [
      "The Beaulieu River is fully tidal.",
      "Tidal streams become stronger near the entrance.",
      "Depths reduce away from the marked channel.",
      "Visitors should plan arrivals around the tide where appropriate.",
    ]),
    section("Visitor Moorings", [
      "Visitor moorings are provided by the Beaulieu Estate.",
      "Advance booking is recommended during busy periods.",
      "Harbour staff allocate moorings where appropriate.",
      "A limited number of pontoon berths are available.",
    ]),
    withList("Buckler's Hard", ["Buckler's Hard is the river’s historic and practical focus for visiting crews."], [
      "Historic shipbuilding village",
      "Maritime museum",
      "Visitor facilities",
      "Public pontoon",
      "Yacht Harbour",
      "Excellent walking",
    ]),
    withList("Facilities", [
      "Diesel is available at Buckler's Hard Yacht Harbour. Opening hours vary, so check availability before arrival.",
      "Fresh water is available at Buckler's Hard Yacht Harbour.",
      "Electricity is available on serviced berths where provided.",
    ], [
      "Visitor Moorings",
      "Fuel",
      "Water",
      "Electricity",
      "Toilets",
      "Showers",
      "Laundry",
      "Harbour Office",
      "Museum",
      "Café",
    ]),
    withList("Wildlife & Conservation", [
      "Observe no-wash areas where applicable and respect wildlife at all times.",
    ], [
      "National Nature Reserve",
      "Saltmarsh",
      "Birdlife",
      "Protected habitats",
    ]),
    withList("Walking Ashore", ["The river and Buckler's Hard provide access to several walking destinations."], [
      "Buckler's Hard",
      "Beaulieu Village",
      "New Forest walks",
      "River paths",
      "Historic attractions",
    ]),
    withList("Best For", ["The Beaulieu River is particularly well suited to:"], [
      "Quiet cruising",
      "Families",
      "History",
      "Photography",
      "Nature",
      "Traditional sailing",
    ]),
    withList("Less Suitable For", ["A different destination may suit:"], [
      "High-speed boating",
      "Large wash",
      "Visitors expecting marina-style nightlife",
    ]),
    withList("Nearby Cruising", ["The Beaulieu River is well placed for onward cruising around the Solent."], [
      "Cowes",
      "Newtown Creek",
      "Lymington",
      "Yarmouth",
      "River Hamble",
      "Portsmouth Harbour",
    ]),
    section("Old Sea Dogs View", [
      "The Beaulieu River reminds us that the finest cruising destinations are not always the busiest. Long before reaching Buckler's Hard, the pace changes. The wooded banks close in, the river narrows and the emphasis shifts from making miles to enjoying the journey.",
      "Generations of shipbuilders, naval vessels and yachts have used these waters, yet the river has retained an atmosphere that feels remarkably untouched. Visitors who arrive with patience, keep their wash down and take time to explore ashore are rewarded with one of the Solent's most memorable cruising destinations.",
    ]),
    withList("Information checked against official sources", ["Primary sources"], [
      "Beaulieu Estate",
      "Buckler's Hard Yacht Harbour",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Beaulieu River Guide | Old Sea Dogs";
  guide.seoDescription = "A practical Beaulieu River Guide covering arrival, tidal navigation, visitor moorings, Buckler’s Hard, facilities, conservation and nearby cruising.";
  guide.socialTitle = "Beaulieu River Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Beaulieu River is a River Guide managed by the Beaulieu Estate; do not present it as a marina or harbour Guide.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational information with the Beaulieu Estate or Buckler's Hard Yacht Harbour before future substantive updates.";
  guide.sourceNotes = "Beaulieu Estate; Buckler's Hard Yacht Harbour.";
  return guide;
}

function createRiverHamble(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G002",
    slug: "river-hamble",
    title: "River Hamble Guide",
    guideType: "River",
    order: 2,
    image: {
      url: "/images/guides/guides-river-hamble-hero-v1.png",
      alt: "Sailing boats and marinas along the River Hamble at golden hour.",
      focalPoint: "50% 52%",
    },
    summary: "A practical cruising reference for entering, navigating and choosing a berth on one of Britain’s best-known yachting rivers.",
    introduction: "The River Hamble is one of Britain's best-known yachting rivers and one of the busiest recreational waterways in Europe. From its entrance at Southampton Water to the historic villages of Hamble-le-Rice, Bursledon and Warsash, the river supports world-class marinas, boatyards, sailing schools and marine businesses.\n\nIts deep-water access, extensive visitor facilities and close proximity to the Solent have made it the traditional base for generations of cruising and racing sailors.",
    sections: [],
    related: ["the-solent", "hamble-point-marina", "southampton-water", "cowes"],
    cruiseOn: ["hamble-point-marina", "cowes", "newtown-creek", "beaulieu-river", "portsmouth-harbour", "yarmouth"],
    previous: "the-solent",
    next: "hamble-point-marina",
    parentGuideSlug: "the-solent",
    subregion: "River Hamble",
    sectionLinks: { "Principal Marinas": [{ label: "Read the Hamble Point Marina Guide", guideSlug: "hamble-point-marina" }] },
    sourceLinks: [
      { label: "River Hamble Harbour Authority", href: "https://www.hants.gov.uk/thingstodo/hambleharbour" },
    ],
  });

  guide.quickFacts = [
    { label: "Guide type", value: "River Guide" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "River Hamble" },
    { label: "Harbour authority", value: "River Hamble Harbour Authority" },
    { label: "Authority", value: "Hampshire County Council" },
    { label: "Harbour office", value: "Harbour Master's Office, Warsash" },
    { label: "Telephone", value: "01489 576387" },
    { label: "Email", value: "harbour.office@hants.gov.uk" },
    { label: "Harbour VHF", value: "Channel 68" },
    { label: "VHF", value: "68" },
    { label: "Speed limit", value: "6 knots north of No.1 buoy" },
    { label: "Fuel", value: "Available" },
    { label: "Visitor berths", value: "Yes" },
    { label: "Lift-out facilities", value: "Extensive" },
    { label: "Boatyards", value: "Numerous" },
    { label: "RYA schools", value: "Several" },
    { label: "Marine services", value: "Extensive" },
    { label: "Best for", value: "Cruisers, racers, training and refit" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body, heading === "Principal Marinas" ? [{ label: "Read the Hamble Point Marina Guide", guideSlug: "hamble-point-marina" }] : undefined),
    listItems,
  });

  guide.sections = [
    section("Arrival from Southampton Water", [
      "Approach via Southampton Water.",
      "Leave Hamble Point Cardinal appropriately and enter between the marked channel buoys.",
      "Maintain a listening watch on Channel 68. Commercial traffic may be encountered in Southampton Water.",
    ]),
    withList("Navigation", ["The River Hamble is a busy working and recreational waterway. Keep a proper lookout and account for:"], [
      "Marked navigation channel",
      "Strong tidal stream",
      "Busy weekend traffic",
      "Commercial traffic",
      "Race fleets",
      "Training craft",
      "Mooring fields",
    ]),
    section("Speed Limits", [
      "Maximum speed: 6 knots through the water north of the Number One buoy.",
      "Wash should be kept to an absolute minimum.",
    ]),
    section("Tidal Information", [
      "The River Hamble is fully tidal.",
      "Cross currents may be experienced near the entrance.",
      "Extra care should be taken during spring tides.",
    ]),
    withList("Principal Marinas", [
      "The River Hamble contains several principal marinas and visitor-berthing options. Operators manage their own availability and arrival arrangements.",
    ], [
      "Hamble Point Marina",
      "Port Hamble Marina",
      "Mercury Yacht Harbour",
      "Universal Marina",
      "Swanwick Marina",
      "Deacons Marina",
      "Warsash Harbour Moorings",
    ]),
    section("Visitor Berthing", [
      "Visitor berths are available throughout the river.",
      "Availability varies between operators.",
      "Advance booking is recommended during the summer.",
    ]),
    section("Fuel", [
      "Fuel is available at Port Hamble Marina and selected other facilities on the river.",
      "Opening hours vary.",
    ]),
    section("Water & Electricity", [
      "Fresh water is available at the principal marinas.",
      "Electricity is available at visitor marinas where berth services are provided.",
    ]),
    withList("Marine Services", ["The river supports an extensive concentration of marine services."], [
      "Boatyards",
      "Travel lifts",
      "Rigging",
      "Engineers",
      "Electronics",
      "Chandlers",
      "Brokerage",
      "Sailmakers",
      "Storage ashore",
      "Dry sailing",
      "RYA training centres",
    ]),
    withList("Ashore", ["The river’s villages and banks provide practical stops and a strong maritime setting."], [
      "Hamble-le-Rice",
      "Warsash",
      "Bursledon",
      "Pubs",
      "Restaurants",
      "Walking",
      "Maritime history",
    ]),
    withList("Walking the River", ["Places and connections associated with walking the River Hamble include:"], [
      "Hamble Common",
      "The Jolly Sailor",
      "Pink Ferry",
      "Riverside footpaths",
      "Nature reserves",
    ]),
    withList("Best For", ["The River Hamble is particularly well suited to:"], [
      "Cruising",
      "Racing",
      "Training",
      "Refit",
      "Families",
      "Weekend sailing",
    ]),
    withList("Less Suitable For", ["A different destination may better suit:"], [
      "High-speed boating",
      "Visitors seeking quiet anchorages",
      "Busy summer weekends",
    ]),
    withList("Nearby Cruising", ["The river provides direct access to onward cruising around the Solent."], [
      "Cowes",
      "Newtown Creek",
      "Beaulieu River",
      "Portsmouth Harbour",
      "Yarmouth",
      "Lymington",
      "Bembridge",
    ]),
    section("Old Sea Dogs View", [
      "The River Hamble is where countless sailing careers have begun. Olympic crews, weekend cruisers, yacht brokers and boatbuilders all share the same stretch of water, giving the river an energy that is difficult to match elsewhere on the South Coast.",
      "Despite its popularity, the Hamble still rewards those who slow down. Beyond the marinas lie quiet reaches, riverside pubs, wooded banks and a sense of maritime tradition that has survived generations of change. The challenge is rarely finding somewhere to berth; it is finding enough time to explore everything the river has to offer.",
    ]),
    withList("Information checked against official sources", ["Primary sources"], [
      "River Hamble Harbour Authority",
      "Hampshire County Council",
      "MDL Marinas",
      "Premier Marinas",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "River Hamble Guide | Old Sea Dogs";
  guide.seoDescription = "A practical River Hamble Guide covering arrival, navigation, speed limits, tides, marinas, visitor berths, fuel, services and onward cruising.";
  guide.socialTitle = "River Hamble Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "River Hamble is the parent River Guide; do not present it as a marina or harbour Guide.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational information with the River Hamble Harbour Authority and relevant marina operator before future substantive updates.";
  guide.sourceNotes = "River Hamble Harbour Authority; Hampshire County Council; MDL Marinas; Premier Marinas.";
  return guide;
}

function createHamblePoint(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G004",
    slug: "hamble-point-marina",
    title: "Hamble Point Marina",
    guideType: "Marina",
    order: 3,
    image: {
      url: "/images/guides/guides-marina-hamble-point-hero-v1.png",
      alt: "Hamble Point Marina and the lower River Hamble viewed from above.",
      focalPoint: "50% 50%",
    },
    summary: "A purposeful marina at the mouth of the Hamble, shaped by quick Solent access, serious marine trades and a famously busy sailing river.",
    introduction: "After a Solent passage, the Hamble entrance gathers the day into a narrow, animated scene. Masts fill the banks, boats turn towards their berths and Southampton Water remains close astern. Hamble Point sits at that threshold. It is not a hushed retreat from sailing life, but a practical place embedded in it: useful to a visiting cruiser, well placed for the next tide and surrounded by the work of keeping boats moving.",
    sections: [
      ["Overview", "The official name is MDL Hamble Point Marina. It lies on the River Hamble near its entrance from Southampton Water, placing the central Solent within immediate reach. That position defines the marina more accurately than a list of amenities. Crews can arrive at the end of a crossing, base a series of short Solent passages or prepare for a longer departure without travelling far upstream.\n\nThe setting is intensely nautical. Dry-sailed and stored boats, yard movements, sailing schools, marine businesses and visiting crews create a purposeful atmosphere. This is not a marina designed to disguise its work. The attraction is seeing the trades and routines of sailing concentrated around the pontoons.\n\nVisitor suitability depends on expectation. A crew wanting strategic access, shoreside essentials and marine support will understand the appeal quickly. Somebody seeking an isolated rural night may prefer another part of the cruising ground. Official booking, contact and operational arrangements should always be checked directly before arrival."],
      ["Arrival by Sea", "Hamble Point is encountered shortly after entering the River Hamble from Southampton Water. The broad commercial water outside gives way to a busy recreational harbour, so arrival requires a deliberate shift from open-water sailing to close observation. Boats may be entering, leaving, crossing or preparing to turn into nearby facilities.\n\nThe River Hamble Harbour Authority’s current directions and notices govern navigation. Commercial context in Southampton Water, leisure traffic in the river, tide and the movements of small craft all deserve attention. Prepare fenders and lines before they compete with lookout work, keep speed and wash appropriate, and give constrained or uncertain traffic room.\n\nThis Guide does not reproduce a turn-by-turn approach. Marks, procedures and notices can change, and a website narrative is the wrong instrument for live pilotage. Skippers must use current charts, almanacs, forecasts, Notices to Mariners, ABP Southampton information and River Hamble Harbour Authority guidance, then follow instructions received on the day."],
      ["Berthing Experience", "Arrival feels connected to the sailing day rather than separated from it. The lower river remains active, masts form the horizon and the next passage is never far from mind. The marina’s position can reduce the amount of river to cover before reaching Southampton Water, an advantage for crews planning an early start or a short crossing.\n\nBusy periods call for calm boat handling. Other skippers may be turning, rigging or moving between berths, and wind or tide can add to the work. Exact berth characteristics vary, so a visitor should seek the assigned-berth information and assistance offered by the marina rather than generalise from a previous stay.\n\nIn broad terms the river setting provides more enclosure than the Solent outside, but no marina berth should be assumed to be still in every condition. A good arrival is prepared outside, conducted slowly enough to observe and finished without treating neighbouring boats as fenders. For visiting cruisers, the atmosphere is lively, competent and unambiguously connected to the water."],
      ["Facilities", "Official marina information confirms toilets and showers, laundry and Wi-Fi. New washroom facilities were officially opened in 2025. These are useful stable facts; opening access, faults or temporary arrangements still belong with the operator at the time of the visit.\n\nFood and drink are available on site according to the marina’s official information, with Hamble village adding further choices. Individual businesses and hours can change, so this Guide does not promise that a particular kitchen will be open after a late landfall. A telephone or online check is more useful than an inherited recommendation.\n\nFuel is an important distinction. MDL’s Hamble Point information directs users to nearby Port Hamble for petrol and diesel rather than presenting fuel as an on-site Hamble Point facility. Skippers should plan accordingly and confirm current service arrangements. Shore power, berth water and chandlery are not asserted here because this edition did not find sufficiently clear official evidence for those public claims."],
      ["Marine Services", "Hamble Point’s strongest identity is as a marine-service centre. MDL describes a large community of on-site businesses and services, including repair and maintenance, marine electronics, boat sales and brokerage, and sailing instruction. The official material also confirms boat lifting, storage ashore, dry sailing and a slipway.\n\nThose capabilities make the marina useful for more than an overnight stop. A boat can be based near the Solent while drawing on the dense expertise of the Hamble. The presence of serious yard activity also means visitors should pay attention to working areas, vehicle movements and local instructions rather than wandering through as though the marina were only a leisure promenade.\n\nExact capacities, appointment availability and suitability for a particular vessel are operational facts. They should be confirmed directly with the marina or relevant tenant. This Guide describes the character of the place and records verified categories of service; it does not guarantee that a lift, repair slot or specialist will be available when the boat arrives."],
      ["Ashore", "Hamble village is the natural shoreside destination. Its pubs, places to eat, waterside views and compact streets reflect a community long shaped by boats. The walk from the marina keeps the river in the story, and the constant movement on the water makes even an ordinary errand feel part of a sailing visit.\n\nOfficial visitor information also points to local walking and the wider village. This is useful after a confined passage or for crew who want time off the pontoons. Footpath conditions and access can change, so a sensible visitor follows signs and respects working or private areas.\n\nRoad access makes the marina practical for joining crew and boat work, while rail connections in the wider area may be useful. Journey times and service frequency are deliberately omitted because they become stale. Check a live journey planner for the day. The enduring point is that Hamble Point belongs to an accessible sailing community rather than a remote holiday enclave."],
      ["Nearby Cruising", "The River Hamble deserves exploration beyond the marina, whether the interest is sailing culture, village life or the working reaches upstream. In the opposite direction, Southampton Water opens immediately into the commercial landscape of the port and the routes towards the central Solent.\n\nCowes is the classic island crossing, rich in racing history and harbour energy. Beaulieu River and Newtown Creek offer quieter western contrasts when tide, weather and current guidance suit them. Yarmouth carries the voyage farther towards Hurst and the Needles, while Portsmouth provides a history-led destination to the east.\n\nThese are relationships, not recommended tracks. A short distance can contain a strong stream, commercial movement or an uncomfortable wind-against-tide sea. Shape every leg with current charts, forecasts and official information. Hamble Point’s virtue is the number of sensible possibilities close by; good seamanship is choosing the one that suits this crew on this day."],
      ["History and Character", "The River Hamble has supported generations of yacht building, racing, training and offshore sailing. Local historical work records builders and one-design classes associated with the river, while the modern banks continue to hold yards, schools and specialist businesses. The technology has changed; the pattern of preparing boats here and sending them out to be tested has not.\n\nHamble Point’s marina history is connected with that post-war expansion of recreational and performance sailing. Fairey Marine is part of the local story, and historical material records the marina opening in the 1970s. This edition avoids turning a complex industrial history into a decorative paragraph; further archival work would strengthen a future version.\n\nCharacter comes from continuity between past and present. A training boat heads out, a stored yacht is prepared, a broker meets a buyer and a family crew returns from Cowes. The marina feels authentic because these activities are ordinary. It is a gateway, workshop and base before it is a brochure image."],
      ["Skipper’s Notes", "Contact the marina through its current official channel before arrival and confirm the visitor procedure, berth instructions and any services the passage depends upon. Do not assume that an arrangement remembered from a previous year still applies. Keep the Harbour Authority’s current notices and Southampton traffic context in the passage plan.\n\nRig the boat for the river before entering. Lines and fenders, a clear deck, an agreed berthing plan and one person watching traffic will make the final minutes quieter. If the assigned berth or wind makes the manoeuvre uncertain, ask for help early. Pride is a poor substitute for an unhurried second approach.\n\nPlan fuel separately: official Hamble Point information points to nearby Port Hamble. Confirm that service before relying on it. For lifting, storage or repairs, speak directly with the marina or relevant business about vessel dimensions, timing and access. The verified panel below records only stable categories checked for this edition."],
      ["Old Sea Dogs View", "Hamble Point suits the skipper who wants to be close to the Solent and close to people who understand boats. It works as a base, a passage stop and a practical staging point for work ashore. The lower-river position is the reason to choose it; the marine-service culture is the reason it can remain useful beyond a single night.\n\nThe compromise is the same energy that creates the advantage. This is a busy sailing river, not secluded water. Traffic, yard activity and a working atmosphere may be welcome signs of life or an interruption to tranquillity, depending on the crew. Arrive expecting movement and the place makes much better sense.\n\nThere is an honesty to Hamble Point. It does not need to be called the best, luxurious or hidden. Lines go ashore among boats being prepared for other voyages, the village is within reach and tomorrow’s route begins almost at the marina entrance. For many Solent sailors, that is exactly enough."],
    ],
    related: ["the-solent", "river-hamble", "cowes", "southampton-water", "beaulieu-river", "newtown-creek"],
    cruiseOn: ["river-hamble", "cowes", "beaulieu-river", "southampton-water"],
    previous: "river-hamble",
    next: "cowes",
    parentGuideSlug: "river-hamble",
    subregion: "River Hamble",
    sectionLinks: {
      "Nearby Cruising": [
        { label: "River Hamble", guideSlug: "river-hamble" },
        { label: "Cowes", guideSlug: "cowes" },
        { label: "Southampton Water", guideSlug: "southampton-water" },
        { label: "Beaulieu River", guideSlug: "beaulieu-river" },
        { label: "Newtown Creek", guideSlug: "newtown-creek" },
        { label: "Yarmouth", guideSlug: "yarmouth" },
        { label: "Portsmouth Harbour", guideSlug: "portsmouth-harbour" },
      ],
    },
    sourceLinks: [
      { label: "Official MDL Hamble Point Marina information", href: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/" },
      { label: "River Hamble Harbour Authority", href: "https://www.hants.gov.uk/thingstodo/hambleharbour" },
      { label: "ABP Southampton Marine Leisure Guide", href: "https://www.southamptonvts.co.uk/yachting_leisure/marine_leisure_guide/" },
      { label: "Hamble Local History Society", href: "https://www.hamblehistory.org.uk/community/hamble-local-history-society-12978/maritime-hamble/" },
    ],
  });
  guide.quickFacts = [
    { label: "Official name", value: "MDL Hamble Point Marina" },
    { label: "Guide type", value: "Marina" },
    { label: "Location", value: "Lower River Hamble, near Southampton Water" },
    { label: "Cruising region", value: "The Solent" },
    { label: "Visitor character", value: "Strategic lower-river stop and sailing base" },
    { label: "Official information", value: "Check MDL and River Hamble Harbour Authority before arrival" },
  ];
  guide.verifiedFacilities = [
    { label: "Toilets and showers", detail: "On-site washroom facilities; new facilities officially opened in 2025.", sourceUrl: "https://www.mdlmarinas.co.uk/news/new-facilities-at-hamble-point-marina-754/", verifiedOn: checkedOn },
    { label: "Laundry", detail: "Laundry facilities listed by the marina.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
    { label: "Wi-Fi", detail: "Wi-Fi listed by the marina.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
    { label: "Food and drink", detail: "On-site food and drink listed; confirm current business and hours.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/visitor-guide/", verifiedOn: checkedOn },
    { label: "Lifting and storage", detail: "Boat lifting, storage ashore and dry-sailing services listed.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
    { label: "Slipway", detail: "Slipway listed by the marina.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
    { label: "Marine services", detail: "On-site marine-service businesses include repair, maintenance and electronics.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
    { label: "Fuel", detail: "Petrol and diesel are directed to nearby Port Hamble, not listed as on site.", sourceUrl: "https://www.mdlmarinas.co.uk/marinas/mdl-hamble-point-marina/", verifiedOn: checkedOn },
  ];
  guide.facilityVerificationNotes = "Public copy deliberately omits shore power, berth water, chandlery, public-transport frequency, exact lifting capacities and berth or dry-stack counts until rechecked for the intended publication date. Fuel is described as nearby at Port Hamble, not on site. An authoritative marina coordinate was not present in the official sources reviewed; third-party positions conflict, so the public map remains disabled. Reconfirm visitor booking and contact procedure, washroom access, restaurant trading and all operational facilities before production publication.";
  guide.location = {};
  guide.editorialNotes = "First Marina Guide format. Narrative opening must remain ahead of quick facts; stable verified facilities are presented separately.";
  guide.researchNotes = "Official MDL marina, visitor-guide and facilities news pages checked. Arrival context checked against River Hamble Harbour Authority and ABP Southampton. Historical context checked against Hamble Local History Society; further archive work is desirable.";
  guide.accuracyConcerns = "Do not add coordinates, capacities, shore power, berth water, chandlery, live opening times, prices or availability without a current authoritative source.";
  guide.sourceNotes = `Official operator and harbour sources checked ${checkedOn}. Facility records retain their source URL and verification date in The Helm.`;
  guide.seoTitle = "Hamble Point Marina Guide | Old Sea Dogs";
  guide.seoDescription = "An independent sailing Guide to Hamble Point Marina: lower River Hamble setting, arrival context, verified facilities, marine services and nearby Solent cruising.";
  return guide;
}

function createCowes(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G003",
    slug: "cowes",
    title: "Cowes Harbour Guide",
    guideType: "Harbour",
    order: 4,
    image: {
      url: "/images/guides/guides-harbour-cowes-hero-v1.png",
      alt: "Cowes Harbour with local vessels and a Red Funnel ferry.",
      focalPoint: "55% 50%",
    },
    summary: "A practical harbour reference for approaching Cowes, choosing a berth and navigating the River Medina’s ferry and commercial traffic.",
    introduction: "Cowes is not merely another Solent harbour. It is the spiritual home of British yacht racing, a working commercial port, a gateway to the Isle of Wight and one of the busiest meeting places for cruising and racing sailors in Europe.\n\nThe River Medina divides Cowes and East Cowes, while the harbour entrance brings together yachts, RIBs, Red Jet passenger craft, Red Funnel vehicle ferries, commercial vessels and race fleets. Several distinct berthing options sit within the harbour, ranging from the central bustle of Cowes Yacht Haven and Shepards Marina to the quieter atmosphere of East Cowes Marina and the harbour’s river moorings.",
    sections: [],
    related: ["the-solent", "river-hamble", "hamble-point-marina", "newtown-creek"],
    cruiseOn: ["newtown-creek", "yarmouth", "river-hamble", "southampton-water", "portsmouth-harbour", "beaulieu-river"],
    previous: "hamble-point-marina",
    next: "newtown-creek",
  });

  guide.subregion = "River Medina";
  guide.quickFacts = [
    { label: "Guide type", value: "Harbour and marina destination" },
    { label: "Region", value: "Solent" },
    { label: "Local waterway", value: "River Medina" },
    { label: "Country", value: "England, United Kingdom" },
    { label: "Harbour authority", value: "Cowes Harbour Commission" },
    { label: "Harbour Office", value: "Town Quay, Cowes, Isle of Wight, PO31 7AS" },
    { label: "Telephone", value: "01983 293952" },
    { label: "Harbour speed limit", value: "6 knots through the water" },
    { label: "Wash", value: "No wash" },
    { label: "Harbour VHF", value: "Channel 69 — Cowes Harbour Radio / HM1" },
    { label: "Marina-arrival VHF", value: "Channel 80" },
    { label: "Main central marinas", value: "Cowes Yacht Haven and Shepards Marina" },
    { label: "East-bank marina", value: "East Cowes Marina" },
    { label: "Fuel", value: "Cowes Harbour Fuel Berth and Lallows" },
    { label: "Main entrance", value: "Between green No. 1 and red No. 2 fairway buoys" },
    { label: "Alternative eastern entrance", value: "Eastern Channel for suitable vessels up to 20 metres" },
    { label: "Chain Ferry", value: "Has right of way over river traffic" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body),
    listItems,
  });

  guide.sections = [
    section("Arrival by Sea", [
      "Cowes can be approached from the north, east or west and entered by day or night. Entry is available at all states of tide for vessels drawing up to about three metres, subject to the actual height of tide.",
      "From the north, take account of commercial traffic and the Southampton Precautionary Area. Vessels over 150 metres may have a Moving Prohibited Zone requiring small craft to remain at least 1,000 metres ahead and 100 metres clear on either side.",
      "From the west, keep a close lookout for unlit mooring buoys inside the Gurnard North Cardinal Buoy and for racing yachts starting or finishing near the harbour entrance.",
    ]),
    section("Main Harbour Entrance", [
      "Enter between the green No. 1 and red No. 2 fairway buoys. Keep to the starboard side where practicable and do not impede commercial vessels, which may need the centre of the fairway.",
      "A sailing vessel fitted with an auxiliary engine must proceed with the engine running and ready for immediate use in the Inner Harbour.",
    ]),
    section("Eastern Channel", [
      "The Eastern Channel may be used by suitable vessels up to 20 metres. Its dredged depth is 2.25 metres below chart datum and its minimum width is approximately 35 metres.",
      "Stay inside the buoyed channel, do not enter the prohibited small-craft mooring areas to either side, and give way to vessels already navigating in the Inner Fairway.",
      "Spring tidal streams west of the Shrape Breakwater may reach approximately two knots before high water and 1.5 knots on the later ebb.",
    ]),
    withList("Navigation Warnings", ["Keep these harbour controls and traffic movements in mind throughout the approach and Inner Harbour."], [
      "Six-knot speed limit through the water",
      "No wash",
      "Commercial traffic has priority where constrained",
      "Red Jet turns beside Town Quay and may generate significant stern wash",
      "Red Funnel vehicle and freight ferries manoeuvre near East Cowes",
      "Cowes Chain Ferry lies on a blind bend and has right of way",
      "Contact the Chain Ferry on Channel 69 in advance if an uninterrupted passage is required",
      "Maintain a listening watch on Channel 69",
      "Vessels of 20 metres LOA and above have mandatory reporting requirements",
      "Remain at least 30 metres from the breakwater crest",
      "Racing yachts may start and finish close to the entrance",
    ]),
    section("Choose Your Berth", [
      "Cowes is a harbour destination with several distinct berthing choices, not one marina. Cowes Yacht Haven and Shepards Marina provide central west-bank access; East Cowes Marina sits on the east bank; Cowes Harbour Commission manages river moorings and Trinity Landing. Contact the chosen provider directly before arrival.",
    ]),
    withList("Cowes Yacht Haven", [
      "Telephone: 01983 299975 · VHF Channel 80 · berthing@cowesyachthaven.com",
      "Vectis Yard, High Street, Cowes, PO31 7BD",
    ], [
      "260 serviced berths", "Fresh water and electricity arrangements", "Wi-Fi, toilets, showers and laundry",
      "50-ton hoist, 25-ton boat mover and 22-ton mobile crane", "Engineers and electricians", "Waste and recycling",
      "Central access to Cowes High Street", "Visitor berths subject to availability; advance booking recommended",
      "Rafting may be used during busy periods",
    ]),
    withList("Shepards Marina", [
      "Telephone: 01983 297821 · VHF Channel 80 · shepards.chc@cowes.co.uk",
      "Situated on the west side shortly before the Chain Ferry.",
    ], [
      "Walk-ashore visitor berths", "Short-stay, seasonal and annual berthing", "Water and 16-amp or 32-amp electricity",
      "Toilets, showers, Wi-Fi, waste and recycling", "Holding-tank pump-out", "Dry sailing and access to lifting services",
      "Large-yacht and deep-water positions", "Rafting may be used at busy times",
    ]),
    withList("East Cowes Marina", [
      "Telephone: 01983 293983 · VHF Channel 80 · eastcowes@boatfolk.co.uk",
      "Britannia Way, East Cowes, PO32 6UB",
    ], [
      "East-bank visitor and resident berthing", "Onsite parking and access to East Cowes", "Riverside pub",
      "Water-taxi connection to West Cowes", "Convenient for the Red Funnel vehicle ferry", "Fuel is available on the west bank, not onsite",
    ]),
    withList("Harbour Moorings and Trinity Landing", [
      "Cowes Harbour Commission manages river pontoons, swinging moorings and pile moorings. Depending on location, vessels drawing up to 4.5 metres may be accommodated.",
      "For reservations and allocation: 01983 297821 · shepards.chc@cowes.co.uk · HM1 on VHF Channel 69.",
    ], [
      "Trinity Landing provides walk-ashore access to The Parade", "Permission is required from HM1 on Channel 69",
      "Smaller craft may use permitted inner sections", "Tenders may pick up and set down outside but must not be left unattended",
      "Fresh water and three-phase electricity are available",
    ]),
    section("Fuel, Water, Electricity and Pump-out", [
      "Petrol and diesel are available in Cowes.",
      "Cowes Harbour Fuel Berth is approximately 200 metres south of the Chain Ferry on the west side of the River Medina. Telephone 01983 200716 or call on VHF Channel 69 during opening hours. Diesel, petrol, gas and lubricating oils are supplied. Opening hours vary seasonally; check before arrival.",
      "Fuel is available from Lallows near Cowes Yacht Haven.",
      "Fresh water is available at Cowes Yacht Haven, Shepards Marina and Trinity Landing. Confirm availability for the allocated berth.",
      "Electricity is available at the principal marinas and Trinity Landing, subject to berth allocation, connection type and marina charges.",
      "A holding-tank pump-out facility is available at Shepards Marina. Contact the marina team on Channel 80 for access.",
    ]),
    withList("Facilities Ashore", ["Cowes and East Cowes provide practical services for visiting crews."], [
      "Supermarkets and specialist food shops", "Restaurants, cafés and pubs", "Yacht clubs", "Chandleries",
      "Engineers, riggers and sailmakers", "Passenger ferry to Southampton", "Vehicle ferry from East Cowes",
      "Bus connections through the Isle of Wight",
    ]),
    withList("Best For", ["Cowes is particularly well suited to crews who value central Solent access, marine services and an active harbour town."], [
      "Regatta crews", "Solent weekend cruising", "Short stays near shops and restaurants", "Yacht-club rallies",
      "Racing support and repairs", "Provisioning", "Public-transport arrivals", "Exploring the Isle of Wight",
    ]),
    withList("Less Suitable For", ["A different destination may suit crews seeking guaranteed quiet or a simple arrival away from commercial traffic."], [
      "Visitors seeking quiet conditions during major regattas", "Crews uncomfortable with rafting",
      "Skippers unfamiliar with commercial harbour traffic", "Boats requiring a guaranteed berth without booking",
      "Crews expecting identical facilities at every berth",
    ]),
    withList("Nearby Cruising", ["Cowes occupies a central position for onward cruising around the Solent and Isle of Wight."], [
      "River Hamble", "Southampton Water", "Portsmouth Harbour", "Bembridge", "Newtown Creek", "Yarmouth",
      "Beaulieu River", "Lymington", "Chichester Harbour", "Poole",
    ]),
    section("Old Sea Dogs View", [
      "Cowes wears its reputation openly. The Royal Yacht Squadron guns, crowded regatta pontoons, ferry wash and forest of masts leave little doubt that this is a harbour built around boats and the people who race, repair, sail and argue about them.",
      "Its greatest advantage is choice. Cowes Yacht Haven puts a crew almost directly onto the High Street. Shepards offers central visitor berthing with a slightly more workmanlike character. East Cowes provides more breathing room and practical access from the vehicle ferry. Harbour moorings allow experienced crews to step away from the busiest pontoons altogether.",
      "That choice comes with responsibility. Cowes is a commercial harbour, not a yacht marina with the traffic turned down. Ferries manoeuvre close to leisure craft, the Chain Ferry guards a narrow bend, racing fleets gather off the entrance and the tide can sweep a hesitant boat sideways at precisely the wrong moment.",
      "Prepare the lines before entering, listen on Channel 69, call the chosen marina on Channel 80 and keep the engine ready. Handle those essentials properly and Cowes remains what it has been for generations: one of the great landfalls in British sailing.",
    ]),
    withList("Information checked against official sources", ["Primary sources:"], [
      "Cowes Harbour Commission", "Cowes Yacht Haven", "Shepards Marina", "East Cowes Marina / boatfolk",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Cowes Harbour Guide | Old Sea Dogs";
  guide.seoDescription = "A practical Cowes Harbour Guide covering approaches, ferry traffic, marina choices, harbour moorings, fuel, facilities and River Medina navigation.";
  guide.socialTitle = "Cowes Harbour Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Cowes is a harbour and sailing destination with multiple independent berthing providers; never present it as one marina.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational information with the named harbour authority or marina before future substantive updates.";
  guide.sourceNotes = "Cowes Harbour Commission; Cowes Yacht Haven; Shepards Marina; East Cowes Marina / boatfolk.";
  return guide;
}

function createPortsmouth(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G007",
    slug: "portsmouth-harbour",
    title: "Portsmouth Harbour Guide",
    guideType: "Harbour",
    order: 7,
    image: {
      url: "/images/guides/guides-portsmouth-harbour-hero-v1.png",
      alt: "Portsmouth Harbour and the Spinnaker Tower viewed across the water.",
      focalPoint: "55% 50%",
    },
    summary: "A practical harbour reference for entering Portsmouth, understanding controlled traffic and choosing visitor berthing.",
    introduction: "Portsmouth Harbour is one of Britain's busiest and most historic natural harbours, combining a major Royal Navy base, international ferry terminal, commercial port and several leading leisure marinas within a relatively compact area.\n\nThe harbour is shared by naval vessels, ferries, commercial shipping, fishing boats and thousands of recreational craft each year. Visitors should expect a highly regulated environment where careful navigation and adherence to harbour procedures are essential.",
    sections: [],
    related: ["the-solent", "cowes", "southampton-water"],
    cruiseOn: ["cowes", "river-hamble", "beaulieu-river", "yarmouth"],
    previous: "yarmouth",
    next: "southampton-water",
    subregion: "Portsmouth Harbour",
    sourceLinks: [{ label: "King’s Harbour Master Portsmouth", href: "https://www.royalnavy.mod.uk/khm/portsmouth" }],
  });

  guide.quickFacts = [
    { label: "Guide type", value: "Harbour Guide" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "Portsmouth Harbour" },
    { label: "Harbour authority", value: "King's Harbour Master Portsmouth" },
    { label: "Address", value: "Semaphore Tower, HM Naval Base, Portsmouth, PO1 3LT" },
    { label: "Telephone", value: "02392 723694" },
    { label: "Harbour VHF", value: "Channel 11" },
    { label: "Secondary VHF", value: "Channel 13" },
    { label: "Call sign", value: "Portsmouth VTS" },
    { label: "Speed", value: "Observe published harbour limits and directions" },
    { label: "Fuel", value: "Available at Port Solent and Gosport Marina" },
    { label: "Visitor marinas", value: "Gunwharf Quays · Haslar · Gosport · Port Solent" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body),
    listItems,
  });

  guide.sections = [
    section("Arrival by Sea", [
      "Approaching from the Eastern Solent, Portsmouth Harbour is entered through a narrow buoyed entrance between Fort Blockhouse and Southsea Castle.",
      "Maintain a listening watch on VHF Channel 11.",
      "Commercial, ferry and naval traffic may have priority.",
    ]),
    withList("Navigation Warnings", ["Keep these requirements prominent when approaching and entering Portsmouth Harbour."], [
      "Portsmouth Harbour entrance is a narrow channel.",
      "Naval vessels have priority where required.",
      "Ferry traffic operates throughout the day.",
      "Maintain a listening watch on Channel 11.",
      "Follow Portsmouth VTS instructions.",
      "Strong tidal streams may be experienced near the harbour entrance.",
      "Observe all General Directions and Local Notices to Mariners.",
    ]),
    section("Small Boat Channel", [
      "The Small Boat Channel provides recreational craft with a safer route clear of the main commercial fairway.",
      "Vessels fitted with engines should use them while navigating the Small Boat Channel.",
      "Craft crossing the main channel towards Gunwharf Quays or Town Camber must obtain permission from Portsmouth VTS on VHF Channel 11.",
    ]),
    section("Visitor Berthing Options", [
      "Portsmouth Harbour has several principal visitor berthing options. Each marina is operated separately, so contact the chosen marina directly for availability and arrival instructions.",
    ]),
    withList("Gunwharf Quays Marina", [
      "Telephone: 02392 836732 · VHF Channel 80",
      "Central visitor marina beside Gunwharf Quays.",
    ], ["Ideal for shopping, restaurants and the Historic Dockyard."]),
    withList("Haslar Marina", [
      "Telephone: 02392 601201 · VHF Channel 80",
      "Premier visitor marina opposite Portsmouth Harbour with excellent facilities and direct access to Gosport.",
    ], []),
    withList("Gosport Marina", [
      "Telephone: 02392 524811 · VHF Channel 80",
      "Full-service visitor marina with fuel pontoon and easy harbour access.",
    ], []),
    withList("Port Solent", [
      "Telephone: 02392 210765 · VHF Channel 80",
      "Large inland marina reached through a lock.",
    ], ["Excellent shoreside facilities.", "Fuel available."]),
    section("Fuel", [
      "Diesel and petrol are available at Port Solent Marina and Gosport Marina.",
      "Availability and opening hours vary seasonally.",
    ]),
    section("Water & Electricity", [
      "Fresh water is available at the principal visitor marinas.",
      "Electricity is available at the principal marinas subject to berth allocation.",
    ]),
    withList("Harbour Facilities", ["Facilities available around the harbour include:"], [
      "Fuel",
      "Visitor Berths",
      "Showers",
      "Laundry",
      "Repairs",
      "Lift-outs",
      "Pump-out where available",
      "Wi-Fi",
      "Waste disposal",
    ]),
    withList("Ashore", ["Portsmouth and Gosport provide a broad range of practical and historic destinations ashore."], [
      "Historic Dockyard",
      "Spinnaker Tower",
      "Gunwharf Quays",
      "Royal Navy Museum",
      "Restaurants",
      "Provisioning",
      "Rail station",
      "Ferry terminal",
    ]),
    withList("Best For", ["Portsmouth Harbour is particularly well suited to:"], [
      "Cruising",
      "Naval history",
      "Weekend breaks",
      "Channel crossings",
      "Families",
    ]),
    withList("Less Suitable For", ["Another destination may suit:"], [
      "Skippers unfamiliar with busy commercial harbours",
      "Visitors uncomfortable with regulated navigation",
    ]),
    withList("Nearby Cruising", ["Portsmouth Harbour provides onward access to destinations across the Solent and neighbouring harbours."], [
      "Cowes",
      "Bembridge",
      "River Hamble",
      "Chichester Harbour",
      "Langstone Harbour",
      "Beaulieu River",
      "Yarmouth",
    ]),
    section("Old Sea Dogs View", [
      "Portsmouth has never been an ordinary harbour. Few places in Britain combine so much history with so much modern maritime activity. Warships, ferries, racing yachts and cruising boats all share the same water, demanding patience, awareness and good seamanship.",
      "The reward is immense. Within minutes of securing alongside, visitors can walk from the decks of HMS Victory to the cafés of Gunwharf Quays before watching another destroyer slip quietly to sea.",
      "Treat Portsmouth with respect, keep one ear on Channel 11 and enjoy one of Britain's greatest working harbours.",
    ]),
    withList("Information checked against official sources", ["Primary sources"], [
      "King's Harbour Master Portsmouth",
      "Royal Navy KHM Portsmouth",
      "Portsmouth International Port",
      "Gunwharf Quays Marina",
      "Haslar Marina",
      "Gosport Marina",
      "Premier Marinas",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Portsmouth Harbour Guide | Old Sea Dogs";
  guide.seoDescription = "A practical Portsmouth Harbour Guide covering the entrance, controlled traffic, Small Boat Channel, visitor marinas, fuel and onward cruising.";
  guide.socialTitle = "Portsmouth Harbour Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Portsmouth is a harbour with multiple independent visitor marinas; never present it as one marina.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to the official sources listed in the Guide.";
  guide.accuracyConcerns = "Recheck operational information with the named harbour authority or marina before future substantive updates.";
  guide.sourceNotes = "King's Harbour Master Portsmouth; Royal Navy KHM Portsmouth; Portsmouth International Port; Gunwharf Quays Marina; Haslar Marina; Gosport Marina; Premier Marinas.";
  return guide;
}

function createYarmouth(): FlagshipGuide {
  const guide = supportGuide({
    internalId: "OSD-G006",
    slug: "yarmouth",
    title: "Yarmouth Harbour Guide",
    guideType: "Harbour",
    order: 6,
    image: {
      url: "/images/guides/guides-yarmouth-marina-entrance-v1.png",
      alt: "The harbour entrance and visitor pontoons at Yarmouth on the Isle of Wight.",
      focalPoint: "50% 50%",
    },
    summary: "A practical harbour reference for visitor berthing, fuel, facilities and western Solent approaches.",
    introduction: "Yarmouth has long been one of the Solent's favourite overnight stops.\n\nSituated at the western gateway to the Isle of Wight, it provides sheltered visitor berths, excellent harbour facilities and immediate access to one of the island's most attractive sailing towns.\n\nIts location makes it a natural overnight stop for yachts arriving from Lymington, Poole, Christchurch, the Needles Channel and the West Country.",
    sections: [],
    related: ["the-solent", "newtown-creek", "cowes", "beaulieu-river"],
    cruiseOn: ["newtown-creek", "beaulieu-river", "the-solent", "cowes"],
    previous: "newtown-creek",
    next: "portsmouth-harbour",
  });

  guide.subregion = "Western Solent";
  guide.quickFacts = [
    { label: "Guide type", value: "Harbour & Visitor Berthing Guide" },
    { label: "Region", value: "The Solent" },
    { label: "Country", value: "England" },
    { label: "Waterway", value: "Western Solent" },
    { label: "Harbour authority", value: "Yarmouth Harbour Commissioners" },
    { label: "Harbour address", value: "The Quay, Yarmouth, Isle of Wight, PO41 0NT" },
    { label: "Telephone", value: "01983 760321" },
    { label: "Email", value: "info@yarmouth-harbour.co.uk" },
    { label: "Bookings", value: "bookings@yarmouth-harbour.co.uk" },
    { label: "Harbour VHF", value: "Channel 68" },
    { label: "Water Taxi", value: "Channel 15" },
    { label: "Visitor Berths", value: "150+" },
    { label: "Visitor Moorings", value: "35" },
    { label: "Fuel", value: "Diesel & Petrol" },
    { label: "Water", value: "Available" },
    { label: "Electricity", value: "Available" },
    { label: "Showers", value: "Yes" },
    { label: "Laundry", value: "Yes" },
    { label: "Wi-Fi", value: "Yes" },
    { label: "Pump-out", value: "Free" },
    { label: "Cockpit Essentials Shop", value: "Yes" },
  ];

  const withList = (heading: string, body: string[], listItems: string[]) => ({
    ...section(heading, body),
    listItems,
  });

  guide.sections = [
    section("Arrival by Sea", [
      "Approaching from the Solent, Yarmouth lies immediately east of Hurst Narrows.",
      "Maintain a listening watch on VHF Channel 68. The harbour entrance is straightforward, but strong tidal streams may develop near the entrance.",
      "Take particular care around Wightlink ferry movements. Berthing Masters allocate visitor berths on arrival.",
    ]),
    withList("Navigation Notes", ["Keep these points in mind during the approach and harbour arrival."], [
      "Strong tidal stream near entrance",
      "Harbour speed limits apply",
      "Keep clear of ferry manoeuvring areas",
      "Call Harbour on VHF Channel 68",
      "Water Taxi operates on VHF Channel 15",
    ]),
    withList("Visitor Berthing", [
      "Yarmouth Harbour Commissioners manage the visitor berths, harbour pontoons and visitor moorings. Berthing Masters allocate positions on arrival, and advance booking is available.",
    ], [
      "More than 150 visitor berths",
      "Walk-ashore pontoons",
      "Finger berths",
      "35 visitor moorings",
      "Advance booking available",
      "Berths allocated by Berthing Masters",
    ]),
    section("Fuel", [
      "Diesel and petrol are available from the harbour fuel berth located close to the harbour entrance.",
      "Water and a free sewage pump-out are also available.",
      "Opening hours vary seasonally.",
    ]),
    section("Water & Electricity", [
      "Fresh water is available on visitor finger berths and walk-ashore pontoons.",
      "Electricity is available on finger berths and walk-ashore pontoons.",
      "Visitors should bring suitable shore-power cables.",
    ]),
    withList("Harbour Facilities", ["Yarmouth Harbour provides practical facilities for visiting crews."], [
      "Reception",
      "Toilets",
      "Showers",
      "Laundry",
      "Wi-Fi",
      "Cockpit Essentials",
      "Water Taxi",
      "Fuel Berth",
      "Pump-out",
      "Waste Disposal",
    ]),
    withList("Ashore", ["Within a short walk of the harbour:"], [
      "Traditional pubs",
      "Restaurants",
      "Cafes",
      "Independent shops",
      "Bus connections",
      "Wightlink ferry terminal",
      "Yarmouth Castle",
    ]),
    withList("Best For", ["Yarmouth works particularly well for:"], [
      "Weekend cruising",
      "Families",
      "Needles transits",
      "West Country passages",
      "Solent stopovers",
      "Rally groups",
    ]),
    withList("Less Suitable For", ["Another plan may suit crews concerned about:"], [
      "Busy summer weekends",
      "Very late arrivals",
      "Peak rally periods",
    ]),
    withList("Nearby Cruising", ["Yarmouth is well placed for onward cruising around the western Solent and beyond."], [
      "Newtown Creek",
      "Lymington",
      "Hurst Castle",
      "Keyhaven",
      "Cowes",
      "Beaulieu River",
      "The Needles",
      "Poole",
    ]),
    section("Old Sea Dogs View", [
      "Yarmouth is a natural western waypoint but should not be reduced to one. Give the harbour and town time, then shape the next leg around the water at Hurst rather than a timetable. It is an excellent place from which to decide whether the day belongs inside the Solent or beyond it.",
    ]),
    withList("Information checked against official sources", ["Primary sources:"], [
      "Yarmouth Harbour Commissioners",
    ]),
  ];
  guide.checklist = [];
  guide.seoTitle = "Yarmouth Harbour Guide | Old Sea Dogs";
  guide.seoDescription = "A practical Yarmouth Harbour Guide covering approaches, visitor berths, moorings, fuel, water taxi, facilities and western Solent cruising.";
  guide.socialTitle = "Yarmouth Harbour Guide — Old Sea Dogs Guides";
  guide.socialDescription = guide.summary;
  guide.editorialNotes = "Yarmouth is a harbour with visitor berths, pontoons and moorings managed by Yarmouth Harbour Commissioners; never present it as one marina.";
  guide.researchNotes = "Public operational information supplied by the owner and attributed to Yarmouth Harbour Commissioners.";
  guide.accuracyConcerns = "Recheck operational information with Yarmouth Harbour Commissioners before future substantive updates.";
  guide.sourceNotes = "Yarmouth Harbour Commissioners.";
  return guide;
}

function supportGuide({
  internalId,
  slug,
  title,
  guideType,
  order,
  image,
  summary,
  introduction,
  sections,
  related,
  cruiseOn,
  previous,
  next,
  parentGuideSlug = "the-solent",
  subregion = "South Coast",
  sectionLinks = {},
  sourceLinks = [{ label: "Return to The Solent collection", href: "/guides/solent" }],
}: {
  internalId: string;
  slug: string;
  title: string;
  guideType: GuideType;
  order: number;
  image?: { url: string; alt: string; focalPoint?: string };
  summary: string;
  introduction: string;
  sections: Array<[string, string]>;
  related: string[];
  cruiseOn: string[];
  previous: string;
  next: string;
  parentGuideSlug?: string;
  subregion?: string;
  sectionLinks?: Record<string, Array<{ label: string; guideSlug: string }>>;
  sourceLinks?: Array<{ label: string; href: string }>;
}): FlagshipGuide {
  return {
    internalId,
    slug,
    title,
    eyebrow: "Old Sea Dogs Guides",
    summary,
    introduction,
    guideType,
    regionKey: "solent",
    regionName: "The Solent",
    subregion,
    parentGuideSlug,
    editorialOrder: order,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: checkedOn,
    imageUrl: image?.url ?? solentHero,
    imageAlt: image?.alt ?? `Painterly maritime artwork for the ${title} Guide.`,
    imageFocalPoint: image?.focalPoint ?? "50% 50%",
    imageCaption: `${title}, part of the first Old Sea Dogs Guides edition.`,
    imageCredit: "",
    artworkCredit: "",
    quickFacts: [
      { label: "Region", value: "The Solent" },
      { label: "Guide type", value: guideType },
      { label: "Character", value: summary },
    ],
    sections: sections.map(([heading, text]) => section(heading, text.split("\n\n"), sectionLinks[heading])),
    checklist: navigationChecklist,
    sourceLinks,
    verifiedFacilities: [],
    facilityVerificationNotes: "",
    location: {},
    relatedGuideSlugs: related,
    cruiseOnGuideSlugs: cruiseOn,
    previousGuideSlug: previous,
    nextGuideSlug: next,
    seoTitle: `${title} Guide | Old Sea Dogs`,
    seoDescription: summary,
    socialTitle: `${title} — Old Sea Dogs Guides`,
    socialDescription: summary,
    canonicalPath: `/guides/solent/${slug}`,
    editorialNotes: "First-edition supporting Guide; expand when commissioned research is available.",
    researchNotes: "Evergreen editorial context only. Operational details must be checked before expansion.",
    reviewDue: "2027-07-30",
    accuracyConcerns: "Current navigation and operational information belongs with official authorities.",
    sourceNotes: sourceLinks.map((source) => source.label).join("; "),
    draftComments: "",
  };
}
