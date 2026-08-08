export const GUIDE_TYPES = [
  "Cruising Area",
  "Marina",
  "Harbour",
  "Anchorage",
  "River",
  "Destination",
  "Pilotage",
  "Passage",
  "Seamanship",
  "Maritime History",
] as const;

export type GuideType = (typeof GUIDE_TYPES)[number];

export type GuideSection = {
  heading: string;
  body: string[];
  anchor?: string;
  kind?: "prose" | "callout" | "quote";
  listItems?: string[];
  links?: Array<{
    label: string;
    guideSlug: string;
  }>;
};

export type GuideVerifiedFacility = {
  label: string;
  detail: string;
  sourceUrl: string;
  verifiedOn: string;
};

export type FlagshipGuide = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  updatedAt: string;
  imageUrl: string;
  imageAlt: string;
  imageCaption?: string;
  imageCredit?: string;
  quickFacts: Array<{
    label: string;
    value: string;
  }>;
  sections: GuideSection[];
  checklist: string[];
  sourceLinks: Array<{
    label: string;
    href: string;
  }>;
  verifiedFacilities?: GuideVerifiedFacility[];
  facilityVerificationNotes?: string;
  internalId?: string;
  introduction?: string;
  guideType?: GuideType;
  regionKey?: string;
  regionName?: string;
  subregion?: string;
  parentGuideSlug?: string;
  editorialOrder?: number;
  author?: string;
  contributorCredits?: string[];
  imageFocalPoint?: string;
  artworkCredit?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    mapZoom?: number;
    what3words?: string;
    osGridReference?: string;
  };
  relatedGuideSlugs?: string[];
  cruiseOnGuideSlugs?: string[];
  previousGuideSlug?: string;
  nextGuideSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  socialTitle?: string;
  socialDescription?: string;
  canonicalPath?: string;
  editorialNotes?: string;
  researchNotes?: string;
  reviewDue?: string;
  accuracyConcerns?: string;
  sourceNotes?: string;
  draftComments?: string;
};

