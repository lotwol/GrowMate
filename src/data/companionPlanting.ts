export interface CompanionData {
  good: string[];
  avoid: string[];
}

export const COMPANION_DATA: Record<string, CompanionData> = {
  Tomat: { good: ["Basilika", "Morot", "Persilja"], avoid: ["Fänkål", "Kål"] },
  Morot: { good: ["Lök", "Purjolök", "Rosmarin"], avoid: ["Dill"] },
  Lök: { good: ["Morot", "Tomat", "Rödbeta"], avoid: ["Ärta", "Böna"] },
  Ärta: { good: ["Morot", "Rädisor", "Spenat"], avoid: ["Lök", "Vitlök"] },
  Böna: { good: ["Gurka", "Majs", "Potatis"], avoid: ["Lök", "Fänkål"] },
  Gurka: { good: ["Böna", "Dill", "Rädisa"], avoid: ["Potatis", "Salvia"] },
  Kål: { good: ["Selleri", "Dill", "Salvia"], avoid: ["Tomat", "Jordgubbe"] },
  Potatis: { good: ["Böna", "Ringblomma", "Kål"], avoid: ["Tomat", "Gurka"] },
  Sallad: { good: ["Morot", "Rädisor", "Jordgubbe"], avoid: [] },
  Pumpa: { good: ["Majs", "Böna", "Ringblomma"], avoid: ["Potatis"] },
  Zucchini: { good: ["Böna", "Ringblomma", "Mynta"], avoid: [] },
  Rödbeta: { good: ["Lök", "Sallad", "Kål"], avoid: ["Spenat"] },
  Persilja: { good: ["Tomat", "Sparris", "Purjolök"], avoid: [] },
  Basilika: { good: ["Tomat", "Paprika", "Oregano"], avoid: ["Salvia"] },
  Dill: { good: ["Kål", "Gurka", "Lök"], avoid: ["Morot", "Tomat"] },
  Purjolök: { good: ["Morot", "Selleri", "Rödbeta"], avoid: ["Böna", "Ärta"] },
  Jordgubbe: { good: ["Lök", "Sallad", "Spenat"], avoid: ["Kål", "Fänkål"] },
  Spenat: { good: ["Jordgubbe", "Ärta", "Rädisor"], avoid: [] },
  Rädisor: { good: ["Morot", "Spenat", "Gurka"], avoid: ["Isop"] },
  Paprika: { good: ["Basilika", "Morot", "Lök"], avoid: ["Fänkål"] },
  Grönkål: { good: ["Selleri", "Rödbeta", "Lök"], avoid: ["Tomat", "Jordgubbe"] },
  Squash: { good: ["Böna", "Ringblomma", "Mynta"], avoid: [] },
  Blomkål: { good: ["Dill", "Selleri", "Mynta"], avoid: ["Tomat", "Jordgubbe"] },
  Palsternacka: { good: ["Ärta", "Rädisor", "Lök"], avoid: [] },
};

/** Find companion data by crop name (case-insensitive, partial match) */
export function findCompanionData(cropName: string): CompanionData | null {
  const lower = cropName.toLowerCase().trim();
  // Exact match first
  for (const [key, data] of Object.entries(COMPANION_DATA)) {
    if (key.toLowerCase() === lower) return data;
  }
  // Partial match (crop name contains key or vice versa)
  for (const [key, data] of Object.entries(COMPANION_DATA)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return data;
  }
  return null;
}

/** Find bad neighbor pairs among a list of crop names */
export function findBadNeighbors(cropNames: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();

  for (const name of cropNames) {
    const data = findCompanionData(name);
    if (!data) continue;
    for (const avoid of data.avoid) {
      const match = cropNames.find(
        (n) => n !== name && n.toLowerCase().includes(avoid.toLowerCase())
      );
      if (match) {
        const key = [name, match].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push([name, match]);
        }
      }
    }
  }
  return pairs;
}
