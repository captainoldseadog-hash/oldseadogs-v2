import type { FlagshipGuide, GuideSection } from "./flagship-guides.ts";

export type PublishedMarinaValue = string | null;

export type MarinaSourceNote = {
  title: string;
  operator: string;
  url: string;
  verifiedOn: string;
  supportedFields: string[];
};

export type SolentMarinaGuideRecord = {
  internalId: string;
  slug: string;
  officialName: string;
  operator: string;
  region: "The Solent";
  subregion: string;
  editorialOrder: number;
  address: string;
  telephone: string;
  email: PublishedMarinaValue;
  vhfChannel: PublishedMarinaValue;
  officeHours: PublishedMarinaValue;
  berthing: {
    berthCount: PublishedMarinaValue;
    visitorBerthing: PublishedMarinaValue;
    maximumLoa: PublishedMarinaValue;
    maximumDraft: PublishedMarinaValue;
  };
  arrival: {
    approach: string;
    tidalConstraints: PublishedMarinaValue;
    lockDetails: PublishedMarinaValue;
    hazards: PublishedMarinaValue;
  };
  services: {
    fuel: PublishedMarinaValue;
    water: PublishedMarinaValue;
    electricity: PublishedMarinaValue;
    toiletsAndShowers: PublishedMarinaValue;
    laundry: PublishedMarinaValue;
    wifi: PublishedMarinaValue;
    pumpOut: PublishedMarinaValue;
    parking: PublishedMarinaValue;
    security: PublishedMarinaValue;
    accessibility: PublishedMarinaValue;
  };
  marineServices: {
    travelLift: PublishedMarinaValue;
    dryStack: PublishedMarinaValue;
    storageAshore: PublishedMarinaValue;
    repairAndMaintenance: PublishedMarinaValue;
  };
  ashore: {
    amenities: string;
    transport: PublishedMarinaValue;
    nearbyDestinations: string;
  };
  editorial: {
    summary: string;
    introduction: string;
    setting: string;
    arrival: string;
    berthing: string;
    facilities: string;
    marineServices: string;
    ashore: string;
    bestFor: string;
    lessSuitableFor: string;
    historyAndCharacter: string;
    nearbyCruising: string;
    skippersNotes: string;
    oldSeaDogsView: string;
  };
  media: {
    primaryImage: string;
    primaryImageAlt: string;
    originalFilename: string;
    supportingImages: Array<{ url: string; alt: string; originalFilename: string }>;
  };
  sources: MarinaSourceNote[];
  relations: {
    parentGuideSlug: string;
    relatedGuideSlugs: string[];
    cruiseOnGuideSlugs: string[];
    previousGuideSlug: string;
    nextGuideSlug: string;
  };
};

const verifiedOn = "2026-08-06";
const unavailable = null;

function officialSource(title: string, operator: string, url: string, supportedFields: string[]): MarinaSourceNote {
  return { title, operator, url, verifiedOn, supportedFields };
}

