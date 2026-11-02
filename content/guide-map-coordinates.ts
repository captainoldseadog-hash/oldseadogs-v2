export type GuideMapCoordinate = {
  latitude: number;
  longitude: number;
  source: string;
  uncertain?: boolean;
};

export const guideMapCoordinates: Record<string, GuideMapCoordinate> = {
  "st-helier": { latitude: 49.1819, longitude: -2.1110, source: "OSM St Helier Marina" },
  // West Country (26 Oct 2026). Dartmouth harbour entrance pin; area hub is excluded.
  "dartmouth": { latitude: 50.3518, longitude: -3.5789, source: "Dartmouth harbour entrance / twin castles reach (map pin)" },
  // West Country core six (27 Oct 2026). Pins are harbour-arrival orientation only — never for navigation.
  "brixham": { latitude: 50.400, longitude: -3.514, source: "Brixham outer harbour / Tor Bay Harbour Authority visitor pontoon reach (map pin)" },
  "salcombe": { latitude: 50.239, longitude: -3.768, source: "Salcombe town reach / Whitestrand (map pin)" },
  "plymouth": { latitude: 50.365, longitude: -4.133, source: "Sutton Harbour lock / Barbican waterfront (map pin)" },
  "fowey": { latitude: 50.335, longitude: -4.633, source: "Fowey lower harbour / east-side visitor moorings reach (map pin)" },
  "falmouth": { latitude: 50.153, longitude: -5.065, source: "Falmouth Haven / Custom House Quay waterfront (map pin)" },
  "helford": { latitude: 50.097, longitude: -5.130, source: "Helford River entrance / green visitor moorings concentration (map pin)" },
  // West Country second wave (28 Oct 2026). Orientation only.
  "torquay": { latitude: 50.4597, longitude: -3.5268, source: "Torquay enclosed harbour / Haldon Pier visitor pontoons (map pin)" },
  "yealm": { latitude: 50.3112, longitude: -4.056, source: "The Pool between Newton Ferrers and Noss Mayo (map pin)" },
  "mevagissey": { latitude: 50.27, longitude: -4.784, source: "Mevagissey outer harbour / Victoria Pier (map pin)" },
  "st-mawes": { latitude: 50.1585, longitude: -5.015, source: "St Mawes outer harbour visitor moorings (map pin)" },
  "newlyn": { latitude: 50.103, longitude: -5.5455, source: "Newlyn harbour leisure pontoon (map pin)" },
  // Norfolk Broads (28 Oct 2026). One area-level pin near Ranworth / the Bure so the map draws a "Norfolk Broads" bubble. Orientation only.
  "wroxham-hoveton": { latitude: 52.7117, longitude: 1.4082, source: "Wroxham Bridge, Hoveton (OSM) (map pin)" },
  "horning": { latitude: 52.7056, longitude: 1.4625, source: "Horning Staithe / Swan Inn, Lower Street (OSM) (map pin)" },
  "ranworth": { latitude: 52.6797, longitude: 1.4905, source: "Ranworth Staithe, east side of Malthouse Broad (OSM, approximate) (map pin)", uncertain: true },
  "how-hill-ludham": { latitude: 52.7171, longitude: 1.5113, source: "How Hill staithe below How Hill House, River Ant (OSM) (map pin)" },
  "stalham": { latitude: 52.7674, longitude: 1.5165, source: "Stalham Staithe / Museum of the Broads (OSM) (map pin)" },
  "hickling": { latitude: 52.7466, longitude: 1.5685, source: "Hickling Staithe / Pleasure Boat Inn (OSM) (map pin)" },
  "potter-heigham": { latitude: 52.7098, longitude: 1.5811, source: "Potter Heigham Bridge (OSM) (map pin)" },
  "acle": { latitude: 52.6484, longitude: 1.5682, source: "Acle Bridge Inn, Old Road (OSM) (map pin)" },
  "great-yarmouth": { latitude: 52.6149, longitude: 1.723, source: "Great Yarmouth Yacht Station, Tar Works Road (OSM) (map pin)" },
  "reedham": { latitude: 52.56, longitude: 1.566, source: "Reedham Quay, Riverside (OSM, Lord Nelson opposite) (map pin)" },
  "brundall": { latitude: 52.6185, longitude: 1.439, source: "Brundall Riverside boatyards (approximate) (map pin)", uncertain: true },
  "norwich": { latitude: 52.63, longitude: 1.3075, source: "Norwich Yacht Station, Riverside Road (OSM) (map pin)" },
  "beccles": { latitude: 52.4654, longitude: 1.5647, source: "Beccles Quay (The Quay Field, OSM) (map pin)" },
  "oulton-broad": { latitude: 52.4742, longitude: 1.7084, source: "Oulton Broad Yacht Station / Harbour Office, Bridge Road (OSM) (map pin)" },
  "padstow": { latitude: 50.542, longitude: -4.937, source: "Padstow inner harbour / floodgate (map pin)" },
};

/** Area hubs and non-place guides that should never get a pin. */
export const guideMapExcludedSlugs = new Set([
  "the-solent",
  "solent",
  "cowes-week-guide",
  "round-the-island-race-guide",
  "uk-boat-show-calendar",
  "beginners-guide-to-yacht-clubs",
  // Channel Islands area hub spans ~60 km; the area bubble represents it instead of a pin.
  "channel-islands",
  "west-country",
  "norfolk-broads",
]);
