import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { GUIDE_TYPES } from "../content/flagship-guides.ts";
import { guideSectionImagesFor } from "../content/guide-image-placements.ts";
import { guideProductSeeds } from "../content/guide-product-seeds.ts";
import { validateGuideInput } from "../lib/guide-validation.ts";
import { guideProductRecords } from "../lib/guides.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

function wordCount(guide) {
  return [
    guide.summary,
    guide.introduction,
    ...guide.sections.flatMap((section) => [section.heading, ...section.body]),
    ...guide.checklist,
  ].join(" ").split(/\s+/).filter(Boolean).length;
}

test("the local Guide fixture contains the nine linked first-edition records in editorial order", () => {
  assert.deepEqual(
    guideProductSeeds.map((guide) => [guide.internalId, guide.slug, guide.editorialOrder]),
    [
      ["OSD-G001", "the-solent", 1],
      ["OSD-G002", "river-hamble", 2],
      ["OSD-G004", "hamble-point-marina", 3],
      ["OSD-G003", "cowes", 4],
      ["OSD-G005", "newtown-creek", 5],
      ["OSD-G006", "yarmouth", 6],
      ["OSD-G007", "portsmouth-harbour", 7],
      ["OSD-G008", "southampton-water", 8],
      ["OSD-G009", "beaulieu-river", 9],
    ],
  );
  const slugs = new Set(guideProductSeeds.map((guide) => guide.slug));
  for (const guide of guideProductSeeds) {
    assert.ok(GUIDE_TYPES.includes(guide.guideType));
    for (const related of [
      ...guide.relatedGuideSlugs,
      ...guide.cruiseOnGuideSlugs,
      guide.previousGuideSlug,
      guide.nextGuideSlug,
    ].filter(Boolean)) {
      assert.ok(slugs.has(related), `${guide.slug} has broken relationship ${related}`);
    }
    for (const link of guide.sections.flatMap((section) => section.links || [])) {
      assert.ok(slugs.has(link.guideSlug), `${guide.slug} has broken section link ${link.guideSlug}`);
    }
  }
});

test("The Solent fixture provides the complete first-edition manuscript and section structure", () => {
  const guide = guideProductSeeds[0];
  assert.ok(wordCount(guide) >= 4000);
  assert.ok(wordCount(guide) <= 5000);
  assert.deepEqual(guide.sections.map((section) => section.heading), [
    "Why the Solent Matters",
    "Understanding the Solent",
    "The Western Solent",
    "The Central Solent",
    "The Eastern Solent",
    "Rivers and Creeks",
    "Harbours and Marinas",
    "Anchorages",
    "Pilotage and Seamanship",
    "Sailing and Racing Heritage",
    "Maritime History",
    "Wildlife and Landscape",
    "Suggested Cruises",
    "Skipper’s Notes",
    "Old Sea Dogs View",
  ]);
  assert.equal(guide.canonicalPath, "/guides/solent/the-solent");
  assert.equal(guide.seoTitle, "The Solent Cruising Guide | Old Sea Dogs");
  assert.match(guide.seoDescription, /harbours, rivers, anchorages/);
});

