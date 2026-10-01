import type { Metadata } from "next";
import Link from "next/link";
import { CompassRose } from "../../components/boats/BoatsMasthead";
import { CRUISING_GROUNDS, KEEL_TYPES, KEEL_LABELS, BOAT_TYPES, BOAT_TYPE_LABELS } from "../../lib/classifieds-types.ts";
import { filterPublicListings, type ListingQuery, type PublicListing } from "../../lib/classifieds-public.ts";
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
  let listings: PublicListing[] = [];
  try {
    listings = await listPublicBoatListings();
  } catch (error) {
    console.error("[OldSeaDogs classifieds] browse skipped", error);
  }
  const results = filterPublicListings(listings, query);
  const filtering = Object.values(query).some((value) => String(value || "").trim());
  const featured = results[0];
  const cards = results.slice(featured ? 1 : 0);
  const moreOpen = Boolean(query.q || query.keel || query.minYear || query.maxYear || query.minPrice || query.trailerable || query.liveaboard);
  const sort = query.sort || "newest";

  return (
    <>
      <section className="boats-wrap">
        <div className="boats-hero">
          <div>
            <p className="boats-kicker">The Boat Register</p>
            <h1>Boats with a story, <em>sold by the people who sailed them.</em></h1>
            <p className="boats-standfirst">Old Sea Dogs’ free classifieds for private owners: honest descriptions, real photographs and the berth she lies in. No brokers, and no commission.</p>
            <form className="boats-plot" method="get">
              <div className="boats-plot-grid">
                <label>Type
                  <select defaultValue={query.type || ""} name="type">
                    <option value="">Any</option>
                    {BOAT_TYPES.map((type) => <option key={type} value={type}>{BOAT_TYPE_LABELS[type]}</option>)}
                  </select>
                </label>
                <label>Length (ft)
                  <span className="boats-plot-pair">
                    <input aria-label="Minimum length in feet" defaultValue={query.minLength || ""} inputMode="decimal" name="minLength" placeholder="From" type="number" min="0" />
                    <input aria-label="Maximum length in feet" defaultValue={query.maxLength || ""} inputMode="decimal" name="maxLength" placeholder="To" type="number" min="0" />
                  </span>
                </label>
                <label>Price (£)
                  <input aria-label="Maximum price in pounds" defaultValue={query.maxPrice || ""} inputMode="numeric" name="maxPrice" placeholder="Up to" type="number" min="0" />
                </label>
                <label>Cruising ground
                  <select defaultValue={query.ground || ""} name="ground">
                    <option value="">Anywhere</option>
                    {CRUISING_GROUNDS.map((ground) => <option key={ground.slug} value={ground.slug}>{ground.label}</option>)}
                  </select>
                </label>
                <button className="boats-button" type="submit">Plot</button>
              </div>
              <details className="boats-more" open={moreOpen || undefined}>
                <summary>More filters</summary>
                <div className="boats-more-grid">
                  <label>Search<input defaultValue={query.q || ""} name="q" placeholder="Make, model, harbour" type="search" /></label>
                  <label>Keel
                    <select defaultValue={query.keel || ""} name="keel">
                      <option value="">Any</option>
                      {KEEL_TYPES.map((keel) => <option key={keel} value={keel}>{KEEL_LABELS[keel]}</option>)}
                    </select>
                  </label>
                  <label>From year<input defaultValue={query.minYear || ""} inputMode="numeric" name="minYear" type="number" min="1900" /></label>
                  <label>To year<input defaultValue={query.maxYear || ""} inputMode="numeric" name="maxYear" type="number" min="1900" /></label>
                  <label>Min price (£)<input defaultValue={query.minPrice || ""} inputMode="numeric" name="minPrice" type="number" min="0" /></label>
                  <label className="boats-check"><input defaultChecked={query.trailerable === "1"} name="trailerable" type="checkbox" value="1" /> Trailerable</label>
                  <label className="boats-check"><input defaultChecked={query.liveaboard === "1"} name="liveaboard" type="checkbox" value="1" /> Liveaboard</label>
                  <input name="sort" type="hidden" value={sort} />
                </div>
              </details>
            </form>
          </div>
          <figure className="boats-frame">
            {featured?.photos[0] ? (
              <>
                <img alt={featured.photos[0].alt} height={featured.photos[0].height || 1000} src={featured.photos[0].src} width={featured.photos[0].width || 1600} />
                <CompassRose />
                <figcaption><span>Above: {featured.title}, {featured.location}.</span><b>{featured.priceLabel}</b></figcaption>
              </>
            ) : (
              <div className="boats-frame-empty">
                <CompassRose />
                <p>The board is clear. The first boat to be listed will sit here.</p>
              </div>
            )}
          </figure>
        </div>

        {listings.length === 0 ? (
          <section className="boats-empty">
            <p className="boats-kicker">The board is clear</p>
            <h2>Be the first to list your boat free</h2>
            <p>A private-seller advertisement runs for three months. It costs nothing. We email you every fortnight while it is up, and at three months we ask whether to keep it running.</p>
            <Link className="boats-button" href="/boats-for-sale/list-your-boat">List your boat free</Link>
          </section>
        ) : results.length === 0 ? (
          <section className="boats-empty">
            <h2>No boats match that course</h2>
            <p>{filtering ? "Try a wider length, price or cruising ground." : "Nothing is listed just now."}</p>
            <Link className="boats-text-link" href="/boats-for-sale">Clear filters</Link>
          </section>
        ) : (
          <>
            <div className="boats-section-heading">
              <h2>Recently entered</h2>
              <div className="boats-sort">
                {(["newest", "price-asc", "length", "year"] as const).map((key) => (
                  <Link aria-current={sort === key ? "true" : undefined} href={browseHref(query, { sort: key })} key={key}>
                    {key === "newest" ? "Newest" : key === "price-asc" ? "Price" : key === "length" ? "Length" : "Year"}
                  </Link>
                ))}
              </div>
            </div>
            {featured ? <Lead listing={featured} /> : null}
            {cards.length > 0 ? (
              <div className="boats-grid">
                {cards.map((listing) => <Card key={listing.id} listing={listing} />)}
              </div>
            ) : null}
          </>
        )}

        <div className="boats-section-heading" id="grounds">
          <h2>Where they lie</h2>
        </div>
        <div className="boats-ground-grid">
          {CRUISING_GROUNDS.map((ground) => {
            const count = listings.filter((listing) => listing.cruisingGround === ground.slug).length;
            return (
              <Link className={`boats-ground ${query.ground === ground.slug ? "is-active" : ""}`} href={`/boats-for-sale?ground=${ground.slug}`} key={ground.slug}>
                <span>{ground.label}</span>
                <small>{count === 0 ? ground.blurb : `${count} ${count === 1 ? "boat" : "boats"} listed`}</small>
              </Link>
            );
          })}
        </div>
      </section>
      <RegisterBand />
    </>
  );
}

