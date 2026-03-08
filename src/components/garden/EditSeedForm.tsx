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

interface EditSeedFormProps {
  seed: {
    id: string;
    name: string;
    category: CropCategory;
    quantity?: string | null;
    best_before?: string | null;
    purchased_from?: string | null;
    cost?: number | null;
    notes?: string | null;
  };
  onSave: (updates: { id: string; name: string; category: CropCategory; quantity?: string; best_before?: string; purchased_from?: string; cost?: number; notes?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditSeedForm({ seed, onSave, onCancel, isLoading }: EditSeedFormProps) {
  const [name, setName] = useState(seed.name);
  const [category, setCategory] = useState<CropCategory>(seed.category);
  const [quantity, setQuantity] = useState(seed.quantity || "");
  const [bestBefore, setBestBefore] = useState(seed.best_before || "");
  const [purchasedFrom, setPurchasedFrom] = useState(seed.purchased_from || "");
  const [cost, setCost] = useState(seed.cost != null ? String(seed.cost) : "");
  const [notes, setNotes] = useState(seed.notes || "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      id: seed.id,
      name: name.trim(),
      category,
      quantity: quantity.trim() || undefined,
      best_before: bestBefore || undefined,
      purchased_from: purchasedFrom.trim() || undefined,
      cost: cost ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const inputCn = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1";

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Redigera frö</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Namn</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCn} />
      </div>

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
          <input type="text" placeholder="t.ex. 1 påse" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCn} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Pris (kr)</label>
          <input type="number" placeholder="t.ex. 35" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCn} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Bäst före</label>
          <input type="date" value={bestBefore} onChange={(e) => setBestBefore(e.target.value)} className={inputCn} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Köpt från</label>
          <input type="text" placeholder="t.ex. Impecta" value={purchasedFrom} onChange={(e) => setPurchasedFrom(e.target.value)} className={inputCn} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Anteckningar</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none mt-1"
        />
      </div>

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || isLoading}>
        {isLoading ? "Sparar..." : "Spara ändringar"}
      </Button>
    </div>
  );
}
