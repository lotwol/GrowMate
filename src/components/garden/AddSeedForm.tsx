import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { SeedPacketScanner, type ScannedSeedData } from "./SeedPacketScanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EmojiPicker } from "./EmojiPicker";
import { suggestSeedEmoji } from "./seedEmojiSuggestion";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

const VALID_CATEGORIES: CropCategory[] = ["grönsak", "ört", "frukt", "bär", "blomma"];

interface AddSeedFormProps {
  onSubmit: (seed: { name: string; category: CropCategory; emoji?: string; quantity?: string; best_before?: string; purchased_from?: string; cost?: number; notes?: string; photo_urls?: string[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddSeedForm({ onSubmit, onCancel, isLoading }: AddSeedFormProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [scannedFields, setScannedFields] = useState<Set<string>>(new Set());
  const [scannedPhotos, setScannedPhotos] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CropCategory>("grönsak");
  const [quantity, setQuantity] = useState("");
  const [bestBefore, setBestBefore] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const handleScanComplete = (data: ScannedSeedData, images: string[]) => {
    const filled = new Set<string>();

    if (data.name) { setName(data.name); filled.add("name"); }
    if (data.category && VALID_CATEGORIES.includes(data.category)) {
      setCategory(data.category); filled.add("category");
    }
    if (data.quantity) { setQuantity(data.quantity); filled.add("quantity"); }
    if (data.best_before) { setBestBefore(data.best_before); filled.add("best_before"); }
    if (data.purchased_from) { setPurchasedFrom(data.purchased_from); filled.add("purchased_from"); }
    if (data.cost) { setCost(String(data.cost)); filled.add("cost"); }

    // Compile extra info into notes
    const extraNotes: string[] = [];
    if (data.sow_indoor) extraNotes.push(`Förkultivering: ${data.sow_indoor}`);
    if (data.sow_outdoor) extraNotes.push(`Direktsådd: ${data.sow_outdoor}`);
    if (data.harvest_time) extraNotes.push(`Skörd: ${data.harvest_time}`);
    if (data.spacing) extraNotes.push(`Avstånd: ${data.spacing}`);
    if (data.notes) extraNotes.push(data.notes);
    if (extraNotes.length > 0) {
      setNotes(extraNotes.join("\n"));
      filled.add("notes");
    }

    // Store scanned images for later upload
    setScannedPhotos(images);

    setScannedFields(filled);
    setShowScanner(false);
  };

  const { user } = useAuth();

  const uploadScannedPhotos = async (): Promise<string[]> => {
    if (scannedPhotos.length === 0 || !user) return [];
    const urls: string[] = [];
    for (let i = 0; i < scannedPhotos.length; i++) {
      try {
        const base64 = scannedPhotos[i];
        const res = await fetch(base64);
        const blob = await res.blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const path = `seeds/${user.id}/${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from("growmate-photos").upload(path, blob);
        if (error) continue;
        const { data: urlData } = supabase.storage.from("growmate-photos").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      } catch {
        // skip failed uploads
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const photoUrls = await uploadScannedPhotos();
    onSubmit({
      name: name.trim(),
      category,
      quantity: quantity.trim() || undefined,
      best_before: bestBefore || undefined,
      purchased_from: purchasedFrom.trim() || undefined,
      cost: cost ? Number(cost) : undefined,
      notes: notes.trim() || undefined,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
    });
  };

  if (showScanner) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-foreground">Nytt frö</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SeedPacketScanner
          onScanComplete={handleScanComplete}
          onSkip={() => setShowScanner(false)}
        />
      </div>
    );
  }

  const inputCn = (field: string) => cn(
    "w-full rounded-xl border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1",
    scannedFields.has(field) ? "border-primary/50 bg-primary/5" : "border-input bg-background"
  );

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Nytt frö</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {scannedFields.size > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI fyllde i {scannedFields.size} fält — granska och justera om det behövs</span>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground">Namn</label>
        <input
          type="text"
          placeholder="Namn, t.ex. Basilika Genovese"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCn("name")}
        />
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
          <input type="text" placeholder="t.ex. 1 påse" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCn("quantity")} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Pris (kr)</label>
          <input type="number" placeholder="t.ex. 35" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCn("cost")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Bäst före</label>
          <input type="date" value={bestBefore} onChange={(e) => setBestBefore(e.target.value)} className={inputCn("best_before")} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Köpt från</label>
          <input type="text" placeholder="t.ex. Impecta" value={purchasedFrom} onChange={(e) => setPurchasedFrom(e.target.value)} className={inputCn("purchased_from")} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Anteckningar & odlingstips</label>
        <textarea
          placeholder="Anteckningar, sådd-tider, odlingstips..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={cn(
            "w-full rounded-xl border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none mt-1",
            scannedFields.has("notes") ? "border-primary/50 bg-primary/5" : "border-input bg-background"
          )}
        />
      </div>

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || isLoading}>
        {isLoading ? "Sparar..." : "Lägg till frö"}
      </Button>
    </div>
  );
}
