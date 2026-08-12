"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { GuideImage, InlineGuideImage, MediaAsset } from "./guide-types";

type Props = {
  assets: MediaAsset[];
  hero?: GuideImage;
  gallery: GuideImage[];
  inlineImages: InlineGuideImage[];
  onHero: (image: GuideImage) => void;
  onGallery: (images: GuideImage[]) => void;
  onInlineImages: (images: InlineGuideImage[]) => void;
  onUploaded: (asset: MediaAsset) => void;
};

function imageFromAsset(asset: MediaAsset): GuideImage {
  return { mediaId: asset.id, url: asset.url, alt: asset.alt || asset.displayName, caption: asset.caption, credit: asset.creditLine || asset.credit, focalPoint: "50% 50%" };
}

export function GuideMediaPicker({ assets, hero, gallery, inlineImages, onHero, onGallery, onInlineImages, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const images = assets.filter((asset) => asset.contentType.startsWith("image/") && [asset.displayName, asset.filename, asset.alt].some((value) => value?.toLowerCase().includes(query.toLowerCase())));

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("action", "uploadMedia");
      form.append("photo", file);
      form.append("alt", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
      const response = await fetch("/api/editor/media/upload", { method: "POST", body: form });
      const payload = await response.json() as { error?: string; media?: MediaAsset };
      if (!response.ok || !payload.media) throw new Error(payload.error || "Upload failed.");
      const asset = { ...payload.media, thumbnailUrl: payload.media.thumbnailUrl || `/api/media/${payload.media.id}?variant=thumbnail` };
      onUploaded(asset);
      onHero(imageFromAsset(asset));
      setMessage("Image uploaded to the Media Library and selected as the hero image.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return <section className="bridge-panel">
    <div className="bridge-panel-heading"><div><p className="eyebrow">Media reuse</p><h2>Hero and gallery images</h2></div><Link href="/editor/media" target="_blank">Open full Media Library</Link></div>
    <p className="bridge-muted">Select an existing asset or upload through the existing Media Library pipeline. The public Guide renderer remains unchanged.</p>
    <div className="guide-manager-media-actions">
      <label><span>Search Media Library</span><input placeholder="Search images" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <input accept="image/jpeg,image/png,image/webp" hidden ref={inputRef} type="file" onChange={(event) => void upload(event.target.files?.[0])} />
      <button disabled={uploading} type="button" onClick={() => inputRef.current?.click()}>{uploading ? "Uploading…" : "Upload image"}</button>
    </div>
    {hero?.url ? <figure className="guide-manager-selected-hero"><img src={hero.url} alt={hero.alt} /><figcaption>Selected hero · {hero.alt || "Alt text required"}</figcaption></figure> : <p className="bridge-error">No hero image selected.</p>}
    <div className="bridge-media-grid guide-manager-media-grid">
      {images.slice(0, 24).map((asset) => <article key={asset.id}><img src={asset.thumbnailUrl || asset.url} alt={asset.alt || asset.displayName} /><strong>{asset.displayName || asset.filename}</strong><div className="bridge-row-actions"><button type="button" onClick={() => onHero(imageFromAsset(asset))}>Use as hero</button><button type="button" onClick={() => onGallery([...gallery, { ...imageFromAsset(asset), order: gallery.length }])}>Add to gallery</button><button type="button" onClick={() => onInlineImages([...inlineImages, { ...imageFromAsset(asset), id: `guide-inline-${Date.now()}`, sectionIndex: 0, paragraphIndex: 0, order: inlineImages.length }])}>Insert inline</button></div></article>)}
    </div>
    {gallery.length ? <div className="guide-manager-gallery"><h3>Gallery order</h3>{gallery.map((image, index) => <article key={`${image.mediaId || image.url}-${index}`}><img src={image.url} alt={image.alt} /><div><label><span>Alt text</span><input value={image.alt} onChange={(event) => onGallery(gallery.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item))} /></label><div className="bridge-row-actions"><button disabled={index === 0} type="button" onClick={() => { const next = [...gallery]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onGallery(next.map((item, order) => ({ ...item, order }))); }}>Move up</button><button type="button" onClick={() => onGallery(gallery.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order })))}>Remove</button></div></div></article>)}</div> : null}
    {inlineImages.length ? <div className="guide-manager-gallery"><h3>Inline image placement</h3>{inlineImages.map((image) => <article key={image.id}><img src={image.url} alt={image.alt} /><div className="bridge-field-row thirds"><label><span>Section number</span><input min="0" type="number" value={image.sectionIndex} onChange={(event) => onInlineImages(inlineImages.map((item) => item.id === image.id ? { ...item, sectionIndex: Number(event.target.value) } : item))} /></label><label><span>After paragraph</span><input min="0" type="number" value={image.paragraphIndex} onChange={(event) => onInlineImages(inlineImages.map((item) => item.id === image.id ? { ...item, paragraphIndex: Number(event.target.value) } : item))} /></label><label><span>Alt text</span><input value={image.alt} onChange={(event) => onInlineImages(inlineImages.map((item) => item.id === image.id ? { ...item, alt: event.target.value } : item))} /></label><label><span>Caption</span><input value={image.caption || ""} onChange={(event) => onInlineImages(inlineImages.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} /></label><label><span>Credit</span><input value={image.credit || ""} onChange={(event) => onInlineImages(inlineImages.map((item) => item.id === image.id ? { ...item, credit: event.target.value } : item))} /></label><button type="button" onClick={() => onInlineImages(inlineImages.filter((item) => item.id !== image.id).map((item, order) => ({ ...item, order })))}>Remove inline image</button></div></article>)}</div> : null}
    {message ? <p className="bridge-save-message" role="status">{message}</p> : null}
  </section>;
}
