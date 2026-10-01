"use client";

import { useCallback, useEffect, useState } from "react";

type HelmListing = {
  id: string;
  title: string;
  status: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  location: string;
  priceGbp: number | null;
  make: string;
  model: string;
  year: number | null;
  lengthFeet: number | null;
  boatType: string;
  keel: string;
  description: string;
  tier: string;
  publicNumber: number;
  expiresAt: string | null;
  approvedAt: string | null;
  rejectionNote: string;
  moderationNote: string;
  example: boolean;
  updatedAt: string;
};

const actions = [
  ["approve", "Approve"],
  ["reject", "Reject"],
  ["sold", "Mark sold"],
  ["extend", "Extend 3 months"],
  ["remove", "Remove"],
  ["delete", "Delete data"],
] as const;

export default function BoatsForSaleManager() {
  const [listings, setListings] = useState<HelmListing[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("pending");

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

  async function act(action: string, id: string) {
    const response = await fetch("/api/boats/moderate", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ action, id, note, moderationNote: note }),
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setError(payload.error || "That action failed.");
      return;
    }
    setNote("");
    await load(id);
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
              <button className={selected?.id === listing.id ? "is-selected" : ""} onClick={() => setSelectedId(listing.id)} type="button">
                <strong>{listing.title || "Untitled"}</strong>
                <span>{listing.status} · {listing.sellerName}</span>
                {listing.example ? <span>Example</span> : null}
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <article className="bridge-panel">
            <p className="boats-kicker">{selected.tier} · {selected.publicNumber ? `No. ${String(selected.publicNumber).padStart(3, "0")}` : "Not numbered"}</p>
            <h2>{selected.title || "Untitled"}</h2>
            <p>{selected.make} {selected.model} · {selected.location}</p>
            <dl className="bridge-definition-list">
              <div><dt>Seller</dt><dd>{selected.sellerName}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${selected.sellerEmail}`}>{selected.sellerEmail}</a></dd></div>
              <div><dt>Phone</dt><dd>{selected.sellerPhone || "Not given"}</dd></div>
              <div><dt>Price</dt><dd>{selected.priceGbp === null ? "POA" : `£${selected.priceGbp}`}</dd></div>
              <div><dt>Expires</dt><dd>{selected.expiresAt ? selected.expiresAt.slice(0, 10) : "Not approved"}</dd></div>
            </dl>
            <p>{selected.description}</p>
            <label>Note for this action
              <textarea onChange={(event) => setNote(event.target.value)} rows={3} value={note} />
            </label>
            <div className="boats-helm-actions">
              {actions.map(([action, label]) => (
                <button key={action} onClick={() => void act(action, selected.id)} type="button">{label}</button>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
