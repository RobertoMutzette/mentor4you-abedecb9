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
