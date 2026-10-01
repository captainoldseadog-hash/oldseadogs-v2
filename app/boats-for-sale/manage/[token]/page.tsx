import type { Metadata } from "next";
import Link from "next/link";
import { CRUISING_GROUNDS, KEEL_LABELS, KEEL_TYPES, BOAT_TYPES, BOAT_TYPE_LABELS, VAT_LABELS, VAT_STATUSES } from "../../../../lib/classifieds-types.ts";
import { readSellerListing } from "../../../../lib/classifieds-service.ts";
import { createPageMetadata } from "../../../../lib/seo.ts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Manage your advertisement",
  description: "Manage a free Old Sea Dogs boat advertisement.",
  path: "/boats-for-sale/manage",
  noIndex: true,
});

export default async function ManageBoatPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; error?: string }>;
}) {
  const [{ token: rawToken }, query] = await Promise.all([params, searchParams]);
  const token = decodeURIComponent(rawToken);
  const context = await readSellerListing(token, "manage");
  if (!context) {
    return (
      <main className="boats-wrap boats-closed">
        <h1>This link has expired</h1>
        <p>Ask us to send a fresh one by listing the boat again, or write to the editor if the advertisement is still running.</p>
        <Link className="boats-button" href="/boats-for-sale/list-your-boat">List your boat</Link>
      </main>
    );
  }
  const listing = context.listing;
  return (
    <main className="boats-wrap boats-logbook-page">
      <p className="boats-kicker">Your advertisement</p>
      <h1>{listing.title || "Untitled boat"}</h1>
      <p>Status: {listing.status.replaceAll("_", " ")}. Use this page to mark the boat sold, take the advertisement down, change the wording, or delete your details.</p>
      {query.done ? <p className="boats-note" role="status">Saved.</p> : null}
      {query.error ? <p className="boats-note boats-note-error" role="alert">That change could not be saved. Check the form and try again.</p> : null}
      <div className="boats-manage-actions">
        <form action="/api/boats/manage" method="post"><input name="token" type="hidden" value={token} /><input name="action" type="hidden" value="sold" /><button className="boats-button" type="submit">Mark as sold</button></form>
        <form action="/api/boats/manage" method="post"><input name="token" type="hidden" value={token} /><input name="action" type="hidden" value="remove" /><button className="boats-button boats-button-quiet" type="submit">Take it down</button></form>
        <form action="/api/boats/manage" method="post"><input name="token" type="hidden" value={token} /><input name="action" type="hidden" value="delete" /><button className="boats-button boats-button-quiet" type="submit">Delete my details now</button></form>
      </div>
      <form action="/api/boats/manage" className="boats-logbook" method="post">
        <input name="token" type="hidden" value={token} />
        <input name="action" type="hidden" value="edit" />
        <fieldset>
          <legend>Change the wording</legend>
          <label>Title<input defaultValue={listing.title} name="title" required type="text" /></label>
          <label>Name<input defaultValue={listing.sellerName} name="sellerName" required type="text" /></label>
          <label>Email<input defaultValue={listing.sellerEmail} name="sellerEmail" required type="email" /></label>
          <label>Telephone<input defaultValue={listing.sellerPhone} name="sellerPhone" type="tel" /></label>
          <label className="boats-check"><input defaultChecked={listing.showPhone} name="showPhone" type="checkbox" value="true" /> Show my telephone number</label>
          <label>Make<input defaultValue={listing.make} name="make" required type="text" /></label>
          <label>Model<input defaultValue={listing.model} name="model" type="text" /></label>
          <label>Year<input defaultValue={listing.year ?? ""} name="year" type="number" /></label>
          <label>Length in feet<input defaultValue={listing.lengthFeet ?? ""} name="lengthFeet" type="number" step="0.1" /></label>
          <label>Type<select defaultValue={listing.boatType} name="boatType">{BOAT_TYPES.map((type) => <option key={type} value={type}>{BOAT_TYPE_LABELS[type]}</option>)}</select></label>
          <label>Keel<select defaultValue={listing.keel} name="keel">{KEEL_TYPES.map((keel) => <option key={keel} value={keel}>{KEEL_LABELS[keel]}</option>)}</select></label>
          <label>Engine<input defaultValue={listing.engine} name="engine" type="text" /></label>
          <label>Berths<input defaultValue={listing.berths ?? ""} name="berths" type="number" /></label>
          <label>Lying<input defaultValue={listing.location} name="location" required type="text" /></label>
          <label>Cruising ground<select defaultValue={listing.cruisingGround} name="cruisingGround">{CRUISING_GROUNDS.map((ground) => <option key={ground.slug} value={ground.slug}>{ground.label}</option>)}</select></label>
          <label>Price in pounds<input defaultValue={listing.priceGbp ?? ""} name="priceGbp" type="number" /></label>
          <label>VAT<select defaultValue={listing.vatStatus} name="vatStatus">{VAT_STATUSES.map((status) => <option key={status} value={status}>{VAT_LABELS[status]}</option>)}</select></label>
          <label className="boats-wide">Description<textarea defaultValue={listing.description} name="description" required rows={8} /></label>
          <label className="boats-check"><input defaultChecked={listing.trailerable} name="trailerable" type="checkbox" value="true" /> Trailerable</label>
          <label className="boats-check"><input defaultChecked={listing.liveaboard} name="liveaboard" type="checkbox" value="true" /> Liveaboard</label>
          <button className="boats-button" type="submit">Save changes</button>
        </fieldset>
      </form>
    </main>
  );
}