export const solentMarinaGuideRecords: SolentMarinaGuideRecord[] = [
  {
    internalId: "OSD-G011",
    slug: "port-hamble-marina",
    officialName: "Port Hamble Marina",
    operator: "MDL Marinas",
    region: "The Solent",
    subregion: "River Hamble",
    editorialOrder: 11,
    address: "Satchell Lane, Hamble, Southampton, SO31 4QD",
    telephone: "023 8045 2741",
    email: unavailable,
    vhfChannel: "VHF Channel 80",
    officeHours: unavailable,
    berthing: { berthCount: "310 berths", visitorBerthing: "Visitor berthing is subject to allocation and availability; contact the marina before arrival.", maximumLoa: "24 metres", maximumDraft: unavailable },
    arrival: { approach: "Port Hamble lies on the River Hamble, where leisure traffic, tide and harbour directions all deserve attention.", tidalConstraints: "Plan the river transit with current tide and Harbour Authority information.", lockDetails: unavailable, hazards: "Busy river traffic and confined manoeuvring near marina fairways." },
    services: { fuel: "Petrol and diesel", water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "Lifting is available nearby at Hamble Point Marina; confirm capacity and booking directly.", dryStack: unavailable, storageAshore: "Storage is available nearby at Hamble Point Marina; confirm arrangements directly.", repairAndMaintenance: unavailable },
    ashore: { amenities: "Hamble village and the wider River Hamble marine community are within the marina's orbit.", transport: unavailable, nearbyDestinations: "River Hamble, Southampton Water and the central Solent." },
    editorial: {
      summary: "A busy lower-river marina with fuel, direct access to Hamble village and a front-row view of one of Britain’s great sailing communities.",
      introduction: "Port Hamble sits where practical marina life and the social life of Hamble meet. It is a useful base for crews who want the village close at hand without losing the sense that the river itself is the main event.",
      setting: "The marina occupies the River Hamble’s western bank in a stretch alive with yachts, launches and working marine businesses. The atmosphere is purposeful rather than secluded, particularly when weekend fleets are moving.",
      arrival: "The approach is a river passage, not a final turn made in isolation. Keep a proper lookout, follow current Harbour Authority directions and contact the marina on VHF Channel 80 before committing to an allocated berth.",
      berthing: "The published capacity is 310 berths for boats up to 24 metres. Fairways can feel busy when several crews arrive together, so fenders, lines and roles are best sorted before the marina entrance.",
      facilities: "Petrol and diesel are the clearest practical advantage in the supplied record. Water, shore power and shoreside facility details should be confirmed directly rather than assumed from a neighbouring marina.",
      marineServices: "Serious lifting and storage are associated with nearby Hamble Point Marina. Treat that as a separate booking and confirm the boat, timing and work scope with the operator.",
      ashore: "Hamble’s pubs, cafés and maritime life give this berth more energy than a remote marina stop. The village is part of the appeal, although crews should confirm their preferred route and transport arrangements before relying on them.",
      bestFor: "Crews who value fuel, Hamble village and a direct start for central Solent sailing.",
      lessSuitableFor: "Visitors seeking a quiet rural basin or an arrival removed from a heavily used river.",
      historyAndCharacter: "Port Hamble belongs to a river whose boatyards, clubs and racing fleets have shaped modern British yachting. Its character comes from participation in that living industry rather than from heritage display.",
      nearbyCruising: "Southampton Water lies downriver, with Cowes, Beaulieu River and the wider central Solent forming natural onward choices when tide and weather agree.",
      skippersNotes: "Call ahead, keep the river listening watch required by current local guidance and avoid treating the final few boat lengths as an excuse to relax the lookout.",
      oldSeaDogsView: "Port Hamble works best when you want to be in the middle of things. It is lively, convenient and unashamedly connected to the business of sailing.",
    },
    media: { primaryImage: "/images/guides/guides-marina-port-hamble-marina-editorial-v1.png", primaryImageAlt: "Painterly aerial view of Port Hamble Marina and the River Hamble.", originalFilename: "guides-marina-port-hamble-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Port Hamble Marina official information", "MDL Marinas", "https://www.mdlmarinas.co.uk/marinas/mdl-port-hamble-marina/", ["operator", "address", "telephone", "VHF", "berths", "maximum LOA", "fuel", "nearby lifting and storage"])],
    relations: { parentGuideSlug: "river-hamble", relatedGuideSlugs: ["hamble-point-marina", "mercury-yacht-harbour", "river-hamble"], cruiseOnGuideSlugs: ["cowes", "beaulieu-river", "southampton-water"], previousGuideSlug: "hamble-point-marina", nextGuideSlug: "mercury-yacht-harbour" },
  },
  {
    internalId: "OSD-G012", slug: "mercury-yacht-harbour", officialName: "Mercury Yacht Harbour", operator: "MDL Marinas", region: "The Solent", subregion: "River Hamble", editorialOrder: 12,
    address: "Satchell Lane, Hamble, Southampton, SO31 4HQ", telephone: "023 8045 5994", email: unavailable, vhfChannel: "VHF Channel 80", officeHours: unavailable,
    berthing: { berthCount: "360 berths", visitorBerthing: "Visitor berthing is subject to allocation and availability; contact the marina before arrival.", maximumLoa: "24 metres", maximumDraft: unavailable },
    arrival: { approach: "Mercury lies farther up the River Hamble in a wooded reach; plan the complete river transit before arrival.", tidalConstraints: "Use current tide and River Hamble Harbour Authority information.", lockDetails: unavailable, hazards: "Busy river traffic, moorings and confined fairways." },
    services: { fuel: "Petrol and diesel are available nearby at Port Hamble Marina.", water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "Lifting is available nearby at Hamble Point Marina; confirm directly.", dryStack: unavailable, storageAshore: "Storage is available nearby at Hamble Point Marina; confirm directly.", repairAndMaintenance: unavailable },
    ashore: { amenities: "A greener river setting with Hamble village and River Hamble businesses within reach.", transport: unavailable, nearbyDestinations: "River Hamble, Southampton Water and the central Solent." },
    editorial: {
      summary: "A sheltered, wooded River Hamble base whose quieter setting contrasts with the river’s constant sailing traffic.",
      introduction: "Mercury Yacht Harbour feels tucked into the landscape even though the Solent is only a river passage away. That balance of shelter and access is its defining quality.",
      setting: "Trees and the upper reaches of the Hamble soften the surroundings. The river remains busy, yet the marina’s immediate mood is less urban than the large basins closer to Southampton Water.",
      arrival: "Arrival requires attention throughout the River Hamble transit. Maintain the required listening watch, watch for ferries and leisure traffic, and contact Mercury on VHF Channel 80 for berth instructions.",
      berthing: "The marina publishes 360 berths for boats up to 24 metres. Prepare for a sheltered berth, while allowing enough time to reach it without rushing the final river section.",
      facilities: "Fuel is not presented as an on-site service in the supplied record; petrol and diesel are available nearby at Port Hamble. Other facilities should be checked directly before a visit.",
      marineServices: "Lifting and storage are available nearby at Hamble Point Marina. A crew planning maintenance should arrange those services separately rather than treating them as part of the Mercury berth.",
      ashore: "The attraction ashore is the calmer riverside setting and access to the broader Hamble community. Confirm transport and seasonal hospitality directly if they are central to the stay.",
      bestFor: "Crews wanting a sheltered Hamble base with a greener, less hurried feel.",
      lessSuitableFor: "A quick fuel stop or visitors who want a town centre immediately outside the marina gate.",
      historyAndCharacter: "Mercury reflects the River Hamble’s evolution from working shoreline to a dense network of leisure sailing, specialist marine trades and waterside communities.",
      nearbyCruising: "The river leads naturally to Southampton Water and the central Solent, with Cowes and Beaulieu River sensible onward ideas in suitable conditions.",
      skippersNotes: "Budget time for the river transit in both directions and decide where fuel fits into the passage before casting off.",
      oldSeaDogsView: "Mercury is the sort of marina that makes staying aboard feel like time beside a river rather than time beside a car park.",
    },
    media: { primaryImage: "/images/guides/guides-marina-mercury-yacht-harbour-hero-v1.png", primaryImageAlt: "Painterly aerial view of Mercury Yacht Harbour at sunset.", originalFilename: "guides-marina-mercury-yacht-harbour-hero-v1.png", supportingImages: [] },
    sources: [officialSource("Mercury Yacht Harbour official information", "MDL Marinas", "https://www.mdlmarinas.co.uk/marinas/mdl-mercury-yacht-harbour/", ["operator", "address", "telephone", "VHF", "berths", "maximum LOA", "nearby fuel", "nearby lifting and storage"])],
    relations: { parentGuideSlug: "river-hamble", relatedGuideSlugs: ["port-hamble-marina", "universal-marina", "river-hamble"], cruiseOnGuideSlugs: ["cowes", "beaulieu-river", "southampton-water"], previousGuideSlug: "port-hamble-marina", nextGuideSlug: "universal-marina" },
  },
  {
    internalId: "OSD-G013", slug: "universal-marina", officialName: "Universal Marina", operator: "Premier Marinas", region: "The Solent", subregion: "River Hamble", editorialOrder: 13,
    address: "Crableck Lane, Sarisbury Green, Southampton, SO31 7ZN", telephone: "01489 574272", email: "universal@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "Reception open 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Universal lies on the upper River Hamble; use current harbour guidance and allow for the full river passage.", tidalConstraints: "Confirm suitability for the boat and state of tide directly.", lockDetails: unavailable, hazards: "Busy river traffic and upper-river manoeuvring." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: unavailable, dryStack: "Approximately 130 dry-stack spaces for boats up to 10 metres.", storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "A River Hamble marine campus in a quieter upper-river setting.", transport: unavailable, nearbyDestinations: "Upper River Hamble, Bursledon and Southampton Water." },
    editorial: {
      summary: "An upper River Hamble marina with a strong dry-stack identity and a setting that rewards an unhurried river passage.",
      introduction: "Universal Marina occupies a quieter part of the Hamble’s long maritime corridor. It suits sailors who regard the river passage as part of the day rather than an obstacle before it.",
      setting: "The upper river feels enclosed and green compared with Southampton Water. Marine activity remains close, but the pace and scale are gentler than at the lower-river marinas.",
      arrival: "Follow current River Hamble guidance throughout the approach and call the marina on VHF Channel 80 for instructions. Suitability for deeper or larger craft should be agreed directly.",
      berthing: "Visitor berthing details and maximum dimensions are not published in the supplied record. A direct conversation with reception is the sensible starting point.",
      facilities: "Reception is published as open 24 hours. The remaining service details in this edition are intentionally left unclaimed until supported by the marina’s current information.",
      marineServices: "The distinctive published service is a dry stack of approximately 130 spaces for boats up to 10 metres. Confirm dimensions, handling arrangements and availability before planning around it.",
      ashore: "Universal is better understood as a river and marina destination than as a town-centre stop. Confirm transport and hospitality details if shore plans matter to the crew.",
      bestFor: "Smaller craft using dry-stack services and crews who enjoy the upper Hamble’s quieter character.",
      lessSuitableFor: "Visitors needing an unverified service or those unwilling to make the longer river transit.",
      historyAndCharacter: "The marina forms part of the Hamble’s deep concentration of boatbuilding, handling and leisure boating, a working landscape that continues to evolve.",
      nearbyCruising: "Downriver choices open into Southampton Water and the Solent; nearby Hamble and Bursledon add useful context to a river-based visit.",
      skippersNotes: "Confirm dimensions and visitor arrangements before departure, then leave enough daylight and attention for the upper-river arrival.",
      oldSeaDogsView: "Universal has the appealing sense of being reached rather than merely parked at. The river earns its place in the logbook.",
    },
    media: { primaryImage: "/images/guides/guides-marina-universal-marina-concept-v1.png", primaryImageAlt: "Watercolour-style sailing scene used for the Universal Marina Guide.", originalFilename: "guides-marina-universal-marina-concept-v1.png", supportingImages: [] },
    sources: [officialSource("Universal Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/universal-marina", ["operator", "address", "telephone", "email", "VHF", "reception", "dry stack"])],
    relations: { parentGuideSlug: "river-hamble", relatedGuideSlugs: ["mercury-yacht-harbour", "swanwick-marina", "river-hamble"], cruiseOnGuideSlugs: ["southampton-water", "cowes", "beaulieu-river"], previousGuideSlug: "mercury-yacht-harbour", nextGuideSlug: "swanwick-marina" },
  },
  {
    internalId: "OSD-G014", slug: "swanwick-marina", officialName: "Swanwick Marina", operator: "Premier Marinas", region: "The Solent", subregion: "River Hamble", editorialOrder: 14,
    address: "Swanwick, Southampton, SO31 1ZL", telephone: "01489 884081", email: "swanwick@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "Reception open 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Swanwick sits on the upper River Hamble near Bursledon; follow current river directions and call ahead.", tidalConstraints: "Boatyard services are published as operating at all states of tide; berth suitability remains a direct check.", lockDetails: unavailable, hazards: "Busy river traffic and confined upper-river water." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "65-tonne travel lift and 35-tonne transporter; published boatyard beam limit approximately 6 metres.", dryStack: "Dry stack for boats up to 11 metres.", storageAshore: unavailable, repairAndMaintenance: "Full-service boatyard; confirm individual work directly." },
    ashore: { amenities: "A substantial working marina close to Bursledon and the upper River Hamble marine trades.", transport: unavailable, nearbyDestinations: "Bursledon, River Hamble and Southampton Water." },
    editorial: {
      summary: "A substantial upper-Hamble marina where serious boat handling and a broad marine-service community sit beside sheltered river berths.",
      introduction: "Swanwick is a practical place with the scale to support more than a night alongside. Its strength lies in the combination of upper-river shelter, boatyard capability and the surrounding marine trade.",
      setting: "The marina sits near Bursledon in a busy but sheltered stretch of river. It feels like a working centre of gravity for boats rather than a decorative waterside development.",
      arrival: "The River Hamble approach calls for the same disciplined lookout needed elsewhere on the river. Contact Swanwick on VHF Channel 80 and follow current berth instructions through the final manoeuvre.",
      berthing: "Visitor dimensions and berth numbers are not claimed in this edition. Reception operates 24 hours, which is useful, although availability and suitability still need direct confirmation.",
      facilities: "The supplied operational record confirms round-the-clock reception. Other berth services should be checked with the marina instead of inferred from the wider Premier network.",
      marineServices: "A 65-tonne travel lift, 35-tonne transporter and published boatyard beam limit of about 6 metres give Swanwick real handling capacity. Dry-stack service is published for boats up to 11 metres.",
      ashore: "Bursledon and the upper Hamble provide the local context, with marine specialists more central to the experience than conventional sightseeing.",
      bestFor: "Owners planning boatyard work, dry-stack users and crews wanting an established upper-river base.",
      lessSuitableFor: "A fleeting town-centre stop or boats whose dimensions have not been agreed with the marina.",
      historyAndCharacter: "Swanwick stands in a river reach long associated with yards and boatbuilding. Modern lifting equipment continues that practical tradition in a different form.",
      nearbyCruising: "The route downriver leads into Southampton Water and the Solent, while Bursledon and the neighbouring marinas reward slower exploration.",
      skippersNotes: "Book heavy handling in advance and give accurate length, beam, displacement and hull information rather than relying on a single headline capacity.",
      oldSeaDogsView: "Swanwick is at its best when the jobs list is longer than the drinks order. It is a marina that understands boats need work as well as admiration.",
    },
    media: { primaryImage: "/images/guides/guides-marina-swanwick-marina-editorial-v1.png", primaryImageAlt: "Watercolour-style aerial view of Swanwick Marina on the River Hamble.", originalFilename: "guides-marina-swanwick-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Swanwick Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/swanwick-marina", ["operator", "address", "telephone", "email", "VHF", "reception", "travel lift", "transporter", "beam", "dry stack"])],
    relations: { parentGuideSlug: "river-hamble", relatedGuideSlugs: ["universal-marina", "deacons-marina", "river-hamble"], cruiseOnGuideSlugs: ["southampton-water", "cowes", "beaulieu-river"], previousGuideSlug: "universal-marina", nextGuideSlug: "deacons-marina" },
  },
  {
    internalId: "OSD-G015", slug: "deacons-marina", officialName: "Deacons Marina", operator: "Premier Marinas", region: "The Solent", subregion: "River Hamble", editorialOrder: 15,
    address: "Bridge Road, Bursledon, Southampton, SO31 8AZ", telephone: "023 8040 2253", email: "deacons@premiermarinas.com", vhfChannel: unavailable, officeHours: "08:00-20:00 April-September; 08:00-17:00 October-March",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Deacons lies beside the upper River Hamble at Bursledon. The marina does not publish a VHF channel in the supplied record.", tidalConstraints: "Confirm boatyard and berth access directly for the boat and tide.", lockDetails: unavailable, hazards: "Keep the River Hamble watch on Channel 68 and account for upper-river traffic." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "Boatyard handling for boats up to approximately 14 metres or 15 tonnes; confirm the limiting dimension directly.", dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: "Boatyard services are available; confirm the required work directly." },
    ashore: { amenities: "Bursledon, riverside walking and the upper Hamble marine community shape the shore visit.", transport: unavailable, nearbyDestinations: "Bursledon, River Hamble and Southampton Water." },
    editorial: {
      summary: "An intimate Bursledon marina with a useful boatyard and a close connection to the upper River Hamble’s working character.",
      introduction: "Deacons feels embedded in Bursledon and the river around it. The scale is more personal than some Solent marinas, while the boatyard keeps the place firmly practical.",
      setting: "Road, rail, river and boatyard activity meet around the upper Hamble. That mixture gives Deacons a distinctive, lived-in setting rather than a resort atmosphere.",
      arrival: "No marina VHF channel is published in the supplied record. Contact the office by telephone when required, maintain the current River Hamble watch on Channel 68 and follow Harbour Authority directions.",
      berthing: "Visitor capacity and maximum dimensions are not stated here, so berth suitability should be settled directly. Seasonal office hours make advance contact particularly sensible.",
      facilities: "Operational shoreside facilities should be checked with the marina. This Guide does not borrow amenities from Swanwick or another nearby site simply because they share an operator.",
      marineServices: "The boatyard handles craft up to approximately 14 metres or 15 tonnes. The actual limiting factor may be weight, shape or working space, so provide full vessel details before booking.",
      ashore: "Bursledon adds railway, village and boatbuilding context to the visit, although individual transport and opening details remain a direct check.",
      bestFor: "Smaller and medium-sized craft, Bursledon visits and crews arranging defined boatyard work.",
      lessSuitableFor: "Crews relying on a marina VHF call or larger boats without confirmed handling and berth arrangements.",
      historyAndCharacter: "The upper Hamble has supported boatbuilding and river trades for generations. Deacons retains some of that yard-like directness within a modern marina operation.",
      nearbyCruising: "Swanwick lies close by, while the river itself leads down to Southampton Water and the wider central Solent.",
      skippersNotes: "Note the seasonal office hours and use the telephone where needed. Never substitute the River Hamble working channel for an unpublished marina channel.",
      oldSeaDogsView: "Deacons has the appeal of a marina that still feels attached to a place. Bursledon and the river do as much work as the pontoons.",
    },
    media: { primaryImage: "/images/guides/guides-marina-deacons-marina-editorial-v1.png", primaryImageAlt: "Watercolour-style aerial view of Deacons Marina and the upper River Hamble.", originalFilename: "guides-marina-deacons-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Deacons Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/deacons-marina", ["operator", "address", "telephone", "email", "office hours", "boatyard limit", "marina VHF not published"])],
    relations: { parentGuideSlug: "river-hamble", relatedGuideSlugs: ["swanwick-marina", "universal-marina", "river-hamble"], cruiseOnGuideSlugs: ["southampton-water", "cowes", "beaulieu-river"], previousGuideSlug: "swanwick-marina", nextGuideSlug: "ocean-village-marina" },
  },
  {
    internalId: "OSD-G016", slug: "ocean-village-marina", officialName: "Ocean Village Marina", operator: "MDL Marinas", region: "The Solent", subregion: "Southampton Water", editorialOrder: 16,
    address: "1 Channel Way, Southampton, SO14 3QF", telephone: "023 8022 9385", email: unavailable, vhfChannel: "VHF Channel 80", officeHours: unavailable,
    berthing: { berthCount: "326 berths", visitorBerthing: "Visitor berthing is subject to allocation and availability; contact the marina before arrival.", maximumLoa: "80 metres", maximumDraft: unavailable },
    arrival: { approach: "The route lies through Southampton Water and the Port of Southampton; commercial traffic and VTS directions take priority.", tidalConstraints: "Use current charts, tides, Southampton VTS information and marina instructions.", lockDetails: unavailable, hazards: "Large commercial shipping, ferries and port traffic." },
    services: { fuel: "Fuel is available at Hythe Marina Village or Port Hamble Marina; confirm before diverting.", water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "Lifting is available at other MDL boatyards; confirm the appropriate site and capacity.", dryStack: unavailable, storageAshore: "Storage is available at other MDL boatyards; arrange separately.", repairAndMaintenance: unavailable },
    ashore: { amenities: "A city marina beside Southampton's waterfront restaurants, events and urban services.", transport: unavailable, nearbyDestinations: "Southampton, Southampton Water and the River Itchen waterfront." },
    editorial: {
      summary: "A large city marina at the head of Southampton Water, combining serious berthing capacity with a lively urban waterfront.",
      introduction: "Ocean Village is where a Solent passage meets the city. The marina offers scale and immediate shoreside life, yet arrival still belongs to one of Britain’s busiest commercial ports.",
      setting: "Apartment towers, restaurants and port infrastructure frame the basin. It is emphatically urban, with the movement of Southampton Water always part of the wider picture.",
      arrival: "Treat Southampton Water as a commercial approach from the outset. Monitor the required channels, follow current VTS and port directions, keep clear of large vessels and call Ocean Village on VHF Channel 80 for the berth.",
      berthing: "The published 326 berths include capacity for vessels up to 80 metres, which sets Ocean Village apart. Large-vessel capability does not remove the need to confirm berth, services and manoeuvring arrangements in advance.",
      facilities: "Fuel is available elsewhere at Hythe or Port Hamble rather than being claimed here. Confirm all other services directly, especially where a larger vessel has non-standard requirements.",
      marineServices: "Lifting and storage can be arranged at other MDL boatyards. Select the site by vessel dimensions and job scope rather than assuming the nearest yard is suitable.",
      ashore: "Few Solent marinas provide a more immediate transition to restaurants, entertainment and city life. That convenience brings noise and movement, particularly during events.",
      bestFor: "City breaks, larger vessels and crews who want an active waterfront outside the companionway.",
      lessSuitableFor: "A quiet rural night or a skipper uncomfortable with commercial-port procedures.",
      historyAndCharacter: "Southampton’s maritime identity is commercial, migratory and ocean-facing. Ocean Village occupies a leisure basin within that much larger working story.",
      nearbyCruising: "The River Hamble, Hythe and the central Solent are natural next legs, while the city itself can justify a longer stay.",
      skippersNotes: "Commercial traffic cannot manoeuvre like a yacht. Build the passage around port movements and directions, not around the convenience of an intended arrival time.",
      oldSeaDogsView: "Ocean Village is not a retreat from Southampton; it is an invitation into it. Come for the contrast between ocean-going ships and supper within walking distance.",
    },
    media: { primaryImage: "/images/guides/guides-marina-ocean-village-marina-editorial-v1.png", primaryImageAlt: "Watercolour-style view across Ocean Village Marina in Southampton.", originalFilename: "guides-marina-ocean-village-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Ocean Village Marina official information", "MDL Marinas", "https://www.mdlmarinas.co.uk/marinas/mdl-ocean-village-marina/", ["operator", "address", "telephone", "VHF", "berths", "maximum LOA", "nearby fuel", "off-site lifting and storage"])],
    relations: { parentGuideSlug: "southampton-water", relatedGuideSlugs: ["hythe-marina-village", "southampton-water", "port-hamble-marina"], cruiseOnGuideSlugs: ["river-hamble", "cowes", "portsmouth-harbour"], previousGuideSlug: "deacons-marina", nextGuideSlug: "hythe-marina-village" },
  },
  {
    internalId: "OSD-G017", slug: "hythe-marina-village", officialName: "Hythe Marina Village", operator: "MDL Marinas", region: "The Solent", subregion: "Southampton Water", editorialOrder: 17,
    address: "Shamrock Way, Hythe, Southampton, SO45 6DY", telephone: "023 8020 7073", email: unavailable, vhfChannel: "VHF Channel 80", officeHours: unavailable,
    berthing: { berthCount: "206 berths", visitorBerthing: "Visitor berthing is subject to lock and berth availability; contact the marina before arrival.", maximumLoa: "Normally 16 metres; larger vessels by arrangement", maximumDraft: unavailable },
    arrival: { approach: "Approach from Southampton Water and enter through the marina lock under current instructions.", tidalConstraints: "The lock is operated 24 hours; confirm current procedures and any restrictions before arrival.", lockDetails: "Controlled lock, operated 24 hours.", hazards: "Commercial traffic in Southampton Water and confined lock manoeuvring." },
    services: { fuel: "Petrol and diesel", water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: "Pump-out available", parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "40-tonne lift; confirm vessel dimensions and booking directly.", dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "A residential marina village with Hythe and the New Forest side of Southampton Water nearby.", transport: unavailable, nearbyDestinations: "Hythe, Southampton Water and the western shore of the Solent." },
    editorial: {
      summary: "A distinctive locked marina village on Southampton Water, with fuel, a 40-tonne lift and a residential waterside character.",
      introduction: "Hythe Marina Village is memorable because the marina and the homes around it form one place. Arrival through the lock marks a clear transition from commercial Southampton Water to an enclosed basin.",
      setting: "Waterfront houses and pontoons define the scene. The basin feels protected and domestic, while the cranes and ships of Southampton remain reminders of the water outside.",
      arrival: "Plan the crossing with full regard for commercial traffic, then contact Hythe on VHF Channel 80 for current lock instructions. Lines and fenders should be ready before entering the confined approach.",
      berthing: "The marina publishes 206 berths and normally accepts boats up to 16 metres, with larger vessels by arrangement. Lock and berth suitability both deserve confirmation.",
      facilities: "Petrol, diesel and pump-out are published services. The remaining berth and shoreside facilities should be checked directly before they become part of the passage plan.",
      marineServices: "A 40-tonne lift provides meaningful boatyard capability. Weight alone is not a complete specification, so confirm beam, hull form and the work required.",
      ashore: "The residential setting is the principal atmosphere ashore, with Hythe and the New Forest side of Southampton Water providing the wider destination.",
      bestFor: "Crews valuing a sheltered locked basin, on-site fuel and a quieter base across the water from Southampton.",
      lessSuitableFor: "Skippers who prefer unrestricted entry or have not confirmed lock and dimensional requirements.",
      historyAndCharacter: "Hythe’s relationship with Southampton Water has long mixed local community and a view across major port activity. The marina village expresses that contrast in modern form.",
      nearbyCruising: "Southampton, the River Hamble, Beaulieu River and the central Solent all become plausible next legs once clear of the lock and commercial channel.",
      skippersNotes: "A 24-hour lock is still a controlled lock. Call for instructions, prepare the boat early and never let a timetable hurry the crossing of Southampton Water.",
      oldSeaDogsView: "There is something agreeably theatrical about locking out from a village of boats and houses into the path of ocean shipping. Hythe is full of contrasts.",
    },
    media: { primaryImage: "/images/guides/guides-marina-hythe-marina-village-editorial-v1.png", primaryImageAlt: "Watercolour-style view of boats and waterside homes at Hythe Marina Village.", originalFilename: "guides-marina-hythe-marina-village-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Hythe Marina Village official information", "MDL Marinas", "https://www.mdlmarinas.co.uk/marinas/mdl-hythe-marina-village/", ["operator", "address", "telephone", "VHF", "berths", "maximum LOA", "lock", "travel lift", "fuel", "pump-out"])],
    relations: { parentGuideSlug: "southampton-water", relatedGuideSlugs: ["ocean-village-marina", "southampton-water", "port-hamble-marina"], cruiseOnGuideSlugs: ["beaulieu-river", "river-hamble", "cowes"], previousGuideSlug: "ocean-village-marina", nextGuideSlug: "haslar-marina" },
  },
  {
    internalId: "OSD-G018", slug: "haslar-marina", officialName: "Haslar Marina", operator: "Premier Marinas", region: "The Solent", subregion: "Portsmouth Harbour", editorialOrder: 18,
    address: "Haslar Road, Gosport, PO12 1NU", telephone: "023 9260 1201", email: "haslar@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "Reception open 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Enter Portsmouth Harbour under current King's Harbour Master and QHM directions, then follow marina instructions.", tidalConstraints: "Use current harbour information for the entrance and Small Boat Channel.", lockDetails: unavailable, hazards: "Naval, commercial and ferry traffic in a controlled harbour entrance." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "Specialist motorboat handling for boats up to approximately 11 metres; confirm details directly.", dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "Gosport waterfront, Portsmouth Harbour views and the marina's well-known lightship setting.", transport: unavailable, nearbyDestinations: "Gosport, Portsmouth and the eastern Solent." },
    editorial: {
      summary: "A sheltered Gosport marina with immediate Portsmouth Harbour character and one of the Solent’s most recognisable lightships.",
      introduction: "Haslar makes a strong first impression. The green lightship and forest of masts sit inside a harbour shaped by naval history, ferries and constant movement.",
      setting: "The marina lies on the Gosport side of Portsmouth Harbour, close enough to the entrance for the wider seascape to remain present. Shelter inside does not erase the working harbour outside.",
      arrival: "Portsmouth is a controlled harbour, so current QHM directions and the Small Boat Channel procedure matter. Contact Haslar on VHF Channel 80 only after the harbour approach is properly understood.",
      berthing: "Visitor numbers and maximum dimensions are not stated in the supplied record. Reception operates 24 hours, but berth availability and fit still require direct agreement.",
      facilities: "This edition claims only the operational details supported by the supplied dataset. Water, power and shoreside amenities should be confirmed with Haslar rather than inferred.",
      marineServices: "The published specialist capability is motorboat handling for craft up to approximately 11 metres. Confirm weight, shape, timing and exact service before arrival.",
      ashore: "Gosport and the harbour waterfront provide the immediate shore interest, while the lightship gives the marina a social landmark of its own.",
      bestFor: "Portsmouth Harbour visits, crews who enjoy maritime atmosphere and suitable motorboats requiring specialist handling.",
      lessSuitableFor: "A first-time arrival made without studying current Portsmouth Harbour directions.",
      historyAndCharacter: "Naval Portsmouth dominates the historical frame, yet Haslar’s lightship and Gosport setting give the marina an identity separate from the dockyard across the water.",
      nearbyCruising: "The eastern Solent, Cowes and Southampton Water are natural onward waters, with the harbour itself deserving time and attention.",
      skippersNotes: "Harbour control and marina control are different things. Understand the entrance first, then make the marina call at the appropriate point.",
      oldSeaDogsView: "Haslar has theatre without pretending to be a stage set. The green lightship, grey naval harbour and white yachts somehow belong together.",
    },
    media: { primaryImage: "/images/guides/guides-marina-haslar-marina-editorial-v1.png", primaryImageAlt: "Illustrated view of Haslar Marina and its green lightship at sunset.", originalFilename: "guides-marina-haslar-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Haslar Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/haslar-marina", ["operator", "address", "telephone", "email", "VHF", "reception", "motorboat handling"])],
    relations: { parentGuideSlug: "portsmouth-harbour", relatedGuideSlugs: ["gosport-marina", "port-solent-marina", "portsmouth-harbour"], cruiseOnGuideSlugs: ["cowes", "southampton-water", "the-solent"], previousGuideSlug: "hythe-marina-village", nextGuideSlug: "gosport-marina" },
  },
  {
    internalId: "OSD-G019", slug: "gosport-marina", officialName: "Gosport Marina", operator: "Premier Marinas", region: "The Solent", subregion: "Portsmouth Harbour", editorialOrder: 19,
    address: "Mumby Road, Gosport, PO12 1AH", telephone: "023 9252 4811", email: "gosport@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "Reception open 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Use current Portsmouth Harbour control procedures before making the marina approach.", tidalConstraints: "Consult current harbour information and tide data.", lockDetails: unavailable, hazards: "Naval, commercial, ferry and leisure traffic." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: unavailable, dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "A central Gosport waterfront base facing Portsmouth's naval and commercial harbour.", transport: unavailable, nearbyDestinations: "Gosport, Portsmouth and the eastern Solent." },
    editorial: {
      summary: "A central Gosport marina with immediate access to Portsmouth Harbour’s naval panorama and active waterfront.",
      introduction: "Gosport Marina places the boat inside one of Britain’s most compelling harbour landscapes. Warships, ferries, historic waterfronts and small craft make every arrival feel part of a larger movement.",
      setting: "The marina sits beside urban Gosport with Portsmouth across the harbour. The view is expansive and maritime, while the shore connection is practical and immediate.",
      arrival: "Current Portsmouth Harbour directions govern the entrance. Use the prescribed small-craft route, maintain the required listening watch and contact Gosport Marina on VHF Channel 80 for the berth.",
      berthing: "The supplied record does not state berth count or dimensional limits. Reception is open 24 hours, but suitability and availability should be agreed before the final approach.",
      facilities: "No unsupported facility claim is added here. Confirm fuel, power, washrooms and other needs directly with the marina before relying on them.",
      marineServices: "The current dataset does not specify lifting or storage capacity. Owners planning work should obtain the marina’s present boatyard information and a vessel-specific booking.",
      ashore: "Gosport’s waterfront and the view towards Portsmouth give the stay a strong sense of place. Practical transport details should be checked for the dates of the visit.",
      bestFor: "Harbour enthusiasts, urban shore visits and crews wanting to be close to Portsmouth without berthing on its eastern shore.",
      lessSuitableFor: "Those seeking silence or an arrival free from harbour-control procedure.",
      historyAndCharacter: "Gosport’s story is inseparable from the Royal Navy and the harbour communities that supported it. Modern marina life occupies the same extraordinary stretch of water.",
      nearbyCruising: "Haslar is close, Port Solent lies farther inside the harbour and the eastern Solent opens immediately beyond the entrance.",
      skippersNotes: "Read the harbour instructions on the day of arrival. Familiar landmarks do not reduce the authority of current control signals and directions.",
      oldSeaDogsView: "Some marinas offer scenery; Gosport offers a working panorama. A cup of tea in the cockpit can turn into an hour of watching the harbour go by.",
    },
    media: { primaryImage: "/images/guides/guides-marina-gosport-marina-editorial-v1.png", primaryImageAlt: "Painterly aerial view of Gosport Marina and Portsmouth Harbour.", originalFilename: "guides-marina-gosport-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Gosport Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/gosport-marina", ["operator", "address", "telephone", "email", "VHF", "reception"])],
    relations: { parentGuideSlug: "portsmouth-harbour", relatedGuideSlugs: ["haslar-marina", "port-solent-marina", "portsmouth-harbour"], cruiseOnGuideSlugs: ["cowes", "southampton-water", "the-solent"], previousGuideSlug: "haslar-marina", nextGuideSlug: "port-solent-marina" },
  },
  {
    internalId: "OSD-G020", slug: "port-solent-marina", officialName: "Port Solent Marina", operator: "Premier Marinas", region: "The Solent", subregion: "Portsmouth Harbour", editorialOrder: 20,
    address: "South Port Solent, Portsmouth, PO6 4TJ", telephone: "023 9221 0765", email: "portsolent@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "Reception and lock operated 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements and lock transit should be confirmed directly.", maximumLoa: unavailable, maximumDraft: unavailable },
    arrival: { approach: "Reach Port Solent through Portsmouth Harbour and the inner channels under current harbour directions.", tidalConstraints: "Lock transit is controlled; confirm current procedures and suitability.", lockDetails: "Controlled lock operated 24 hours. Published approximate lock waypoint: 50°50′37″N, 01°06′W; use for general orientation only.", hazards: "Commercial and naval traffic, inner-harbour channels and confined lock manoeuvring." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: unavailable, dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "A large waterside leisure development with an enclosed marina-basin atmosphere.", transport: unavailable, nearbyDestinations: "Portsmouth Harbour, Portchester and the eastern Solent." },
    editorial: {
      summary: "A locked marina deep inside Portsmouth Harbour, pairing sheltered berthing with a large waterside leisure development.",
      introduction: "Port Solent is a destination reached in stages: harbour entrance, inner waters and finally the lock. The reward is a protected basin with an unusually extensive shore life around it.",
      setting: "The marina is enclosed and urban, surrounded by waterside development rather than open Solent horizons. Its atmosphere is self-contained once the lock gates are behind you.",
      arrival: "The journey begins with current Portsmouth Harbour directions and continues through the inner harbour. Call Port Solent on VHF Channel 80 for lock instructions and treat the published waypoint as orientation, never pilotage.",
      berthing: "Berth count and dimensional limits are not stated in the supplied record. The lock runs 24 hours, yet every boat still needs confirmed suitability and an allocated berth.",
      facilities: "Reception and lock operation are published around the clock. Remaining berth services must be confirmed directly rather than assumed from the marina’s large shoreside development.",
      marineServices: "No lifting or storage capability is claimed from the current dataset. Arrange any technical work using vessel-specific information from the marina.",
      ashore: "The developed waterfront gives crews a broad choice of leisure activity without travelling far. It feels very different from a village or rural river marina.",
      bestFor: "Sheltered stays, crews who appreciate an active waterside development and skippers comfortable with a controlled lock arrival.",
      lessSuitableFor: "A quick open-water stop or an unplanned arrival made without harbour and lock preparation.",
      historyAndCharacter: "Port Solent represents a modern chapter of Portsmouth Harbour, converting enclosed waterside land into a marina and leisure destination far from the historic entrance.",
      nearbyCruising: "The harbour contains Gosport, Haslar and Portsmouth’s naval landscape; beyond it, the eastern Solent leads towards Cowes and the Isle of Wight.",
      skippersNotes: "Do not confuse 24-hour operation with unrestricted entry. Obtain current lock directions and keep the boat prepared for confined manoeuvring.",
      oldSeaDogsView: "Port Solent is the long way in and the easy place to stay. The lock gives the arrival a satisfying full stop.",
    },
    media: { primaryImage: "/images/guides/guides-marina-port-solent-marina-editorial-v1.png", primaryImageAlt: "Painterly view through the lock gates at Port Solent Marina.", originalFilename: "guides-marina-port-solent-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Port Solent Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/port-solent-marina", ["operator", "address", "telephone", "email", "VHF", "reception", "lock operation", "approximate waypoint"])],
    relations: { parentGuideSlug: "portsmouth-harbour", relatedGuideSlugs: ["gosport-marina", "haslar-marina", "portsmouth-harbour"], cruiseOnGuideSlugs: ["cowes", "southampton-water", "the-solent"], previousGuideSlug: "gosport-marina", nextGuideSlug: "lymington-yacht-haven" },
  },
  {
    internalId: "OSD-G021", slug: "lymington-yacht-haven", officialName: "Lymington Yacht Haven", operator: "Yacht Havens", region: "The Solent", subregion: "Western Solent", editorialOrder: 21,
    address: "King's Saltern Road, Lymington, SO41 3QD", telephone: "01590 677071", email: unavailable, vhfChannel: "VHF Channel 80", officeHours: "Staff and security available 24 hours",
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: unavailable, maximumDraft: "Some deeper berths are published at approximately 3 metres below chart datum; berth allocation must be confirmed." },
    arrival: { approach: "Enter the Lymington River using current harbour information and account for ferry and local traffic.", tidalConstraints: "Published channel depth is approximately 2.5 metres below chart datum; verify current depths and berth suitability.", lockDetails: unavailable, hazards: "Ferry movements, river traffic and depth constraints. Published river waypoint 50°44.20′N, 01°30.28′W is for orientation only." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: "Staff and security available 24 hours", accessibility: unavailable },
    marineServices: { travelLift: "Boatyard lift published at approximately 50 tonnes; confirm current capacity and vessel fit.", dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "Lymington town, river walks and immediate western Solent cruising.", transport: unavailable, nearbyDestinations: "Lymington, Hurst, Yarmouth and the western Solent." },
    editorial: {
      summary: "A major western Solent marina close to the river entrance, with 24-hour staff, a substantial boatyard and Lymington within reach.",
      introduction: "Lymington Yacht Haven gives visiting crews a strong western Solent base without separating them from the town and river that make Lymington distinctive.",
      setting: "The marina lies low beside the salt marshes and the busy Lymington River. Ferries, racing boats and cruising yachts keep the scene in motion.",
      arrival: "Use current harbour directions, account for ferry movements and call the marina on VHF Channel 80. The published waypoint and depths are planning clues only, never a substitute for charts and present conditions.",
      berthing: "The channel is published at approximately 2.5 metres below chart datum, with some deeper berths around 3 metres below chart datum. Actual berth depth and vessel suitability must be confirmed.",
      facilities: "Staff and security are available 24 hours. Other facilities should be checked directly, particularly when seasonal opening or a specific berth service matters.",
      marineServices: "The boatyard lift is published at approximately 50 tonnes. Confirm current capacity, beam, slings, hull type and storage arrangements before booking.",
      ashore: "Lymington is a proper town as well as a sailing centre, with the river, quay and New Forest edge giving crews several reasons to stay beyond one night.",
      bestFor: "Western Solent cruising, town access and boats requiring an established full-scale marina and boatyard.",
      lessSuitableFor: "Crews who have not checked river depths or are uncomfortable sharing the approach with ferry traffic.",
      historyAndCharacter: "Lymington’s river has long served trade, ferries, salt working and sailing. The Yacht Haven is a modern part of a waterfront whose purposes have changed without becoming ornamental.",
      nearbyCruising: "Yarmouth lies across the western Solent, with Hurst, the Needles and Newtown Creek shaping wider passage choices.",
      skippersNotes: "Depth figures need chart-datum context and a current tide calculation. Secure an actual berth allocation before treating a headline depth as available water.",
      oldSeaDogsView: "Lymington Yacht Haven makes a fine base because it never quite lets you forget the western gate is nearby. Every forecast invites another look west.",
    },
    media: { primaryImage: "/images/guides/guides-marina-lymington-yacht-haven-editorial-v1.png", primaryImageAlt: "Painterly aerial view of Lymington Yacht Haven and the Lymington River.", originalFilename: "guides-marina-lymington-yacht-haven-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Lymington Yacht Haven official information", "Yacht Havens", "https://www.yachthavens.com/lymington-yacht-haven", ["operator", "address", "telephone", "VHF", "staff and security", "waypoint", "channel and berth depths", "boatyard lift"])],
    relations: { parentGuideSlug: "the-solent", relatedGuideSlugs: ["berthon-lymington-marina", "yarmouth", "the-solent"], cruiseOnGuideSlugs: ["yarmouth", "newtown-creek", "beaulieu-river"], previousGuideSlug: "port-solent-marina", nextGuideSlug: "berthon-lymington-marina" },
  },
  {
    internalId: "OSD-G022", slug: "berthon-lymington-marina", officialName: "Berthon Lymington Marina", operator: "Berthon Boat Company", region: "The Solent", subregion: "Western Solent", editorialOrder: 22,
    address: "The Shipyard, Bath Road, Lymington, SO41 3YL", telephone: "01590 673312", email: "enquiries@berthon.co.uk", vhfChannel: "VHF Channel 80", officeHours: unavailable,
    berthing: { berthCount: unavailable, visitorBerthing: "Visitor berthing is subject to availability and should be confirmed directly.", maximumLoa: "Craft over approximately 75 feet require individual confirmation", maximumDraft: "Craft drawing over approximately 3.5 metres require individual confirmation" },
    arrival: { approach: "Enter the Lymington River under current harbour directions and account for ferry and local traffic.", tidalConstraints: "Large or deep craft require individual confirmation.", lockDetails: unavailable, hazards: "Ferry movements, river traffic and dimensional constraints; craft over approximately 16 feet beam require confirmation." },
    services: { fuel: "Petrol and diesel", water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: unavailable, dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: "Berthon is a working shipyard; arrange all services directly." },
    ashore: { amenities: "A working shipyard marina close to Lymington town and the western Solent.", transport: unavailable, nearbyDestinations: "Lymington, Yarmouth, Hurst and the western Solent." },
    editorial: {
      summary: "A family-run shipyard marina where deep maritime capability sits close to Lymington town and the western Solent.",
      introduction: "Berthon is not merely a marina with a workshop attached. The shipyard identity comes first, giving the place a practical confidence that serious cruising boats and their owners quickly recognise.",
      setting: "The marina occupies the Lymington River beside an active yard. Town, ferry and working waterfront are all close, yet the Solent feels only a short river passage away.",
      arrival: "Follow current Lymington Harbour directions, watch ferry traffic and call Berthon on VHF Channel 80. Larger craft should settle dimensions and manoeuvring requirements before entering the river.",
      berthing: "Craft over about 75 feet in length, 16 feet in beam or 3.5 metres in draught require individual confirmation. Those thresholds are prompts to call, not guaranteed acceptance limits.",
      facilities: "Petrol and diesel are published. Other visitor services should be checked directly, as shipyard capability does not automatically describe every berth facility.",
      marineServices: "Berthon’s defining asset is the working shipyard and its range of skilled trades. Each project remains vessel-specific and should be scoped with the yard in advance.",
      ashore: "Lymington town is close enough to make the marina a destination rather than only a service stop. The river and quay add life beyond the yard gates.",
      bestFor: "Cruising boats, owners seeking serious technical support and crews wanting Lymington with a working-yard atmosphere.",
      lessSuitableFor: "Visitors who want a resort marina or larger craft arriving without prior dimensional agreement.",
      historyAndCharacter: "Berthon’s long boatbuilding history gives the modern marina unusual continuity. The waterfront still earns its living from boats rather than merely displaying them.",
      nearbyCruising: "Yarmouth, Hurst, the Needles and Newtown Creek frame the obvious western Solent choices, always subject to tide and conditions.",
      skippersNotes: "Give the yard honest dimensions, displacement and draft. Approximate thresholds are not a substitute for a berth and service plan agreed for the actual boat.",
      oldSeaDogsView: "Berthon smells of competence. Even a short stay reminds you that beautiful yachts survive through skilled, often unglamorous work.",
    },
    media: { primaryImage: "/images/guides/guides-marina-berthon-lymington-marina-editorial-v1.png", primaryImageAlt: "Painterly aerial view of Berthon Lymington Marina and shipyard.", originalFilename: "guides-marina-berthon-lymington-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("Berthon Lymington Marina official information", "Berthon Boat Company", "https://www.berthon.co.uk/lymington-marina/", ["operator", "address", "telephone", "email", "VHF", "fuel", "large-craft confirmation thresholds"])],
    relations: { parentGuideSlug: "the-solent", relatedGuideSlugs: ["lymington-yacht-haven", "yarmouth", "the-solent"], cruiseOnGuideSlugs: ["yarmouth", "newtown-creek", "beaulieu-river"], previousGuideSlug: "lymington-yacht-haven", nextGuideSlug: "island-harbour" },
  },
  {
    internalId: "OSD-G023", slug: "island-harbour", officialName: "Island Harbour", operator: "Island Harbour Marina (IOW) Limited", region: "The Solent", subregion: "River Medina", editorialOrder: 23,
    address: "The Control Tower, Mill Lane, Binfield, Newport, Isle of Wight, PO30 2LA", telephone: "01983 539994", email: "enquiries@island-harbour.co.uk", vhfChannel: "VHF Channel 80", officeHours: unavailable,
    berthing: { berthCount: "More than 200 berths", visitorBerthing: "Visitor berthing and lock transit should be arranged directly.", maximumLoa: unavailable, maximumDraft: "Deep-draught craft must confirm tide and lock-sill suitability directly" },
    arrival: { approach: "Proceed up the River Medina beyond Cowes using current harbour and marina information.", tidalConstraints: "Lock and sill constraints vary with tide; confirm the transit window for the vessel.", lockDetails: "Controlled lock. Obtain current operating instructions and a vessel-specific transit plan.", hazards: "River traffic, tidal access and lock-sill clearance." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: "50-tonne hoist; confirm vessel dimensions and booking directly.", dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "A secluded Medina valley setting with riverside routes towards Newport and island countryside.", transport: unavailable, nearbyDestinations: "Cowes, Newport, the River Medina and the Isle of Wight interior." },
    editorial: {
      summary: "A secluded locked marina upriver from Cowes, with more than 200 berths, a 50-tonne hoist and a genuinely different Isle of Wight mood.",
      introduction: "Island Harbour asks more commitment than a marina at the river mouth. The passage up the Medina and the controlled lock lead to a sheltered basin that feels removed from Cowes despite being on the same river.",
      setting: "The marina lies in a green valley near Binfield, with countryside and waterside development replacing the regatta energy of lower Medina. The sense of enclosure is part of its charm.",
      arrival: "Navigate the River Medina using current Cowes Harbour and marina information, then call Island Harbour on VHF Channel 80. Lock timing and sill clearance must be agreed for the actual vessel and tide.",
      berthing: "More than 200 berths are published. Deep-draught craft need specific confirmation because the limiting question is not only berth depth but safe passage over the lock sill.",
      facilities: "This edition avoids claiming services not supplied in the verified dataset. Confirm berth utilities, washrooms and other needs directly before undertaking the upriver passage.",
      marineServices: "A 50-tonne hoist gives the marina significant handling capability. Booking still depends on dimensions, hull form, access and the work planned.",
      ashore: "The valley setting, riverside routes and access towards Newport make the shore experience quieter and more rural than lower Cowes.",
      bestFor: "Crews seeking shelter, a longer Medina exploration and an Isle of Wight base away from the busiest harbour frontage.",
      lessSuitableFor: "A spontaneous deep-draught arrival or crews unwilling to plan a controlled lock transit.",
      historyAndCharacter: "The site developed around a former tidal mill landscape, and the enclosed water still gives Island Harbour a character unlike the open marinas of the Solent shore.",
      nearbyCruising: "Cowes lies back downriver, while the central Solent opens towards the Hamble, Beaulieu and Portsmouth once clear of the Medina.",
      skippersNotes: "Get the current lock information from the marina, state the boat’s true draft and allow a margin. A memorable destination is not improved by scraping the plan too fine.",
      oldSeaDogsView: "Island Harbour feels like finding a room behind the bookcase. The journey in is part of the pleasure, provided the lock homework is done.",
    },
    media: { primaryImage: "/images/guides/guides-marina-island-harbour-hero-v1.png", primaryImageAlt: "Watercolour-style view into Island Harbour Marina on the River Medina.", originalFilename: "guides-marina-island-harbour-hero-v1.png", supportingImages: [{ url: "/images/guides/guides-marina-island-harbour-spice-bus-v1.png", alt: "Illustrated Spice Bus beside Island Harbour Marina.", originalFilename: "guides-marina-island-harbour-spice-bus-v1.png" }] },
    sources: [officialSource("Island Harbour Marina official information", "Island Harbour Marina (IOW) Limited", "https://www.island-harbour.co.uk/", ["operator", "address", "telephone", "email", "VHF", "berths", "controlled lock", "hoist", "draft caution"])],
    relations: { parentGuideSlug: "cowes", relatedGuideSlugs: ["east-cowes-marina", "cowes", "the-solent"], cruiseOnGuideSlugs: ["cowes", "newtown-creek", "portsmouth-harbour"], previousGuideSlug: "berthon-lymington-marina", nextGuideSlug: "east-cowes-marina" },
  },
  {
    internalId: "OSD-G024", slug: "east-cowes-marina", officialName: "East Cowes Marina", operator: "Premier Marinas", region: "The Solent", subregion: "River Medina", editorialOrder: 24,
    address: "Britannia Way, East Cowes, Isle of Wight, PO32 6UB", telephone: "01983 293983", email: "eastcowes@premiermarinas.com", vhfChannel: "VHF Channel 80", officeHours: "08:00-20:00 April-September; 08:00-17:00 October-March",
    berthing: { berthCount: "More than 300 berths", visitorBerthing: "Visitor arrangements should be confirmed directly.", maximumLoa: "Approximately 30 metres", maximumDraft: "Approximately 3 metres" },
    arrival: { approach: "Enter Cowes Harbour and continue into the River Medina under current harbour directions.", tidalConstraints: "Confirm berth depth and suitability for the actual vessel.", lockDetails: unavailable, hazards: "Ferries, chain ferry operations, commercial movements and concentrated leisure traffic." },
    services: { fuel: unavailable, water: unavailable, electricity: unavailable, toiletsAndShowers: unavailable, laundry: unavailable, wifi: unavailable, pumpOut: unavailable, parking: unavailable, security: unavailable, accessibility: unavailable },
    marineServices: { travelLift: unavailable, dryStack: unavailable, storageAshore: unavailable, repairAndMaintenance: unavailable },
    ashore: { amenities: "East Cowes waterfront, Cowes connections and central Solent access.", transport: unavailable, nearbyDestinations: "East Cowes, Cowes, the River Medina and the central Solent." },
    editorial: {
      summary: "A substantial River Medina marina on the East Cowes shore, well placed for central Solent cruising and the island’s maritime life.",
      introduction: "East Cowes Marina offers a calmer base inside the Medina while keeping Cowes and the central Solent close. The position works equally well as a destination and as a practical turning point in a wider cruise.",
      setting: "The marina sits within the working and residential landscape of East Cowes. River traffic remains visible, with the harbour entrance and Cowes activity a short distance away.",
      arrival: "Follow current Cowes Harbour directions, account for ferries and the chain ferry, then contact East Cowes Marina on VHF Channel 80. Avoid allowing the apparent shelter upriver to reduce the lookout.",
      berthing: "The marina publishes more than 300 berths, with maximum length around 30 metres and maximum draft around 3 metres. Both figures remain subject to actual berth allocation and confirmation.",
      facilities: "Seasonal reception hours are published. Other services should be confirmed directly, especially for larger or deeper vessels and visits during major Solent events.",
      marineServices: "The supplied dataset does not state lifting or storage capacity. Obtain current service information before adding technical work to the visit.",
      ashore: "East Cowes has its own waterfront identity, with access to Cowes and the island beyond. Current ferry and local transport details are worth checking in advance.",
      bestFor: "Central Solent cruising, Cowes visits and crews who prefer an upriver marina on the East Cowes shore.",
      lessSuitableFor: "Unbooked arrivals during major events or deeper and larger craft without a confirmed berth.",
      historyAndCharacter: "East Cowes has a rich tradition of shipbuilding and royal maritime connections. The modern marina sits within a river still defined by movement, industry and sailing.",
      nearbyCruising: "The Medina leads straight to the central Solent, with the River Hamble, Beaulieu River, Portsmouth and western island harbours all within the wider cruising pattern.",
      skippersNotes: "Event demand changes Cowes quickly. Book early, verify reception arrangements and read the current harbour notices before leaving the Solent approach to memory.",
      oldSeaDogsView: "East Cowes is often treated as the other side of the river. Stay awhile and it becomes a capable base with a character entirely its own.",
    },
    media: { primaryImage: "/images/guides/guides-marina-east-cowes-marina-editorial-v1.png", primaryImageAlt: "Painterly aerial view of East Cowes Marina and the River Medina.", originalFilename: "guides-marina-east-cowes-marina-editorial-v1.png", supportingImages: [] },
    sources: [officialSource("East Cowes Marina official information", "Premier Marinas", "https://www.premiermarinas.com/marinas/east-cowes-marina", ["operator", "address", "telephone", "email", "VHF", "reception hours", "berths", "maximum LOA", "maximum draft"])],
    relations: { parentGuideSlug: "cowes", relatedGuideSlugs: ["island-harbour", "cowes", "the-solent"], cruiseOnGuideSlugs: ["cowes", "portsmouth-harbour", "river-hamble"], previousGuideSlug: "island-harbour", nextGuideSlug: "" },
  },
];

