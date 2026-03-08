import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Package, X } from "lucide-react";
import type { SeedItem } from "@/hooks/useGarden";

const CATEGORY_EMOJI: Record<string, string> = {
  grönsak: "🥕", ört: "🌿", frukt: "🍎", bär: "🫐", blomma: "🌸",
};

interface SeedSelectorProps {
  seeds: SeedItem[];
  selectedSeedId: string | null;
  onSelect: (seedId: string | null) => void;
  cropName?: string;
  /** Show "Ta bort koppling" option */
  allowClear?: boolean;
  className?: string;
}

export function SeedSelector({ seeds, selectedSeedId, onSelect, cropName, allowClear, className }: SeedSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter to active seeds, sort by crop name match
  const sortedSeeds = useMemo(() => {
    const activeSeeds = seeds.filter((s: any) => !s.status || s.status === "active");
    if (!cropName || cropName.trim().length < 2) return activeSeeds;
    const lower = cropName.trim().toLowerCase();
    return [...activeSeeds].sort((a, b) => {
      const aMatch = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bMatch = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [seeds, cropName]);

  const selectedSeed = seeds.find((s) => s.id === selectedSeedId);

  if (seeds.length === 0) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        <Package className="w-3.5 h-3.5 inline mr-1" />
        Inga frön i lager –{" "}
        <span className="text-primary underline cursor-pointer">lägg till i Frön-tabben</span>
      </div>
    );
  }

  const seedLabel = (seed: SeedItem) => {
    const emoji = CATEGORY_EMOJI[seed.category] || "🌱";
    let label = `${emoji} ${seed.name}`;
    if (seed.notes?.includes("Sort:")) {
      // try to extract variety from notes
    }
    if (seed.quantity) label += ` · ${seed.quantity}`;
    return label;
  };

  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground">Frö från lager (valfritt)</label>
      <select
        value={selectedSeedId || ""}
        onChange={(e) => {
          const val = e.target.value;
          onSelect(val === "__clear__" ? null : val || null);
        }}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
      >
        <option value="">Välj ett frö...</option>
        {allowClear && selectedSeedId && (
          <option value="__clear__">🚫 Ta bort koppling</option>
        )}
        {sortedSeeds.map((seed) => (
          <option key={seed.id} value={seed.id}>
            {seedLabel(seed)}
          </option>
        ))}
      </select>
    </div>
  );
}
