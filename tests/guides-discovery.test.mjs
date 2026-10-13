import assert from "node:assert/strict";
import test from "node:test";
import { guideAreaCountLabel, guideCollectionLead, guideCollectionMembers, guideCruisingArea, guideDiscoveryAreas, guideEditorialLinkMatches, guideHubRelatedLinks, mobileGuideMenuLinks, recentPublicGuides } from "../lib/guides.ts";

function guide({
  id,
  internalId,
  slug,
  title,
  guideType,
  regionKey,
  regionName,
  parentGuideSlug = "",
  status = "published",
  updatedAt = "2026-01-01T00:00:00.000Z",
  publication,
  relatedGuideSlugs = [],
  sections = [],
  imageUrl,
}) {
  return {
    id,
    internalId,
    slug,
    title,
    summary: `${title} summary`,
    guideType,
    regionKey,
    regionName,
    parentGuideSlug,
    status,
    updatedAt,
    publication,
    relatedGuideSlugs,
    sections,
    editorialOrder: Number(internalId.replace(/\D/g, "")),
    canonicalPath: "",
    imageUrl: imageUrl === undefined ? `/images/${slug}.png` : imageUrl,
    imageAlt: title,
  };
}

test("Guide discovery is generated from area and parent relationships", () => {
  const records = [
    guide({ id: "solent", internalId: "OSD-G001", slug: "the-solent", title: "The Solent", guideType: "Cruising Area", regionKey: "solent", regionName: "The Solent" }),
    guide({ id: "portsmouth", internalId: "OSD-G007", slug: "portsmouth-harbour", title: "Portsmouth Harbour", guideType: "Harbour", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "the-solent" }),
    guide({ id: "haslar", internalId: "OSD-G018", slug: "haslar-marina", title: "Haslar Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "portsmouth-harbour" }),
    guide({ id: "gosport", internalId: "OSD-G019", slug: "gosport-marina", title: "Gosport Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "portsmouth-harbour" }),
    guide({ id: "southsea", internalId: "OSD-G040", slug: "southsea-marina", title: "Southsea Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "portsmouth-harbour", status: "draft" }),
    guide({ id: "poole", internalId: "OSD-G101", slug: "poole-harbour", title: "Poole Harbour", guideType: "Cruising Area", regionKey: "poole-harbour", regionName: "Poole Harbour" }),
    guide({ id: "brownsea", internalId: "OSD-G102", slug: "brownsea-island", title: "Brownsea Island", guideType: "Destination", regionKey: "poole-harbour", regionName: "Poole Harbour", parentGuideSlug: "poole-harbour" }),
    guide({ id: "bad", internalId: "OSD-G999", slug: "bad-region", title: "Bad region", guideType: "Destination", regionKey: " ", regionName: " " }),
  ];

  const areas = guideDiscoveryAreas(records);
  assert.deepEqual(areas.map((area) => area.key), ["solent", "poole-harbour"]);
  assert.equal(areas[0].guideCount, 3, "the hub record and draft Guides are excluded from the displayed count");
  for (const area of areas) {
    const listed = area.nodes.reduce((total, node) => total + 1 + node.children.length, 0) + area.directGuides.length;
    assert.equal(area.guideCount, listed, area.key);
    assert.equal(area.guideCount, guideCollectionMembers(area.key, records.filter((item) => item.status === "published")).length);
  }
  assert.deepEqual(areas[0].nodes.map((node) => node.guide.slug), ["portsmouth-harbour"]);
  assert.deepEqual(areas[0].nodes[0].children.map((child) => child.slug), ["haslar-marina", "gosport-marina"]);
  assert.deepEqual(areas[1].directGuides.map((child) => child.slug), ["brownsea-island"]);
});

test("a parented cruising area with the region slug still leads the collection", () => {
  const records = [
    guide({ id: "chichester", internalId: "OSD-G300", slug: "chichester-harbour", title: "Chichester Harbour", guideType: "Cruising Area", regionKey: "chichester-harbour", regionName: "Chichester Harbour", parentGuideSlug: "the-solent" }),
    guide({ id: "itchenor", internalId: "OSD-G301", slug: "itchenor", title: "Itchenor", guideType: "Destination", regionKey: "chichester-harbour", regionName: "Chichester Harbour", parentGuideSlug: "chichester-harbour" }),
  ];

  assert.equal(guideCruisingArea("chichester-harbour", records), null);
  assert.equal(guideCollectionLead("chichester-harbour", records)?.slug, "chichester-harbour");
  const [area] = guideDiscoveryAreas(records);
  assert.equal(area.key, "chichester-harbour");
  assert.equal(area.path, "/guides/chichester-harbour");
  assert.deepEqual(area.directGuides.map((item) => item.slug), ["itchenor"]);
  assert.equal(area.guideCount, 1);
  assert.equal(guideCollectionMembers("chichester-harbour", records).map((item) => item.slug).join(","), "itchenor");
});

test("a future cruising area appears without a named-area code path", () => {
  const records = [
    guide({ id: "future", internalId: "OSD-G500", slug: "future-coast", title: "Future Coast", guideType: "Cruising Area", regionKey: "future-coast", regionName: "Future Coast" }),
    guide({ id: "future-port", internalId: "OSD-G501", slug: "future-port", title: "Future Port", guideType: "Harbour", regionKey: "future-coast", regionName: "Future Coast", parentGuideSlug: "future-coast" }),
  ];
  const [area] = guideDiscoveryAreas(records);
  assert.equal(area.name, "Future Coast");
  assert.equal(area.path, "/guides/future-coast");
  assert.deepEqual(area.directGuides.map((item) => item.slug), ["future-port"]);
});

test("private hierarchy may include drafts while public discovery never does", () => {
  const records = [
    guide({ id: "solent", internalId: "OSD-G001", slug: "the-solent", title: "The Solent", guideType: "Cruising Area", regionKey: "solent", regionName: "The Solent" }),
    guide({ id: "portsmouth", internalId: "OSD-G007", slug: "portsmouth-harbour", title: "Portsmouth Harbour", guideType: "Harbour", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "the-solent" }),
    guide({ id: "southsea", internalId: "OSD-G040", slug: "southsea-marina", title: "Southsea Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "portsmouth-harbour", status: "draft" }),
  ];
  assert.deepEqual(guideDiscoveryAreas(records)[0].directGuides.map((item) => item.slug), ["portsmouth-harbour"]);
  assert.deepEqual(guideDiscoveryAreas(records, { includeDrafts: true })[0].nodes[0].children.map((item) => item.slug), ["southsea-marina"]);
});

test("an area with no child guides is labelled as an area guide", () => {
  const records = [
    guide({ id: "empty", internalId: "OSD-G700", slug: "empty-coast", title: "Empty Coast", guideType: "Cruising Area", regionKey: "empty-coast", regionName: "Empty Coast" }),
  ];
  const [area] = guideDiscoveryAreas(records);
  assert.equal(area.guideCount, 0);
  assert.equal(guideAreaCountLabel(0), "Area guide");
  assert.equal(guideAreaCountLabel(1), "1 Guide");
  assert.equal(guideAreaCountLabel(22), "22 Guides");
});

test("mobile guide links follow published discovery areas", () => {
  const records = [
    guide({ id: "solent", internalId: "OSD-G001", slug: "the-solent", title: "The Solent", guideType: "Cruising Area", regionKey: "solent", regionName: "The Solent" }),
    guide({ id: "langstone", internalId: "OSD-G200", slug: "langstone-harbour", title: "Langstone Harbour", guideType: "Cruising Area", regionKey: "langstone-harbour", regionName: "Langstone Harbour" }),
    guide({ id: "weymouth", internalId: "OSD-G400", slug: "weymouth-portland", title: "Weymouth & Portland", guideType: "Cruising Area", regionKey: "weymouth-portland", regionName: "Weymouth & Portland" }),
  ];
  assert.deepEqual(mobileGuideMenuLinks(records), [
    { href: "/guides", label: "All Guides" },
    { href: "/guides/solent", label: "The Solent" },
    { href: "/guides/langstone-harbour", label: "Langstone Harbour" },
    { href: "/guides/weymouth-portland", label: "Weymouth & Portland" },
  ]);
});

test("area hubs keep saved section links and related guides", () => {
  const langstone = guide({ id: "langstone", internalId: "OSD-G200", slug: "langstone-harbour", title: "Langstone Harbour", guideType: "Cruising Area", regionKey: "langstone-harbour", regionName: "Langstone Harbour" });
  const chichester = guide({
    id: "chichester",
    internalId: "OSD-G300",
    slug: "chichester-harbour",
    title: "Chichester Harbour",
    guideType: "Cruising Area",
    regionKey: "chichester-harbour",
    regionName: "Chichester Harbour",
    parentGuideSlug: "the-solent",
    relatedGuideSlugs: ["langstone-harbour"],
    sections: [{ heading: "Nearby waters", body: [], links: [{ label: "Langstone Harbour", guideSlug: "langstone-harbour" }] }],
  });
  const links = guideHubRelatedLinks(chichester, [chichester, langstone]);
  assert.deepEqual(links.map((link) => [link.label, link.slug]), [["Langstone Harbour", "langstone-harbour"]]);
});

test("recent guides follow publication date and skip area hubs without paintings", () => {
  const records = [
    guide({ id: "solent", internalId: "OSD-G001", slug: "the-solent", title: "The Solent", guideType: "Cruising Area", regionKey: "solent", regionName: "The Solent", publication: { publishedAt: "2026-09-01T00:00:00.000Z" } }),
    guide({ id: "old", internalId: "OSD-G010", slug: "old-marina", title: "Old Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "the-solent", publication: { publishedAt: "2026-01-01T00:00:00.000Z" } }),
    guide({ id: "new", internalId: "OSD-G011", slug: "weymouth-marina", title: "Weymouth Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "the-solent", publication: { createdAt: "2026-08-01T00:00:00.000Z", publishedAt: "2026-08-02T00:00:00.000Z" } }),
    guide({ id: "blank", internalId: "OSD-G012", slug: "no-painting", title: "No Painting", guideType: "Marina", regionKey: "solent", regionName: "The Solent", parentGuideSlug: "the-solent", imageUrl: "", publication: { publishedAt: "2026-10-01T00:00:00.000Z" } }),
  ];
  assert.deepEqual(recentPublicGuides(records, 4).map((item) => item.slug), ["weymouth-marina", "old-marina"]);
});

test("editorial mentions link only unique published targets", () => {
  const target = guide({ id: "east-cowes", internalId: "OSD-G024", slug: "east-cowes-marina", title: "East Cowes Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent" });
  const draft = guide({ id: "southsea", internalId: "OSD-G040", slug: "southsea-marina", title: "Southsea Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", status: "draft" });
  const matches = guideEditorialLinkMatches("East Cowes Marina is calmer. Southsea Marina is nearby.", "cowes", [target, draft]);
  assert.deepEqual(matches.map((match) => [match.label, match.guide.slug]), [["East Cowes Marina", "east-cowes-marina"]]);
  assert.equal(guideEditorialLinkMatches("East Cowes Marina again.", "cowes", [target], new Set([target.slug])).length, 0);
});
