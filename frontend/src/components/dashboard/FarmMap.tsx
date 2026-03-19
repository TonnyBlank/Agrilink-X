import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default Leaflet icon paths (bundler issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

async function geocodeLocation(location: string): Promise<GeoResult | null> {
  try {
    const query = encodeURIComponent(`${location}, Kenya`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name.split(",").slice(0, 3).join(", "),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Inner component that re-centers map when geo changes
function MapRecenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 13, { animate: true });
  }, [lat, lon, map]);
  return null;
}

interface FarmMapProps {
  location: string;
  subCounty?: string;
}

export default function FarmMap({ location, subCounty }: FarmMapProps) {
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const searchQuery = subCounty ? `${subCounty}, ${location}` : location;

  useEffect(() => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    let cancelled = false;
    geocodeLocation(searchQuery).then((result) => {
      if (!cancelled) {
        setGeo(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="h-48 rounded-2xl bg-muted/50 flex items-center justify-center text-sm text-muted-foreground border border-border animate-pulse">
        📍 Locating {searchQuery}...
      </div>
    );
  }

  if (!geo) {
    return (
      <div className="h-48 rounded-2xl bg-muted/30 border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
        Set your county to see your farm location on the map
      </div>
    );
  }

  return (
    <div className="h-48 rounded-2xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[geo.lat, geo.lon]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapRecenter lat={geo.lat} lon={geo.lon} />
        <Marker position={[geo.lat, geo.lon]}>
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">🌱 My Farm</p>
              <p>{geo.displayName}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
