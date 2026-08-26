import { Crosshair, Loader2, MapPin } from "lucide-react";
import type { Coords } from "@/hooks/useMyLocation";

const RADII = [10, 50, 200, 1000];

type Props = {
  coords: Coords | null;
  source: "profile" | "device" | null;
  locating: boolean;
  locate: () => void;
  radius: number | null;
  setRadius: (r: number | null) => void;
};

/** "People around you" controls shared by the Mentors and Partners maps. */
export function NearbyBar({ coords, source, locating, locate, radius, setRadius }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium hover:bg-secondary transition disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
        {coords ? "Update my location" : "Use my location"}
      </button>

      {coords && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {source === "device" ? "Live location" : "Profile location"}
        </span>
      )}

      {coords && (
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-muted-foreground mr-1">Within</span>
          <button
            type="button"
            onClick={() => setRadius(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${radius === null ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}
          >
            Anywhere
          </button>
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${radius === r ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary"}`}
            >
              {r >= 1000 ? `${r / 1000}k` : r} km
            </button>
          ))}
        </div>
      )}

      {!coords && (
        <span className="text-xs text-muted-foreground">
          Share a location to see who’s around you on the map.
        </span>
      )}
    </div>
  );
}