test("Newtown Creek is structured as an Anchorage Guide with responsible access and conservation", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "newtown-creek");
  assert.equal(guide.title, "Newtown Creek Guide");
  assert.equal(guide.guideType, "Anchorage");
  assert.equal(guide.subregion, "Newtown Creek");
  assert.equal(guide.imageUrl, "/images/guides/guides-newtown-creek-hero-v1.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "Anchorage Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Management")?.value, "National Trust");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Visitor moorings")?.value, "Available");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Anchoring")?.value, "Permitted in designated areas");
  for (const heading of [
    "Arrival from the Solent",
    "Entrance & Navigation",
    "Anchoring",
    "Visitor Moorings",
    "Landing Ashore",
    "Wildlife & Conservation",
    "Walking",
    "Nearby Cruising",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing Newtown Creek section ${heading}`);
  }
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /Visitor moorings are available on a first-come basis/);
  assert.match(publicCopy, /Respect environmentally sensitive seabed/);
  assert.match(publicCopy, /National Trust footpaths/);
  assert.match(publicCopy, /Protected habitats/);
  assert.match(publicCopy, /Portsmouth Harbour/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
});

test("Southampton Water is structured as an Estuary and Commercial Waterway Guide", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "southampton-water");
  assert.equal(guide.title, "Southampton Water Guide");
  assert.equal(guide.guideType, "Cruising Area");
  assert.equal(guide.subregion, "Southampton Water");
  assert.equal(guide.imageUrl, "/images/guides/guides-southampton-water-hero.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "Estuary & Commercial Waterway Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Port authority")?.value, "Associated British Ports");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "VTS")?.value, "Channel 12");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Call sign")?.value, "Southampton VTS");
  for (const heading of [
    "Arrival from the Solent",
    "Southampton VTS",
    "Commercial Shipping",
    "Navigation",
    "Tides & Currents",
    "Marinas & Visitor Berthing",
    "Fuel",
    "Marine Services",
    "Cruise & Commercial Terminals",
    "Nearby Cruising",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing Southampton Water section ${heading}`);
  }
  const marinaSection = guide.sections.find((item) => item.heading === "Marinas & Visitor Berthing");
  assert.deepEqual(marinaSection?.links?.map((link) => link.guideSlug), ["hamble-point-marina", "river-hamble"]);
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  for (const marina of [
    "Hamble Point Marina",
    "Port Hamble Marina",
    "Mercury Yacht Harbour",
    "Universal Marina",
    "Ocean Village Marina",
    "Town Quay Marina",
    "Hythe Marina Village",
    "Swanwick Marina",
  ]) assert.match(publicCopy, new RegExp(marina));
  assert.match(publicCopy, /Large commercial vessels have priority/);
  assert.match(publicCopy, /Southampton Cruise Terminals/);
  assert.match(publicCopy, /Diesel and petrol are available at several marinas/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
});

test("River Hamble is structured as the parent River Guide with navigation, berthing and services", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "river-hamble");
  assert.equal(guide.title, "River Hamble Guide");
  assert.equal(guide.guideType, "River");
  assert.equal(guide.subregion, "River Hamble");
  assert.equal(guide.imageUrl, "/images/guides/guides-river-hamble-hero-v1.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "River Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour authority")?.value, "River Hamble Harbour Authority");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour VHF")?.value, "Channel 68");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Speed limit")?.value, "6 knots north of No.1 buoy");
  for (const heading of [
    "Arrival from Southampton Water",
    "Navigation",
    "Speed Limits",
    "Tidal Information",
    "Principal Marinas",
    "Visitor Berthing",
    "Fuel",
    "Walking the River",
    "Nearby Cruising",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing River Hamble section ${heading}`);
  }
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /Hamble Point Marina/);
  assert.match(publicCopy, /Port Hamble Marina/);
  assert.match(publicCopy, /Mercury Yacht Harbour/);
  assert.match(publicCopy, /Universal Marina/);
  assert.match(publicCopy, /Swanwick Marina/);
  assert.match(publicCopy, /Deacons Marina/);
  assert.match(publicCopy, /Warsash Harbour Moorings/);
  assert.match(publicCopy, /Hamble Common/);
  assert.match(publicCopy, /Pink Ferry/);
  assert.match(publicCopy, /Portsmouth Harbour/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
  assert.deepEqual(guideSectionImagesFor("river-hamble", "Walking the River").map((image) => image.url), [
    "/images/guides/guides-river-hamble-jolly-sailor-v1.png",
  ]);
});

test("Beaulieu River is structured as a River Guide with moorings, facilities and conservation", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "beaulieu-river");
  assert.equal(guide.title, "Beaulieu River Guide");
  assert.equal(guide.guideType, "River");
  assert.equal(guide.subregion, "Beaulieu River");
  assert.equal(guide.imageUrl, "/images/guides/guides-beaulieu-river-hero.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "River Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "River authority")?.value, "Beaulieu Estate");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour VHF")?.value, "Channel 68");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Visitor moorings")?.value, "Available");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Fuel")?.value, "Available at Buckler's Hard");
  for (const heading of [
    "Arrival from the Solent",
    "Navigation",
    "Tides and River Conditions",
    "Visitor Moorings",
    "Buckler's Hard",
    "Facilities",
    "Wildlife & Conservation",
    "Walking Ashore",
    "Nearby Cruising",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing Beaulieu River section ${heading}`);
  }
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /Visitor moorings are provided by the Beaulieu Estate/);
  assert.match(publicCopy, /Diesel is available at Buckler's Hard Yacht Harbour/);
  assert.match(publicCopy, /National Nature Reserve/);
  assert.match(publicCopy, /Protected habitats/);
  assert.match(publicCopy, /Portsmouth Harbour/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
});