export const flagshipGuides: FlagshipGuide[] = [
  {
    slug: "cowes-week-guide",
    title: "Cowes Week Guide",
    eyebrow: "Flagship guide",
    summary:
      "A practical Old Sea Dogs guide to Cowes Week: racing, shore plans, berthing, viewing points, first-timer traps and what to check before heading for the Solent.",
    updatedAt: "2026-07-06",
    imageUrl: "/images/section-heroes/oldseadogs-races.webp",
    imageAlt: "Racing yachts under sail on a Solent-style race course.",
    quickFacts: [
      { label: "2026 dates", value: "1-7 August 2026" },
      { label: "Where", value: "Cowes and the central Solent" },
      { label: "Best for", value: "Keelboat racing, club crews, spectators and Solent visitors" },
      { label: "Check first", value: "Notice of Regatta, local notices, tide times and marina space" },
    ],
    sections: [
      {
        heading: "What Cowes Week actually is",
        body: [
          "Cowes Week is not a single race but a week of class racing, starts, finishes, protest-room tension, club nights and busy Solent traffic. For competitors, the useful work starts before the first gun: entry, class rules, rating paperwork, crew lists, safety kit and a frank look at how the boat behaves in Solent chop.",
          "For visitors, the trick is to treat Cowes as a working harbour during a festival, not a theme park. Ferries, ribs, launches, race boats, tenders and spectators all want the same water and the same streets.",
        ],
      },
      {
        heading: "Where to watch",
        body: [
          "The Parade gives the easiest shore view, especially around start and finish activity. Egypt Point and the Green can be useful when the fleet works west, while a spectator boat gives the richest picture if you are comfortable afloat and can keep clear of racing yachts.",
          "Binoculars help. So does a race programme, AIS or tracking where available, and a willingness to move with the breeze rather than stand where the crowd happens to be.",
        ],
      },
      {
        heading: "Competitor notes",
        body: [
          "Read the official race documents before packing the boat. Check safety requirements, crew eligibility, class flags, start procedures and any amendment posted to the notice board. The Solent can make experienced crews look untidy when tide and breeze disagree.",
          "Berthing, water taxis and evening plans should be settled early. A good Cowes Week is often won by the boring jobs: charged handhelds, clear crew briefings, foulies that still work, and a plan for getting tired people home.",
        ],
      },
      {
        heading: "Where to berth",
        body: [
          "Cowes Yacht Haven, Shepards Marina, East Cowes Marina and river moorings all put you close to the action, but they are not interchangeable. The right berth depends on crew changeover, depth, noise tolerance, ferry movements, launch access and whether you need to get ashore quickly after racing. Book early, confirm arrival windows, and do not assume the berth you enjoyed on a quiet May weekend will behave the same way when the regatta is in full voice.",
          "Skippers arriving from the Hamble, Lymington, Portsmouth or Southampton should also think about the exit plan. If the crew is staying ashore, sort bags, showers, keys and late-night access before the first round of drinks. If the boat is returning to the mainland each evening, check light, tide and fatigue. A tired delivery after racing is when small mistakes start breeding.",
        ],
      },
      {
        heading: "Race village and shore planning",
        body: [
          "The race village gives Cowes Week its public face: sponsor stands, music, food, crew chatter and the useful theatre of people trying to look relaxed while their results are still unresolved. It is worth a wander, but the serious visitor treats it as one part of the day rather than the whole event. The best shore plan leaves time for the Parade, the clubs, the chain ferry queue and a quiet place to check the next day's weather.",
          "If you are bringing family or non-sailing friends, make the plan kind. Cowes can be crowded, pavements narrow, and restaurant tables scarce. Pick meeting points that do not rely on mobile signal or everyone knowing local landmarks. Ferries and Red Jet timings matter. So does footwear: this is a working harbour town during a regatta, not a polished promenade designed around spectators.",
        ],
      },
      {
        heading: "Solent weather and tide checks",
        body: [
          "Cowes Week is a Solent event first and a social event second. The tide can turn a modest breeze into a lumpy wet beat, or make a tactical genius of the boat that simply escaped the worst foul stream. Check the tide atlas, local forecasts, inshore waters, race office notices and any class-specific briefing. If the breeze is light, tide gates and clean air become the day. If it is fresh, crew work and boat handling become the story.",
          "The common first-timer mistake is to look only at a headline wind speed. Direction, gusts, sea state, rain, visibility, commercial traffic and the time of your start all matter. The western Solent can feel like a different racecourse from the eastern side. Put the forecast against your class course, then brief the crew in plain language: what will hurt, what will help, and what the boat does if the plan changes.",
        ],
      },
      {
        heading: "First-timer traps",
        body: [
          "The traps are rarely glamorous. People underestimate how early they need to be on the boat, how long breakfast takes, how quickly water bottles disappear, and how much a bad tack costs when fifty boats are hunting the same lane. New crews also tend to stare at the boat ahead and forget tide, depth and the next mark. Give every crew member one clear job and one clear way to ask for help.",
          "Another trap is chasing Cowes Week as a party with racing attached. That may work for one evening. It does not work for a week. Sleep, food, dry kit, spares and a clean cockpit are performance tools. Old hands know that the boat that looks dull at 0830 is often the one still functioning at 1530.",
        ],
      },
      {
        heading: "Old Sea Dogs tips",
        body: [
          "Walk the waterfront before racing if you can. You will learn where the queues form, where launches run, where crews disappear for coffee and how the harbour feels in the morning. Keep a small dry bag for phone, wallet, medication and a spare layer. Mark your water bottle. Put the handheld VHF somewhere useful rather than somewhere tidy.",
          "After racing, write down what actually happened while it is still fresh: start, sail choice, tide call, breakages, crew lessons and one thing to improve tomorrow. Regatta memory gets polished in the bar. The logbook should be less flattering and more useful.",
        ],
      },
    ],
    checklist: [
      "Check the official Notice of Regatta and amendments.",
      "Book berthing or launch plans early.",
      "Brief crew on tide gates, commercial traffic and radio discipline.",
      "Carry water, layers and a realistic plan for late returns.",
      "Use official channels for race changes rather than dockside rumour.",
    ],
    sourceLinks: [
      { label: "Cowes Week official site", href: "https://www.cowesweek.co.uk/" },
      { label: "Cowes Week notice board", href: "https://www.cowesweek.co.uk/" },
    ],
  },
  {
    slug: "round-the-island-race-guide",
    title: "Round the Island Race Guide",
    eyebrow: "Flagship guide",
    summary:
      "How to think about the Round the Island Race: the course, pinch points, race-day planning, spectator notes and the practical checks that matter before the start.",
    updatedAt: "2026-07-06",
    imageUrl: "/images/racing-yachts.png",
    imageAlt: "Offshore racing yachts sailing in a fresh breeze.",
    quickFacts: [
      { label: "2026 date", value: "Saturday 11 July 2026" },
      { label: "Organiser", value: "Island Sailing Club" },
      { label: "Course", value: "Around the Isle of Wight, starting and finishing off Cowes" },
      { label: "Best for", value: "Club crews, cruiser-racers, spectators and first offshore-style race plans" },
    ],
    sections: [
      {
        heading: "The shape of the race",
        body: [
          "Round the Island is simple on paper and rarely simple on the water. Start at Cowes, leave the Isle of Wight to port, deal with the Needles, St Catherine's, Bembridge Ledge and the long return to the Solent, then finish back off Cowes.",
          "The course rewards preparation more than swagger. Tide, depth, traffic, class start time and the boat's ability to keep moving in disturbed air all matter.",
        ],
      },
      {
        heading: "Crew planning",
        body: [
          "Treat it as a long day rather than a short sprint. Sort food, water, layers, seasickness plans, handheld VHF, charging, harness rules and who is allowed to make tactical calls before the boat is on the line.",
          "The race often mixes serious campaigns with family and club boats. That is part of its charm, but it also means the start and marks can become crowded quickly.",
        ],
      },
      {
        heading: "Spectator notes",
        body: [
          "Cowes, the Needles approaches, St Catherine's and Bembridge all have appeal, but access and timing vary. A shore plan should start with the tide table and transport home, not just the prettiest photograph.",
          "If watching afloat, stay outside the race and respect marshal instructions. A spectator boat that forces a racing yacht to alter course has missed the point of the day.",
        ],
      },
      {
        heading: "Cowes start",
        body: [
          "The start off Cowes is the crowded, noisy, unforgiving part of the day. Different classes leave at different times, so the water can feel like several races laid on top of each other. Know your start, your flag, your side of the line and the traffic around you. A safe, clean start is worth more than a heroic lunge that leaves the boat slow, boxed, or on the wrong side of the rules before breakfast has settled.",
          "For spectators, the start is a fine show but it rewards patience. Get there early, use binoculars, and remember that the most important action may be half a mile away from the most photogenic boat. If you are on the water, keep well clear. Racing crews have enough to manage without a sightseeing boat wandering into their escape route.",
        ],
      },
      {
        heading: "The Needles",
        body: [
          "The Needles are the postcard moment, but for competitors they are a tidal and tactical gate. The fleet compresses, sea room narrows, and everyone has an opinion about how close is close enough. Depth, tide, wind angle and confidence in the boat all matter. A few metres can feel clever on a chart and less clever when the water is boiling beside the rocks.",
          "The safe lesson is simple: know the official course, know your navigator's plan, and decide in advance who has the final call. If conditions are poor, give yourself room. The race is long enough to reward boats that stay in one piece and keep sailing.",
        ],
      },
      {
        heading: "St Catherine's and the south side",
        body: [
          "The south side of the Isle of Wight can feel a world away from the Solent start. St Catherine's often brings stronger breeze, different sea state and the mental dip that comes when the early excitement has worn off. Crews need food, water and a rotation before they are cold, hungry and quiet. This is where a casual day out starts looking like a proper race.",
          "Tactically, the south side asks whether you trust the tide plan or the boats around you. Blindly following a pack is tempting, especially in reduced visibility or mixed fleets. Keep the boat fast, watch the compass, and treat any major split as a decision rather than a drift.",
        ],
      },
      {
        heading: "Bembridge Ledge",
        body: [
          "Bembridge Ledge is another place where the race can become expensive for the careless. The mark area can be busy, the tide can be awkward, and fatigue is usually arriving just as judgement needs to improve. Brief the rounding early. Check who is calling depth, who is watching traffic and what sail handling is needed after the turn.",
          "For shore watchers, Bembridge and the eastern side can be rewarding, but access, parking and timing need thought. The fleet spreads as the day develops, so a single viewing point may give a burst of action followed by long gaps. Take layers, food and a realistic plan for getting home.",
        ],
      },
      {
        heading: "Tidal gates",
        body: [
          "The Round the Island Race is often described as a race round an island, but much of it is a race through gates that open and close with the tide. The Needles, St Catherine's, Bembridge and the return to the Solent all punish boats that arrive at the wrong time. That does not mean the fastest boat always wins. It means the boat that keeps moving at the right moments has a voice in the result.",
          "A useful race plan marks expected times at the main gates, likely foul-tide patches and sensible escape routes. Do not hide that plan in the navigator's head. The helm and trimmers should know why the boat is sailing high, low, offshore or inshore, otherwise every tactical choice becomes a cockpit argument.",
        ],
      },
      {
        heading: "Competitor checklist",
        body: [
          "Before race day, check entry, rating, insurance, safety kit, lifejackets, harnesses, flares or electronic distress equipment as required, navigation lights, engine reliability, fuel, drinking water, food, reefing lines and a working VHF. That list is intentionally dull. Dull preparation is what lets the crew enjoy the interesting parts.",
          "On the morning, confirm the forecast, tide plan, start sequence, crew roles, retirement ports and emergency contacts. If someone is new to racing, tell them what the day may feel like: long quiet stretches, crowded moments, shouting that is not personal, and the need to keep eating before they feel hungry.",
        ],
      },
    ],
    checklist: [
      "Read the official race documents and sailing instructions.",
      "Check start group, tide plan and likely gates before leaving the berth.",
      "Brief crew on commercial traffic and the crowded mark roundings.",
      "Prepare for both drifting and overpowered conditions.",
      "Have a retirement plan that everyone understands.",
    ],
    sourceLinks: [
      { label: "Round the Island Race official site", href: "https://roundtheisland.org.uk/" },
      { label: "Island Sailing Club", href: "https://islandsc.org.uk/" },
    ],
  },
  {
    slug: "solent-marina-guide",
    title: "Solent Marina Guide",
    eyebrow: "Flagship guide",
    summary:
      "A practical guide to choosing Solent marina stops, from Cowes and the Hamble to Lymington, Portsmouth and Yarmouth, with the checks that matter before arrival.",
    updatedAt: "2026-07-06",
    imageUrl: "/images/section-heroes/oldseadogs-ports.webp",
    imageAlt: "A marina with moored yachts and pontoons.",
    quickFacts: [
      { label: "Area", value: "Central and western Solent" },
      { label: "Best for", value: "Weekend cruising, race bases, first Solent trips and visitor berths" },
      { label: "Main checks", value: "Tide, depth, VHF, fuel, showers, ferry wash and walk-ashore access" },
      { label: "Old Sea Dogs rule", value: "Book early when racing or boat shows are in town" },
    ],
    sections: [
      {
        heading: "Choosing a berth",
        body: [
          "The Solent is dense with good berthing, but the right marina depends on the job. Cowes is convenient for racing and atmosphere. The Hamble is strong for yards, brokers and services. Lymington works well for the western Solent and Yarmouth is hard to beat for a proper Isle of Wight stop.",
          "Portsmouth and Gosport give easy access to the eastern Solent, transport and chandlery, while quieter river or harbour options may suit crews who want less noise and less ferry wash.",
        ],
      },
      {
        heading: "What to check before you call",
        body: [
          "Visitor berths are not just about price. Check approach depth, sill or lock restrictions, VHF channel, fuel hours, late-arrival process, shore power, showers, dog access, food nearby and whether the berth is exposed to wash.",
          "On busy weekends, the difference between a pleasant arrival and an awkward one is often a five-minute phone call before you commit.",
        ],
      },
      {
        heading: "First Solent trip",
        body: [
          "A first Solent weekend should leave margin. Pick a short hop, arrive in daylight and plan a bail-out if wind against tide gets lumpy. The area is friendly to learning, but it is also full of ferries, racing fleets, shallow edges and fast-changing traffic.",
        ],
      },
      {
        heading: "Cowes and the River Medina",
        body: [
          "Cowes is the obvious Solent stop because it puts you close to racing, chandlery, pubs, ferries and the old rhythm of a harbour that has seen every kind of sailor. Cowes Yacht Haven and Shepards Marina suit crews who want walk-ashore access and the town close at hand. East Cowes Marina and river options can feel calmer, with different access to services and mainland ferries. Check visitor availability, rafting expectations, wash, showers, fuel access and late arrival details before committing.",
          "The Medina is not just a backdrop. It is a working river with ferries, yards, commercial traffic and boats manoeuvring in confined water. If you are new to Cowes, arrive with fenders rigged both sides, lines ready and the crew briefed. A skipper might choose Cowes for regatta access, crew changeovers, atmosphere and easy shore life. They might avoid it on the busiest weekends if quiet sleep, simple parking or a low-stress arrival matters more.",
        ],
      },
      {
        heading: "Hamble",
        body: [
          "The Hamble is the Solent's service yard, race base and brokerage spine rolled into one river. Port Hamble, Mercury, Hamble Point and nearby facilities give access to engineers, riggers, fuel, water, power, showers, restaurants and a deep pool of marine trades. It is a strong choice before a race, after a delivery, or when the boat needs work as much as the crew needs supper.",
          "The river is busy and can be tight. Expect racing fleets, school boats, tenders and a fair amount of confident manoeuvring in small spaces. Check visitor berths, depth, fuel hours, VHF procedure and walk-ashore access. A skipper chooses the Hamble for services and mainland convenience. They do not choose it for solitude.",
        ],
      },
      {
        heading: "Southampton and the Itchen",
        body: [
          "Southampton works for crews who value transport, provisioning, boat-show access and city facilities. Ocean Village and nearby marinas put restaurants, rail links, supermarkets and marine services close by. The water is shaped by commercial traffic, cruise ships, ferries and Southampton Water's own weather habits, so the approach deserves attention rather than autopilot complacency.",
          "Check marina approach notes, VHF channels, lock or bridge constraints where relevant, fuel, security and how long it takes to reach open Solent water. Southampton is often a practical base for a delivery, a show visit or a crew travelling by train. It is less romantic than a small harbour, but romance does not fill water tanks or meet a late train.",
        ],
      },
      {
        heading: "Portsmouth and Gosport",
        body: [
          "Portsmouth Harbour and Gosport give strong eastern Solent access, historic waterfronts, rail links, ferries, chandlery and a choice of marinas. Haslar, Gosport, Port Solent and Gunwharf-area options each suit different crews. Some are better for transport and restaurants; others for yards, longer stays or shelter. Check locks where relevant, small-craft channels, harbour rules and commercial traffic before arrival.",
          "This is a proper naval and ferry harbour, not a sleepy creek. Keep a listening watch, know the entrance discipline and do not drift into the wrong water while sorting lines. Skippers choose Portsmouth and Gosport for eastern Solent cruising, yard work, crew logistics and shelter. The price is busier pilotage and less of the village feel found farther west.",
        ],
      },
      {
        heading: "Yarmouth, Lymington and Beaulieu",
        body: [
          "Yarmouth is a classic western Solent stop: compact, popular and useful for crews heading towards the Needles, Poole or the south coast of the island. Visitor berths, harbour staff, shore access and a short walk to food make it attractive, but space can be tight. Check booking, rafting, tide, ferry wash and arrival timing. A peaceful Yarmouth evening is worth planning for rather than assuming.",
          "Lymington offers marinas, town access, yards, food and a handsome river approach that still needs respect for ferries and tide. Beaulieu is quieter, more rural and more tide-conscious, with a different kind of reward: shelter, scenery and the feeling of properly leaving the rush behind. For all three, check depth, visitor berths, fuel, water, power and whether the shore plan suits your crew.",
        ],
      },
      {
        heading: "Chichester and the eastern harbours",
        body: [
          "Chichester Harbour is a beautiful cruising ground with marinas and moorings around places such as Northney, Sparkes and Chichester Marina, but it is also an area where tide, channels and local knowledge matter. Bar and entrance conditions should be checked carefully, especially in stronger wind against tide. Facilities vary by marina, so confirm visitor berthing, fuel, water, power, showers and food before arrival.",
          "A skipper might choose Chichester for a quieter cruise, birdlife, dinghy sailing, sheltered exploring and a less compressed feel than the central Solent. They should also accept that it may add pilotage work and timing constraints. Pretty water is still water that wants respect.",
        ],
      },
      {
        heading: "Choosing honestly",
        body: [
          "No marina guide should pretend to know today's berth availability, fuel hours or shower code. Treat this guide as a planning companion, then call or check the marina's own notices before travel. Ask about visitor berths, LOA, draught, arrival time, shore power, water, fuel, pump-out, dogs, restaurants, laundry, repairs, security and whether anything local has changed.",
          "The best Solent stop is the one that matches the passage. Racing crew with wet sails and broken kit need different things from a family on a first weekend or a singlehander arriving in the dark. Choose for the boat you have, the crew you have, and the weather you have, not the harbour you fancied in January.",
        ],
      },
    ],
    checklist: [
      "Call ahead for visitor berth availability.",
      "Check approach depth and any lock or sill times.",
      "Know the marina VHF channel and fallback phone number.",
      "Plan fuel, water and pump-out before the return leg.",
      "Avoid arriving tired, hungry and against the tide if a simpler berth is available.",
    ],
    sourceLinks: [
      { label: "Old Sea Dogs ports section", href: "/ports" },
      { label: "Old Sea Dogs contact for marina corrections", href: "mailto:captainoldseadog@gmail.com" },
    ],
  },
  {
    slug: "uk-boat-show-calendar",
    title: "UK Boat Show Calendar",
    eyebrow: "Flagship guide",
    summary:
      "A checked calendar-style guide to UK boat shows and sailing events, with confirmed dates called out and uncertain listings kept honest.",
    updatedAt: "2026-07-06",
    imageUrl: "/images/section-heroes/oldseadogs-shows.webp",
    imageAlt: "Boats and visitors at a marine show.",
    quickFacts: [
      { label: "Checked", value: "6 July 2026" },
      { label: "Confirmed 2026", value: "Cowes Week, Round the Island Race, Southampton International Boat Show" },
      { label: "Past in 2026", value: "RYA Dinghy and Watersports Show" },
      { label: "Watch list", value: "Crick Boat Show 2027 and BoatLife future dates" },
    ],
    sections: [
      {
        heading: "Confirmed dates to plan around",
        body: [
          "Cowes Week is listed by the official event site for 1-7 August 2026. Round the Island Race is listed by the race site for Saturday 11 July 2026. Southampton International Boat Show is listed for 18-27 September 2026 at Mayflower Park.",
          "The RYA Dinghy and Watersports Show ran at Farnborough International on 21-22 February 2026. That makes it useful for next-year planning, but not a live 2026 visitor listing after July.",
        ],
      },
      {
        heading: "How to use the calendar",
        body: [
          "Use this page as a planning map, not a ticket office. Before booking travel, check the organiser's own site for opening times, ticket waves, exhibitor lists, access notes and any change to dates.",
          "Boat shows change shape quickly. A show may be excellent for chandlery and dinghies but thin on yachts; another may be strong on marina visits but poor for hands-on equipment comparison.",
        ],
      },
      {
        heading: "What Old Sea Dogs will add",
        body: [
          "As the archive is cleaned, each listing should link to preview notes, first-timer tips, show-floor priorities and follow-up reports. The useful question is not simply when a show happens, but whether it is worth a day of a reader's time.",
        ],
      },
      {
        heading: "Southampton International Boat Show",
        body: [
          "Southampton is the big UK on-water show and usually the most useful stop for buyers who want to step aboard production yachts, motor boats, RIBs and practical kit in one place. It is strong for families, new buyers, cruising sailors, marine trades and anyone comparing layouts without driving around half the south coast. Check the organiser's official dates, pontoon access, ticket rules, opening times and exhibitor list before booking travel.",
          "Practical visitor notes are simple. Wear shoes you can remove easily, carry a small bag rather than a suitcase, and make appointments for boats you genuinely want to inspect. Boat-show legs are real. Decide what matters before the day: cockpit access, engine checks, heads layout, berth length, visibility from the helm, service access, finance, delivery dates or training. Otherwise the shine will do your thinking for you.",
        ],
      },
      {
        heading: "RYA Dinghy and Watersports Show",
        body: [
          "The RYA Dinghy and Watersports Show is the natural stop for dinghy sailors, clubs, instructors, parents, class associations and anyone trying to understand the smaller-boat end of the sport. It is useful for training pathways, class advice, clothing, safety kit, club contacts and youth sailing. Dates and venue can change by year, so check the RYA's official information before travel.",
          "A good visit starts with questions: which class suits the sailor, where will the boat be stored, who races locally, what kit is needed immediately and what can wait. For parents, it is a chance to compare clubs, youth programmes and realistic costs. For returning sailors, it is a way to find a fleet rather than just a new toy.",
        ],
      },
      {
        heading: "Cowes Week and Round the Island Race",
        body: [
          "Cowes Week and the Round the Island Race are not boat shows, but they belong in any UK sailing calendar because they shape the Solent season. Cowes Week is a regatta week with shore activity, racing classes, sponsor presence and a harbour full of stories. Round the Island is a single race day that pulls club boats and serious campaigns onto the same course around the Isle of Wight.",
          "For visitors, both events need planning around ferries, accommodation, berthing, weather and tide. For competitors, official race documents matter more than social posts. Check the organisers' dates, notices, entry rules and any local harbour guidance before making plans. If the forecast turns foul, the best ticket may be a warm shore view and a later train.",
        ],
      },
      {
        heading: "Crick Boat Show and inland-waterway events",
        body: [
          "Crick Boat Show sits in a different lane from the Solent events. It is more useful for narrowboat, canal, inland-waterway and liveaboard interests than for offshore racing sailors. That does not make it lesser; it makes it specific. Visitors comparing layouts, heating, power, fit-out quality, mooring realities and inland cruising habits may get more practical value there than from a glossy marina pontoon.",
          "Do not invent dates for inland events. Check official dates before travel, then check ticket rules, parking, dogs, accessibility, seminar programmes and whether boats can be viewed by appointment. Inland shows reward slow looking: storage, insulation, battery access and daily living details matter more than heroic brochure claims.",
        ],
      },
      {
        heading: "BoatLife and regional shows",
        body: [
          "Regional shows can be excellent if they match your boat life. Some are strong on powerboats, chandlery, local dealers, trailers and family boating. Others are better for talks, clubs and trade networking. The trap is assuming every show has every kind of boat. Before buying tickets, check the exhibitor list and ask what you actually want from the day.",
          "If dates are not confirmed, say so and check before travel. A sensible calendar should distinguish confirmed dates, usual seasonal timing and watch-list events. Old Sea Dogs will not pad the list with invented certainty. Better a shorter honest calendar than a long one that sends readers to a locked gate.",
        ],
      },
      {
        heading: "How to plan a show visit",
        body: [
          "Work backwards from decisions. If you are buying, list the boats or kit you need to inspect and book appointments. If you are browsing, pick a theme: safety, electronics, club sailing, cruising routes, family boats or refit ideas. If you are taking children, check activity booking, food, toilets and how much pontoon walking they will tolerate before the day turns mutinous.",
          "Take photographs of details, not just whole boats. Capture locker openings, helm sight lines, service panels, cockpit drains, handholds, berth access, engine labels and any price sheet you may want later. Ask direct questions and write down the answers. By Monday morning, every boat-show promise sounds smoother than it did beside the bilge hatch.",
        ],
      },
    ],
    checklist: [
      "Check organiser sites before buying tickets.",
      "Look for on-water access, trial sails or marina pontoons if comparing boats.",
      "Book accommodation early around Cowes and Southampton.",
      "For family visits, check under-16 ticket rules and water activity booking.",
      "Send corrections or missing UK events to Old Sea Dogs.",
    ],
    sourceLinks: [
      { label: "Southampton International Boat Show", href: "https://www.southamptonboatshow.com/" },
      { label: "RYA Dinghy and Watersports Show", href: "https://www.rya.org.uk/dinghy-show/" },
      { label: "Cowes Week", href: "https://www.cowesweek.co.uk/" },
      { label: "Round the Island Race", href: "https://roundtheisland.org.uk/" },
      { label: "Crick Boat Show", href: "https://www.crickboatshow.com/" },
    ],
  },
  {
    slug: "beginners-guide-to-yacht-clubs",
    title: "Beginner's Guide to Yacht Clubs",
    eyebrow: "Flagship guide",
    summary:
      "What yacht clubs are for, how to visit one without feeling out of place, what membership usually buys, and how to find the right club for your sailing.",
    updatedAt: "2026-07-06",
    imageUrl: "/images/section-heroes/oldseadogs-clubs.webp",
    imageAlt: "A yacht club scene with boats and a clubhouse by the water.",
    quickFacts: [
      { label: "Best for", value: "New sailors, returning boaters, crew hunters and families" },
      { label: "Ask first", value: "Visitor rules, training, crewing lists, racing, storage and bar access" },
      { label: "Good sign", value: "Clear welcome, active volunteers and boats actually going sailing" },
      { label: "Avoid", value: "Joining before you know how often you will use it" },
    ],
    sections: [
      {
        heading: "What a yacht club does",
        body: [
          "A good yacht club is part harbour office, part classroom, part race hut, part social room and part noticeboard. The best ones help people get afloat more often and with better company.",
          "Some clubs are racing-led. Some are cruising-led. Some are training centres, dinghy parks, mooring communities or social clubs with a strong maritime habit. The label matters less than the boats and people you actually find there.",
        ],
      },
      {
        heading: "First visit",
        body: [
          "Phone or email before turning up. Ask whether visitors are welcome, when the bar or office is open, and whether there is a club night, race night or open day. Most clubs are friendlier than nervous newcomers expect, but many are volunteer-run and appreciate a little notice.",
          "Wear normal practical clothes, ask simple questions and be honest about experience. A novice who wants to learn is easier to help than someone pretending to know more than they do.",
        ],
      },
      {
        heading: "Choosing the right club",
        body: [
          "Start with geography and use. A beautiful club you rarely visit will not beat a modest one ten minutes away with active sailing. Look for training, crewing boards, winter talks, family access, storage, launch facilities, moorings and whether the calendar matches your free time.",
        ],
      },
      {
        heading: "How clubs differ",
        body: [
          "Racing clubs live by starts, results, protest rooms, crew lists and the rhythm of a season. Cruising clubs care more about rallies, passages, pilotage evenings and the quiet competence of people who know where to anchor when the forecast changes. Royal yacht clubs may carry history, dress expectations and formal traditions, though many are far warmer than nervous visitors expect. Dinghy clubs can be muddy, busy, youth-heavy and wonderfully direct: boats go in, boats come out, people learn fast.",
          "Marina-based clubs often suit owners who want social life, talks, rallies and crew connections without hauling dinghies across a beach. Some clubs are training centres. Some are almost volunteer rescue networks for confused newcomers. The Old Sea Dogs clubs section is useful because it shows the variety: clubs as race organisers, waterfront communities, youth sailing bases, cruising networks and places where local knowledge is passed across a bar rather than a brochure.",
        ],
      },
      {
        heading: "What to expect as a visitor",
        body: [
          "Most clubs want visitors to behave like decent guests. Sign in if asked, pay for temporary membership where required, respect members' areas, do not wander into boat parks or pontoons without permission, and ask before bringing wet kit into the wrong room. If there is a dress code, follow it without making a speech about modern life. If there is not, still turn up clean enough for the room you are entering.",
          "The first conversation matters less than you think. You do not need to prove yourself with tales of heavy weather. Say what sailing you do, what you hope to do, and ask when the club is active. The useful questions are practical: race nights, cruising meets, training, crewing lists, visitor berths, launch access, youth sessions, volunteering and whether non-members can attend a talk or open day.",
        ],
      },
      {
        heading: "Etiquette, burgees and clubhouse basics",
        body: [
          "A burgee is the small club flag, and in some clubs it still carries meaning. You do not need to become a flag scholar before visiting, but you should understand that clubs have habits and those habits matter to the people who keep them alive. Ask if unsure. The old rule is simple: be interested, not dismissive.",
          "Clubhouse etiquette is mostly common sense dressed in local custom. Do not block the bar with wet sails. Do not treat volunteers like staff. Do not criticise a race officer until you have tried running a start line in a shifty breeze. If you borrow knowledge, buy a drink, say thank you, and remember the name of the person who helped you.",
        ],
      },
      {
        heading: "Joining and volunteering",
        body: [
          "Joining a club is not only a financial decision. Ask what membership includes: voting rights, bar access, training discounts, moorings, storage, launch use, crewing lists, reciprocal visits, family membership and winter events. Check joining fees, waiting lists, duties and whether you are expected to volunteer. A club that relies on volunteers should be honest about it; a new member should be honest about what they can give.",
          "Volunteering is often the fastest way in. Race box, safety boat, galley, open days, work parties, youth sessions and committee jobs all reveal how a club really functions. If you are new to sailing, offer practical help before offering opinions. Clubs remember the person who turned up early with gloves more warmly than the person who arrived late with theories.",
        ],
      },
      {
        heading: "Youth sailing and families",
        body: [
          "For families, the right club is one where children can learn safely and parents can understand the path. Ask about instructors, safety cover, changing rooms, safeguarding, boat hire, class fleets, costs, parent duties and what happens when a child outgrows the first boat. Youth sailing works best where the social side is as strong as the coaching.",
          "Do not assume the smartest clubhouse has the best youth programme. Look for boats on the water, clear communication and young sailors who seem to belong. The Old Sea Dogs clubs pages should help by showing clubs as living communities, not just addresses and crests.",
        ],
      },
      {
        heading: "How to choose",
        body: [
          "Choose the club that will get you afloat. Distance matters. So does the sailing calendar, the boats people actually use, the warmth of the welcome and whether your experience level fits the place. A racing sailor needs starts and rivals. A cruiser needs companions and passage knowledge. A beginner needs patience, training and a way to make mistakes without being made to feel small.",
          "Visit two or three clubs if you can. Go on an ordinary evening, not only an open day. Watch whether people talk to newcomers, whether boats are moving, and whether the noticeboard looks alive. A yacht club is not a logo. It is the sum of the people who unlock the doors, set the marks, scrub the tables, teach the juniors and keep coming back when the weather is filthy.",
        ],
      },
    ],
    checklist: [
      "Visit before joining.",
      "Ask about trial sails, crewing nights or open days.",
      "Check joining fees, annual fees, storage and bar minimums.",
      "Look at the calendar: racing, cruising, talks, training and socials.",
      "Choose the club that gets you afloat, not just the one with the best view.",
    ],
    sourceLinks: [
      { label: "Old Sea Dogs clubs section", href: "/clubs" },
      { label: "Send club updates", href: "mailto:captainoldseadog@gmail.com" },
    ],
  },
];

export function getFlagshipGuide(slug: string) {
  return flagshipGuides.find((guide) => guide.slug === slug) ?? null;
}
