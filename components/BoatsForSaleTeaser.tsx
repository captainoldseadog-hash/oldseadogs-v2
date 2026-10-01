import Link from "next/link";
import { listPublicBoatListings } from "../lib/classifieds-service.ts";

export async function BoatsForSaleTeaser() {
  let listings: Awaited<ReturnType<typeof listPublicBoatListings>> = [];
  try {
    listings = (await listPublicBoatListings()).slice(0, 3);
  } catch (error) {
    console.error("[OldSeaDogs classifieds] homepage teaser skipped", error);
  }

  return (
    <section className="boats-teaser" aria-labelledby="boats-teaser-title">
      <div className="boats-teaser-copy">
        <p className="eyebrow">Classifieds</p>
        <h2 id="boats-teaser-title">Boats for Sale</h2>
        <p>Free advertisements from private sellers. Browse what is lying nearby, or list your own boat. It costs nothing.</p>
        <div className="boats-teaser-actions">
          <Link className="button-primary" href="/boats-for-sale">Browse boats</Link>
          <Link className="button-secondary" href="/boats-for-sale/list-your-boat">List your boat free</Link>
        </div>
      </div>
      <div className="boats-teaser-list">
        {listings.length === 0 ? (
          <p className="boats-teaser-empty">Be the first to list your boat free.</p>
        ) : listings.map((listing) => (
          <Link href={`/boats-for-sale/${listing.slug}`} key={listing.id}>
            <span>{listing.publicNumber}</span>
            <strong>{listing.title}</strong>
            <small>{listing.chartLabel}</small>
            <em>{listing.priceLabel}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}