test("Hamble Point establishes a sourced Marina Guide format without invented location data", () => {
  const guide = guideProductSeeds.find((item) => item.internalId === "OSD-G004");
  assert.equal(guide.slug, "hamble-point-marina");
  assert.equal(guide.guideType, "Marina");
  assert.equal(guide.subregion, "River Hamble");
  assert.ok(wordCount(guide) >= 1500);
  assert.ok(wordCount(guide) <= 2500);
  assert.deepEqual(guide.sections.map((item) => item.heading), [
    "Overview",
    "Arrival by Sea",
    "Berthing Experience",
    "Facilities",
    "Marine Services",
    "Ashore",
    "Nearby Cruising",
    "History and Character",
    "Skipper’s Notes",
    "Old Sea Dogs View",
  ]);
  assert.equal(guide.location.latitude, undefined);
  assert.equal(guide.location.longitude, undefined);
  assert.ok(guide.verifiedFacilities.length >= 8);
  for (const facility of guide.verifiedFacilities) {
    assert.match(facility.sourceUrl, /^https:\/\/www\.mdlmarinas\.co\.uk\//);
    assert.equal(facility.verifiedOn, "2026-07-30");
  }
  assert.match(guide.facilityVerificationNotes, /shore power.*berth water.*coordinate/is);
  assert.match(guide.verifiedFacilities.map((item) => item.detail).join(" "), /nearby Port Hamble, not listed as on site/);
});

test("Cowes is structured as a harbour destination with distinct berthing providers", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "cowes");
  assert.equal(guide.title, "Cowes Harbour Guide");
  assert.equal(guide.guideType, "Harbour");
  assert.equal(guide.subregion, "River Medina");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "Harbour and marina destination");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour VHF")?.value, "Channel 69 — Cowes Harbour Radio / HM1");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Marina-arrival VHF")?.value, "Channel 80");
  for (const heading of [
    "Cowes Yacht Haven",
    "Shepards Marina",
    "East Cowes Marina",
    "Harbour Moorings and Trinity Landing",
    "Fuel, Water, Electricity and Pump-out",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing Cowes section ${heading}`);
  }
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /6 knots through the water/i);
  assert.match(publicCopy, /Chain Ferry lies on a blind bend and has right of way/i);
  assert.match(publicCopy, /Cowes Harbour Fuel Berth/);
  assert.match(publicCopy, /Lallows/);
  assert.match(publicCopy, /holding-tank pump-out facility is available at Shepards Marina/i);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it/i);
});

test("Yarmouth is structured as a Harbour Guide with visitor berthing and facilities", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "yarmouth");
  assert.equal(guide.title, "Yarmouth Harbour Guide");
  assert.equal(guide.guideType, "Harbour");
  assert.equal(guide.subregion, "Western Solent");
  assert.equal(guide.imageUrl, "/images/guides/guides-yarmouth-marina-entrance-v1.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "Harbour & Visitor Berthing Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour VHF")?.value, "Channel 68");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Water Taxi")?.value, "Channel 15");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Visitor Berths")?.value, "150+");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Visitor Moorings")?.value, "35");
  const oldSeaDogsView = guide.sections.find((item) => item.heading === "Old Sea Dogs View");
  assert.deepEqual(oldSeaDogsView?.body, [
    "Yarmouth is a natural western waypoint but should not be reduced to one. Give the harbour and town time, then shape the next leg around the water at Hurst rather than a timetable. It is an excellent place from which to decide whether the day belongs inside the Solent or beyond it.",
  ]);
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /Yarmouth Harbour Commissioners/);
  assert.match(publicCopy, /More than 150 visitor berths/);
  assert.match(publicCopy, /35 visitor moorings/);
  assert.match(publicCopy, /harbour fuel berth/);
  assert.match(publicCopy, /free sewage pump-out/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it/i);
});

test("Portsmouth is structured as a Harbour Guide with controlled navigation and distinct visitor marinas", () => {
  const guide = guideProductSeeds.find((item) => item.slug === "portsmouth-harbour");
  assert.equal(guide.title, "Portsmouth Harbour Guide");
  assert.equal(guide.guideType, "Harbour");
  assert.equal(guide.subregion, "Portsmouth Harbour");
  assert.equal(guide.imageUrl, "/images/guides/guides-portsmouth-harbour-hero-v1.png");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Guide type")?.value, "Harbour Guide");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Harbour VHF")?.value, "Channel 11");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Secondary VHF")?.value, "Channel 13");
  assert.equal(guide.quickFacts.find((fact) => fact.label === "Call sign")?.value, "Portsmouth VTS");
  for (const heading of [
    "Small Boat Channel",
    "Gunwharf Quays Marina",
    "Haslar Marina",
    "Gosport Marina",
    "Port Solent",
    "Fuel",
    "Information checked against official sources",
  ]) {
    assert.ok(guide.sections.some((item) => item.heading === heading), `missing Portsmouth section ${heading}`);
  }
  const publicCopy = JSON.stringify({
    title: guide.title,
    summary: guide.summary,
    introduction: guide.introduction,
    quickFacts: guide.quickFacts,
    sections: guide.sections,
  });
  assert.match(publicCopy, /Small Boat Channel/);
  assert.match(publicCopy, /obtain permission from Portsmouth VTS on VHF Channel 11/);
  assert.match(publicCopy, /Diesel and petrol are available at Port Solent Marina and Gosport Marina/);
  assert.match(publicCopy, /King's Harbour Master Portsmouth/);
  assert.doesNotMatch(publicCopy, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
});

test("the flagship Guide library excludes legacy records without breaking their URLs", () => {
  const legacy = {
    ...guideProductSeeds[0],
    internalId: "",
    slug: "solent-marina-guide",
    canonicalPath: "/guides/solent-marina-guide",
  };
  assert.deepEqual(
    guideProductRecords([legacy, ...guideProductSeeds]).map((guide) => guide.slug),
    guideProductSeeds.map((guide) => guide.slug),
  );
});

test("the draft Guide artwork manifest resolves to distinct local assets", async () => {
  const heroBySlug = new Map(guideProductSeeds.map((guide) => [guide.slug, guide.imageUrl]));
  assert.equal(heroBySlug.get("the-solent"), "/images/guides/guides-solent-needles-hero-v1.png");
  assert.equal(heroBySlug.get("river-hamble"), "/images/guides/guides-river-hamble-hero-v1.png");
  assert.equal(heroBySlug.get("hamble-point-marina"), "/images/guides/guides-marina-hamble-point-hero-v1.png");
  assert.equal(heroBySlug.get("cowes"), "/images/guides/guides-harbour-cowes-hero-v1.png");
  assert.equal(heroBySlug.get("newtown-creek"), "/images/guides/guides-newtown-creek-hero-v1.png");
  assert.equal(heroBySlug.get("yarmouth"), "/images/guides/guides-yarmouth-marina-entrance-v1.png");
  assert.equal(heroBySlug.get("portsmouth-harbour"), "/images/guides/guides-portsmouth-harbour-hero-v1.png");
  assert.equal(heroBySlug.get("southampton-water"), "/images/guides/guides-southampton-water-hero.png");
  assert.equal(heroBySlug.get("beaulieu-river"), "/images/guides/guides-beaulieu-river-hero.png");

  const supportingImages = [
    ...guideSectionImagesFor("cowes", "Arrival by Sea"),
    ...guideSectionImagesFor("cowes", "Best For"),
    ...guideSectionImagesFor("cowes", "Old Sea Dogs View"),
    ...guideSectionImagesFor("river-hamble", "Walking the River"),
  ];
  assert.equal(new Set(supportingImages.map((image) => image.url)).size, supportingImages.length);

  const landing = await fs.readFile(path.join(projectDir, "app/guides/page.tsx"), "utf8");
  const usedPaths = [
    ...[
      "the-solent",
      "river-hamble",
      "hamble-point-marina",
      "cowes",
      "newtown-creek",
      "yarmouth",
      "portsmouth-harbour",
      "southampton-water",
      "beaulieu-river",
    ].map((slug) => heroBySlug.get(slug)),
    ...supportingImages.map((image) => image.url),
  ];
  assert.doesNotMatch(landing, /guide-library-hero-image|guides-homepage-hero-the-solent\.png/);
  assert.equal(new Set(usedPaths).size, usedPaths.length);
  for (const publicPath of usedPaths) {
    await fs.access(path.join(projectDir, "public", publicPath.replace(/^\//, "")));
  }
});

test("the homepage and Guide pages use the compact practical presentation", async () => {
  const [homepage, publicGuide, css] = await Promise.all([
    fs.readFile(path.join(projectDir, "app/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "components/GuidePublicContent.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/globals.css"), "utf8"),
  ]);
  assert.match(homepage, /Discover Old Sea Dogs Guides/);
  assert.match(homepage, /homepage-guides-promo/);
  assert.match(homepage, /homepage-guides-list/);
  assert.match(homepage, /const featuredSlugs = \["the-solent", "river-hamble", "hamble-point-marina"\]/);
  assert.match(homepage, /Explore All Guides/);
  assert.match(homepage, /guidePublicPath\(guide\)/);
  assert.doesNotMatch(homepage, /Useful pages for real days afloat|flagship-guides-band/);
  assert.match(publicGuide, /Practical information/);
  assert.match(publicGuide, /VHF channel/);
  assert.match(publicGuide, /Depths and draught/);
  assert.match(publicGuide, /HamblePointPracticalReference/);
  assert.match(publicGuide, /Hamble Point Marina[\s\S]*VHF Channel 80/);
  assert.match(publicGuide, /Hamble Harbour Radio[\s\S]*VHF Channel 68/);
  assert.match(publicGuide, /Visitor berths are available subject to allocation and availability/);
  assert.match(publicGuide, /No onsite fuel\. Petrol and diesel are available nearby at Port Hamble Marina\./);
  assert.match(publicGuide, /Freshwater availability should be confirmed directly with the marina\./);
  assert.match(publicGuide, /Electricity is available where enabled/);
  assert.match(publicGuide, /vessels drawing 2\.5 metres or less/);
  assert.match(publicGuide, /Hook Spit to starboard on entry/);
  assert.match(publicGuide, /Osborne Bay/);
  assert.match(publicGuide, /"Berthing Experience": "Berthing"/);
  assert.match(publicGuide, /"History and Character": "History"/);
  assert.match(publicGuide, /anchor: "sources", heading: "Sources"/);
  assert.match(publicGuide, /Information checked against official sources/);
  assert.match(publicGuide, /MDL Marinas/);
  assert.match(publicGuide, /River Hamble Harbour Authority/);
  assert.match(publicGuide, /Hampshire County Council/);
  assert.doesNotMatch(publicGuide, /verifiedOn|Information last verified/);
  assert.doesNotMatch(publicGuide, /should be claimed|do not claim|should not be shown|do not infer|before relying on them/i);
  assert.match(css, /\.guide-product-hero::after[\s\S]*display: none/);
  assert.match(css, /\.guide-promo-grid[\s\S]*repeat\(5/);
  assert.match(css, /\.guide-section-navigation--wrapped[\s\S]*flex-wrap: wrap/);
  assert.doesNotMatch(css, /\.guide-section-navigation--wrapped[^}]*white-space:\s*nowrap/);
});

test("Guide validation covers identity, ordering, relationships and location", () => {
  assert.doesNotThrow(() => validateGuideInput({
    title: "Valid Guide",
    slug: "valid-guide",
    guideType: "Cruising Area",
    editorialOrder: 0,
    status: "published",
    location: { latitude: 50.77, longitude: -1.3, mapZoom: 10 },
    relatedGuideSlugs: ["river-hamble"],
    cruiseOnGuideSlugs: ["cowes"],
  }));
  assert.throws(() => validateGuideInput({ title: "", slug: "Bad Slug" }), /title.*slug/);
  assert.throws(() => validateGuideInput({
    title: "Bad location",
    slug: "bad-location",
    status: "published",
    location: { latitude: 91, mapZoom: 1.5 },
  }), /latitude.*map zoom.*both latitude and longitude/);
  assert.throws(() => validateGuideInput({
    title: "Self relation",
    slug: "self-relation",
    relatedGuideSlugs: ["self-relation", "self-relation"],
  }), /cannot include itself.*duplicates/);
});

test("public routes expose search, section navigation, onward routes, privacy map and feedback", async () => {
  const [landing, collections, region, detail, content, browser, navigation, sections, preview] = await Promise.all([
    fs.readFile(path.join(projectDir, "app/guides/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "content/guide-collections.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "app/guides/[region]/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "app/guides/[region]/[guide]/page.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "components/GuidePublicContent.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "components/GuideCollectionBrowser.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "components/GuideSectionNavigation.tsx"), "utf8"),
    fs.readFile(path.join(projectDir, "content/sections.ts"), "utf8"),
    fs.readFile(path.join(projectDir, "app/editor/preview/guide/[slug]/page.tsx"), "utf8"),
  ]);
  assert.match(landing, /Old Sea Dogs Guides/);
  assert.match(landing, /Practical marina, harbour and cruising information/);
  assert.doesNotMatch(landing, /guide-library-hero-image|Featured Guide · The opening chapter/);
  assert.match(collections, /Marina Guides/);
  assert.match(landing, /href="\/guides\?type=Marina#guide-library"/);
  assert.match(landing, /Marina &amp; Harbour Guides/);
  assert.match(landing, /Browse by region/);
  assert.match(landing, /Browse rivers and anchorages/);
  assert.match(landing, /hamble-point-marina/);
  assert.doesNotMatch(landing, /Useful sailing pages|rewritten noise/);
  assert.match(landing, /Search marinas, harbours, anchorages and cruising areas/);
  assert.match(region, /Browse by type/);
  assert.match(region, /Browse all Guides/);
  assert.match(region, /View on map/);
  assert.match(detail, /breadcrumbJsonLd/);
  assert.match(content, /GuideSectionNavigation/);
  assert.match(content, /Cruise On/);
  assert.match(content, /Previous Guide/);
  assert.match(content, /Next Guide/);
  assert.match(content, /Know this area/);
  assert.match(content, /must not be used for navigation/);
  assert.doesNotMatch(content, /editorialNotes|researchNotes|reviewDue|accuracyConcerns|draftComments|facilityVerificationNotes/);
  assert.match(content, /Verified facilities/);
  assert.match(content, /Official marina information/);
  assert.match(content, /Legacy overview/);
  assert.match(browser, /type="search"/);
  assert.match(browser, /id="guide-library"/);
  assert.match(browser, /aria-live="polite"/);
  assert.match(browser, /The next Guide may still be on the chart table/);
  assert.doesNotMatch(browser, /Open Guide/);
  assert.doesNotMatch(browser, /No published Guides match/);
  assert.match(navigation, /<nav[^>]+aria-label="Guide sections"/);
  assert.match(navigation, /<details/);
  assert.match(sections, /href: "\/guides"[\s\S]*label: "Guides"/);
  assert.match(preview, /GuidePublicContent/);
});

test("The Helm visibly supports Guide creation, editing groups and publication controls", async () => {
  const source = await fs.readFile(path.join(projectDir, "app/editor/BridgeCms.tsx"), "utf8");
  for (const label of [
    "Create Marina Guide",
    "Create Harbour Guide",
    "Create Cruising Area Guide",
    "Create another Guide type",
    "Guide identity and collection",
    "Guide type",
    "Editorial order",
    "Guide orientation",
    "Related Guide slugs",
    "Cruise On Guide slugs",
    "Internal notes",
    "Verified facility information",
    "Internal facility verification notes",
    "Facility | Stable public detail | Official source URL | YYYY-MM-DD",
    "Save as Draft",
    "Unpublish",
    "Publish Now",
    "Preview",
  ]) {
    assert.ok(source.includes(label), `missing Guide editor control: ${label}`);
  }
});
