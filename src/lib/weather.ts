// Open-Meteo: free, no key. Reverse geocoding via Open-Meteo.

import i18n from "@/i18n";

export type WeatherSnapshot = {
  temp: number;
  code: number;
  label: string;
  city?: string;
  wind?: number;
};

export const labelForCode = (code: number) =>
  i18n.t(`weatherLabel.${code}`, { defaultValue: i18n.t("weatherLabel.fallback") }) as string;

export const getCoords = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("no geo"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const w = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
    { cache: "no-store" },
  ).then((r) => r.json());
  const temp = Math.round(w?.current?.temperature_2m ?? 0);
  const code = Number(w?.current?.weather_code ?? 0);
  const wind = Math.round(w?.current?.wind_speed_10m ?? 0);

  let city: string | undefined;
  try {
    const lang = (i18n.language || "fr").split("-")[0];
    const g = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=${lang}&format=json`,
      { cache: "no-store" },
    ).then((r) => r.json());
    city = g?.results?.[0]?.name;
  } catch {}

  return { temp, code, label: labelForCode(code), city, wind };
}

export async function getCurrentWeather(): Promise<WeatherSnapshot | null> {
  try {
    const c = await getCoords();
    return await fetchWeather(c.lat, c.lon);
  } catch {
    return null;
  }
}