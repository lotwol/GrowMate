import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { Garden } from "@/hooks/useGarden";
import { SeedPacketScanner, type ScannedSeedData } from "./SeedPacketScanner";
import { EmojiPicker } from "./EmojiPicker";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

const VALID_CATEGORIES: CropCategory[] = ["grönsak", "ört", "frukt", "bär", "blomma"];

interface AddCropFormProps {
  gardens: Garden[];
  onSubmit: (crop: { name: string; category: CropCategory; garden_id?: string; sow_date?: string; notes?: string; emoji?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddCropForm({ gardens, onSubmit, onCancel, isLoading }: AddCropFormProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [scannedFields, setScannedFields] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CropCategory>("grönsak");
  const [emoji, setEmoji] = useState("🥕");
  const [gardenId, setGardenId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [sowDate, setSowDate] = useState("");

  const handleScanComplete = (data: ScannedSeedData) => {
    const filled = new Set<string>();

    if (data.name) { setName(data.name); filled.add("name"); }
    if (data.category && VALID_CATEGORIES.includes(data.category)) {
      setCategory(data.category); filled.add("category");
    }

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

    setScannedFields(filled);
    setShowScanner(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      category,
      emoji,
      garden_id: gardenId || undefined,
      sow_date: sowDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  if (showScanner) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-foreground">Ny gröda</h3>
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
    "w-full rounded-xl border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body",
    scannedFields.has(field) ? "border-primary/50 bg-primary/5" : "border-input bg-background"
  );

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Ny gröda</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {scannedFields.size > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI fyllde i {scannedFields.size} fält — granska och justera</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          type="text"
          placeholder="Namn, t.ex. Tomat San Marzano"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={cn(inputCn("name"), "flex-1")}
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

      {gardens.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Odlingsyta</p>
          <select
            value={gardenId}
            onChange={(e) => setGardenId(e.target.value)}
            className={inputCn("garden")}
          >
            <option value="">Välj yta (valfritt)</option>
            {gardens.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground">Sådd-/planteringsdatum</label>
        <input
          type="date"
          value={sowDate}
          onChange={(e) => setSowDate(e.target.value)}
          className={cn(inputCn("sow_date"), "mt-1")}
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Anteckningar & odlingstips</label>
        <textarea
          placeholder="Anteckningar (valfritt)"
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
        {isLoading ? "Sparar..." : "Lägg till gröda"}
      </Button>
    </div>
  );
}
