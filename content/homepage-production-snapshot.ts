/**
 * STALE DEVELOPMENT-ONLY HOMEPAGE PREVIEW FIXTURE.
 *
 * This is not current production content and must never be treated as a
 * release baseline. It is loaded dynamically only after the fail-closed
 * development fixture policy confirms all three conditions:
 *   1. NODE_ENV is exactly `development` and OLDSEADOGS_ENV is not production;
 *   2. OLDSEADOGS_ENABLE_DEV_HOMEPAGE_FIXTURE is exactly `true`;
 *   3. the selected local editor data source has no saved story records.
 *
 * Current live story selection always comes from production persistence.
 */
export type HomepageProductionSnapshotStory = {
  slug: string;
  title: string;
  category: string;
  date: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCaption: string;
  summary: string;
  body: string[];
  readMinutes: number;
  featured: boolean;
};

export const homepageProductionSnapshotStories: HomepageProductionSnapshotStory[] = [
  {
    slug: "back-2-black-wins-the-noakes-sydney-gold-coast-yacht-race",
    title: "Back 2 Black Writes Another Chapter in the Rich History of the Noakes Sydney Gold Coast Yacht Race",
    category: "News",
    date: "2026-07-29",
    sourceName: "Old Sea Dogs live editorial snapshot",
    sourceUrl: "https://oldseadogs.com/stories/back-2-black-wins-the-noakes-sydney-gold-coast-yacht-race",
    imageUrl: "https://oldseadogs.com/api/media/media_04cedc3a5a124295be0c35bb00e60b02",
    imageAlt: "The 2026 Noakes Sydney Gold Coast Yacht Race start.",
    imageCredit: "© CYCA & Ashley Dart · Sydney",
    imageCaption: "The Noakes Sydney Gold Coast Yacht Race.",
    summary:
      "Sean Langman's Back 2 Black overcame an early setback to win the 2026 Noakes Sydney Gold Coast Yacht Race, adding another memorable chapter to one of Australia's most respected offshore sailing classics.",
    body: [
      "Few offshore races capture the spirit of Australian ocean racing quite like the Noakes Sydney Gold Coast Yacht Race. Stretching 384 nautical miles from Sydney Harbour to the glittering skyline of Southport on Queensland's Gold Coast, the event has long served as both a proving ground for ambitious crews and an important stepping stone towards the Rolex Sydney Hobart Yacht Race later in the year.",
      "The 2026 edition once again demonstrated exactly why this race has earned its reputation over decades of competition. Sunshine, warm trade winds, spectacular wildlife and tactical puzzles combined to produce what many competitors described as one of the most enjoyable passages in recent memory. Beneath the idyllic conditions, however, lay a fiercely contested race where fortunes changed rapidly and victory was earned through patience, experience and flawless teamwork.",
      "When Sean Langman's GP42 Back 2 Black crossed the finish line as the IRC Overall winner, few watching would have guessed how difficult the opening stages had been.",
      "For a period the eventual winners languished towards the back of the fleet, unable to find their rhythm as larger yachts stretched away. Offshore racing rarely rewards panic, though, and few skippers understand that better than Langman.",
      "One of Australia's most recognisable offshore sailors, Langman has spent decades racing everything from ocean-going maxis to classic yachts. His calm approach eventually paid dividends as Back 2 Black settled into its stride.",
    ],
    readMinutes: 3,
    featured: true,
  },
  {
    slug: "old-sea-dogs-joined-the-island-sailing-club-press-boat",
    title: "When Seamanship Beats Horsepower: A Folkboat Steals the Show at the Round the Island Race 2026",
    category: "News",
    date: "2026-07-12",
    sourceName: "Old Sea Dogs original reporting",
    sourceUrl: "https://oldseadogs.com/stories/old-sea-dogs-joined-the-island-sailing-club-press-boat",
    imageUrl: "https://oldseadogs.com/api/media/media_d0b24613238440dd84baa3227365efde",
    imageAlt: "Round the Island Race fleet seen from the Island Sailing Club press boat.",
    imageCredit: "© Michael Hodges",
    imageCaption: "Round the Island Race 2026.",
    summary:
      "Old Sea Dogs joined the Island Sailing Club press boat for an unforgettable day on the Solent, where nearly 800 yachts celebrated one of Britain's greatest sailing traditions.",
    body: [
      "Some sailing days stay with you forever. This year's Round the Island Race will certainly be one of them.",
      "With the River Medina still quiet and the tide carrying me gently downstream, I climbed aboard my RIB and headed for the Island Sailing Club as the eastern sky was beginning to glow.",
      "No matter how many times you have watched the Round the Island Race begin, nothing quite prepares you for the scale of it. Everywhere you looked there were yachts: large racing machines, beautiful classics, family cruisers, Folkboats, sportsboats and multihulls.",
      "By race day, almost 800 boats had gathered beneath clear blue skies, creating a scene that could only belong to Cowes. The Solent looked magnificent.",
      "The unmistakable boom of the Royal Yacht Squadron cannon echoed across the Solent. Within seconds hundreds of sails accelerated towards us.",
    ],
    readMinutes: 3,
    featured: false,
  },
  {
    slug: "2026-ilca-6-youth-european-championships",
    title: "Future Stars Shine Bright at the 2026 ILCA 6 Youth European Championships",
    category: "News",
    date: "2026-07-23",
    sourceName: "Old Sea Dogs live editorial snapshot",
    sourceUrl: "https://oldseadogs.com/stories/2026-ilca-6-youth-european-championships",
    imageUrl: "https://oldseadogs.com/api/media/media_7b73c45d68eb4ba59b7839f2331989ac",
    imageAlt: "Young ILCA 6 sailors racing at the 2026 European Championships.",
    imageCredit: "© Maria Vogiatzopoulou",
    imageCaption: "2026 ILCA 6 Youth European Championships.",
    summary:
      "The 2026 ILCA 6 Youth European Championships concluded in Greece after an exhilarating week of racing that showcased exceptional young talent, changing conditions and the bright future of international sailing.",
    body: [
      "Every Olympic sailor begins somewhere.",
      "Before the medals, world championships and America's Cup campaigns, there are youth championships where reputations are forged, confidence is built and future stars quietly announce their arrival.",
      "The 2026 ILCA 6 Youth European Championships and Open European Trophy, held in Thessaloniki, Greece, provided exactly that stage.",
      "For an entire week, some of the world's finest young sailors battled across the waters of the Thermaic Gulf, producing racing that was as unpredictable as it was impressive.",
      "By the time the final race finished, twelve races had been completed across six fleets, producing deserving champions and confirming that the future of competitive sailing remains in exceptionally capable hands.",
    ],
    readMinutes: 3,
    featured: false,
  },
  {
    slug: "round-the-island-race-2026",
    title: "Round the Island Race Became a Journey of Recovery, Friendship and New Beginnings for the Stride Forward Crew",
    category: "News",
    date: "2026-07-24",
    sourceName: "Old Sea Dogs live editorial snapshot",
    sourceUrl: "https://oldseadogs.com/stories/round-the-island-race-2026",
    imageUrl: "https://oldseadogs.com/api/media/media_c0f58dc562904dcb84fb8ce98976944d",
    imageAlt: "The Farr 65 Stride Forward sailing in the Solent.",
    imageCredit: "© Matt Dickens · Solent",
    imageCaption: "Stride Forward at the 2026 Round the Island Race.",
    summary:
      "The 2026 Round the Island Race was about far more than finishing positions as a remarkable crew demonstrated how sailing can rebuild confidence, purpose and lives after serious injury.",
    body: [
      "Every yacht that crossed the Royal Yacht Squadron start line during the 2026 Round the Island Race carried its own ambitions.",
      "Some crews dreamed of silverware. Some hoped to beat old rivals. Others simply wanted to complete one of Britain's most famous yacht races.",
      "Aboard the Farr 65 Stride Forward, success had already been measured long before the first starting cannon echoed across the Solent.",
      "Their race had begun in hospital wards and continued through rehabilitation centres, painful physiotherapy sessions and the quiet struggle to rediscover confidence after catastrophic injuries.",
      "Nearly 800 yachts left Cowes on 11 July, setting off beneath bright skies and a gentle north-easterly breeze.",
    ],
    readMinutes: 3,
    featured: false,
  },
  {
    slug: "50th-anniversary-of-the-round-britain-and-ireland-race",
    title: "Round Britain & Ireland Race 2026: The Next Generation Sets Sail for Offshore Sailing's Greatest Test",
    category: "News",
    date: "2026-07-15",
    sourceName: "Old Sea Dogs live editorial snapshot",
    sourceUrl: "https://oldseadogs.com/stories/50th-anniversary-of-the-round-britain-and-ireland-race",
    imageUrl: "https://oldseadogs.com/api/media/media_a49844a4ab004fd697327625dbe5b2a2",
    imageAlt: "Ellie Driver preparing for the Round Britain and Ireland Race.",
    imageCredit: "© Rick Tomlinson/RORC",
    imageCaption: "Round Britain and Ireland Race 2026.",
    summary:
      "The Royal Ocean Racing Club's 2026 Round Britain & Ireland Race is more than another offshore contest. It is where ambition meets endurance as experienced veterans and young sailors tackle 1,800 unforgiving miles around Britain and Ireland.",
    body: [
      "There are offshore races that test your boat. There are offshore races that test your crew.",
      "Then there is the Round Britain & Ireland Race, a race that quietly tests everything you thought you knew about sailing.",
      "This August, one of offshore racing's most respected events returns as competitors prepare to leave Cowes for a 1,800-nautical-mile non-stop voyage around Britain and Ireland.",
      "Unlike shorter offshore races where speed alone can carry a crew through difficult moments, the race demands patience, resilience and careful judgement.",
      "The 2026 race marks the 50th anniversary of an event that has become one of the defining challenges in offshore sailing.",
    ],
    readMinutes: 3,
    featured: false,
  },
];

export const homepageProductionSnapshot = {
  capturedAt: "2026-07-30",
  leadSlug: "back-2-black-wins-the-noakes-sydney-gold-coast-yacht-race",
  latestSlugs: [
    "old-sea-dogs-joined-the-island-sailing-club-press-boat",
    "2026-ilca-6-youth-european-championships",
    "round-the-island-race-2026",
    "50th-anniversary-of-the-round-britain-and-ireland-race",
  ],
} as const;
