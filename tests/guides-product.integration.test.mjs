import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { startEditorStoreWorker } from "./helpers/worker-fetch-client.mjs";
import { solentMarinaGuideRecords } from "../content/solent-marina-guides.ts";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);
const fixedNow = "2026-07-30T09:00:00.000Z";
let controller;
let dataDir;

const editorStore = {
  version: 1,
  stories: [],
  guides: [],
  media: [],
  galleryCategories: [],
  galleryItems: [],
  instagramImports: [],
  ads: [],
  settings: {},
  socialEvents: [],
  pressReleases: [],
  blockedSenders: [],
  publicationOverrides: [],
  storyRevisions: [],
  updatedAt: fixedNow,
};

async function request(pathname, init = {}) {
  return controller.fetch(`http://localhost${pathname}`, init);
}

async function saveGuide(guide) {
  return request("/api/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "saveGuide", guide }),
  });
}

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "oldseadogs-guides-product-"));
  await fs.writeFile(
    path.join(dataDir, "editor-store.json"),
    `${JSON.stringify(editorStore, null, 2)}\n`,
    { mode: 0o600 },
  );
  controller = await startEditorStoreWorker({
    projectDir,
    dataDir,
    env: {
      NODE_ENV: "production",
      OLDSEADOGS_RUNTIME: "node",
      OLDSEADOGS_SITE_URL: "http://localhost",
    },
  });
});

