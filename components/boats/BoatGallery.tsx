"use client";

import { useState } from "react";

type GalleryPhoto = {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  thumb: string;
};

export function BoatGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) {
    return <div className="boats-hero-shot boats-frame-empty"><p>Photograph to follow</p></div>;
  }
  const current = photos[Math.min(index, photos.length - 1)];
  return (
    <div className="boats-gallery">
      <figure className="boats-hero-shot">
        <img alt={current.alt || title} height={current.height || 1000} src={current.src} width={current.width || 1600} />
        <figcaption>{current.alt}</figcaption>
      </figure>
      {photos.length > 1 ? (
        <div className="boats-thumbs" role="tablist" aria-label="Photographs">
          {photos.map((photo, photoIndex) => (
            <button
              aria-label={`Photograph ${photoIndex + 1} of ${photos.length}`}
              aria-selected={photoIndex === index}
              className={photoIndex === index ? "is-selected" : ""}
              key={photo.id}
              onClick={() => setIndex(photoIndex)}
              role="tab"
              type="button"
            >
              <img alt="" height={photo.height || 640} src={photo.thumb} width={photo.width || 640} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
