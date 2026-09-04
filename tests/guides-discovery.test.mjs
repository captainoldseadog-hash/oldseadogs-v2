import assert from "node:assert/strict";
import test from "node:test";
import { guideDiscoveryAreas, guideEditorialLinkMatches } from "../lib/guides.ts";

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
    editorialOrder: Number(internalId.replace(/\D/g, "")),
    canonicalPath: "",
    imageUrl: `/images/${slug}.png`,
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
  assert.equal(areas[0].guideCount, 4, "draft Guides are excluded from public counts");
  assert.deepEqual(areas[0].nodes.map((node) => node.guide.slug), ["portsmouth-harbour"]);
  assert.deepEqual(areas[0].nodes[0].children.map((child) => child.slug), ["haslar-marina", "gosport-marina"]);
  assert.deepEqual(areas[1].directGuides.map((child) => child.slug), ["brownsea-island"]);
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

test("editorial mentions link only unique published targets", () => {
  const target = guide({ id: "east-cowes", internalId: "OSD-G024", slug: "east-cowes-marina", title: "East Cowes Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent" });
  const draft = guide({ id: "southsea", internalId: "OSD-G040", slug: "southsea-marina", title: "Southsea Marina", guideType: "Marina", regionKey: "solent", regionName: "The Solent", status: "draft" });
  const matches = guideEditorialLinkMatches("East Cowes Marina is calmer. Southsea Marina is nearby.", "cowes", [target, draft]);
  assert.deepEqual(matches.map((match) => [match.label, match.guide.slug]), [["East Cowes Marina", "east-cowes-marina"]]);
  assert.equal(guideEditorialLinkMatches("East Cowes Marina again.", "cowes", [target], new Set([target.slug])).length, 0);
});
