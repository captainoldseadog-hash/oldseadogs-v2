"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BOAT_TYPE_LABELS,
  BOAT_TYPES,
  CRUISING_GROUNDS,
  KEEL_LABELS,
  KEEL_TYPES,
  VAT_LABELS,
  VAT_STATUSES,
  type ClassifiedPhoto,
} from "../../../lib/classifieds-types";

type MailFailure = {
  kind: string;
  at: string;
  subject: string;
  canResend: boolean;
};

type HelmListing = {
  id: string;
  title: string;
  status: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  showPhone: boolean;
  sellerType?: string;
  location: string;
  cruisingGround: string;
  priceGbp: number | null;
  make: string;
  model: string;
  year: number | null;
  lengthFeet: number | null;
  boatType: string;
  keel: string;
  engine: string;
  berths: number | null;
  vatStatus: string;
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  tier: string;
  publicNumber: number;
  expiresAt: string | null;
  approvedAt: string | null;
  rejectionNote: string;
  moderationNote: string;
  example: boolean;
  updatedAt: string;
  photos: ClassifiedPhoto[];
  mailFailures?: MailFailure[];
};

type EditDraft = {
  title: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  showPhone: boolean;
  sellerType: string;
  location: string;
  cruisingGround: string;
  priceGbp: string;
  make: string;
  model: string;
  year: string;
  lengthFeet: string;
  boatType: string;
  keel: string;
  engine: string;
  berths: string;
  vatStatus: string;
  description: string;
  trailerable: boolean;
  liveaboard: boolean;
  tier: string;
};

const actions = [
  ["approve", "Approve"],
  ["reject", "Reject"],
  ["sold", "Mark sold"],
  ["extend", "Extend 3 months"],
  ["remove", "Remove"],
  ["delete", "Delete data"],
] as const;

const successText: Record<string, string> = {
  approve: "Advertisement approved.",
  reject: "Advertisement rejected.",
  sold: "Marked as sold.",
  extend: "Extended by three months.",
  remove: "Advertisement removed from sale.",
  delete: "Advertisement and its photographs deleted.",
  save: "Changes saved.",
  photos: "Photographs updated.",
  resend: "The failed email was sent again.",
};

function draftFromListing(listing: HelmListing): EditDraft {
  return {
    title: listing.title,
    sellerName: listing.sellerName,
    sellerEmail: listing.sellerEmail,
    sellerPhone: listing.sellerPhone,
    showPhone: listing.showPhone,
    sellerType: listing.sellerType === "trade" ? "trade" : "private",
    location: listing.location,
    cruisingGround: listing.cruisingGround,
    priceGbp: listing.priceGbp === null ? "" : String(listing.priceGbp),
    make: listing.make,
    model: listing.model,
    year: listing.year === null ? "" : String(listing.year),
    lengthFeet: listing.lengthFeet === null ? "" : String(listing.lengthFeet),
    boatType: listing.boatType,
    keel: listing.keel,
    engine: listing.engine,
    berths: listing.berths === null ? "" : String(listing.berths),
    vatStatus: listing.vatStatus,
    description: listing.description,
    trailerable: listing.trailerable,
    liveaboard: listing.liveaboard,
    tier: listing.tier === "featured" ? "featured" : "free",
  };
}

function photoSrc(photo: ClassifiedPhoto, thumb = false) {
  return thumb ? `/boats-media/${photo.id}?variant=thumb` : `/boats-media/${photo.id}`;
}