export const solentMarinaGuideGroups = [
  { label: "River Hamble", slugs: ["port-hamble-marina", "mercury-yacht-harbour", "universal-marina", "swanwick-marina", "deacons-marina"] },
  { label: "Southampton Water", slugs: ["ocean-village-marina", "hythe-marina-village"] },
  { label: "Portsmouth Harbour", slugs: ["haslar-marina", "gosport-marina", "port-solent-marina"] },
  { label: "Western Solent", slugs: ["lymington-yacht-haven", "berthon-lymington-marina"] },
  { label: "Isle of Wight", slugs: ["island-harbour", "east-cowes-marina"] },
] as const;

function listSection(heading: string, body: string, listItems: string[] = []): GuideSection {
  return {
    heading,
    anchor: heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    kind: heading === "Old Sea Dogs View" || heading === "Skipper’s Notes" ? "callout" : "prose",
    body: [body],
    listItems,
  };
}

type GuideFact = { label: string; value: string };

type WaterwayProfile = {
  localWaterway: string;
  facts: GuideFact[];
  source: MarinaSourceNote;
};

const waterwayProfiles: Record<string, WaterwayProfile> = {
  "River Hamble": {
    localWaterway: "River Hamble",
    facts: [
      { label: "Harbour Authority", value: "River Hamble Harbour Authority" },
      { label: "Harbour Office", value: "Harbour Master's Office, Shore Road, Warsash, SO31 9FR" },
      { label: "Harbour Speed Limit", value: "6 knots north of No. 1 mark" },
      { label: "Wash", value: "Avoid excessive wash throughout the river" },
      { label: "Harbour VHF", value: "Channel 68 — Hamble Harbour Radio" },
      { label: "Main Entrance", value: "From Southampton Water via No. 1 mark and the buoyed channel" },
      { label: "Tide Restrictions", value: "Entry at all states of tide for vessels drawing 2.5 metres or less" },
      { label: "Navigation Notes", value: "Vessels over 20 metres must obtain approval on Channel 68 before entering" },
    ],
    source: officialSource(
      "River Hamble Harbour Authority navigation guidance",
      "River Hamble Harbour Authority",
      "https://www.hants.gov.uk/thingstodo/hambleharbour/using-the-river/navigation",
      ["harbour authority", "harbour office", "speed limit", "wash", "Harbour VHF", "entrance", "tide restrictions", "navigation notes"],
    ),
  },
  "Southampton Water": {
    localWaterway: "Southampton Water",
    facts: [
      { label: "Harbour Authority", value: "Associated British Ports Southampton" },
      { label: "Harbour Speed Limit", value: "6 knots north of the Hythe Pier–Weston Shelf line" },
      { label: "Wash", value: "Reduce speed and wash when passing marinas and jetties" },
      { label: "Harbour VHF", value: "Channel 12 — Southampton VTS" },
      { label: "Navigation Notes", value: "Keep clear of commercial channels where possible and cross at right angles without impeding shipping" },
    ],
    source: officialSource(
      "ABP Southampton Marine Leisure Guide",
      "Associated British Ports Southampton",
      "https://www.southamptonvts.co.uk/yachting_leisure/marine_leisure_guide/",
      ["harbour authority", "speed limit", "wash", "VTS VHF", "navigation notes"],
    ),
  },
  "Portsmouth Harbour": {
    localWaterway: "Portsmouth Harbour",
    facts: [
      { label: "Harbour Authority", value: "King's Harbour Master Portsmouth" },
      { label: "Harbour Office", value: "Semaphore Tower, HM Naval Base, Portsmouth, PO1 3LT" },
      { label: "Harbour Speed Limit", value: "10 knots through the water" },
      { label: "Wash", value: "No wash" },
      { label: "Harbour VHF", value: "Channel 11 — Portsmouth VTS" },
      { label: "Main Entrance", value: "Small Boat Channel for vessels under 20 metres" },
      { label: "Navigation Notes", value: "Keep to the Small Boat Channel rules and allow for strong cross-currents at the harbour mouth" },
    ],
    source: officialSource(
      "King's Harbour Master Portsmouth small-craft guidance",
      "King's Harbour Master Portsmouth",
      "https://www.royalnavy.mod.uk/khm/portsmouth/safety-and-regulations/regulations/entering-the-harbour",
      ["harbour authority", "harbour office", "speed limit", "wash", "Harbour VHF", "entrance", "navigation notes"],
    ),
  },
  "Western Solent": {
    localWaterway: "Lymington River",
    facts: [
      { label: "Harbour Authority", value: "Lymington Harbour Commissioners" },
      { label: "Harbour Office", value: "Bath Road, Lymington, Hampshire, SO41 3SE · 01590 672014" },
      { label: "Harbour Speed Limit", value: "6 knots through the water" },
      { label: "Wash", value: "Keep wash to a minimum" },
      { label: "Harbour VHF", value: "Channel 66 — Lymington Harbour" },
      { label: "Tide Restrictions", value: "Entry by day or night at all states of tide for vessels drawing up to about 2.5 metres" },
      { label: "Navigation Notes", value: "An advisory 4-knot limit applies above the inner-harbour wave screens" },
    ],
    source: officialSource(
      "Lymington Harbour navigation guidance",
      "Lymington Harbour Commissioners",
      "https://lymingtonharbour.co.uk/safety-navigation/navigating-the-harbour/",
      ["harbour authority", "harbour office", "speed limit", "wash", "Harbour VHF", "tide restrictions", "navigation notes"],
    ),
  },
  "River Medina": {
    localWaterway: "River Medina",
    facts: [
      { label: "Harbour Authority", value: "Cowes Harbour Commission" },
      { label: "Harbour Office", value: "Town Quay, Cowes, Isle of Wight, PO31 7AS · 01983 293952" },
      { label: "Harbour Speed Limit", value: "6 knots through the water" },
      { label: "Wash", value: "No wash in the Inner Harbour" },
      { label: "Harbour VHF", value: "Channel 69 — Cowes Harbour Radio" },
      { label: "Main Entrance", value: "Between green No. 1 and red No. 2 fairway buoys" },
      { label: "Alternative Entrance", value: "Eastern Channel for suitable vessels up to 20 metres" },
      { label: "Chain Ferry", value: "Has right of way over river traffic" },
    ],
    source: officialSource(
      "Cowes Harbour navigation guidance",
      "Cowes Harbour Commission",
      "https://www.cowes.co.uk/safety-navigation/navigation/",
      ["harbour authority", "harbour office", "speed limit", "wash", "Harbour VHF", "entrances", "chain ferry"],
    ),
  },
};

