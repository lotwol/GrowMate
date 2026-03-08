import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Sprout } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Garden, SeedItem } from "@/hooks/useGarden";

const ACTIVE_STATUSES = ["planerad", "sådd", "grodd", "utplanterad"];

const START_STATUSES = [
  { value: "planerad", label: "Planerad", emoji: "📋" },
  { value: "sådd", label: "Sådd", emoji: "🌱" },
  { value: "grodd", label: "I kruka inomhus", emoji: "🪴" },
];

interface StartCropFromSeedSheetProps {
  open: boolean;
  onClose: () => void;
  seed: SeedItem & { emoji?: string | null };
  gardens: Garden[];
  onSubmit: (data: {
    name: string;
    emoji?: string;
    category: string;
    garden_id?: string;
    sow_date?: string;
    status: string;
    notes?: string;
    seed_id: string;
  }) => void;
  isLoading?: boolean;
}

export function StartCropFromSeedSheet({ open, onClose, seed, gardens, onSubmit, isLoading }: StartCropFromSeedSheetProps) {
  const [gardenId, setGardenId] = useState<string>("");
  const [sowDate, setSowDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("planerad");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit({
      name: seed.name,
      emoji: (seed as any).emoji || undefined,
      category: seed.category,
      garden_id: gardenId || undefined,
      sow_date: sowDate || undefined,
      status,
      notes: notes.trim() || undefined,
      seed_id: seed.id,
    });
  };

  const inputCn = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-1";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Sprout className="w-5 h-5 text-primary" />
            Starta odling av {seed.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          {/* Read-only seed info */}
          <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{(seed as any).emoji || "🌱"}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{seed.name}</p>
                <p className="text-xs text-muted-foreground">
                  Frö: {seed.name}{seed.quantity ? ` · ${seed.quantity} kvar` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Garden picker */}
          <div>
            <label className="text-xs text-muted-foreground">Odlingsyta</label>
            <select
              value={gardenId}
              onChange={(e) => setGardenId(e.target.value)}
              className={inputCn}
            >
              <option value="">Välj yta (valfritt)</option>
              {gardens.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="text-xs text-muted-foreground">Startdatum</label>
            <input
              type="date"
              value={sowDate}
              onChange={(e) => setSowDate(e.target.value)}
              className={inputCn}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {START_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                    status === s.value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground">Anteckning (valfritt)</label>
            <input
              type="text"
              placeholder="T.ex. fönsterbräda köket"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCn}
            />
          </div>

          <Button variant="growmate" className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Startar..." : "🌱 Starta odling"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
