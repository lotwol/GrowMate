// Crop rotation families for Swedish gardening
// Rule: same family should NOT be grown in the same garden bed 2 years in a row

export const ROTATION_FAMILIES: Record<string, string[]> = {
  "Nattskatte-växter": ["Tomat", "Paprika", "Potatis", "Aubergine"],
  "Korsblommiga": ["Kål", "Blomkål", "Grönkål", "Rädisa", "Rädisor", "Broccoli"],
  "Rotfrukter": ["Morot", "Palsternacka", "Rödbeta", "Selleri"],
  "Baljväxter": ["Böna", "Ärta", "Soja"],
  "Lökväxter": ["Lök", "Purjolök", "Vitlök", "Gräslök"],
  "Gurkväxter": ["Gurka", "Zucchini", "Squash", "Pumpa"],
  "Korgblommiga": ["Sallad", "Endiv", "Cikoria"],
  "Örter": ["Basilika", "Persilja", "Dill"],
};

/** Find which rotation family a crop belongs to (case-insensitive partial match) */
export function getCropFamily(cropName: string): string | null {
  const lower = cropName.toLowerCase();
  for (const [family, members] of Object.entries(ROTATION_FAMILIES)) {
    if (members.some((m) => lower.includes(m.toLowerCase()) || m.toLowerCase().includes(lower))) {
      return family;
    }
  }
  return null;
}

/** Get other crops in the same family */
export function getFamilyMembers(family: string): string[] {
  return ROTATION_FAMILIES[family] || [];
}

/** Check if two crops are in the same rotation family */
export function isSameFamily(cropA: string, cropB: string): boolean {
  const familyA = getCropFamily(cropA);
  const familyB = getCropFamily(cropB);
  return familyA !== null && familyA === familyB;
}