export default function BoatsForSaleManager() {
  const [listings, setListings] = useState<HelmListing[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("pending");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (preferred = "") => {
    const response = await fetch("/api/boats/moderate", { cache: "no-store" });
    const payload = await response.json() as { error?: string; listings?: HelmListing[] };
    if (!response.ok) {
      setError(payload.error || "The boats desk could not be loaded.");
      return;
    }
    const next = payload.listings || [];
    setListings(next);
    setSelectedId((current) => next.some((listing) => listing.id === (preferred || current)) ? (preferred || current) : next[0]?.id || "");
    setError("");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(""); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = listings.filter((listing) => filter === "all" || listing.status === filter);
  const selected = listings.find((listing) => listing.id === selectedId) || visible[0] || null;

  function choose(id: string) {
    setSelectedId(id);
    setEditing(false);
    setDraft(null);
  }

  async function act(action: string, id: string, extra: Record<string, unknown> = {}) {
    const listing = listings.find((item) => item.id === id);
    const title = listing?.title || "this advertisement";
    if (action === "delete" && !window.confirm(`Delete “${title}” and its photographs? This cannot be undone.`)) return;
    if (action === "remove" && !window.confirm(`Remove “${title}” from sale? It will leave the public board.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/boats/moderate", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ action, id, note, moderationNote: note, ...extra }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        setError(payload.error || "That action failed.");
        return;
      }
      if (action !== "reject" && action !== "save") setNote("");
      if (action === "save") {
        setEditing(false);
        setDraft(null);
      }
      setMessage(successText[action] || "Saved.");
      await load(action === "delete" ? "" : id);
    } finally {
      setBusy(false);
    }
  }

  function updatePhotos(photoIds: string[]) {
    if (!selected) return;
    void act("photos", selected.id, { photoIds });
  }

  function movePhoto(photoId: string, direction: -1 | 1) {
    if (!selected) return;
    const ids = selected.photos.map((photo) => photo.id);
    const index = ids.indexOf(photoId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const swapped = [...ids];
    [swapped[index], swapped[next]] = [swapped[next], swapped[index]];
    updatePhotos(swapped);
  }

  function removePhoto(photoId: string) {
    if (!selected) return;
    if (!window.confirm("Remove this photograph from the advertisement?")) return;
    updatePhotos(selected.photos.filter((photo) => photo.id !== photoId).map((photo) => photo.id));
  }

  function startEdit() {
    if (!selected) return;
    setDraft(draftFromListing(selected));
    setEditing(true);
    setMessage("");
    setError("");
  }

  return (
    <div className="boats-helm">
      <header className="bridge-panel-heading">
        <div>
          <p className="eyebrow">Classifieds</p>
          <h1>Boats for Sale</h1>
          <p className="bridge-muted">New advertisements arrive as Pending. Only approved advertisements are public. Seller emails stay in this desk.</p>
        </div>
      </header>
      {error ? <p className="bridge-error" role="alert">{error}</p> : null}
      {message ? <p className="boats-helm-success" role="status">{message}</p> : null}
      <div className="boats-helm-filters" aria-label="Advertisement status">
        {["pending", "approved", "rejected", "sold", "expired", "removed", "all"].map((status) => (
          <button aria-pressed={filter === status} className={filter === status ? "is-selected" : ""} key={status} onClick={() => setFilter(status)} type="button">
            {status} ({status === "all" ? listings.length : listings.filter((listing) => listing.status === status).length})
          </button>
        ))}
      </div>
      <div className="boats-helm-layout">
        <ul className="boats-helm-list">
          {visible.length === 0 ? <li>Nothing in this tray.</li> : visible.map((listing) => (
            <li key={listing.id}>
              <button className={selected?.id === listing.id ? "is-selected" : ""} onClick={() => choose(listing.id)} type="button">
                {listing.photos?.[0] ? <img alt="" src={photoSrc(listing.photos[0], true)} /> : <span className="boats-helm-nophoto">No photo</span>}
                <span>
                  <strong>{listing.title || "Untitled"}</strong>
                  <span>{listing.status} · {listing.sellerType === "trade" ? "Trade" : "Private"} · {listing.sellerName}</span>
                  {listing.example ? <span>Example</span> : null}
                  {listing.mailFailures?.length ? <span className="boats-helm-mail-flag">Email failed</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <article className="bridge-panel">
            <p className="boats-kicker">{selected.tier} · {selected.publicNumber ? `No. ${String(selected.publicNumber).padStart(3, "0")}` : "Not numbered"}</p>
            <h2>{selected.title || "Untitled"}</h2>
            <p>{selected.make} {selected.model} · {selected.location}</p>
            {selected.mailFailures?.length ? (
              <p className="boats-helm-mail" role="status">
                <strong>Email failed</strong>
                <span>{selected.mailFailures.map((failure) => failure.subject || failure.kind).join(" · ")}</span>
                {selected.mailFailures.some((failure) => failure.canResend) ? (
                  <button disabled={busy} onClick={() => void act("resend", selected.id)} type="button">Resend</button>
                ) : (
                  <span>This message is not kept, so it cannot be resent from the desk.</span>
                )}
              </p>
            ) : null}
            <div className="boats-helm-photos" aria-label="Advertisement photographs">
              {selected.photos?.length ? selected.photos.map((photo, index) => (
                <figure className="boats-helm-photo" key={photo.id}>
                  <img alt={photo.alt || selected.title} src={photoSrc(photo, true)} />
                  <figcaption>{index === 0 ? "Cover" : `Photo ${index + 1}`}</figcaption>
                  <div className="boats-helm-photo-actions">
                    <button disabled={busy || index === 0} onClick={() => updatePhotos([photo.id, ...selected.photos.filter((item) => item.id !== photo.id).map((item) => item.id)])} type="button">Make cover</button>
                    <button disabled={busy || index === 0} onClick={() => movePhoto(photo.id, -1)} type="button">Earlier</button>
                    <button disabled={busy || index === selected.photos.length - 1} onClick={() => movePhoto(photo.id, 1)} type="button">Later</button>
                    <button disabled={busy} onClick={() => removePhoto(photo.id)} type="button">Remove</button>
                  </div>
                </figure>
              )) : <p className="bridge-muted">No photographs on this advertisement.</p>}
            </div>
            <dl className="bridge-definition-list">
              <div><dt>Seller</dt><dd>{selected.sellerName}</dd></div>
              <div><dt>Seller type</dt><dd>{selected.sellerType === "trade" ? "Trade" : "Private"}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${selected.sellerEmail}`}>{selected.sellerEmail}</a></dd></div>
              <div><dt>Phone</dt><dd>{selected.sellerPhone || "Not given"}</dd></div>
              <div><dt>Price</dt><dd>{selected.priceGbp === null ? "POA" : `£${selected.priceGbp}`}</dd></div>
              <div><dt>Expires</dt><dd>{selected.expiresAt ? selected.expiresAt.slice(0, 10) : "Not approved"}</dd></div>
            </dl>
            <p>{selected.description}</p>
            {editing && draft ? (
              <form className="boats-helm-form" onSubmit={(event) => { event.preventDefault(); void act("save", selected.id, draft); }}>
                <h3>Edit advertisement</h3>
                <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
                <div className="bridge-field-row">
                  <label>Make<input value={draft.make} onChange={(event) => setDraft({ ...draft, make: event.target.value })} /></label>
                  <label>Model<input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} /></label>
                </div>
                <div className="bridge-field-row">
                  <label>Year<input inputMode="numeric" value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} /></label>
                  <label>Length (feet)<input inputMode="decimal" value={draft.lengthFeet} onChange={(event) => setDraft({ ...draft, lengthFeet: event.target.value })} /></label>
                </div>
                <div className="bridge-field-row">
                  <label>Type
                    <select value={draft.boatType} onChange={(event) => setDraft({ ...draft, boatType: event.target.value })}>
                      {BOAT_TYPES.map((type) => <option key={type} value={type}>{BOAT_TYPE_LABELS[type]}</option>)}
                    </select>
                  </label>
                  <label>Keel
                    <select value={draft.keel} onChange={(event) => setDraft({ ...draft, keel: event.target.value })}>
                      {KEEL_TYPES.map((keel) => <option key={keel} value={keel}>{KEEL_LABELS[keel]}</option>)}
                    </select>
                  </label>
                </div>
                <div className="bridge-field-row">
                  <label>Engine<input value={draft.engine} onChange={(event) => setDraft({ ...draft, engine: event.target.value })} /></label>
                  <label>Berths<input inputMode="numeric" value={draft.berths} onChange={(event) => setDraft({ ...draft, berths: event.target.value })} /></label>
                </div>
                <label>Lying<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label>
                <div className="bridge-field-row">
                  <label>Cruising ground
                    <select value={draft.cruisingGround} onChange={(event) => setDraft({ ...draft, cruisingGround: event.target.value })}>
                      {CRUISING_GROUNDS.map((ground) => <option key={ground.slug} value={ground.slug}>{ground.label}</option>)}
                    </select>
                  </label>
                  <label>Price (£, blank for POA)<input inputMode="numeric" value={draft.priceGbp} onChange={(event) => setDraft({ ...draft, priceGbp: event.target.value })} /></label>
                </div>
                <label>VAT
                  <select value={draft.vatStatus} onChange={(event) => setDraft({ ...draft, vatStatus: event.target.value })}>
                    {VAT_STATUSES.map((status) => <option key={status} value={status}>{VAT_LABELS[status]}</option>)}
                  </select>
                </label>
                <label>Description<textarea rows={6} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
                <div className="bridge-field-row">
                  <label>Seller<input value={draft.sellerName} onChange={(event) => setDraft({ ...draft, sellerName: event.target.value })} /></label>
                  <label>Seller email<input type="email" value={draft.sellerEmail} onChange={(event) => setDraft({ ...draft, sellerEmail: event.target.value })} /></label>
                </div>
                <div className="bridge-field-row">
                  <label>Phone<input value={draft.sellerPhone} onChange={(event) => setDraft({ ...draft, sellerPhone: event.target.value })} /></label>
                  <label>Seller type
                    <select value={draft.sellerType} onChange={(event) => setDraft({ ...draft, sellerType: event.target.value })}>
                      <option value="private">Private</option>
                      <option value="trade">Trade</option>
                    </select>
                  </label>
                </div>
                <label className="boats-helm-check"><input checked={draft.showPhone} onChange={(event) => setDraft({ ...draft, showPhone: event.target.checked })} type="checkbox" /> Show phone on the public page</label>
                <label className="boats-helm-check"><input checked={draft.trailerable} onChange={(event) => setDraft({ ...draft, trailerable: event.target.checked })} type="checkbox" /> Trailerable</label>
                <label className="boats-helm-check"><input checked={draft.liveaboard} onChange={(event) => setDraft({ ...draft, liveaboard: event.target.checked })} type="checkbox" /> Liveaboard</label>
                <label>Desk tier
                  <select value={draft.tier} onChange={(event) => setDraft({ ...draft, tier: event.target.value })}>
                    <option value="free">Free</option>
                    <option value="featured">Featured</option>
                  </select>
                </label>
                <div className="boats-helm-actions">
                  <button className="bridge-primary-action" disabled={busy} type="submit">Save changes</button>
                  <button disabled={busy} onClick={() => { setEditing(false); setDraft(null); }} type="button">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="boats-helm-actions">
                <button className="bridge-primary-action" disabled={busy} onClick={startEdit} type="button">Edit</button>
              </div>
            )}
            <label>Note for this action
              <textarea onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
            </label>
            <div className="boats-helm-actions">
              {actions.map(([action, label]) => (
                <button disabled={busy} key={action} onClick={() => void act(action, selected.id)} type="button">{label}</button>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
