import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  humidity: number;
  windspeed: number;
  weathercode: number;
  loading: boolean;
  error: string | null;
  locationName: string;
}

// Use Nominatim to geocode a location string to lat/lon
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
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
        displayName: data[0].display_name.split(",").slice(0, 2).join(", "),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch real weather from Open-Meteo (free, no API key needed)
async function fetchWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const current = data.current_weather;
  const humidity = data.hourly?.relativehumidity_2m?.[0] ?? 65;
  return {
    temperature: Math.round(current.temperature),
    windspeed: Math.round(current.windspeed),
    weathercode: current.weathercode,
    humidity,
  };
}

export function useWeather(location: string | null | undefined): WeatherData {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    humidity: 65,
    windspeed: 12,
    weathercode: 0,
    loading: false,
    error: null,
    locationName: "Kenya",
  });

  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    setWeather(prev => ({ ...prev, loading: true, error: null }));

    (async () => {
      const geo = await geocodeLocation(location);
      if (cancelled) return;

      if (!geo) {
        setWeather(prev => ({ ...prev, loading: false, error: "Could not find location" }));
        return;
      }

      try {
        const w = await fetchWeather(geo.lat, geo.lon);
        if (!cancelled) {
          setWeather({
            ...w,
            loading: false,
            error: null,
            locationName: geo.displayName,
          });
        }
      } catch {
        if (!cancelled) {
          setWeather(prev => ({ ...prev, loading: false, error: "Weather data unavailable" }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [location]);

  return weather;
}