function phaseOneFacts(record: SolentMarinaGuideRecord): GuideFact[] {
  const profile = waterwayProfiles[record.subregion];
  const facts: GuideFact[] = [
    { label: "Guide Type", value: "Marina Guide" },
    { label: "Region", value: record.region },
    { label: "Local Waterway", value: profile.localWaterway },
    { label: "Country", value: "England, United Kingdom" },
    { label: "Operator", value: record.operator },
    { label: "Marina Address", value: record.address },
    ...profile.facts,
    { label: "Telephone", value: record.telephone },
  ];

  if (record.email) facts.push({ label: "Email", value: record.email });
  if (record.officeHours) facts.push({ label: "Reception Hours", value: record.officeHours });
  if (record.berthing.berthCount) facts.push({ label: "Berths", value: record.berthing.berthCount });
  if (record.berthing.maximumLoa) facts.push({ label: "Maximum LOA", value: record.berthing.maximumLoa });
  if (record.berthing.maximumDraft) facts.push({ label: "Maximum Draft", value: record.berthing.maximumDraft });

  if (record.vhfChannel) {
    facts.push({ label: "Marina Arrival VHF", value: record.vhfChannel.replace(/^VHF\s+/i, "") });
  }
  if (record.services.fuel) {
    facts.push({ label: "Fuel", value: record.services.fuel });
  }
  if (record.arrival.lockDetails) {
    facts.push({ label: "Lock Information", value: record.arrival.lockDetails });
  }
  if (record.slug === "island-harbour") {
    facts.push({ label: "Tide Restrictions", value: "Lock and sill constraints vary with tide; confirm the vessel-specific transit window" });
  }

  return facts;
}

