// Lightweight geocoding via Nominatim (OpenStreetMap). No API key.
// Please respect their usage policy — cache results and don't burst-query.
export type GeoResult = { label: string; latitude: number; longitude: number };

export async function geocode(query: string): Promise<GeoResult[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!r.ok) return [];
    const data = (await r.json()) as any[];
    return data.map((d) => ({
      label: d.display_name as string,
      latitude: parseFloat(d.lat),
      longitude: parseFloat(d.lon),
    }));
  } catch {
    return [];
  }
}

/** Great-circle distance in km between two coordinates. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}
