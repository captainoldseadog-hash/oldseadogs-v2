import Link from "next/link";
import { guideSectionImagesFor } from "../content/guide-image-placements.ts";
import { contactEmail } from "../lib/seo.ts";
import {
  guidePublicPath,
  relatedGuides,
} from "../lib/guides.ts";
import type { EditableGuide } from "../lib/site-content.ts";
import { GuideBreadcrumbs } from "./GuideBreadcrumbs.tsx";
import { GuideGoogleMap } from "./GuideGoogleMap.tsx";
import { GuideSectionNavigation } from "./GuideSectionNavigation.tsx";

const toBeVerified = "To be verified";
const primarySourcesByGuideSlug: Record<string, string[]> = {
  "hamble-point-marina": [
    "MDL Marinas",
    "River Hamble Harbour Authority",
    "Hampshire County Council",
  ],
};

function factValue(guide: EditableGuide, label: RegExp) {
  return guide.quickFacts.find((fact) => label.test(fact.label))?.value || "";
}

function facilityValue(guide: EditableGuide, label: RegExp) {
  return guide.verifiedFacilities.find((facility) => label.test(facility.label))?.detail || "";
}

function RiverHambleSnapshot({ guide }: { guide: EditableGuide }) {
  const snapshot = [
    ["Guide Type", factValue(guide, /^guide type$/i)],
    ["Harbour Authority", factValue(guide, /^harbour authority$/i)],
    ["Harbour VHF", factValue(guide, /^harbour vhf$/i)],
    ["Speed Limit", factValue(guide, /^speed limit$/i)],
    ["Fuel", factValue(guide, /^fuel$/i)],
    ["Visitor Berths", factValue(guide, /^visitor berths$/i)],
    ["Marine Services", factValue(guide, /^marine services$/i)],
    ["Best For", factValue(guide, /^best for$/i)],
  ];

  return (
    <section className="river-hamble-snapshot" id="skippers-snapshot" aria-labelledby="river-hamble-snapshot-title">
      <div>
        <p className="eyebrow">At a glance</p>
        <h2 id="river-hamble-snapshot-title">Skipper&apos;s Snapshot</h2>
      </div>
      <dl>
        {snapshot.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

function BeaulieuRiverSnapshot({ guide }: { guide: EditableGuide }) {
  const snapshot = [
    ["Guide Type", factValue(guide, /^guide type$/i)],
    ["River Authority", factValue(guide, /^river authority$/i)],
    ["VHF", factValue(guide, /^harbour vhf$/i)],
    ["Visitor Moorings", factValue(guide, /^visitor moorings$/i)],
    ["Fuel", factValue(guide, /^fuel$/i)],
    ["Water", factValue(guide, /^water$/i)],
    ["Best For", factValue(guide, /^best for$/i)],
  ];

  return (
    <section className="beaulieu-river-snapshot" id="skippers-snapshot" aria-labelledby="beaulieu-river-snapshot-title">
      <div>
        <p className="eyebrow">At a glance</p>
        <h2 id="beaulieu-river-snapshot-title">Skipper&apos;s Snapshot</h2>
      </div>
      <dl>
        {snapshot.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

function NewtownCreekSnapshot({ guide }: { guide: EditableGuide }) {
  const snapshot = [
    ["Guide Type", factValue(guide, /^guide type$/i)],
    ["Management", factValue(guide, /^management$/i)],
    ["Visitor Moorings", factValue(guide, /^visitor moorings$/i)],
    ["Anchoring", factValue(guide, /^anchoring$/i)],
    ["Fuel", factValue(guide, /^fuel$/i)],
    ["Water", factValue(guide, /^water$/i)],
    ["Electricity", factValue(guide, /^electricity$/i)],
    ["Best For", factValue(guide, /^best for$/i)],
  ];

  return (
    <section className="newtown-creek-snapshot" id="skippers-snapshot" aria-labelledby="newtown-creek-snapshot-title">
      <div>
        <p className="eyebrow">At a glance</p>
        <h2 id="newtown-creek-snapshot-title">Skipper&apos;s Snapshot</h2>
      </div>
      <dl>
        {snapshot.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

function SouthamptonWaterSnapshot({ guide }: { guide: EditableGuide }) {
  const snapshot = [
    ["Guide Type", factValue(guide, /^guide type$/i)],
    ["Port Authority", factValue(guide, /^port authority$/i)],
    ["VTS", factValue(guide, /^vts$/i)],
    ["Commercial Shipping", factValue(guide, /^commercial traffic$/i)],
    ["Visitor Marinas", factValue(guide, /^visitor marinas$/i)],
    ["Fuel", factValue(guide, /^fuel$/i)],
    ["Best For", factValue(guide, /^best for$/i)],
  ];

  return (
    <section className="southampton-water-snapshot" id="skippers-snapshot" aria-labelledby="southampton-water-snapshot-title">
      <div>
        <p className="eyebrow">At a glance</p>
        <h2 id="southampton-water-snapshot-title">Skipper&apos;s Snapshot</h2>
      </div>
      <dl>
        {snapshot.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

function PracticalGuideReference({ guide, hasMap }: { guide: EditableGuide; hasMap: boolean }) {
  const approach = guide.sections.find((section) => /arrival|approach|setting/i.test(section.heading));
  const officialSource = guide.sourceLinks.find((source) => /^https?:\/\//i.test(source.href));
  const location = factValue(guide, /^location$/i)
    || [guide.subregion, guide.regionName].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ")
    || toBeVerified;
  const fields = [
    ["Location", location],
    ["Visitor berths", facilityValue(guide, /visitor|berth/i) || toBeVerified],
    ["Fuel", facilityValue(guide, /fuel/i) || toBeVerified],
    ["Water", facilityValue(guide, /^water$|berth water/i) || toBeVerified],
    ["Electricity", facilityValue(guide, /electric|shore power/i) || toBeVerified],
    ["Toilets and showers", facilityValue(guide, /toilet|shower|washroom/i) || toBeVerified],
    ["Laundry", facilityValue(guide, /laundry/i) || toBeVerified],
    ["Chandlery or repairs", facilityValue(guide, /chandlery|repair|marine service/i) || toBeVerified],
    ["Food and drink", facilityValue(guide, /food|drink|restaurant/i) || toBeVerified],
    ["Transport", facilityValue(guide, /transport|rail|bus/i) || toBeVerified],
    ["Tides and tidal streams", toBeVerified],
    ["Depths and draught", toBeVerified],
    ["VHF channel", toBeVerified],
    ["Booking information", toBeVerified],
    ["Harbour or marina office", toBeVerified],
    ["Local hazards", toBeVerified],
    ["Nearby anchorages", guide.cruiseOnGuideSlugs.length ? "See related Guides below" : toBeVerified],
  ] as const;

  return (
    <section className="guide-practical-reference" aria-labelledby="guide-practical-reference-title">
      <div className="guide-practical-heading">
        <p className="eyebrow">Planning reference</p>
        <h2 id="guide-practical-reference-title">Practical information</h2>
        <p>Verified details are shown where the current Guide record supports them. Confirm operational information with the harbour or marina before arrival.</p>
      </div>
      <div className="guide-practical-grid">
        <dl className="guide-information-table">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={value === toBeVerified ? "guide-to-verify" : ""}>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="guide-practical-sidebar">
          <section className="guide-approach-box">
            <p className="eyebrow">Approach notes</p>
            <h3>{approach?.heading || "Approach"}</h3>
            <p>{approach?.body[0] || "Check current charts, official notices and harbour guidance before arrival."}</p>
          </section>
          <aside className="guide-navigation-warning-box">
            <strong>Navigation warning</strong>
            <p>This editorial Guide does not replace current charts, almanacs, Notices to Mariners or harbour-master directions.</p>
          </aside>
          <section className="guide-contact-panel">
            <p className="eyebrow">Contact and booking</p>
            <dl>
              <div><dt>Telephone</dt><dd className="guide-to-verify">{toBeVerified}</dd></div>
              <div><dt>Office</dt><dd className="guide-to-verify">{toBeVerified}</dd></div>
              <div>
                <dt>Website</dt>
                <dd>{officialSource ? <a href={officialSource.href} rel="noopener noreferrer" target="_blank">{officialSource.label}</a> : <span className="guide-to-verify">{toBeVerified}</span>}</dd>
              </div>
            </dl>
          </section>
          {!hasMap ? (
            <section className="guide-map-placeholder" aria-label="Map or chart placeholder">
              <p className="eyebrow">Map / chart</p>
              <strong>To be verified and added</strong>
              <span>For orientation only; never for navigation.</span>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function HamblePointPracticalReference() {
  return (
    <section className="guide-practical-reference hamble-point-practical-reference" aria-labelledby="guide-practical-reference-title">
      <div className="guide-practical-heading">
        <p className="eyebrow">Planning reference</p>
        <h2 id="guide-practical-reference-title">Practical information</h2>
        <p>Check current marina, Harbour Authority, tide and navigation information before arrival.</p>
      </div>

      <div className="hamble-practical-groups">
        <section>
          <h3>Contact and VHF</h3>
          <dl>
            <div><dt>Hamble Point Marina</dt><dd><a href="tel:+442380452464">023 8045 2464</a><br /><a href="mailto:hamblepoint@mdlmarinas.co.uk">hamblepoint@mdlmarinas.co.uk</a><br />VHF Channel 80</dd></div>
            <div><dt>Hamble Harbour Radio</dt><dd>VHF Channel 68</dd></div>
            <div><dt>River Hamble Harbour Authority</dt><dd><a href="tel:+441489576387">01489 576387</a><br /><a href="mailto:harbour.office@hants.gov.uk">harbour.office@hants.gov.uk</a></dd></div>
          </dl>
        </section>

        <section>
          <h3>Berthing</h3>
          <dl>
            <div><dt>Location</dt><dd>Western bank of the lower River Hamble, close to Southampton Water and the river entrance.</dd></div>
            <div><dt>Visitor berths</dt><dd>Visitor berths are available subject to allocation and availability. Contact Hamble Point Marina directly on VHF Channel 80 or by telephone on 023 8045 2464 before arrival.</dd></div>
            <div><dt>Booking information</dt><dd>Visitor berths should be booked or confirmed directly with Hamble Point Marina by telephone, VHF Channel 80, or the marina operator&apos;s booking system.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Fuel, water and electricity</h3>
          <dl>
            <div><dt>Fuel</dt><dd>No onsite fuel. Petrol and diesel are available nearby at Port Hamble Marina.</dd></div>
            <div><dt>Water</dt><dd>Freshwater availability should be confirmed directly with the marina.</dd></div>
            <div><dt>Electricity</dt><dd>Electricity is available where enabled. Visitors using an enabled supply must register through the marina electricity portal.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Facilities</h3>
          <dl>
            <div><dt>Toilets and showers</dt><dd>On-site washroom facilities are available. New facilities officially opened in 2025.</dd></div>
            <div><dt>Laundry</dt><dd>Laundry facilities are available.</dd></div>
            <div><dt>Chandlery or repairs</dt><dd>The marina and marine-service centre include businesses covering repairs, maintenance, electronics, rigging, sailmaking, metal fabrication, brokerage and other marine services.</dd></div>
            <div><dt>Food and drink</dt><dd>The Ketch Rigger bar and restaurant is located at the marina. Opening hours vary; check directly before visiting.</dd></div>
            <div><dt>Transport</dt><dd>Hamble village and the surrounding area are accessible by road. Current bus, rail and taxi arrangements should be checked before travelling.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Tidal and navigation notes</h3>
          <dl>
            <div><dt>Tides and tidal streams</dt><dd>The lower River Hamble is tidal. Expect cross-current and confined manoeuvring conditions near the entrance and marina access. Allow for the state of tide and maintain a listening watch on VHF Channel 68.</dd></div>
            <div><dt>Depths and draught</dt><dd>River entry is possible by day or night and at all states of tide for vessels drawing 2.5 metres or less. Vessels drawing more than 2.5 metres should check available depth during lower spring tides and contact the Harbour Authority if in doubt.</dd></div>
          </dl>
        </section>

        <section>
          <h3>Local hazards</h3>
          <ul>
            <li>Heavy leisure traffic during summer weekends and major events</li>
            <li>Commercial traffic in Southampton Water</li>
            <li>Hook Spit to starboard on entry</li>
            <li>Hamble Point shoal to port</li>
            <li>Strong tidal influence near the river entrance</li>
            <li>Six-knot speed limit north of the Number 1 mark</li>
            <li>Wash must be kept to a minimum</li>
            <li>Large commercial vessels may operate with a Moving Prohibited Zone</li>
          </ul>
        </section>

        <section>
          <h3>Nearby cruising and anchorages</h3>
          <ul>
            <li>Newtown Creek</li>
            <li>Osborne Bay</li>
            <li>Beaulieu River</li>
            <li>Keyhaven</li>
            <li>Priory Bay</li>
          </ul>
          <p>Conditions, shelter and suitability vary. Check current charts, forecasts, tides and local guidance before choosing an anchorage.</p>
        </section>
      </div>
    </section>
  );
}

export function GuidePublicContent({
  guide,
  publishedGuides,
  preview = false,
}: {
  guide: EditableGuide;
  publishedGuides: EditableGuide[];
  preview?: boolean;
}) {
  const related = relatedGuides(guide, publishedGuides, "relatedGuideSlugs");
  const cruiseOn = relatedGuides(guide, publishedGuides, "cruiseOnGuideSlugs");
  const bySlug = new Map(publishedGuides.map((item) => [item.slug, item]));
  const previous = guide.previousGuideSlug ? bySlug.get(guide.previousGuideSlug) : undefined;
  const next = guide.nextGuideSlug ? bySlug.get(guide.nextGuideSlug) : undefined;
  const isHamblePoint = guide.slug === "hamble-point-marina";
  const isCowes = guide.slug === "cowes";
  const isYarmouth = guide.slug === "yarmouth";
  const isPortsmouth = guide.slug === "portsmouth-harbour";
  const isRiverHamble = guide.slug === "river-hamble";
  const isBeaulieuRiver = guide.slug === "beaulieu-river";
  const isNewtownCreek = guide.slug === "newtown-creek";
  const isSouthamptonWater = guide.slug === "southampton-water";
  const hambleNavigationLabels: Record<string, string> = {
    "Berthing Experience": "Berthing",
    "History and Character": "History",
  };
  const contentSectionLinks = guide.sections.map((section) => ({
    anchor: section.anchor || section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    heading: isHamblePoint ? hambleNavigationLabels[section.heading] || section.heading : section.heading,
  }));
  const cowesNavigationByHeading: Record<string, string> = {
    "Arrival by Sea": "Arrival",
    "Navigation Warnings": "Navigation",
    "Choose Your Berth": "Berthing",
    "Cowes Yacht Haven": "Yacht Haven",
    "Shepards Marina": "Shepards",
    "East Cowes Marina": "East Cowes",
    "Harbour Moorings and Trinity Landing": "Harbour Moorings",
    "Fuel, Water, Electricity and Pump-out": "Fuel & Facilities",
    "Facilities Ashore": "Ashore",
    "Old Sea Dogs View": "Old Sea Dogs View",
    "Information checked against official sources": "Sources",
  };
  const sectionLinks = isHamblePoint
    ? [...contentSectionLinks, { anchor: "sources", heading: "Sources" }]
    : isCowes
      ? [
          { anchor: "guide-introduction-title", heading: "Overview" },
          ...contentSectionLinks.flatMap((item) => cowesNavigationByHeading[item.heading]
            ? [{ ...item, heading: cowesNavigationByHeading[item.heading] }]
            : []),
        ]
      : isYarmouth
        ? [{ anchor: "guide-introduction-title", heading: "Overview" }, ...contentSectionLinks]
      : isPortsmouth
        ? [{ anchor: "guide-introduction-title", heading: "Overview" }, ...contentSectionLinks]
      : isRiverHamble
        ? [
            { anchor: "guide-introduction-title", heading: "Overview" },
            { anchor: "skippers-snapshot", heading: "Skipper's Snapshot" },
            { anchor: "river-hamble-quick-facts", heading: "Quick Facts" },
            ...contentSectionLinks,
          ]
      : isBeaulieuRiver
        ? [
            { anchor: "guide-introduction-title", heading: "Overview" },
            { anchor: "skippers-snapshot", heading: "Skipper's Snapshot" },
            { anchor: "beaulieu-river-quick-facts", heading: "Quick Facts" },
            ...contentSectionLinks,
          ]
      : isNewtownCreek
        ? [
            { anchor: "guide-introduction-title", heading: "Overview" },
            { anchor: "skippers-snapshot", heading: "Skipper's Snapshot" },
            { anchor: "newtown-creek-quick-facts", heading: "Quick Facts" },
            ...contentSectionLinks,
          ]
      : isSouthamptonWater
        ? [
            { anchor: "guide-introduction-title", heading: "Overview" },
            { anchor: "skippers-snapshot", heading: "Skipper's Snapshot" },
            { anchor: "southampton-water-quick-facts", heading: "Quick Facts" },
            ...contentSectionLinks,
          ]
      : contentSectionLinks;
  const hasMap = Number.isFinite(guide.location.latitude)
    && Number.isFinite(guide.location.longitude);
  const mapLocation = {
    latitude: guide.location.latitude,
    longitude: guide.location.longitude,
    mapMetadata: guide.location.mapZoom
      ? { preferredZoom: guide.location.mapZoom }
      : undefined,
  };
  const primarySources = primarySourcesByGuideSlug[guide.slug] || [];

  return (
    <>
      {preview ? <div className="guide-preview-banner">Preview · {guide.status}</div> : null}
      {guide.slug === "solent-marina-guide" && !guide.internalId ? (
        <aside className="guide-legacy-notice" aria-label="Legacy Guide notice">
          <p className="eyebrow">Legacy overview</p>
          <p>
            This page is preserved for existing links. The new Marina Guides collection begins
            with the complete <Link href="/guides/solent/hamble-point-marina">Hamble Point Marina Guide</Link>.
          </p>
          <Link href="/guides?type=Marina#guide-library">Browse current Marina Guides <span aria-hidden="true">→</span></Link>
        </aside>
      ) : null}
      <GuideBreadcrumbs items={[
        { href: "/", label: "Home" },
        { href: "/guides", label: "Guides" },
        ...(guide.regionKey && guide.regionName
          ? [{ href: `/guides/${guide.regionKey}`, label: guide.regionName }]
          : []),
        { label: guide.title },
      ]} />

      <header className="guide-product-hero">
        <figure>
          <img
            src={guide.imageUrl}
            alt={guide.imageAlt}
            decoding="async"
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            style={{ objectPosition: guide.imageFocalPoint }}
          />
          {guide.imageCaption || guide.imageCredit || guide.artworkCredit ? (
            <figcaption>
              {guide.imageCaption}
              {guide.imageCredit || guide.artworkCredit
                ? ` · ${guide.imageCredit || guide.artworkCredit}`
                : ""}
            </figcaption>
          ) : null}
        </figure>
        <div>
          <p className="eyebrow">Old Sea Dogs Guides</p>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
        </div>
      </header>

      <section className="guide-introduction" aria-labelledby="guide-introduction-title">
        <p className="eyebrow">{
          isCowes
            ? "Harbour and marina destination · Solent · River Medina"
            : isYarmouth
              ? "Harbour & Visitor Berthing Guide · The Solent · Western Solent"
              : isPortsmouth
                ? "Harbour Guide · The Solent · Portsmouth Harbour"
                : isRiverHamble
                  ? "River Guide · The Solent · River Hamble"
                  : isBeaulieuRiver
                    ? "River Guide · The Solent · Beaulieu River"
                    : isNewtownCreek
                      ? "Anchorage Guide · The Solent · Newtown Creek"
                      : isSouthamptonWater
                        ? "Estuary & Commercial Waterway Guide · The Solent · Southampton Water"
              : `${guide.guideType} · ${guide.regionName}`
        }</p>
        <h2 id="guide-introduction-title">{isCowes || isYarmouth || isPortsmouth || isRiverHamble || isBeaulieuRiver || isNewtownCreek || isSouthamptonWater ? "Overview" : `Welcome to ${guide.title}`}</h2>
        {(guide.introduction || "").split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      {isRiverHamble ? <RiverHambleSnapshot guide={guide} /> : null}
      {isBeaulieuRiver ? <BeaulieuRiverSnapshot guide={guide} /> : null}
      {isNewtownCreek ? <NewtownCreekSnapshot guide={guide} /> : null}
      {isSouthamptonWater ? <SouthamptonWaterSnapshot guide={guide} /> : null}

      {!isYarmouth && !isPortsmouth && !isRiverHamble && !isBeaulieuRiver && !isNewtownCreek && !isSouthamptonWater ? <GuideSectionNavigation sections={sectionLinks} wrapped={isHamblePoint || isCowes} /> : null}

      <section className="guide-facts" id={isRiverHamble ? "river-hamble-quick-facts" : isBeaulieuRiver ? "beaulieu-river-quick-facts" : isNewtownCreek ? "newtown-creek-quick-facts" : isSouthamptonWater ? "southampton-water-quick-facts" : undefined} aria-label={`${guide.title} at a glance`}>
        {guide.quickFacts.map((fact) => (
          <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>
        ))}
      </section>

      {isYarmouth || isPortsmouth || isRiverHamble || isBeaulieuRiver || isNewtownCreek || isSouthamptonWater ? <GuideSectionNavigation sections={sectionLinks} wrapped /> : null}

      {guide.guideType === "Marina" || guide.guideType === "Harbour" ? (
        isHamblePoint
          ? <HamblePointPracticalReference />
          : isCowes || isYarmouth || isPortsmouth
            ? null
            : guide.quickFacts.length
              ? null
              : <PracticalGuideReference guide={guide} hasMap={hasMap} />
      ) : null}

      <article className={`guide-body guide-product-body ${isCowes ? "cowes-guide-body" : isYarmouth ? "yarmouth-guide-body" : isPortsmouth ? "portsmouth-guide-body" : isRiverHamble ? "river-hamble-guide-body" : isBeaulieuRiver ? "beaulieu-river-guide-body" : isNewtownCreek ? "newtown-creek-guide-body" : isSouthamptonWater ? "southampton-water-guide-body" : ""}`}>
        {guide.sections.map((section, sectionIndex) => {
          const anchor = contentSectionLinks[sectionIndex].anchor;
          const cowesSectionClass = isCowes
            ? section.heading === "Navigation Warnings"
              ? "cowes-navigation-warning-panel"
              : /Cowes Yacht Haven|Shepards Marina|East Cowes Marina|Harbour Moorings and Trinity Landing/.test(section.heading)
                ? "cowes-berth-panel"
                : "cowes-full-width-section"
            : "";
          const yarmouthSectionClass = isYarmouth
            ? section.heading === "Navigation Notes"
              ? "yarmouth-navigation-warning-panel"
              : /Visitor Berthing|Fuel|Water & Electricity|Harbour Facilities/.test(section.heading)
                ? "yarmouth-information-panel"
                : "yarmouth-full-width-section"
            : "";
          const portsmouthSectionClass = isPortsmouth
            ? section.heading === "Navigation Warnings"
              ? "portsmouth-navigation-warning-panel"
              : /Gunwharf Quays Marina|Haslar Marina|Gosport Marina|Port Solent|Fuel|Water & Electricity|Harbour Facilities/.test(section.heading)
                ? "portsmouth-information-panel"
                : "portsmouth-full-width-section"
            : "";
          const riverHambleSectionClass = isRiverHamble
            ? section.heading === "Speed Limits"
              ? "river-hamble-speed-warning-panel"
              : /Principal Marinas|Visitor Berthing|Fuel|Water & Electricity|Marine Services/.test(section.heading)
                ? "river-hamble-information-panel"
                : "river-hamble-full-width-section"
            : "";
          const beaulieuRiverSectionClass = isBeaulieuRiver
            ? section.heading === "Navigation"
              ? "beaulieu-navigation-panel"
              : /Visitor Moorings|Buckler's Hard|Facilities|Wildlife & Conservation/.test(section.heading)
                ? "beaulieu-information-panel"
                : "beaulieu-full-width-section"
            : "";
          const newtownCreekSectionClass = isNewtownCreek
            ? section.heading === "Entrance & Navigation"
              ? "newtown-navigation-panel"
              : /Anchoring|Visitor Moorings|Landing Ashore|Wildlife & Conservation/.test(section.heading)
                ? "newtown-information-panel"
                : "newtown-full-width-section"
            : "";
          const southamptonWaterSectionClass = isSouthamptonWater
            ? section.heading === "Navigation"
              ? "southampton-navigation-panel"
              : /Southampton VTS|Commercial Shipping|Marinas & Visitor Berthing|Fuel|Marine Services|Cruise & Commercial Terminals/.test(section.heading)
                ? "southampton-information-panel"
                : "southampton-full-width-section"
            : "";
          return (
            <section
              className={`${section.kind === "callout" ? "old-sea-dogs-view" : section.kind === "quote" ? "guide-quote-section" : ""} ${cowesSectionClass} ${yarmouthSectionClass} ${portsmouthSectionClass} ${riverHambleSectionClass} ${beaulieuRiverSectionClass} ${newtownCreekSectionClass} ${southamptonWaterSectionClass}`.trim()}
              id={anchor}
              key={anchor}
            >
              <h2>{section.heading}</h2>
              {section.body.map((paragraph, paragraphIndex) => (
                <div key={`${anchor}-${paragraphIndex}`}>
                  <p>{paragraph}</p>
                  {guide.inlineImages
                    .filter((image) => image.sectionIndex === sectionIndex && image.paragraphIndex === paragraphIndex)
                    .sort((left, right) => left.order - right.order)
                    .map((image) => (
                      <figure className="article-inline-figure" key={image.id}>
                        <img loading="lazy" src={image.url} alt={image.alt} />
                        <figcaption>{image.caption}{image.credit ? ` · ${image.credit}` : ""}</figcaption>
                      </figure>
                    ))}
                </div>
              ))}
              {guideSectionImagesFor(guide.slug, section.heading).map((image) => (
                <figure className="article-inline-figure" key={image.id}>
                  <img loading="lazy" src={image.url} alt={image.alt} />
                </figure>
              ))}
              {section.listItems?.length ? <ul>{section.listItems.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              {section.links?.length ? (
                <div className="guide-section-links" aria-label={`Continue from ${section.heading}`}>
                  {section.links.flatMap((link) => {
                    const linkedGuide = bySlug.get(link.guideSlug);
                    return linkedGuide
                      ? [<Link href={guidePublicPath(linkedGuide)} key={link.guideSlug}>{link.label} <span aria-hidden="true">→</span></Link>]
                      : [];
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </article>

      {guide.guideType === "Marina" && guide.verifiedFacilities.length ? (
        <section className="guide-verified-facilities" id={isHamblePoint ? "sources" : undefined} aria-labelledby="guide-facilities-title">
          <div>
            <p className="eyebrow">Confirmed information</p>
            <h2 id="guide-facilities-title">Verified facilities</h2>
            <p>Stable facilities checked against the marina&apos;s official information. Confirm operational details before arrival.</p>
            {primarySources.length ? (
              <aside className="guide-source-assurance" aria-label="Guide source verification">
                <strong>Information checked against official sources</strong>
                <p>Primary sources:</p>
                <ul>
                  {primarySources.map((source) => <li key={source}>{source}</li>)}
                </ul>
              </aside>
            ) : null}
          </div>
          <dl>
            {guide.verifiedFacilities.map((facility) => (
              <div key={facility.label}>
                <dt>{facility.label}</dt>
                <dd>{facility.detail}</dd>
              </div>
            ))}
          </dl>
          {guide.sourceLinks.find((source) => /^https?:\/\//i.test(source.href)) ? (
            <a className="button-secondary" href={guide.sourceLinks.find((source) => /^https?:\/\//i.test(source.href))?.href} rel="noopener noreferrer" target="_blank">
              Official marina information
            </a>
          ) : null}
        </section>
      ) : null}

      {hasMap ? (
        <section className="guide-map-section" aria-label={`${guide.title} orientation map`}>
          <GuideGoogleMap marinaName={guide.title} location={mapLocation} />
          <p className="guide-navigation-warning">
            This map is provided for general orientation only and must not be used for navigation.
          </p>
          {guide.location.what3words || guide.location.osGridReference ? (
            <dl>
              {guide.location.what3words ? <><dt>What3Words</dt><dd>{guide.location.what3words}</dd></> : null}
              {guide.location.osGridReference ? <><dt>OS Grid Reference</dt><dd>{guide.location.osGridReference}</dd></> : null}
            </dl>
          ) : null}
        </section>
      ) : null}

      {cruiseOn.length ? (
        <section className="guide-cruise-on" aria-labelledby="guide-cruise-on-title">
          <div>
            <p className="eyebrow">Cruise On</p>
            <h2 id="guide-cruise-on-title">Where the water leads next</h2>
          </div>
          <div>
            {cruiseOn.map((item) => (
              <article key={item.slug}>
                <h3><Link href={guidePublicPath(item)}>{item.title}</Link></h3>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="guide-related" aria-labelledby="guide-related-title">
          <div className="section-heading">
            <p className="eyebrow">Related Guides</p>
            <h2 id="guide-related-title">Keep exploring {guide.regionName}</h2>
          </div>
          <div className="guide-related-grid">
            {related.map((item) => (
              <article className="guide-card" key={item.slug}>
                <Link className="guide-card-image" href={guidePublicPath(item)}>
                  <img loading="lazy" src={item.imageUrl} alt={item.imageAlt} />
                </Link>
                <div>
                  <p className="eyebrow">{item.guideType}</p>
                  <h3><Link href={guidePublicPath(item)}>{item.title}</Link></h3>
                  <p>{item.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="guide-sequence-navigation" aria-label="Previous and next Guides">
        {previous ? (
          <Link href={guidePublicPath(previous)}><span>Previous Guide</span><strong>{previous.title}</strong></Link>
        ) : (
          <Link href={guide.regionKey ? `/guides/${guide.regionKey}` : "/guides"}>
            <span>Previous</span>
            <strong>{guide.regionName ? `${guide.regionName} collection` : "All Old Sea Dogs Guides"}</strong>
          </Link>
        )}
        {next ? (
          <Link href={guidePublicPath(next)}><span>Next Guide</span><strong>{next.title}</strong></Link>
        ) : (
          <Link href="/guides"><span>Next</span><strong>All Old Sea Dogs Guides</strong></Link>
        )}
      </nav>

      <section className="guide-feedback" aria-labelledby="guide-feedback-title">
        <p className="eyebrow">Local knowledge</p>
        <h2 id="guide-feedback-title">Know this area?</h2>
        <p>
          Old Sea Dogs welcomes constructive feedback from local sailors, harbour users and
          cruising skippers. If you have spotted something that has changed, or have local
          knowledge that would improve this Guide, we would be pleased to hear from you.
        </p>
        <a className="button-secondary" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Guide feedback: ${guide.title}`)}`}>
          Send Guide feedback
        </a>
      </section>
    </>
  );
}