function Lead({ listing }: { listing: PublicListing }) {
  const quote = listing.description.split(/(?<=\.)\s/)[0] || "";
  return (
    <article className="boats-lead">
      {listing.photos[0] ? <img alt={listing.photos[0].alt} height={listing.photos[0].height || 1000} src={listing.photos[0].src} width={listing.photos[0].width || 1600} /> : <div className="boats-frame-empty">Photograph to follow</div>}
      <div>
        <p className="boats-number">{listing.publicNumber}</p>
        <p className="boats-chart-label">{listing.chartLabel}</p>
        <h3>{listing.title.replace(/^Example only — /, "")}</h3>
        <p>{[listing.make, listing.model, listing.year, listing.location].filter(Boolean).join(" · ")}</p>
        {quote ? <p className="boats-quote">{quote}</p> : null}
        <p className="boats-price">{listing.priceLabel}</p>
        <Link className="boats-text-link" href={`/boats-for-sale/${listing.slug}`}>Read the entry</Link>
      </div>
    </article>
  );
}

function Card({ listing }: { listing: PublicListing }) {
  return (
    <article className="boats-card">
      <Link href={`/boats-for-sale/${listing.slug}`}>
        <p className="boats-number">{listing.publicNumber}</p>
        <p className="boats-chart-label">{listing.chartLabel}</p>
        <div className="boats-card-media">
          {listing.photos[0] ? <img alt="" height={listing.photos[0].height || 640} src={listing.photos[0].thumb} width={listing.photos[0].width || 960} /> : <span className="boats-card-placeholder">Photograph to follow</span>}
        </div>
        <h2>{listing.title.replace(/^Example only — /, "")}</h2>
        <p className="boats-card-meta">{[listing.location, listing.lengthLabel, listing.keelLabel].filter(Boolean).join(" · ")}</p>
        <p className="boats-price">{listing.priceLabel}</p>
      </Link>
    </article>
  );
}

function RegisterBand() {
  return (
    <section className="boats-sell">
      <div className="boats-sell-inner">
        <div>
          <p className="boats-kicker">For owners</p>
          <h2>Enter your boat in the Register. It’s free.</h2>
          <p>Write her up in your own words, add your photographs and tell buyers where she lies. Your advertisement runs for three months. We send a short note every fortnight to say it is still running, and at three months we ask whether you would like to keep it going.</p>
          <div className="boats-sell-actions">
            <Link className="boats-button" href="/boats-for-sale/list-your-boat">List your boat free</Link>
            <a className="boats-button boats-button-quiet" href="#grounds">Where they lie</a>
          </div>
        </div>
        <ol className="boats-course" aria-label="How a free advertisement runs">
          <li><span>Week 0</span>You list it. Nothing is public until you confirm your email and the editor approves it.</li>
          <li><span>Every fortnight</span>A short note, with a link to mark her sold, change the wording or take her down.</li>
          <li><span>Three months</span>We ask once. One confirmation keeps the advertisement up for another three months.</li>
        </ol>
      </div>
    </section>
  );
}

function browseHref(query: ListingQuery, patch: Record<string, string>) {
  const params = new URLSearchParams();
  const next = { ...query, ...patch };
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `/boats-for-sale?${text}` : "/boats-for-sale";
}
