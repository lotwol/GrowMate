import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, HelpCircle, FileText } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type GardenType = Database["public"]["Enums"]["garden_type"];

export const GARDEN_TYPES: { value: GardenType; emoji: string; label: string }[] = [
  { value: "friland", emoji: "🌾", label: "Friland" },
  { value: "balkong", emoji: "🏙️", label: "Balkong" },
  { value: "växthus", emoji: "🏡", label: "Växthus" },
  { value: "pallkrage", emoji: "📦", label: "Pallkrage" },
  { value: "kruka", emoji: "🪴", label: "Kruka" },
];

// Standard pallkrage: 120cm × 80cm = 0.96m²
const PALLKRAGE_SQM = 0.96;

const SIZE_HINTS: Partial<Record<GardenType, string>> = {
  pallkrage: "En standardpallkrage ≈ 1 m² (120×80 cm)",
  balkong: "Liten balkong ≈ 3–5 m², stor ≈ 8–15 m²",
  växthus: "Litet växthus ≈ 4–6 m², stort ≈ 10–20 m²",
  kruka: "Krukor räknas oftast inte i m² — ange antal istället",
  friland: "Liten trädgård ≈ 10–30 m², stor ≈ 50–200 m²",
};

const DRAFT_KEY = "growmate_garden_draft";

interface DraftData {
  name: string;
  types: GardenType[];
  size: string;
  notes: string;
  pallkrageCount: string;
  savedAt: number;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftData;
    // Expire drafts older than 7 days
    if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(data: Omit<DraftData, "savedAt">) {
  // Only save if there's meaningful content
  if (!data.name.trim() && !data.notes.trim() && !data.size && !data.pallkrageCount) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch { /* ignore quota errors */ }
}

export function clearGardenDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

interface AddGardenFormProps {
  onSubmit: (garden: { name: string; type: GardenType[]; size_sqm?: number; notes?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddGardenForm({ onSubmit, onCancel, isLoading }: AddGardenFormProps) {
  const draft = useMemo(() => loadDraft(), []);
  const [name, setName] = useState(draft?.name ?? "");
  const [types, setTypes] = useState<GardenType[]>(draft?.types ?? ["friland"]);
  const [size, setSize] = useState(draft?.size ?? "");
  const [notes, setNotes] = useState(draft?.notes ?? "");
  const [pallkrageCount, setPallkrageCount] = useState(draft?.pallkrageCount ?? "");
  const [showDraftBanner, setShowDraftBanner] = useState(!!draft?.name);

  const hasPallkrage = types.includes("pallkrage");

  // Auto-save draft on every change
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft({ name, types, size, notes, pallkrageCount });
    }, 500);
    return () => clearTimeout(timer);
  }, [name, types, size, notes, pallkrageCount]);

  const calculatedSqm = useMemo(() => {
    if (hasPallkrage && pallkrageCount) {
      return Math.round(Number(pallkrageCount) * PALLKRAGE_SQM * 10) / 10;
    }
    return null;
  }, [hasPallkrage, pallkrageCount]);

  const activeHints = useMemo(() => {
    return types.map((t) => SIZE_HINTS[t]).filter(Boolean) as string[];
  }, [types]);

  const handleSubmit = () => {
    if (!name.trim() || types.length === 0) return;
    const finalSize = size ? Number(size) : calculatedSqm ?? undefined;
    clearGardenDraft();
    onSubmit({
      name: name.trim(),
      type: types,
      size_sqm: finalSize,
      notes: notes.trim() || undefined,
    });
  };

  const handleCancel = () => {
    // Draft is already auto-saved, just close
    onCancel();
  };

  const handleDiscardDraft = () => {
    clearGardenDraft();
    setName("");
    setTypes(["friland"]);
    setSize("");
    setNotes("");
    setPallkrageCount("");
    setShowDraftBanner(false);
  };

  const toggleType = (t: GardenType) => {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  };

  const applyPallkrageSize = () => {
    if (calculatedSqm) {
      setSize(String(calculatedSqm));
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground">Ny odlingsyta</h3>
        <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Draft restored banner */}
      {showDraftBanner && (
        <div className="flex items-center gap-2 rounded-xl bg-accent/60 border border-border px-3 py-2">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">Utkast återställt</p>
          <button
            onClick={handleDiscardDraft}
            className="text-xs text-destructive hover:underline"
          >
            Rensa
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Namn, t.ex. Trädgården"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
      />

      <div>
        <p className="text-xs text-muted-foreground mb-2">Typ av yta (välj en eller flera)</p>
        <div className="flex flex-wrap gap-2">
          {GARDEN_TYPES.map((gt) => (
            <button
              key={gt.value}
              onClick={() => toggleType(gt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                types.includes(gt.value)
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              )}
            >
              <span>{gt.emoji}</span> {gt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart size section */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          Storlek (m²)
          {activeHints.length > 0 && <HelpCircle className="w-3 h-3" />}
        </label>

        {/* Size hints */}
        {activeHints.length > 0 && (
          <div className="rounded-xl bg-accent/50 border border-border px-3 py-2 space-y-1">
            {activeHints.map((hint, i) => (
              <p key={i} className="text-xs text-muted-foreground">💡 {hint}</p>
            ))}
          </div>
        )}

        {/* Pallkrage calculator */}
        {hasPallkrage && (
          <div className="rounded-xl bg-growmate-leaf-light/30 border border-primary/20 px-3 py-2.5 space-y-2">
            <p className="text-xs font-medium text-foreground">📦 Pallkrage-kalkylator</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="Antal"
                value={pallkrageCount}
                onChange={(e) => setPallkrageCount(e.target.value)}
                className="w-20 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
              />
              <span className="text-xs text-muted-foreground">pallkragar</span>
              {calculatedSqm && (
                <>
                  <span className="text-xs text-muted-foreground">=</span>
                  <span className="text-sm font-medium text-foreground">{calculatedSqm} m²</span>
                  <button
                    type="button"
                    onClick={applyPallkrageSize}
                    className="text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Använd
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <input
          type="number"
          placeholder="t.ex. 20"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
        />
      </div>

      <textarea
        placeholder="Anteckningar, t.ex. sydvänt läge, lerjord..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
      />

      <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={!name.trim() || types.length === 0 || isLoading}>
        {isLoading ? "Sparar..." : "Lägg till yta"}
      </Button>
    </div>
  );
}
