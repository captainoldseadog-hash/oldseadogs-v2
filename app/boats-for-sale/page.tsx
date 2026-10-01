import type { Metadata } from "next";
import Link from "next/link";
import { CRUISING_GROUNDS, KEEL_TYPES, KEEL_LABELS, BOAT_TYPES, BOAT_TYPE_LABELS } from "../../lib/classifieds-types.ts";
import { filterPublicListings, type ListingQuery } from "../../lib/classifieds-public.ts";
import { listPublicBoatListings } from "../../lib/classifieds-service.ts";
import { createPageMetadata } from "../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Boats for Sale",
  description: "Free private-seller boats for sale on Old Sea Dogs. Search by type, length, price, year, keel and cruising ground.",
  path: "/boats-for-sale",
});

type BrowseProps = {
  searchParams: Promise<ListingQuery>;
};

export default async function BoatsForSalePage({ searchParams }: BrowseProps) {
  const query = await searchParams;
  let listings: Awaited<ReturnType<typeof listPublicBoatListings>> = [];
  try {
    listings = await listPublicBoatListings();
  } catch (error) {
    console.error("[OldSeaDogs classifieds] browse skipped", error);
  }
  const results = filterPublicListings(listings, query);
  const filtering = Object.values(query).some((value) => String(value || "").trim());

  return (
    <main className="boats-wrap">
      <section className="boats-intro">
        <p>A quiet board for people selling their own boats. Each advertisement runs for three months, is read by the editor before it appears, and never shows the seller’s email address.</p>
      </section>

      <section className="boats-grounds" id="grounds" aria-labelledby="boats-grounds-title">
        <div className="boats-section-heading">
          <p className="boats-kicker">Chart index</p>
          <h2 id="boats-grounds-title">Browse by cruising ground</h2>
        </div>
        <div className="boats-ground-grid">
          {CRUISING_GROUNDS.map((ground) => (
            <Link className={`boats-ground ${query.ground === ground.slug ? "is-active" : ""}`} href={`/boats-for-sale?ground=${ground.slug}`} key={ground.slug}>
              <ChartTile />
              <span>{ground.label}</span>
              <small>{ground.blurb}</small>
            </Link>
          ))}
        </div>
      </section>

      <form className="boats-filters" method="get">
        <div className="boats-filter-search">
          <label htmlFor="boats-q">Search</label>
          <input defaultValue={query.q || ""} id="boats-q" name="q" placeholder="Make, model, harbour" type="search" />
        </div>
        <label>Type
          <select defaultValue={query.type || ""} name="type">
            <option value="">Any</option>
            {BOAT_TYPES.map((type) => <option key={type} value={type}>{BOAT_TYPE_LABELS[type]}</option>)}
          </select>
        </label>
        <label>Keel
          <select defaultValue={query.keel || ""} name="keel">
            <option value="">Any</option>
            {KEEL_TYPES.map((keel) => <option key={keel} value={keel}>{KEEL_LABELS[keel]}</option>)}
          </select>
        </label>
        <label>Cruising ground
          <select defaultValue={query.ground || ""} name="ground">
            <option value="">Anywhere</option>
            {CRUISING_GROUNDS.map((ground) => <option key={ground.slug} value={ground.slug}>{ground.label}</option>)}
          </select>
        </label>
        <label>Min length (ft)<input defaultValue={query.minLength || ""} inputMode="decimal" name="minLength" type="number" min="0" /></label>
        <label>Max length (ft)<input defaultValue={query.maxLength || ""} inputMode="decimal" name="maxLength" type="number" min="0" /></label>
        <label>Min price (£)<input defaultValue={query.minPrice || ""} inputMode="numeric" name="minPrice" type="number" min="0" /></label>
        <label>Max price (£)<input defaultValue={query.maxPrice || ""} inputMode="numeric" name="maxPrice" type="number" min="0" /></label>
        <label>From year<input defaultValue={query.minYear || ""} inputMode="numeric" name="minYear" type="number" min="1900" /></label>
        <label>To year<input defaultValue={query.maxYear || ""} inputMode="numeric" name="maxYear" type="number" min="1900" /></label>
        <label className="boats-check"><input defaultChecked={query.trailerable === "1"} name="trailerable" type="checkbox" value="1" /> Trailerable</label>
        <label className="boats-check"><input defaultChecked={query.liveaboard === "1"} name="liveaboard" type="checkbox" value="1" /> Liveaboard</label>
        <label>Sort
          <select defaultValue={query.sort || "newest"} name="sort">
            <option value="newest">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="length">Length</option>
            <option value="year">Year</option>
          </select>
        </label>
        <button className="boats-button" type="submit">Show boats</button>
      </form>

      {listings.length === 0 ? (
        <section className="boats-empty">
          <p className="boats-kicker">The board is clear</p>
          <h2>Be the first to list your boat free</h2>
          <p>A private-seller advertisement on Old Sea Dogs runs for three months. It costs nothing, and we email you before it ends.</p>
          <Link className="boats-button" href="/boats-for-sale/list-your-boat">List your boat free</Link>
        </section>
      ) : results.length === 0 ? (
        <section className="boats-empty">
          <h2>No boats match that course</h2>
          <p>{filtering ? "Try a wider length, price or cruising ground." : "Nothing is listed just now."}</p>
          <Link className="boats-text-link" href="/boats-for-sale">Clear filters</Link>
        </section>
      ) : (
        <section className="boats-results" aria-label="Boats for sale">
          <p className="boats-count">{results.length} {results.length === 1 ? "boat" : "boats"}</p>
          <div className="boats-grid">
            {results.map((listing) => (
              <article className="boats-card" key={listing.id}>
                <Link href={`/boats-for-sale/${listing.slug}`}>
                  <div className="boats-card-media">
                    {listing.photos[0] ? (
                      <img alt={listing.photos[0].alt} height={listing.photos[0].height || 640} src={listing.photos[0].thumb} width={listing.photos[0].width || 960} />
                    ) : <span className="boats-card-placeholder">Photograph to follow</span>}
                  </div>
                  <p className="boats-number">{listing.publicNumber}</p>
                  <p className="boats-chart-label">{listing.chartLabel}</p>
                  <h2>{listing.title}</h2>
                  <p className="boats-card-meta">{[listing.lengthLabel, listing.year, listing.keelLabel].filter(Boolean).join(" · ")}</p>
                  <p className="boats-price">{listing.priceLabel}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ChartTile() {
  return (
    <svg className="boats-chart-tile" viewBox="0 0 160 90" aria-hidden="true">
      <path d="M4 70 C 30 60, 40 30, 70 40 S 120 80, 156 36" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M4 50 C 36 46, 50 20, 88 28 S 130 60, 156 22" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M20 84 C 48 70, 90 78, 140 58" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
