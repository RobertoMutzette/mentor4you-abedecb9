import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  href?: string;
  avatarUrl?: string;
};

type Props = {
  markers: MapMarker[];
  height?: number;
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (m: MapMarker) => void;
  footer?: ReactNode;
};

// Client-only Leaflet wrapper — safe under _authenticated (ssr: false).
export function LocationMap({ markers, height = 460, center, zoom = 3, className = "", onMarkerClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      if (!mapRef.current) {
        const initial = center || (markers[0] ? [markers[0].latitude, markers[0].longitude] : [20, 0]);
        mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView(initial as any, zoom);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      if (layerRef.current) layerRef.current.remove();
      layerRef.current = L.layerGroup().addTo(mapRef.current);

      const bounds: [number, number][] = [];
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:9999px;background:oklch(0.42 0.28 264);border:3px solid white;box-shadow:0 4px 12px oklch(0 0 0/0.25)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      for (const m of markers) {
        if (typeof m.latitude !== "number" || typeof m.longitude !== "number") continue;
        const marker = L.marker([m.latitude, m.longitude], { icon }).addTo(layerRef.current);
        const html = `<div style="min-width:180px"><div style="font-weight:700;font-size:13px">${escapeHtml(m.title)}</div>${
          m.subtitle ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">${escapeHtml(m.subtitle)}</div>` : ""
        }${m.href ? `<a href="${m.href}" style="display:inline-block;margin-top:6px;font-size:12px;color:oklch(0.42 0.28 264);font-weight:600">View →</a>` : ""}</div>`;
        marker.bindPopup(html);
        marker.on("click", () => onMarkerClick?.(m));
        bounds.push([m.latitude, m.longitude]);
      }
      if (bounds.length > 1) mapRef.current.fitBounds(bounds as any, { padding: [40, 40] });
      else if (bounds.length === 1) mapRef.current.setView(bounds[0] as any, 10);
    })();
    return () => { cancelled = true; };
  }, [markers, center, zoom, onMarkerClick]);

  useEffect(() => () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } }, []);

  return <div ref={ref} className={`w-full rounded-3xl overflow-hidden border border-border ${className}`} style={{ height }} />;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
