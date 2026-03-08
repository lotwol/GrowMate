export interface SeedShop {
  id: string;
  name: string;
  searchUrl: string;
  emoji: string;
  note: string;
}

export const SEED_SHOPS: SeedShop[] = [
  {
    id: "impecta",
    name: "Impecta Fröhandel",
    searchUrl: "https://www.impecta.se/search?q=",
    emoji: "🌱",
    note: "Störst sortiment, ovanliga sorter",
  },
  {
    id: "nelson",
    name: "Nelson Garden",
    searchUrl: "https://www.nelsongarden.se/search?query=",
    emoji: "🏡",
    note: "Bra för nybörjare, vanliga sorter",
  },
  {
    id: "runabergs",
    name: "Runåbergs Fröer",
    searchUrl: "https://www.runabergs.se/?s=",
    emoji: "🌾",
    note: "Ekologiska och gammaldags sorter",
  },
];

export function getShopSearchUrl(shopId: string, cropName: string): string {
  const shop = SEED_SHOPS.find((s) => s.id === shopId);
  if (!shop) return "#";
  return shop.searchUrl + encodeURIComponent(cropName);
}
