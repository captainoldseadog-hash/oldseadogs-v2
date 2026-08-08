"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import type { PortMapMarker } from "../content/port-map";

const tileSize = 256;
const viewportWidth = 1120;
const viewportHeight = 560;
const minZoom = 2;
const maxZoom = 6;

type MapPoint = {
  x: number;
  y: number;
};

type MapCenter = {
  lat: number;
  lng: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wrapLongitude(lng: number) {
  if (!Number.isFinite(lng)) return 0;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

function project(lat: number, lng: number, zoom: number): MapPoint {
  const scale = tileSize * 2 ** zoom;
  const safeLat = clamp(lat, -85.0511, 85.0511);
  const sin = Math.sin((safeLat * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function unproject(point: MapPoint, zoom: number): MapCenter {
  const scale = tileSize * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return {
    lat: clamp(lat, -85, 85),
    lng: wrapLongitude(lng),
  };
}

function screenPoint(lat: number, lng: number, center: MapCenter, zoom: number) {
  const worldSize = tileSize * 2 ** zoom;
  const centerPoint = project(center.lat, center.lng, zoom);
  const point = project(lat, lng, zoom);
  let x = point.x;

  while (x - centerPoint.x > worldSize / 2) x -= worldSize;
  while (centerPoint.x - x > worldSize / 2) x += worldSize;

  return {
    left: x - (centerPoint.x - viewportWidth / 2),
    top: point.y - (centerPoint.y - viewportHeight / 2),
  };
}

function makeTiles(center: MapCenter, zoom: number) {
  const centerPoint = project(center.lat, center.lng, zoom);
  const minX = Math.floor((centerPoint.x - viewportWidth / 2) / tileSize) - 1;
  const maxX = Math.floor((centerPoint.x + viewportWidth / 2) / tileSize) + 1;
  const minY = Math.max(0, Math.floor((centerPoint.y - viewportHeight / 2) / tileSize) - 1);
  const tileCount = 2 ** zoom;
  const maxY = Math.min(tileCount - 1, Math.floor((centerPoint.y + viewportHeight / 2) / tileSize) + 1);
  const tiles: Array<{ key: string; x: number; y: number; wrappedX: number; left: number; top: number }> = [];

  for (let x = minX; x <= maxX; x += 1) {
    const wrappedX = ((x % tileCount) + tileCount) % tileCount;
    for (let y = minY; y <= maxY; y += 1) {
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        x,
        y,
        wrappedX,
        left: x * tileSize - (centerPoint.x - viewportWidth / 2),
        top: y * tileSize - (centerPoint.y - viewportHeight / 2),
      });
    }
  }

  return tiles;
}

export function PortsInteractiveMap({ markers }: { markers: PortMapMarker[] }) {
  const [center, setCenter] = useState<MapCenter>({ lat: 24, lng: 4 });
  const [zoom, setZoom] = useState(2);
  const [activeSlug, setActiveSlug] = useState(markers[0]?.slug ?? "");
  const dragStart = useRef<{ x: number; y: number; center: MapPoint } | null>(null);
  const activeMarker = markers.find((marker) => marker.slug === activeSlug) ?? markers[0];

  const tiles = useMemo(() => makeTiles(center, zoom), [center, zoom]);
  const countryMarkers = useMemo(() => {
    const groups = new Map<string, { country: string; count: number; lat: number; lng: number }>();

    for (const marker of markers) {
      if (!marker.country) continue;
      const current = groups.get(marker.country) ?? { country: marker.country, count: 0, lat: 0, lng: 0 };
      current.count += 1;
      current.lat += marker.lat;
      current.lng += marker.lng;
      groups.set(marker.country, current);
    }

    return Array.from(groups.values()).map((group) => ({
      country: group.country,
      count: group.count,
      lat: group.lat / group.count,
      lng: group.lng / group.count,
    }));
  }, [markers]);

  function zoomBy(step: number) {
    setZoom((current) => clamp(current + step, minZoom, maxZoom));
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      center: project(center.lat, center.lng, zoom),
    };
  }

  function dragMap(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const worldSize = tileSize * 2 ** zoom;
    const nextPoint = {
      x: dragStart.current.center.x - (event.clientX - dragStart.current.x),
      y: clamp(dragStart.current.center.y - (event.clientY - dragStart.current.y), 0, worldSize),
    };

    setCenter(unproject(nextPoint, zoom));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStart.current = null;
  }

  function wheelZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1 : -1);
  }

  function focusCountry(country: { lat: number; lng: number }) {
    setCenter({ lat: country.lat, lng: country.lng });
    setZoom((current) => Math.max(current, 3));
  }

  if (markers.length === 0) {
    return (
      <section className="ports-map-panel" aria-labelledby="ports-map-title">
        <div className="ports-map-heading">
          <div>
            <p className="eyebrow">Harbour map</p>
            <h3 id="ports-map-title">Ports we have covered</h3>
          </div>
        </div>
        <p className="ports-map-empty">Port markers will appear here once port pages have coordinates.</p>
      </section>
    );
  }

  return (
    <section className="ports-map-panel" aria-labelledby="ports-map-title">
      <div className="ports-map-heading">
        <div>
          <p className="eyebrow">Harbour map</p>
          <h3 id="ports-map-title">Ports we have covered</h3>
        </div>
        <span>{markers.length.toLocaleString("en-GB")} mapped ports</span>
      </div>

      <div className="ports-map-toolbar" aria-label="Map controls">
        <button type="button" onClick={() => zoomBy(1)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(-1)} aria-label="Zoom out">-</button>
        <button type="button" onClick={() => {
          setCenter({ lat: 24, lng: 4 });
          setZoom(2);
        }}>
          Reset
        </button>
      </div>

      <div
        className="ports-map-canvas"
        aria-label="Interactive nautical map of Old Sea Dogs ports"
        onPointerDown={beginDrag}
        onPointerLeave={endDrag}
        onPointerMove={dragMap}
        onPointerUp={endDrag}
        onWheel={wheelZoom}
      >
        <div className="ports-map-viewport" style={{ width: viewportWidth, height: viewportHeight }}>
          <div className="ports-tile-layer" aria-hidden="true">
            {tiles.map((tile) => (
              <span
                className="ports-map-tile"
                key={tile.key}
                style={{
                  backgroundImage: `url(https://tile.openstreetmap.org/${zoom}/${tile.wrappedX}/${tile.y}.png)`,
                  left: tile.left,
                  top: tile.top,
                }}
              >
                <span
                  style={{
                    backgroundImage: `url(https://tiles.openseamap.org/seamark/${zoom}/${tile.wrappedX}/${tile.y}.png)`,
                  }}
                />
              </span>
            ))}
          </div>

          {countryMarkers.map((country) => {
            const point = screenPoint(country.lat, country.lng, center, zoom);
            return (
              <button
                className="port-country-marker"
                key={country.country}
                onClick={() => focusCountry(country)}
                style={{ left: point.left, top: point.top }}
                type="button"
              >
                <strong>{country.country}</strong>
                <span>{country.count}</span>
              </button>
            );
          })}

          {markers.map((marker) => {
            const point = screenPoint(marker.lat, marker.lng, center, zoom);
            return (
              <Link
                aria-label={`${marker.title} port information`}
                className={`port-map-marker ${activeMarker?.slug === marker.slug ? "active" : ""}`}
                href={`/stories/${marker.slug}`}
                key={marker.slug}
                onClick={(event) => event.stopPropagation()}
                onFocus={() => setActiveSlug(marker.slug)}
                onMouseEnter={() => setActiveSlug(marker.slug)}
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  left: point.left + (marker.offsetX ?? 0),
                  top: point.top + (marker.offsetY ?? 0),
                }}
                title={marker.title}
              >
                <span className="port-map-dot" aria-hidden="true" />
              </Link>
            );
          })}

          {activeMarker ? (
            <article className="ports-map-popup">
              {activeMarker.imageUrl ? (
                <span
                  className="ports-map-popup-image"
                  role="img"
                  aria-label={activeMarker.imageAlt}
                  style={{ backgroundImage: `url(${activeMarker.imageUrl})` }}
                />
              ) : null}
              <div>
                <p>{activeMarker.country || "Port"}</p>
                <h4>{activeMarker.title}</h4>
                {activeMarker.summary ? <span>{activeMarker.summary}</span> : null}
                <Link href={`/stories/${activeMarker.slug}`}>Open port page</Link>
              </div>
            </article>
          ) : null}

          <p className="ports-map-attribution">Map tiles © OpenStreetMap contributors · seamarks © OpenSeaMap</p>
        </div>
      </div>

      <div className="ports-map-list" aria-label="Mapped ports">
        {markers.map((marker) => (
          <Link href={`/stories/${marker.slug}`} key={marker.slug}>
            {marker.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
