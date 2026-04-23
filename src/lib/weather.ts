// Open-Meteo: free, no key. Reverse geocoding via Open-Meteo.

export type WeatherSnapshot = {
  temp: number;
  code: number;
  label: string;
  city?: string;
  wind?: number;
};

const WMO: Record<number, string> = {
  0: "ciel dégagé",
  1: "ciel clair",
  2: "partiellement nuageux",
  3: "couvert",
  45: "brouillard",
  48: "brouillard givrant",
  51: "bruine légère",
  53: "bruine",
  55: "bruine dense",
  61: "pluie faible",
  63: "pluie",
  65: "pluie forte",
  66: "pluie verglaçante",
  67: "pluie verglaçante forte",
  71: "neige faible",
  73: "neige",
  75: "neige forte",
  80: "averses",
  81: "averses",
  82: "fortes averses",
  95: "orage",
  96: "orage avec grêle",
  99: "orage violent",
};

export const labelForCode = (code: number) => WMO[code] ?? "temps variable";

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
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`,
  ).then((r) => r.json());
  const temp = Math.round(w?.current?.temperature_2m ?? 0);
  const code = Number(w?.current?.weather_code ?? 0);
  const wind = Math.round(w?.current?.wind_speed_10m ?? 0);

  let city: string | undefined;
  try {
    const g = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=fr&format=json`,
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