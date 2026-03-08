import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

interface AddSeedFormProps {
  onSubmit: (seed: { name: string; category: CropCategory; quantity?: string; best_before?: string; purchased_from?: string; cost?: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddSeedForm({ onSubmit, onCancel, isLoading }: AddSeedFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CropCategory>("grönsak");
  const [quantity, setQuantity] = useState("");
  const [bestBefore, setBestBefore] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [cost, setCost] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      category,
      quantity: quantity.trim() || undefined,
      best_before: bestBefore || undefined,
      purchased_from: purchasedFrom.trim() || undefined,
      cost: cost ? Number(cost) : undefined,
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Nytt frö</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Namn, t.ex. Basilika Genovese"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
      />

      <div>
        <p className="text-xs text-muted-foreground mb-2">Kategori</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                category === c.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Mängd</label>
          <input
            type="text"
            placeholder="t.ex. 1 påse"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Pris (kr)</label>
          <input
            type="number"
            placeholder="t.ex. 35"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Bäst före</label>
          <input
            type="date"
            value={bestBefore}
            onChange={(e) => setBestBefore(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Köpt från</label>
          <input
            type="text"
            placeholder="t.ex. Impecta"
            value={purchasedFrom}
            onChange={(e) => setPurchasedFrom(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
          />
        </div>
      </div>

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || isLoading}>
        {isLoading ? "Sparar..." : "Lägg till frö"}
      </Button>
    </div>
  );
}
