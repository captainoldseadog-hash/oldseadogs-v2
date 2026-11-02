"use client";
import { useEffect, useState } from "react";

type TideEvent = { type: "High" | "Low"; time: string; height: number };

/** Loads ADMIRALTY tide times automatically on page load (pack 6). First-party API; no consent needed. */
export function GuideTideTimes({ slug, station }: { slug: string; station: string }) {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [events, setEvents] = useState<TideEvent[]>([]);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/guide-tides?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.events)) throw new Error("unavailable");
        if (live) { setEvents(data.events); setState("done"); }
      } catch { if (live) setState("error"); }
    })();
    return () => { live = false; };
  }, [slug]);
  return (
    <div className="guide-conditions-block" aria-live="polite" aria-busy={state === "loading"}>
      <h3>Next tides <span>{station}</span></h3>
      {state === "done" && events.length ? (
        <dl>
          {events.map((e) => (
            <div key={`${e.type}-${e.time}`}><dt>{e.type} water</dt><dd>{e.time} · {e.height.toFixed(1)} m</dd></div>
          ))}
        </dl>
      ) : (
        <p>{state === "loading" ? `Loading high and low water for ${station}…` : "Tide times are not available right now. Please check the official tide tables."}</p>
      )}
      <p className="guide-conditions-credit">Tidal predictions: © Crown copyright, UK Hydrographic Office (ADMIRALTY). Times in UK local time; heights above chart datum.</p>
    </div>
  );
}
