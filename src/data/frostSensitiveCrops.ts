// Frost sensitivity categories for Swedish crops

/** Frost-sensitive: protect below 0°C */
export const FROST_SENSITIVE: string[] = [
  "Tomat", "Gurka", "Zucchini", "Squash", "Pumpa", "Paprika",
  "Basilika", "Böna", "Majs", "Aubergine",
];

/** Light frost tolerant: protect below -3°C */
export const LIGHT_FROST_TOLERANT: string[] = [
  "Sallad", "Spenat", "Rädisor", "Rädisa", "Ärta", "Persilja", "Dill",
];

/** Frost hardy: no protection needed */
export const FROST_HARDY: string[] = [
  "Morot", "Rödbeta", "Palsternacka", "Grönkål", "Blomkål",
  "Purjolök", "Lök", "Jordgubbe", "Potatis", "Kål", "Vitlök",
];

export type FrostRisk = "none" | "possible" | "likely";

/** Returns the minimum temperature threshold below which this crop needs protection, or null if frost hardy */
export function getCropFrostThreshold(cropName: string): number | null {
  const lower = cropName.toLowerCase();
  if (FROST_SENSITIVE.some((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower))) {
    return 0;
  }
  if (LIGHT_FROST_TOLERANT.some((c) => lower.includes(c.toLowerCase()) || c.toLowerCase().includes(lower))) {
    return -3;
  }
  // Frost hardy or unknown
  return null;
}

/** Determine frost risk level from a minimum temperature */
export function getFrostRisk(minTemp: number): FrostRisk {
  if (minTemp < -1) return "likely";
  if (minTemp <= 3) return "possible";
  return "none";
}

/** Filter crops that would be affected by a given minimum temperature */
export function getAffectedCrops(
  cropNames: string[],
  minTemp: number
): string[] {
  return cropNames.filter((name) => {
    const threshold = getCropFrostThreshold(name);
    if (threshold === null) return false;
    return minTemp <= threshold + 2; // warn 2°C above threshold
  });
}
