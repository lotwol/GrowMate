import { useMemo } from "react";
import { useAllCrops, useSeedInventory, useGardens } from "@/hooks/useGarden";

export interface ShoppingItem {
  id: string;
  emoji: string;
  name: string;
  type: "seed" | "supply" | "inStock" | "seedCheck";
  reason?: string;
  urgencyLabel?: string;
  sowDate?: string;
  cropName?: string;
}

const FROST_SENSITIVE = ["tomat", "gurka", "paprika", "zucchini", "pumpa", "squash", "böna", "basilika"];

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function useShoppingItems(year: number) {
  const { data: crops = [] } = useAllCrops(year);
  const { data: seeds = [] } = useSeedInventory();
  const { data: gardens = [] } = useGardens();

  return useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const in21Days = new Date(today.getTime() + 21 * 86400000).toISOString().split("T")[0];
    const in60Days = new Date(today.getTime() + 60 * 86400000).toISOString().split("T")[0];

    const seedMap = new Map(seeds.map((s) => [s.id, s]));

    // --- TIER 1 & 2: Planned crops needing seeds ---
    const urgent: ShoppingItem[] = [];
    const later: ShoppingItem[] = [];

    const plannedCrops = crops.filter((c: any) => c.status === "planerad");

    for (const crop of plannedCrops) {
      const c = crop as any;
      let reason: string | null = null;

      if (!c.seed_id) {
        // No seed linked – check if name matches any seed in inventory
        const matchingSeed = seeds.find(
          (s) => s.name.toLowerCase() === c.name.toLowerCase() && (!s.status || s.status === "active")
        );
        if (!matchingSeed) {
          reason = "Saknar frö";
        } else {
          const qty = matchingSeed.quantity ? parseInt(matchingSeed.quantity, 10) : NaN;
          if (!isNaN(qty) && qty <= 0) reason = "Slut i lager";
          else if (matchingSeed.best_before && matchingSeed.best_before < todayStr) reason = "Utgånget frö";
          // else: has matching seed with stock – no action needed
        }
      } else {
        const seed = seedMap.get(c.seed_id);
        if (!seed) {
          reason = "Saknar frö";
        } else {
          const qty = seed.quantity ? parseInt(seed.quantity, 10) : NaN;
          if (isNaN(qty) || qty <= 0) reason = "Slut i lager";
          else if (seed.best_before && seed.best_before < todayStr) reason = "Utgånget frö";
        }
      }

      if (!reason) continue;

      const isUrgent = c.sow_date && c.sow_date <= in21Days;
      const item: ShoppingItem = {
        id: `buy-${c.id}`,
        emoji: c.emoji || "🌱",
        name: c.name,
        type: "seed",
        reason,
        urgencyLabel: isUrgent ? "🔴 Behövs snart" : "🟡 Planera inköp",
        sowDate: c.sow_date ? `Sås ${formatDateShort(c.sow_date)}` : undefined,
        cropName: c.name,
      };

      if (isUrgent) urgent.push(item);
      else later.push(item);
    }

    // --- TIER 3: Seed inventory checks ---
    const seedChecks: ShoppingItem[] = [];
    for (const seed of seeds) {
      if ((seed as any).status && (seed as any).status !== "active") continue;
      const qty = seed.quantity ? parseInt(seed.quantity, 10) : NaN;
      const isExpiringSoon = seed.best_before && seed.best_before >= todayStr && seed.best_before <= in60Days;
      const isDepleted = !isNaN(qty) && qty <= 0;

      if (isExpiringSoon) {
        seedChecks.push({
          id: `check-exp-${seed.id}`,
          emoji: (seed as any).emoji || "🌱",
          name: seed.name,
          type: "seedCheck",
          reason: `⏰ Går ut ${formatDateShort(seed.best_before!)}`,
          cropName: seed.name,
        });
      } else if (isDepleted) {
        // Only show if not already in tier 1/2
        const alreadyListed = [...urgent, ...later].some((i) => i.cropName?.toLowerCase() === seed.name.toLowerCase());
        if (!alreadyListed) {
          seedChecks.push({
            id: `check-empty-${seed.id}`,
            emoji: (seed as any).emoji || "🌱",
            name: seed.name,
            type: "seedCheck",
            reason: "🫙 Slut i lager",
            cropName: seed.name,
          });
        }
      }
    }

    // --- SUPPLIES (keep existing logic) ---
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

    const hasFrostSensitive = crops.some(
      (c: any) => FROST_SENSITIVE.some((fs) => c.name.toLowerCase().includes(fs)) && c.status === "planerad"
    );
    if (hasFrostSensitive) {
      suggestions.push({ id: `sug-${sid++}`, emoji: "❄️", name: "Fiberduk/frostskydd", type: "supply" });
    }

    // --- IN STOCK ---
    const inStock: ShoppingItem[] = seeds
      .filter((s) => {
        if ((s as any).status && (s as any).status !== "active") return false;
        const qty = s.quantity ? parseInt(s.quantity, 10) : NaN;
        if (!isNaN(qty) && qty <= 0) return false;
        if (s.best_before && s.best_before < todayStr) return false;
        return true;
      })
      .map((s) => ({
        id: `stock-${s.id}`,
        emoji: (s as any).emoji || "✅",
        name: `${s.name}${s.quantity ? ` (${s.quantity})` : ""}`,
        type: "inStock" as const,
      }));

    return { urgent, later, seedChecks, suggestions, inStock };
  }, [crops, seeds, gardens, year]);
}
