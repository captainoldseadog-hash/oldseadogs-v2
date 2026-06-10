export type PortMapMarker = {
  slug: string;
  title: string;
  lat: number;
  lng: number;
  left: number;
  top: number;
  offsetX?: number;
  offsetY?: number;
};

type PortStory = {
  slug: string;
  title: string;
};

type PortLocation = {
  lat: number;
  lng: number;
  offsetX?: number;
  offsetY?: number;
};

const portLocations: Record<string, PortLocation> = {
  "ports-cowes-yacht-heaven": { lat: 50.76, lng: -1.3, offsetX: -12, offsetY: -4 },
  "ports-port-hercules": { lat: 43.73, lng: 7.42, offsetX: 4, offsetY: -16 },
  "ports-albany-marina": { lat: 25, lng: -77.54, offsetX: -9, offsetY: 11 },
  "ports-alimos-marina": { lat: 37.91, lng: 23.7, offsetX: 12, offsetY: 10 },
  "ports-atlantis-marina": { lat: 25.08, lng: -77.32, offsetX: 11, offsetY: -6 },
  "ports-brighton-marina": { lat: 50.81, lng: -0.1, offsetX: 10, offsetY: 8 },
  "ports-coal-harbour-marina": { lat: 49.29, lng: -123.12 },
  "ports-coral-sea-marina-airlie-beach": { lat: -20.27, lng: 148.72, offsetX: -9, offsetY: -9 },
  "ports-eden-island-marina": { lat: -4.64, lng: 55.48 },
  "ports-gouvia-marina": { lat: 39.65, lng: 19.85, offsetX: -12, offsetY: -10 },
  "ports-gustavia-harbour": { lat: 17.9, lng: -62.85, offsetX: 7, offsetY: -10 },
  "ports-hamilton-island-marina": { lat: -20.35, lng: 148.95, offsetX: 10, offsetY: 8 },
  "ports-ibiza-marina": { lat: 38.91, lng: 1.44, offsetX: -16, offsetY: 10 },
  "ports-largs-yacht-haven": { lat: 55.79, lng: -4.86, offsetX: -8, offsetY: -14 },
  "ports-lymington-marina": { lat: 50.75, lng: -1.53, offsetX: -7, offsetY: 14 },
  "ports-marina-coppola": { lat: 40.63, lng: 14.6, offsetX: 13, offsetY: -3 },
  "ports-marina-de-vilamoura": { lat: 37.08, lng: -8.12, offsetX: -12, offsetY: 8 },
  "ports-marina-del-rey-california": { lat: 33.98, lng: -118.45 },
  "ports-marina-grande-capri": { lat: 40.56, lng: 14.24, offsetX: -9, offsetY: 15 },
  "ports-montauk-yacht-club": { lat: 41.07, lng: -71.94, offsetX: 8, offsetY: -9 },
  "ports-nanny-cay-marina": { lat: 18.4, lng: -64.63, offsetX: -10, offsetY: 9 },
  "ports-port-adriano": { lat: 39.49, lng: 2.48, offsetX: 14, offsetY: -7 },
  "ports-port-de-saint-tropez": { lat: 43.27, lng: 6.64, offsetX: -10, offsetY: 10 },
  "ports-port-denarau-marina": { lat: -17.77, lng: 177.38 },
  "ports-port-royal": { lat: 17.94, lng: -76.84, offsetX: -6, offsetY: -12 },
  "ports-port-st-charles-marina-barbados": { lat: 13.26, lng: -59.64 },
  "ports-port-vauban": { lat: 43.58, lng: 7.13, offsetX: 12, offsetY: 9 },
  "ports-porto-cervo-sardinia": { lat: 41.14, lng: 9.53, offsetX: -14, offsetY: -13 },
  "ports-puerto-del-rey-marina": { lat: 18.29, lng: -65.64, offsetX: 12, offsetY: 10 },
  "ports-puerto-portals-mallorca": { lat: 39.53, lng: 2.57, offsetX: -13, offsetY: -16 },
  "ports-safe-harbor-newport-shipyard": { lat: 41.49, lng: -71.32, offsetX: -9, offsetY: 10 },
  "ports-santa-pola": { lat: 38.19, lng: -0.56, offsetX: 7, offsetY: -12 },
  "ports-scrub-island-marina": { lat: 18.47, lng: -64.52, offsetX: 8, offsetY: -9 },
  "ports-setur-marina": { lat: 36.2, lng: 29.64 },
  "ports-southport-yacht-club-marina": { lat: -27.97, lng: 153.42 },
  "ports-va-waterfront-marina": { lat: -33.91, lng: 18.42 },
  "ports-viaduct-harbour": { lat: -36.84, lng: 174.76 },
};

function projectPortPoint(lat: number, lng: number) {
  return {
    left: ((lng + 180) / 360) * 100,
    top: ((90 - lat) / 180) * 100,
  };
}

export function getPortMapMarkers(stories: PortStory[]): PortMapMarker[] {
  return stories
    .map((story) => {
      const location = portLocations[story.slug];
      if (!location) return null;
      const point = projectPortPoint(location.lat, location.lng);
      return {
        slug: story.slug,
        title: story.title,
        lat: location.lat,
        lng: location.lng,
        left: point.left,
        top: point.top,
        offsetX: location.offsetX,
        offsetY: location.offsetY,
      };
    })
    .filter((marker): marker is PortMapMarker => marker !== null);
}
