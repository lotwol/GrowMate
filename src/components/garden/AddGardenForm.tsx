import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type GardenType = Database["public"]["Enums"]["garden_type"];

export const GARDEN_TYPES: { value: GardenType; emoji: string; label: string }[] = [
  { value: "friland", emoji: "🌾", label: "Friland" },
  { value: "balkong", emoji: "🏙️", label: "Balkong" },
  { value: "växthus", emoji: "🏡", label: "Växthus" },
  { value: "pallkrage", emoji: "📦", label: "Pallkrage" },
  { value: "kruka", emoji: "🪴", label: "Kruka" },
];

interface AddGardenFormProps {
  onSubmit: (garden: { name: string; type: GardenType[]; size_sqm?: number; notes?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddGardenForm({ onSubmit, onCancel, isLoading }: AddGardenFormProps) {
  const [name, setName] = useState("");
  const [types, setTypes] = useState<GardenType[]>(["friland"]);
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || types.length === 0) return;
    onSubmit({
      name: name.trim(),
      type: types,
      size_sqm: size ? Number(size) : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const toggleType = (t: GardenType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Ny odlingsyta</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        type="text"
        placeholder="Namn, t.ex. Trädgården"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
      />

      <div>
        <p className="text-xs text-muted-foreground mb-2">Typ av yta</p>
        <div className="flex flex-wrap gap-2">
          {GARDEN_TYPES.map((gt) => (
            <button
              key={gt.value}
              onClick={() => setType(gt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                type === gt.value
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span>{gt.emoji}</span> {gt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Storlek (m²)</label>
          <input
            type="number"
            placeholder="t.ex. 20"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1"
          />
        </div>
      </div>

      <textarea
        placeholder="Anteckningar, t.ex. sydvänt läge, lerjord..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
      />

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || isLoading}>
        {isLoading ? "Sparar..." : "Lägg till yta"}
      </Button>
    </div>
  );
}
