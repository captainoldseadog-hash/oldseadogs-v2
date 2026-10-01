import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoatGallery } from "../../../components/boats/BoatGallery";
import { JsonLd } from "../../../components/JsonLd";
import { buyerSafetyTips } from "../../../lib/classifieds-copy.ts";
import { listingJsonLd, toPublicListing } from "../../../lib/classifieds-public.ts";
import { getListingBySlug } from "../../../lib/classifieds-service.ts";
import { listingIsPublic } from "../../../lib/classifieds-types.ts";
import { getPublishedGuides } from "../../../lib/site-content.ts";
import { createPageMetadata } from "../../../lib/seo.ts";

export const dynamic = "force-dynamic";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
};

const closedStatuses = new Set(["expired", "sold", "removed"]);

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  const isPublic = Boolean(listing && listingIsPublic(listing));
  const title = listing?.title || "Boat advertisement";
  return createPageMetadata({
    title,
    description: isPublic ? listing?.description.slice(0, 180) || "A private-seller boat advertisement on Old Sea Dogs." : "This Old Sea Dogs boat advertisement is no longer running.",
    path: `/boats-for-sale/${slug}`,
    noIndex: !isPublic,
    image: isPublic && listing?.photos[0] ? { url: `/boats-media/${listing.photos[0].id}`, alt: listing.photos[0].alt || title } : undefined,
  });
}

export default async function BoatListingPage({ params, searchParams }: ListingPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();
  const isPublic = listingIsPublic(listing);
  if (!isPublic && !closedStatuses.has(listing.status)) notFound();
  if (!isPublic) {
    return (
      <main className="boats-wrap boats-closed">
        <p className="boats-kicker">Advertisement closed</p>
        <h1>{listing.title}</h1>
        <p>{listing.status === "sold" ? "The seller has marked this boat as sold." : "This advertisement is no longer running."}</p>
        <Link className="boats-button" href="/boats-for-sale">Back to Boats for Sale</Link>
      </main>
    );
  }

  let guides: Awaited<ReturnType<typeof getPublishedGuides>> = [];
  try {
    guides = await getPublishedGuides();
  } catch (error) {
    console.error("[OldSeaDogs classifieds] marina match skipped", error);
  }
  const view = toPublicListing(listing, guides);
  if (!view) notFound();

  return (
    <main className="boats-wrap boats-feature">
      <JsonLd data={listingJsonLd(view)} />
      <header className="boats-feature-heading">
        <p className="boats-number">{view.publicNumber}</p>
        <p className="boats-chart-label">{view.chartLabel}</p>
        <h1>{view.title}</h1>
        <p>{[view.make, view.model, view.year].filter(Boolean).join(" · ")} · {view.listedLabel} · {view.confirmedLabel}</p>
      </header>
      <BoatGallery photos={view.photos} title={view.title} />
      {view.example ? <p className="boats-example">Example advertisement for layout only. Not a real boat.</p> : null}
      <div className="boats-feature-layout">
        <table className="boats-specs">
          <caption>Particulars</caption>
          <tbody>
            <Row label="Make" value={view.make} />
            <Row label="Model" value={view.model || "Not stated"} />
            <Row label="Year" value={view.year ? String(view.year) : "Not stated"} />
            <Row label="Length" value={view.lengthLabel} />
            <Row label="Type" value={view.boatTypeLabel} />
            <Row label="Keel" value={view.keelLabel} />
            <Row label="Engine" value={view.engine || "Not stated"} />
            <Row label="Berths" value={view.berths === null ? "Not stated" : String(view.berths)} />
            <Row label="Lying" value={view.location} />
            <Row label="Cruising ground" value={view.cruisingGroundLabel} />
            <Row label="Price" value={`${view.priceLabel}. ${view.vatLabel}.`} />
            <Row label="Trailerable" value={view.trailerable ? "Yes" : "No"} />
            <Row label="Liveaboard" value={view.liveaboard ? "Yes" : "No"} />
          </tbody>
        </table>
        <article>
          <div className="boats-prose">
            {view.description.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
          </div>
          {view.marinaGuide ? (
            <p className="boats-guide-link">
              The mooring matches an Old Sea Dogs guide. <Link href={view.marinaGuide.href}>Read the {view.marinaGuide.title}</Link>.
            </p>
          ) : null}
          <section className="boats-safety" aria-labelledby="boats-safety-title">
            <h2 id="boats-safety-title">Before you buy</h2>
            <ul>
              {buyerSafetyTips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </section>
        </article>
        <aside className="boats-contact" aria-labelledby="boats-contact-title">
          <p className="boats-kicker">Contact the seller</p>
          <h2 id="boats-contact-title">{view.priceLabel}</h2>
          <p>{view.sellerName}{view.phone ? ` · ${view.phone}` : ""}</p>
          <p className="boats-contact-note">Your message is emailed to the seller. Their address is not shown.</p>
          {query.sent ? <p className="boats-note" role="status">Your message has been sent to the seller.</p> : null}
          {query.error ? <p className="boats-note boats-note-error" role="alert">{query.error}</p> : null}
          <form action="/api/boats/contact" method="post">
            <input name="slug" type="hidden" value={view.slug} />
            <p className="boats-honeypot" aria-hidden="true">
              <label>Company website<input autoComplete="off" name="companyWebsite" tabIndex={-1} type="text" /></label>
            </p>
            <label>Your name<input autoComplete="name" name="name" required type="text" /></label>
            <label>Your email<input autoComplete="email" name="email" required type="email" /></label>
            <label>Message<textarea name="message" required rows={6} /></label>
            <button className="boats-button" type="submit">Send message</button>
          </form>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <tr><th scope="row">{label}</th><td>{value}</td></tr>;
}
