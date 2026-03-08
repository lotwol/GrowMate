import { useQuery } from "@tanstack/react-query";
import { getFrostRisk, getAffectedCrops, type FrostRisk } from "@/data/frostSensitiveCrops";

const ZONE_COORDS: Record<string, { lat: number; lon: number }> = {
  I: { lat: 55.6, lon: 13.0 },
  II: { lat: 57.7, lon: 11.9 },
  III: { lat: 59.3, lon: 18.1 },
  IV: { lat: 59.6, lon: 16.5 },
  V: { lat: 60.7, lon: 17.1 },
  VI: { lat: 63.8, lon: 20.3 },
  VII: { lat: 65.6, lon: 22.1 },
  VIII: { lat: 67.9, lon: 20.2 },
};

interface WeatherSymbolInfo {
  description: string;
  emoji: string;
}

function getWeatherInfo(code: number): WeatherSymbolInfo {
  if (code === 1) return { description: "Klart", emoji: "☀️" };
  if (code <= 3) return { description: "Lätt molnigt", emoji: "🌤️" };
  if (code <= 6) return { description: "Halvklart", emoji: "⛅" };
  if (code <= 8) return { description: "Mulet", emoji: "☁️" };
  if (code <= 10) return { description: "Regnskurar", emoji: "🌦️" };
  if (code === 11) return { description: "Åskskurar", emoji: "⛈️" };
  if (code <= 13) return { description: "Snöblandad regn", emoji: "🌨️" };
  if (code <= 16) return { description: "Snöfall", emoji: "❄️" };
  if (code <= 18) return { description: "Regn", emoji: "🌧️" };
  if (code <= 20) return { description: "Åska", emoji: "⛈️" };
  if (code === 21) return { description: "Snöbyar", emoji: "🌨️" };
  return { description: "Snö", emoji: "❄️" };
}

export interface WeatherData {
  temperature: number;
  weatherSymbol: number;
  description: string;
  emoji: string;
}

export interface FrostForecastDay {
  date: string;        // yyyy-mm-dd
  minTemp: number;
  frostRisk: FrostRisk;
}

export interface WeatherWithFrost extends WeatherData {
  frostRisk: FrostRisk;
  minTempTonight: number | null;
  nextFrostDate: string | null;
  frostForecast: FrostForecastDay[];
}

async function fetchWeather(zone: string): Promise<WeatherWithFrost> {
  const coords = ZONE_COORDS[zone];
  if (!coords) throw new Error("Unknown zone");

  const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${coords.lon}/lat/${coords.lat}/data.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("SMHI API error");

  const data = await res.json();
  const now = new Date();
  
  // Find the closest time series entry for current weather
  let closest = data.timeSeries?.[0];
  if (data.timeSeries) {
    for (const ts of data.timeSeries) {
      const tsTime = new Date(ts.validTime);
      if (tsTime <= now) closest = ts;
      else break;
    }
  }

  const getParam = (name: string, ts?: any) =>
    (ts || closest)?.parameters?.find((p: any) => p.name === name)?.values?.[0];

  const temp = getParam("t") ?? 0;
  const wsymb = getParam("Wsymb2") ?? 1;
  const info = getWeatherInfo(wsymb);

  // Compute daily min temperatures for forecast (next 10 days)
  const dailyMins: Record<string, number> = {};
  if (data.timeSeries) {
    for (const ts of data.timeSeries) {
      const tsTime = new Date(ts.validTime);
      const dateStr = tsTime.toISOString().split("T")[0];
      const t = getParam("t", ts);
      if (t !== undefined) {
        if (!(dateStr in dailyMins) || t < dailyMins[dateStr]) {
          dailyMins[dateStr] = t;
        }
      }
    }
  }

  // Build frost forecast for next 10 days
  const todayStr = now.toISOString().split("T")[0];
  const frostForecast: FrostForecastDay[] = Object.entries(dailyMins)
    .filter(([date]) => date >= todayStr)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 10)
    .map(([date, minTemp]) => ({
      date,
      minTemp: Math.round(minTemp * 10) / 10,
      frostRisk: getFrostRisk(minTemp),
    }));

  // Tonight's min temp (today or tomorrow if past midnight)
  const tonightDate = now.getHours() >= 18
    ? new Date(now.getTime() + 86400000).toISOString().split("T")[0]
    : todayStr;
  const minTempTonight = dailyMins[tonightDate] ?? null;

  // Overall frost risk based on tonight
  const frostRisk: FrostRisk = minTempTonight !== null
    ? getFrostRisk(minTempTonight)
    : "none";

  // Next frost date
  const nextFrostEntry = frostForecast.find(
    (f) => f.frostRisk === "likely" || f.frostRisk === "possible"
  );

  return {
    temperature: Math.round(temp),
    weatherSymbol: wsymb,
    description: info.description,
    emoji: info.emoji,
    frostRisk,
    minTempTonight: minTempTonight !== null ? Math.round(minTempTonight * 10) / 10 : null,
    nextFrostDate: nextFrostEntry?.date ?? null,
    frostForecast,
  };
}

export function useWeather(zone?: string | null) {
  return useQuery({
    queryKey: ["weather", zone],
    queryFn: () => fetchWeather(zone!),
    enabled: !!zone,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

/** Get names of frost-affected crops from a list of active crop names */
export function useFrostAffectedCrops(
  cropNames: string[],
  minTemp: number | null
): string[] {
  if (minTemp === null) return [];
  return getAffectedCrops(cropNames, minTemp);
}