function guideSources(record: SolentMarinaGuideRecord) {
  return [...record.sources, waterwayProfiles[record.subregion].source];
}

function toGuideSeed(record: SolentMarinaGuideRecord): FlagshipGuide {
  const sources = guideSources(record);
  const sourceTitles = sources.map((source) => source.title);
  return {
    internalId: record.internalId,
    slug: record.slug,
    title: record.officialName,
    eyebrow: "Old Sea Dogs Marina Guide",
    summary: record.editorial.summary,
    introduction: record.editorial.introduction,
    guideType: "Marina",
    regionKey: "solent",
    regionName: record.region,
    subregion: record.subregion,
    parentGuideSlug: record.relations.parentGuideSlug,
    editorialOrder: record.editorialOrder,
    author: "Michael Hodges",
    contributorCredits: [],
    updatedAt: verifiedOn,
    imageUrl: record.media.primaryImage,
    imageAlt: record.media.primaryImageAlt,
    imageFocalPoint: "50% 50%",
    imageCaption: `${record.officialName}, illustrated for Old Sea Dogs Guides.`,
    imageCredit: "",
    artworkCredit: "Artwork supplied by Old Sea Dogs",
    quickFacts: phaseOneFacts(record),
    sections: [
      listSection("Setting & Character", record.editorial.setting),
      listSection("Arrival by Sea", record.editorial.arrival),
      listSection("Berthing Experience", record.editorial.berthing),
      listSection("Facilities Afloat", record.editorial.facilities),
      listSection("Marine Services", record.editorial.marineServices),
      listSection("Ashore", record.editorial.ashore),
      listSection("Best For", record.editorial.bestFor),
      listSection("Less Suitable For", record.editorial.lessSuitableFor),
      listSection("History & Local Character", record.editorial.historyAndCharacter),
      listSection("Nearby Cruising", record.editorial.nearbyCruising),
      listSection("Skipper’s Notes", record.editorial.skippersNotes),
      listSection("Old Sea Dogs View", record.editorial.oldSeaDogsView),
      listSection("Information checked against official sources", "The practical information in this Guide was checked against the official source record below on 6 August 2026. Operational details can change.", sourceTitles),
    ],
    checklist: [
      "Confirm the berth, vessel dimensions and arrival instructions directly with the marina.",
      "Use current charts, almanacs, forecasts, tides, Notices to Mariners and harbour-master directions.",
      "Treat every map, waypoint and depth in this Guide as general orientation, never navigation.",
      "Recheck fuel, lock, lifting and seasonal service availability before departure.",
    ],
    sourceLinks: sources.map((source) => ({ label: source.title, href: source.url })),
    verifiedFacilities: [],
    facilityVerificationNotes: "Phase Two uses the Phase One information-card pattern. Unsupported facility fields are omitted from public presentation.",
    location: {},
    relatedGuideSlugs: record.relations.relatedGuideSlugs,
    cruiseOnGuideSlugs: record.relations.cruiseOnGuideSlugs,
    previousGuideSlug: record.relations.previousGuideSlug,
    nextGuideSlug: record.relations.nextGuideSlug,
    seoTitle: `${record.officialName} Guide | Old Sea Dogs`,
    seoDescription: record.editorial.summary,
    socialTitle: `${record.officialName} — Old Sea Dogs Guides`,
    socialDescription: record.editorial.summary,
    canonicalPath: `/guides/solent/${record.slug}`,
    editorialNotes: "Phase Two static marina record. Preserve the structured source data when editing public copy.",
    researchNotes: sources.map((source) => `${source.title} (${source.url}) checked ${source.verifiedOn}: ${source.supportedFields.join(", ")}.`).join("\n"),
    reviewDue: "2027-08-06",
    accuracyConcerns: "Operational information may change; navigation, availability and vessel suitability always require direct confirmation.",
    sourceNotes: JSON.stringify(sources),
    draftComments: "",
  };
}

export const solentMarinaGuideSeeds: FlagshipGuide[] = solentMarinaGuideRecords.map(toGuideSeed);

export const solentMarinaGuideBySlug = new Map(solentMarinaGuideRecords.map((record) => [record.slug, record]));
