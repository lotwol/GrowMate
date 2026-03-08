import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { Garden, Crop } from "@/hooks/useGarden";
import { EmojiPicker } from "./EmojiPicker";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

interface EditCropFormProps {
  crop: Crop;
  gardens: Garden[];
  onSave: (updates: { id: string; name?: string; category?: CropCategory; emoji?: string | null; garden_id?: string | null; sow_date?: string | null; harvest_date?: string | null; notes?: string | null; cost?: number | null }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditCropForm({ crop, gardens, onSave, onCancel, isLoading }: EditCropFormProps) {
  const [name, setName] = useState(crop.name);
  const [category, setCategory] = useState<CropCategory>(crop.category);
  const [gardenId, setGardenId] = useState(crop.garden_id || "");
  const [sowDate, setSowDate] = useState(crop.sow_date || "");
  const [harvestDate, setHarvestDate] = useState(crop.harvest_date || "");
  const [notes, setNotes] = useState(crop.notes || "");
  const [cost, setCost] = useState(crop.cost ? String(crop.cost) : "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: crop.id,
      name: name.trim(),
      category,
      garden_id: gardenId || null,
      sow_date: sowDate || null,
      harvest_date: harvestDate || null,
      notes: notes.trim() || null,
      cost: cost ? Number(cost) : null,
    });
  };

  const inputCn = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1";

  return (
    <div className="rounded-2xl bg-card border-2 border-primary/30 p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Redigera gröda</h3>
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

      {gardens.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground">Odlingsyta</label>
          <select value={gardenId} onChange={(e) => setGardenId(e.target.value)} className={inputCn}>
            <option value="">Ingen yta</option>
            {gardens.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Sådd-datum</label>
          <input type="date" value={sowDate} onChange={(e) => setSowDate(e.target.value)} className={inputCn} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Skörd-datum</label>
          <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className={inputCn} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Kostnad (kr)</label>
        <input type="number" placeholder="t.ex. 35" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCn} />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Anteckningar</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none mt-1"
        />
      </div>

      <Button variant="growmate" className="w-full" onClick={handleSave} disabled={!name.trim() || isLoading}>
        <Save className="w-4 h-4 mr-1.5" />
        {isLoading ? "Sparar..." : "Spara ändringar"}
      </Button>
    </div>
  );
}
