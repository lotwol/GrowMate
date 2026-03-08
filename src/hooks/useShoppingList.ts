import { useMemo } from "react";
import { useAllCrops, useSeedInventory, useGardens } from "@/hooks/useGarden";

export interface ShoppingItem {
  id: string;
  emoji: string;
  name: string;
  type: "seed" | "supply" | "inStock";
  checked?: boolean;
}

const FROST_SENSITIVE = ["tomat", "gurka", "paprika", "zucchini", "pumpa", "squash", "böna", "basilika"];

export function useShoppingItems(year: number) {
  const { data: crops = [] } = useAllCrops(year);
  const { data: seeds = [] } = useSeedInventory();
  const { data: gardens = [] } = useGardens();

  return useMemo(() => {
    const seedNamesLower = seeds.map((s) => s.name.toLowerCase());
    const today = new Date().toISOString().split("T")[0];

    // SECTION 1: Seeds to buy – planned crops not in seed inventory
    const toBuy: ShoppingItem[] = crops
      .filter((c: any) => c.status === "planerad")
      .filter((c: any) => !seedNamesLower.some((sn) => sn.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(sn)))
      .map((c: any) => ({
        id: `buy-${c.id}`,
        emoji: c.emoji || "🌱",
        name: c.name,
        type: "seed" as const,
      }));

    // SECTION 2: Suggestions based on garden types
    const gardenTypes = new Set(gardens.flatMap((g) => (Array.isArray(g.type) ? g.type : [g.type])));
    const suggestions: ShoppingItem[] = [];
    let sid = 0;

    if (gardenTypes.has("växthus") || gardenTypes.has("balkong") || gardenTypes.has("kruka")) {
      suggestions.push({ id: `sug-${sid++}`, emoji: "🪴", name: "Odlingsjord för kruka", type: "supply" });
    }
    if (gardenTypes.has("pallkrage")) {
      suggestions.push({ id: `sug-${sid++}`, emoji: "📦", name: "Pallkragejord", type: "supply" });
      suggestions.push({ id: `sug-${sid++}`, emoji: "♻️", name: "Kompost", type: "supply" });
    }
    if (gardenTypes.has("friland")) {
      suggestions.push({ id: `sug-${sid++}`, emoji: "🌿", name: "Täckbark", type: "supply" });
      suggestions.push({ id: `sug-${sid++}`, emoji: "🥶", name: "Nätmaterial (frostskydd)", type: "supply" });
    }
    suggestions.push({ id: `sug-${sid++}`, emoji: "🏷️", name: "Etiketter/pinnar till fröer", type: "supply" });

    const hasFrostSensitive = crops.some((c: any) =>
      FROST_SENSITIVE.some((fs) => c.name.toLowerCase().includes(fs)) && c.status === "planerad"
    );
    if (hasFrostSensitive) {
      suggestions.push({ id: `sug-${sid++}`, emoji: "❄️", name: "Fiberduk/frostskydd", type: "supply" });
    }

    // SECTION 3: Seeds in stock (not expired)
    const inStock: ShoppingItem[] = seeds
      .filter((s) => {
        if (!s.best_before) return true;
        return s.best_before >= today;
      })
      .map((s) => ({
        id: `stock-${s.id}`,
        emoji: "✅",
        name: `${s.name}${s.quantity ? ` (${s.quantity})` : ""}`,
        type: "inStock" as const,
      }));

    return { toBuy, suggestions, inStock };
  }, [crops, seeds, gardens, year]);
}