after(async () => {
  await controller.stop();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test("Guide library, Solent collection and Guide detail render the complete public journey", async () => {
  const homepage = await request("/");
  assert.equal(homepage.status, 200);
  const homepageHtml = await homepage.text();
  const promoStart = homepageHtml.indexOf('<section class="homepage-guides-promo"');
  const promoEnd = homepageHtml.indexOf("</section>", promoStart);
  assert.ok(promoStart >= 0 && promoEnd > promoStart);
  const promoHtml = homepageHtml.slice(promoStart, promoEnd);
  assert.match(promoHtml, /Discover Old Sea Dogs Guides/);
  assert.match(promoHtml, /href="\/guides\/solent\/the-solent"/);
  assert.match(promoHtml, /href="\/guides\/solent\/river-hamble"/);
  assert.match(promoHtml, /href="\/guides\/solent\/hamble-point-marina"/);
  assert.match(promoHtml, /Explore All Guides/);
  assert.equal((promoHtml.match(/href="\/guides\/solent\//g) || []).length, 3);

  const landing = await request("/guides");
  assert.equal(landing.status, 200);
  const landingHtml = await landing.text();
  assert.match(landingHtml, /Old Sea Dogs Guides/);
  assert.match(landingHtml, /Practical marina, harbour and cruising information/);
  assert.doesNotMatch(landingHtml, /guide-library-hero-image|Featured Guide · The opening chapter/);
  assert.match(landingHtml, /Marina &amp; Harbour Guides/);
  assert.match(landingHtml, /href="\/guides\?type=Marina#guide-library"/);
  assert.match(landingHtml, /Browse by region/);
  assert.match(landingHtml, /Browse rivers and anchorages/);
  assert.match(landingHtml, /Hamble Point Marina/);
  assert.match(landingHtml, /River Hamble/);
  assert.match(landingHtml, /Cowes/);
  assert.match(landingHtml, /Newtown Creek/);
  assert.match(landingHtml, /Yarmouth/);
  assert.match(landingHtml, /Portsmouth Harbour/);
  assert.match(landingHtml, /Southampton Water/);
  assert.match(landingHtml, /Beaulieu River/);
  assert.doesNotMatch(landingHtml, /Useful sailing pages|rewritten noise|solent-marina-guide/);
  assert.match(landingHtml, /Search marinas, harbours, anchorages and cruising areas/);
  assert.match(landingHtml, /The Solent/);

  const region = await request("/guides/solent");
  assert.equal(region.status, 200);
  const regionHtml = await region.text();
  assert.match(regionHtml, /Browse by type/);
  assert.match(regionHtml, /Browse all Guides/);
  assert.match(regionHtml, /View on map/);
  assert.match(regionHtml, /River Hamble/);

  for (const record of solentMarinaGuideRecords) {
    const escapedTitle = record.officialName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(regionHtml, new RegExp(escapedTitle));
    const response = await request(`/guides/solent/${record.slug}`);
    assert.equal(response.status, 200, record.slug);
    const html = await response.text();
    assert.match(html, new RegExp(escapedTitle));
    assert.match(html, /class="guide-facts"/);
    assert.match(html, /Setting &amp; Character/);
    assert.match(html, /Arrival by Sea/);
    assert.match(html, /Berthing Experience/);
    assert.match(html, /Marine Services/);
    assert.match(html, /Skipper(?:’|&#x27;)s Notes/);
    assert.match(html, /Old Sea Dogs View/);
    assert.match(html, /Information checked against official sources/);
    assert.doesNotMatch(html, /Not published — confirm directly/);
    assert.doesNotMatch(html, /Information not publicly available/);
    assert.doesNotMatch(html, /No navigation map is published in this edition/);
    assert.doesNotMatch(html, /Practical information/);
    assert.match(html, new RegExp(record.operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(record.telephone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (record.berthing.berthCount) assert.match(html, />Berths</);
    else assert.doesNotMatch(html, />Berths</);
    if (record.berthing.maximumLoa) assert.match(html, />Maximum LOA</);
    else assert.doesNotMatch(html, />Maximum LOA</);
    if (record.berthing.maximumDraft) assert.match(html, />Maximum Draft</);
    else assert.doesNotMatch(html, />Maximum Draft</);
    if (record.vhfChannel) assert.match(html, />Marina Arrival VHF</);
    else assert.doesNotMatch(html, />Marina Arrival VHF</);
    assert.doesNotMatch(html, /guide-map-placeholder|guide-map-section/);
    assert.match(html, new RegExp(record.media.primaryImage.split("/").at(-1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  const detail = await request("/guides/solent/the-solent");
  assert.equal(detail.status, 200);
  const detailHtml = await detail.text();
  assert.match(detailHtml, /most concentrated cruising ground/);
  assert.match(detailHtml, /Jump to section/);
  assert.match(detailHtml, /Why the Solent Matters/);
  assert.match(detailHtml, /Old Sea Dogs View/);
  assert.match(detailHtml, /Cruise On/);
  assert.match(detailHtml, /Know this area/);
  assert.match(detailHtml, /Load Google Map/);
  assert.doesNotMatch(detailHtml, /<iframe/);
  assert.match(detailHtml, /rel="canonical" href="https:\/\/oldseadogs\.com\/guides\/solent\/the-solent"/);
  assert.match(detailHtml, /"@type":"Article"/);
  assert.match(detailHtml, /"@type":"BreadcrumbList"/);

  const marina = await request("/guides/solent/hamble-point-marina");
  assert.equal(marina.status, 200);
  const marinaHtml = await marina.text();
  assert.match(marinaHtml, /MDL Hamble Point Marina/);
  assert.match(marinaHtml, /Practical information/);
  assert.doesNotMatch(marinaHtml, /To be verified/);
  assert.match(marinaHtml, /VHF Channel 80/);
  assert.match(marinaHtml, /VHF Channel 68/);
  assert.match(marinaHtml, /Visitor berths are available subject to allocation and availability/);
  assert.match(marinaHtml, /No onsite fuel\. Petrol and diesel are available nearby at Port Hamble Marina\./);
  assert.match(marinaHtml, /Freshwater availability should be confirmed directly with the marina\./);
  assert.match(marinaHtml, /Electricity is available where enabled/);
  assert.match(marinaHtml, /vessels drawing 2\.5 metres or less/);
  assert.match(marinaHtml, /Hook Spit to starboard on entry/);
  assert.match(marinaHtml, /Moving Prohibited Zone/);
  assert.match(marinaHtml, /Osborne Bay/);
  assert.match(marinaHtml, /Priory Bay/);
  assert.match(marinaHtml, /guide-section-navigation guide-section-navigation--wrapped/);
  for (const navigationLabel of [
    "Overview",
    "Arrival by Sea",
    "Berthing",
    "Facilities",
    "Marine Services",
    "Ashore",
    "Nearby Cruising",
    "History",
    "Skipper’s Notes",
    "Old Sea Dogs View",
    "Sources",
  ]) {
    assert.match(marinaHtml, new RegExp(`>${navigationLabel.replace("’", "(?:’|&#x27;)")}<`));
  }
  assert.match(marinaHtml, /Verified facilities/);
  assert.match(marinaHtml, /Information checked against official sources/);
  assert.match(marinaHtml, /Primary sources:/);
  assert.match(marinaHtml, /MDL Marinas/);
  assert.match(marinaHtml, /River Hamble Harbour Authority/);
  assert.match(marinaHtml, /Hampshire County Council/);
  assert.doesNotMatch(marinaHtml, /Information last verified|30 July 2026|3 August 2026/);
  assert.match(marinaHtml, /Official marina information/);
  assert.match(marinaHtml, /guides-marina-hamble-point-hero-v1\.png/);
  assert.doesNotMatch(marinaHtml, /Public copy deliberately omits|third-party positions conflict|should be claimed|do not claim|should not be shown|do not infer|before relying on them/i);
  assert.doesNotMatch(marinaHtml, /Load Google Map/);

  const cowes = await request("/guides/solent/cowes");
  assert.equal(cowes.status, 200);
  const cowesHtml = await cowes.text();
  assert.match(cowesHtml, /Cowes Harbour Guide/);
  assert.match(cowesHtml, /Harbour and marina destination/);
  assert.match(cowesHtml, /Channel 69/);
  assert.match(cowesHtml, /Channel 80/);
  assert.match(cowesHtml, /6 knots through the water/i);
  assert.match(cowesHtml, /Chain Ferry/);
  assert.match(cowesHtml, /right of way over river traffic/i);
  assert.match(cowesHtml, /Cowes Yacht Haven/);
  assert.match(cowesHtml, /Shepards Marina/);
  assert.match(cowesHtml, /East Cowes Marina/);
  assert.match(cowesHtml, /Cowes Harbour Fuel Berth/);
  assert.match(cowesHtml, /Lallows/);
  assert.match(cowesHtml, /holding-tank pump-out facility is available at Shepards Marina/i);
  assert.match(cowesHtml, /guide-section-navigation guide-section-navigation--wrapped/);
  assert.match(cowesHtml, /cowes-navigation-warning-panel/);
  assert.match(cowesHtml, /cowes-berth-panel/);
  assert.match(cowesHtml, /guides-harbour-cowes-hero-v1\.png/);
  assert.match(cowesHtml, /guides-cowes-royal-yacht-squadron-hero-v1\.png/);
  assert.match(cowesHtml, /guides-cowes-racing-start-cannons-v1\.png/);
  assert.match(cowesHtml, /guides-cowes-castle-v1\.png/);
  assert.match(cowesHtml, /Information checked against official sources/);
  assert.doesNotMatch(cowesHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it/i);

  const newtown = await request("/guides/solent/newtown-creek");
  assert.equal(newtown.status, 200);
  const newtownHtml = await newtown.text();
  assert.match(newtownHtml, /Newtown Creek Guide/);
  assert.match(newtownHtml, /Anchorage Guide/);
  assert.match(newtownHtml, /National Trust/);
  assert.match(newtownHtml, /Visitor Moorings/);
  assert.match(newtownHtml, /Anchoring/);
  assert.match(newtownHtml, /Permitted in designated areas/);
  assert.match(newtownHtml, /Wildlife &amp; Conservation/);
  assert.match(newtownHtml, /Walking/);
  assert.match(newtownHtml, /National Trust footpaths/);
  assert.match(newtownHtml, /Nearby Cruising/);
  assert.match(newtownHtml, /newtown-creek-snapshot/);
  assert.match(newtownHtml, /newtown-navigation-panel/);
  assert.match(newtownHtml, /newtown-information-panel/);
  assert.match(newtownHtml, /guides-newtown-creek-hero-v1\.png/);
  assert.match(newtownHtml, /Information checked against official sources/);
  assert.doesNotMatch(newtownHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);

  const yarmouth = await request("/guides/solent/yarmouth");
  assert.equal(yarmouth.status, 200);
  const yarmouthHtml = await yarmouth.text();
  assert.match(yarmouthHtml, /Yarmouth Harbour Guide/);
  assert.match(yarmouthHtml, /Harbour &amp; Visitor Berthing Guide/);
  assert.match(yarmouthHtml, /Yarmouth Harbour Commissioners/);
  assert.match(yarmouthHtml, /Channel 68/);
  assert.match(yarmouthHtml, /Channel 15/);
  assert.match(yarmouthHtml, /150\+/);
  assert.match(yarmouthHtml, />35</);
  assert.match(yarmouthHtml, /harbour fuel berth/);
  assert.match(yarmouthHtml, /free sewage pump-out/);
  assert.match(yarmouthHtml, /guide-section-navigation guide-section-navigation--wrapped/);
  assert.match(yarmouthHtml, /yarmouth-navigation-warning-panel/);
  assert.match(yarmouthHtml, /yarmouth-information-panel/);
  assert.match(yarmouthHtml, /guides-yarmouth-marina-entrance-v1\.png/);
  assert.match(yarmouthHtml, /Information checked against official sources/);
  assert.doesNotMatch(yarmouthHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it/i);

  const portsmouth = await request("/guides/solent/portsmouth-harbour");
  assert.equal(portsmouth.status, 200);
  const portsmouthHtml = await portsmouth.text();
  assert.match(portsmouthHtml, /Portsmouth Harbour Guide/);
  assert.match(portsmouthHtml, />Harbour Guide</);
  assert.match(portsmouthHtml, /Channel 11/);
  assert.match(portsmouthHtml, /Channel 13/);
  assert.match(portsmouthHtml, /Portsmouth VTS/);
  assert.match(portsmouthHtml, /Small Boat Channel/);
  assert.match(portsmouthHtml, /Gunwharf Quays Marina/);
  assert.match(portsmouthHtml, /Haslar Marina/);
  assert.match(portsmouthHtml, /Gosport Marina/);
  assert.match(portsmouthHtml, /Port Solent/);
  assert.match(portsmouthHtml, /Diesel and petrol are available at Port Solent Marina and Gosport Marina/);
  assert.match(portsmouthHtml, /guide-section-navigation guide-section-navigation--wrapped/);
  assert.match(portsmouthHtml, /portsmouth-navigation-warning-panel/);
  assert.match(portsmouthHtml, /portsmouth-information-panel/);
  assert.match(portsmouthHtml, /guides-portsmouth-harbour-hero-v1\.png/);
  assert.match(portsmouthHtml, /Information checked against official sources/);
  assert.doesNotMatch(portsmouthHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);

  const southampton = await request("/guides/solent/southampton-water");
  assert.equal(southampton.status, 200);
  const southamptonHtml = await southampton.text();
  assert.match(southamptonHtml, /Southampton Water Guide/);
  assert.match(southamptonHtml, /Estuary &amp; Commercial Waterway Guide/);
  assert.match(southamptonHtml, /Associated British Ports/);
  assert.match(southamptonHtml, /Southampton VTS/);
  assert.match(southamptonHtml, /Channel 12/);
  assert.match(southamptonHtml, /Commercial Shipping/);
  assert.match(southamptonHtml, /Cruise &amp; Commercial Terminals/);
  assert.match(southamptonHtml, /Hamble Point Marina/);
  assert.match(southamptonHtml, /Port Hamble Marina/);
  assert.match(southamptonHtml, /Mercury Yacht Harbour/);
  assert.match(southamptonHtml, /Universal Marina/);
  assert.match(southamptonHtml, /Ocean Village Marina/);
  assert.match(southamptonHtml, /Town Quay Marina/);
  assert.match(southamptonHtml, /Hythe Marina Village/);
  assert.match(southamptonHtml, /Swanwick Marina/);
  assert.match(southamptonHtml, /Read the Hamble Point Marina Guide/);
  assert.match(southamptonHtml, /Explore the River Hamble Guide/);
  assert.match(southamptonHtml, /Diesel and petrol are available at several marinas/);
  assert.match(southamptonHtml, /southampton-water-snapshot/);
  assert.match(southamptonHtml, /southampton-navigation-panel/);
  assert.match(southamptonHtml, /southampton-information-panel/);
  assert.match(southamptonHtml, /guides-southampton-water-hero\.png/);
  assert.match(southamptonHtml, /Information checked against official sources/);
  assert.doesNotMatch(southamptonHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);

  const river = await request("/guides/solent/river-hamble");
  assert.equal(river.status, 200);
  const riverHtml = await river.text();
  assert.match(riverHtml, /River Hamble Guide/);
  assert.match(riverHtml, />River Guide</);
  assert.match(riverHtml, /River Hamble Harbour Authority/);
  assert.match(riverHtml, /Channel 68/);
  assert.match(riverHtml, /6 knots through the water north of the Number One buoy/);
  assert.match(riverHtml, /Skipper(?:’|&#x27;|&apos;|')s Snapshot/);
  assert.match(riverHtml, /Principal Marinas/);
  assert.match(riverHtml, /Port Hamble Marina/);
  assert.match(riverHtml, /Mercury Yacht Harbour/);
  assert.match(riverHtml, /Universal Marina/);
  assert.match(riverHtml, /Swanwick Marina/);
  assert.match(riverHtml, /Deacons Marina/);
  assert.match(riverHtml, /Warsash Harbour Moorings/);
  assert.match(riverHtml, /Walking the River/);
  assert.match(riverHtml, /Hamble Common/);
  assert.match(riverHtml, /Pink Ferry/);
  assert.match(riverHtml, /Nearby Cruising/);
  assert.match(riverHtml, /Read the Hamble Point Marina Guide/);
  assert.match(riverHtml, /guides-river-hamble-hero-v1\.png/);
  assert.match(riverHtml, /guides-river-hamble-jolly-sailor-v1\.png/);
  assert.match(riverHtml, /river-hamble-snapshot/);
  assert.match(riverHtml, /river-hamble-speed-warning-panel/);
  assert.match(riverHtml, /river-hamble-information-panel/);
  assert.match(riverHtml, /Information checked against official sources/);
  assert.doesNotMatch(riverHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);
  assert.match(riverHtml, /Next Guide[\s\S]*Hamble Point Marina/);

  const beaulieu = await request("/guides/solent/beaulieu-river");
  assert.equal(beaulieu.status, 200);
  const beaulieuHtml = await beaulieu.text();
  assert.match(beaulieuHtml, /Beaulieu River Guide/);
  assert.match(beaulieuHtml, />River Guide</);
  assert.match(beaulieuHtml, /Beaulieu Estate/);
  assert.match(beaulieuHtml, /Channel 68/);
  assert.match(beaulieuHtml, /Visitor Moorings/);
  assert.match(beaulieuHtml, /Buckler(?:’|&#x27;|&apos;|')s Hard/);
  assert.match(beaulieuHtml, /Diesel is available at Buckler(?:’|&#x27;|&apos;|')s Hard Yacht Harbour/);
  assert.match(beaulieuHtml, /Wildlife &amp; Conservation/);
  assert.match(beaulieuHtml, /National Nature Reserve/);
  assert.match(beaulieuHtml, /Nearby Cruising/);
  assert.match(beaulieuHtml, /beaulieu-river-snapshot/);
  assert.match(beaulieuHtml, /beaulieu-navigation-panel/);
  assert.match(beaulieuHtml, /beaulieu-information-panel/);
  assert.match(beaulieuHtml, /guides-beaulieu-river-hero\.png/);
  assert.match(beaulieuHtml, /Information checked against official sources/);
  assert.doesNotMatch(beaulieuHtml, /To be verified|do not claim|should be claimed|do not infer|according to the record|before relying on it|internal editorial/i);

  const legacy = await request("/guides/solent-marina-guide");
  assert.equal(legacy.status, 200);
  const legacyHtml = await legacy.text();
  assert.match(legacyHtml, /Legacy overview/);
  assert.match(legacyHtml, /Hamble Point Marina Guide/);
  assert.match(legacyHtml, /guides\?type=Marina#guide-library/);
  assert.match(legacyHtml, /rel="canonical" href="https:\/\/oldseadogs\.com\/guides\/solent-marina-guide"/);
});

test("invalid and draft Guides are protected while authenticated preview remains accurate", async () => {
  assert.equal((await request("/guides/solent/not-a-guide")).status, 404);

  const response = await saveGuide({
    title: "Private Draft Guide",
    slug: "private-draft-guide",
    status: "draft",
    guideType: "Destination",
    regionKey: "solent",
    regionName: "The Solent",
    editorialOrder: 99,
    introduction: "Private preview introduction.",
    summary: "Private preview strapline.",
    sections: [{ heading: "Draft section", body: ["Draft Guide body."] }],
  });
  assert.equal(response.status, 200);
  const saved = (await response.json()).guide;
  assert.match(saved.internalId, /^OSD-G\d{3}$/);
  assert.equal((await request("/guides/solent/private-draft-guide")).status, 404);

  const preview = await request("/editor/preview/guide/private-draft-guide");
  assert.equal(preview.status, 200);
  const previewHtml = await preview.text();
  assert.match(previewHtml, /Preview · [\s\S]*draft/i);
  assert.match(previewHtml, /Private Draft Guide/);
  assert.match(previewHtml, /Private preview introduction/);
});

test("The Helm can publish and unpublish a Guide without touching production data", async () => {
  const paragraph = "A practical local Guide paragraph with useful cruising context, harbour awareness, considerate seamanship and enough editorial substance for this local workflow demonstration.";
  let response = await saveGuide({
    title: "Workflow Guide",
    slug: "workflow-guide",
    status: "published",
    guideType: "Harbour",
    regionKey: "solent",
    regionName: "The Solent",
    editorialOrder: 100,
    author: "Michael Hodges",
    summary: "A local publication workflow Guide.",
    introduction: paragraph,
    sections: [
      { heading: "Understanding the harbour", body: [paragraph, paragraph, paragraph] },
      { heading: "Old Sea Dogs View", body: [paragraph, paragraph] },
    ],
    relatedGuideSlugs: ["the-solent"],
    cruiseOnGuideSlugs: ["river-hamble"],
  });
  assert.equal(response.status, 200);
  let saved = (await response.json()).guide;
  assert.equal(saved.status, "published");
  assert.equal((await request("/guides/solent/workflow-guide")).status, 200);

  response = await saveGuide({ ...saved, status: "unpublished" });
  assert.equal(response.status, 200);
  saved = (await response.json()).guide;
  assert.equal(saved.status, "unpublished");
  assert.equal((await request("/guides/solent/workflow-guide")).status, 404);
});
