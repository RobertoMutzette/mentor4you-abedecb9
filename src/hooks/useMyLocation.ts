import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Coords = { latitude: number; longitude: number };

/**
 * Resolves "where am I" for the people-maps: the location saved on the
 * profile first, with an opt-in browser-geolocation refinement.
 */
export function useMyLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [source, setSource] = useState<"profile" | "device" | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("latitude, longitude")
        .eq("id", u.user.id)
        .maybeSingle();
      if (!alive || !data?.latitude || !data?.longitude) return;
      setCoords({ latitude: Number(data.latitude), longitude: Number(data.longitude) });
      setSource("profile");
    })();
    return () => {
      alive = false;
    };
  }, []);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setSource("device");
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  return { coords, source, locating, locate };
}
