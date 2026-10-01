"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { BOAT_TYPE_LABELS, BOAT_TYPES, CRUISING_GROUNDS, KEEL_LABELS, KEEL_TYPES, VAT_LABELS, VAT_STATUSES } from "../../../lib/classifieds-types.ts";

type PhotoChip = { id: string; thumb: string; alt: string };

export function ListYourBoatForm({ consentLabel, privacyNotice }: { consentLabel: string; privacyNotice: string }) {
  const [draftToken, setDraftToken] = useState("");
  const [photos, setPhotos] = useState<PhotoChip[]>([]);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function addFiles(files: FileList | File[]) {
    const queue = Array.from(files).slice(0, 30 - photos.length);
    if (queue.length === 0) {
      setStatus("An advertisement can have up to 30 photographs.");
      return;
    }
    setBusy(true);
    setStatus("");
    let token = draftToken;
    const next = [...photos];
    for (const file of queue) {
      const body = new FormData();
      body.set("file", file);
      if (token) body.set("draftToken", token);
      const response = await fetch("/api/boats/photos", { method: "POST", body });
      const payload = await response.json() as { error?: string; draftToken?: string; photo?: { id: string; thumb: string; alt: string } };
      if (!response.ok || !payload.photo) {
        setStatus(payload.error || "That photograph could not be added.");
        break;
      }
      token = payload.draftToken || token;
      next.push({ id: payload.photo.id, thumb: `${payload.photo.thumb}${payload.photo.thumb.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`, alt: file.name });
    }
    setDraftToken(token);
    setPhotos(next);
    setBusy(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setStatus("");
    const form = new FormData(event.currentTarget);
    const record = Object.fromEntries(form.entries());
    record.draftToken = draftToken;
    record.trailerable = form.get("trailerable") ? "true" : "";
    record.liveaboard = form.get("liveaboard") ? "true" : "";
    record.showPhone = form.get("showPhone") ? "true" : "";
    record.consent = form.get("consent") ? "true" : "";
    const response = await fetch("/api/boats/submit", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(record),
    });
    const payload = await response.json() as { error?: string; errors?: Record<string, string>; accepted?: boolean };
    setBusy(false);
    if (!response.ok) {
      setErrors(payload.errors || {});
      setStatus(payload.error || "The advertisement could not be sent.");
      return;
    }
    if (payload.accepted) window.location.assign("/boats-for-sale/list-your-boat?sent=1");
  }

  return (
    <form className="boats-logbook" onSubmit={onSubmit}>
      <p className="boats-honeypot" aria-hidden="true">
        <label>Company website<input autoComplete="off" name="companyWebsite" tabIndex={-1} type="text" /></label>
      </p>
      {status ? <p className="boats-note boats-note-error" role="alert">{status}</p> : null}
      <fieldset>
        <legend><b>I.</b> The vessel</legend>
        <label>Title<input name="title" required type="text" />{errors.title ? <small>{errors.title}</small> : null}</label>
        <label>Make<input name="make" required type="text" />{errors.make ? <small>{errors.make}</small> : null}</label>
        <label>Model<input name="model" type="text" /></label>
        <label>Year<input inputMode="numeric" name="year" type="number" min="1900" max="2100" /></label>
        <label>Length in feet<input inputMode="decimal" name="lengthFeet" type="number" min="6" max="250" step="0.1" />{errors.lengthFeet ? <small>{errors.lengthFeet}</small> : null}</label>
        <label>Type
          <select name="boatType" defaultValue="sail">{BOAT_TYPES.map((type) => <option key={type} value={type}>{BOAT_TYPE_LABELS[type]}</option>)}</select>
        </label>
        <label>Keel
          <select name="keel" defaultValue="fin">{KEEL_TYPES.map((keel) => <option key={keel} value={keel}>{KEEL_LABELS[keel]}</option>)}</select>
        </label>
        <label>Engine<input name="engine" type="text" /></label>
        <label>Berths<input inputMode="numeric" name="berths" type="number" min="0" max="40" /></label>
        <label>Where she is lying<input name="location" required type="text" />{errors.location ? <small>{errors.location}</small> : null}</label>
        <label>Cruising ground
          <select name="cruisingGround" defaultValue="solent">{CRUISING_GROUNDS.map((ground) => <option key={ground.slug} value={ground.slug}>{ground.label}</option>)}</select>
        </label>
        <label>Price in pounds<input inputMode="numeric" name="priceGbp" type="number" min="0" />{errors.priceGbp ? <small>{errors.priceGbp}</small> : null}</label>
        <label>VAT
          <select name="vatStatus" defaultValue="unspecified">{VAT_STATUSES.map((status) => <option key={status} value={status}>{VAT_LABELS[status]}</option>)}</select>
        </label>
        <label className="boats-wide">Her story, in your words<textarea name="description" required rows={8} />{errors.description ? <small>{errors.description}</small> : null}</label>
        <label className="boats-check"><input name="trailerable" type="checkbox" /> Trailerable</label>
        <label className="boats-check"><input name="liveaboard" type="checkbox" /> Suitable as a liveaboard</label>
      </fieldset>
      <fieldset>
        <legend><b>II.</b> Photographs</legend>
        <div
          className={`boats-drop ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}
        >
          <p>Drag photographs here, or choose them. Up to 30, JPEG, PNG, WebP or HEIC, 8 MB each. We resize them and remove location data from the file.</p>
          <label className="boats-button boats-file">Add photographs
            <input accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic" multiple onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} type="file" />
          </label>
        </div>
        {errors.photos ? <small>{errors.photos}</small> : null}
        {photos.length > 0 ? (
          <ul className="boats-photo-list">
            {photos.map((photo, index) => (
              <li key={photo.id}><img alt="" src={photo.thumb} /><span>Photograph {index + 1}</span></li>
            ))}
          </ul>
        ) : null}
      </fieldset>
      <fieldset>
        <legend><b>III.</b> Correspondence</legend>
        <label>Name<input autoComplete="name" name="sellerName" required type="text" />{errors.sellerName ? <small>{errors.sellerName}</small> : null}</label>
        <label>Email<input autoComplete="email" name="sellerEmail" required type="email" />{errors.sellerEmail ? <small>{errors.sellerEmail}</small> : null}</label>
        <label>Telephone, if you wish<input autoComplete="tel" name="sellerPhone" type="tel" />{errors.sellerPhone ? <small>{errors.sellerPhone}</small> : null}</label>
        <label className="boats-check"><input name="showPhone" type="checkbox" /> Show my telephone number on the advertisement</label>
      </fieldset>
      <fieldset>
        <legend>Privacy notice</legend>
        <p>{privacyNotice}</p>
        <p><Link href="/privacy#boats-for-sale">Read the privacy policy</Link></p>
        <label className="boats-check"><input name="consent" required type="checkbox" /> {consentLabel}</label>
        {errors.consent ? <small>{errors.consent}</small> : null}
      </fieldset>
      <button className="boats-button" disabled={busy} type="submit">{busy ? "Sending…" : "Send my advertisement"}</button>
    </form>
  );
}
