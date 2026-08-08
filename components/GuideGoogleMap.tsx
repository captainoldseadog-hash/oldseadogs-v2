"use client";

import { useState } from "react";

type GuideMapLocation = { latitude?: number; longitude?: number; mapMetadata?: { preferredZoom?: number } };
type GuideGoogleMapProps = { marinaName: string; location: GuideMapLocation };

function validCoordinates(location: GuideMapLocation) {
  return typeof location.latitude === "number" && Number.isFinite(location.latitude) && location.latitude >= -90 && location.latitude <= 90
    && typeof location.longitude === "number" && Number.isFinite(location.longitude) && location.longitude >= -180 && location.longitude <= 180;
}
function zoom(location: GuideMapLocation) {
  const value = location.mapMetadata?.preferredZoom;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 20 ? value : 15;
}
function externalUrl(location: GuideMapLocation) {
  if (!validCoordinates(location)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(location.latitude))},${encodeURIComponent(String(location.longitude))}`;
}
function embedUrl(location: GuideMapLocation) {
  if (!validCoordinates(location)) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(String(location.latitude))},${encodeURIComponent(String(location.longitude))}&z=${zoom(location)}&output=embed`;
}

export function GuideGoogleMap({ marinaName, location }: GuideGoogleMapProps) {
  const [loaded, setLoaded] = useState(false);
  const mapLink = externalUrl(location);
  const mapEmbed = embedUrl(location);
  if (!mapLink || !mapEmbed) return null;
  return (
    <section className="marina-google-map" aria-labelledby="guide-google-map-title">
      <div className="section-heading"><p className="eyebrow">Find your way</p><h2 id="guide-google-map-title">Location</h2></div>
      {loaded ? (
        <>
          <div className="marina-google-map-frame"><iframe allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapEmbed} title={`Map showing the location of ${marinaName}`} /></div>
          <p className="marina-google-map-actions"><a href={mapLink} rel="noopener noreferrer" target="_blank">Open {marinaName} in Google Maps</a></p>
        </>
      ) : (
        <div className="marina-google-map-consent">
          <p>This map is supplied by Google. Google may receive connection and device data when you load it.</p>
          <div className="marina-google-map-actions">
            <button type="button" onClick={() => setLoaded(true)}>Load Google Map</button>
            <a href={mapLink} rel="noopener noreferrer" target="_blank">Open {marinaName} in Google Maps</a>
          </div>
        </div>
      )}
    </section>
  );
}
