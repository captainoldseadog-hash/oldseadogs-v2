"use client";

import { useState } from "react";

export function HarbourTvThumb({
  id,
  title,
  thumb,
}: {
  id: string;
  title: string;
  thumb: string;
}) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        title={title}
      />
    );
  }
  return (
    <button
      aria-label={`Play ${title}`}
      className="htv-th"
      onClick={() => setPlaying(true)}
      style={{ backgroundImage: `url(${thumb})` }}
      title={title}
      type="button"
    >
      <b>▶</b>
    </button>
  );
}
