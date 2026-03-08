import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { PhotoStrip } from "@/components/PhotoStrip";
import { EmojiPicker } from "./EmojiPicker";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv", emoji: "🟢" },
  { value: "depleted", label: "Slut", emoji: "📦" },
  { value: "expired", label: "Utgången", emoji: "⏰" },
  { value: "archived", label: "Arkiverad", emoji: "🗄️" },
];

interface EditSeedFormProps {
  seed: {
    id: string;
    name: string;
    category: CropCategory;
    emoji?: string | null;
    quantity?: string | null;
    best_before?: string | null;
    purchased_from?: string | null;
    cost?: number | null;
    notes?: string | null;
    status?: string | null;
    photo_urls?: string[] | null;
  };
  onSave: (updates: { id: string; name: string; category: CropCategory; emoji?: string; quantity?: string; best_before?: string; purchased_from?: string; cost?: number; notes?: string; status?: string; photo_urls?: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditSeedForm({ seed, onSave, onCancel, isLoading }: EditSeedFormProps) {
  const [name, setName] = useState(seed.name);
  const [emoji, setEmoji] = useState(seed.emoji || "🌱");
  const [category, setCategory] = useState<CropCategory>(seed.category);
  const [quantity, setQuantity] = useState(seed.quantity || "");
  const [bestBefore, setBestBefore] = useState(seed.best_before || "");
  const [purchasedFrom, setPurchasedFrom] = useState(seed.purchased_from || "");
  const [cost, setCost] = useState(seed.cost != null ? String(seed.cost) : "");
  const [notes, setNotes] = useState(seed.notes || "");
  const [status, setStatus] = useState(seed.status || "active");
  const [photoUrls, setPhotoUrls] = useState<string[]>(seed.photo_urls || []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      id: seed.id,
      name: name.trim(),
      category,
      emoji,
      quantity: quantity.trim() || undefined,
      best_before: bestBefore || undefined,
      purchased_from: purchasedFrom.trim() || undefined,
      cost: cost ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
      status,
      photo_urls: photoUrls,
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

      {/* Status selector */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                status === s.value
                  ? s.value === "active" ? "border-primary bg-primary/10 text-foreground" : "border-muted-foreground bg-muted text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Namn & ikon</label>
        <div className="flex items-center gap-2 mt-1">
          <EmojiPicker value={emoji} onChange={setEmoji} size="sm" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body" />
        </div>
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

      {/* Scanned photos */}
      {photoUrls.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Fröpåsebilder</label>
          <PhotoStrip
            photos={photoUrls}
            onPhotosChange={setPhotoUrls}
            storagePath={`seeds/${seed.id}`}
          />
        </div>
      )}

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || isLoading}>
        {isLoading ? "Sparar..." : "Spara ändringar"}
      </Button>
    </div>
  );
}
