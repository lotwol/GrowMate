import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { Garden } from "@/hooks/useGarden";
import { SeedPacketScanner, type ScannedSeedData } from "./SeedPacketScanner";
import { EmojiPicker } from "./EmojiPicker";
import { supabase } from "@/integrations/supabase/client";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

type CropCategory = Database["public"]["Enums"]["crop_category"];

const CATEGORIES: { value: CropCategory; emoji: string; label: string }[] = [
  { value: "grönsak", emoji: "🥕", label: "Grönsak" },
  { value: "ört", emoji: "🌿", label: "Ört" },
  { value: "frukt", emoji: "🍎", label: "Frukt" },
  { value: "bär", emoji: "🫐", label: "Bär" },
  { value: "blomma", emoji: "🌸", label: "Blomma" },
];

const VALID_CATEGORIES: CropCategory[] = ["grönsak", "ört", "frukt", "bär", "blomma"];

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const monthRange = (start?: number | null, end?: number | null) => {
  if (!start) return null;
  const s = MONTH_NAMES[start - 1];
  const e = end ? MONTH_NAMES[end - 1] : s;
  return s === e ? s : `${s}–${e}`;
};

const DIFFICULTY_BADGE: Record<string, string> = {
  lätt: "🟢 Lätt",
  medel: "🟡 Medel",
  avancerad: "🔴 Avancerad",
};

interface AddCropFormProps {
  gardens: Garden[];
  zone?: string | null;
  school?: string | null;
  onSubmit: (crop: { name: string; category: CropCategory; garden_id?: string; sow_date?: string; notes?: string; emoji?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// OpenFarm suggestion type
interface OpenFarmSuggestion {
  name: string;
  description: string;
  sun?: string;
  spread?: string;
  rowSpacing?: string;
  sowingMethod?: string;
}

// Swedish tip type
interface SwedishTip {
  crop_name: string;
  zone: string;
  sow_indoor_start: number | null;
  sow_indoor_end: number | null;
  sow_outdoor_start: number | null;
  sow_outdoor_end: number | null;
  harvest_start: number | null;
  harvest_end: number | null;
  days_to_harvest: number | null;
  spacing_cm: number | null;
  difficulty: string | null;
  tips: string | null;
  school_naturens_vag_tip: string | null;
  school_precisionsodlaren_tip: string | null;
  school_hackaren_tip: string | null;
  school_traditionalisten_tip: string | null;
}

interface CommunityInsight {
  crop_name: string;
  zone: string;
  sample_count: number;
  avg_success_rating: number | null;
  typical_sow_month_start: number | null;
  typical_sow_month_end: number | null;
  typical_harvest_month_start: number | null;
  typical_harvest_month_end: number | null;
  confidence_level: string | null;
}

export function AddCropForm({ gardens, zone, school, onSubmit, onCancel, isLoading }: AddCropFormProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [scannedFields, setScannedFields] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CropCategory>("grönsak");
  const [emoji, setEmoji] = useState("🥕");
  const [gardenId, setGardenId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [sowDate, setSowDate] = useState("");

  // Knowledge layer state
  const [openFarmSuggestions, setOpenFarmSuggestions] = useState<OpenFarmSuggestion[]>([]);
  const [swedishTip, setSwedishTip] = useState<SwedishTip | null>(null);
  const [communityInsight, setCommunityInsight] = useState<CommunityInsight | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced lookups when name changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setOpenFarmSuggestions([]);
      setSwedishTip(null);
      setCommunityInsight(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      // OpenFarm lookup
      fetch(`https://openfarm.cc/api/v1/crops/?filter=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((json) => {
          const results = (json.data || []).slice(0, 3).map((item: any) => ({
            name: item.attributes?.name || "",
            description: item.attributes?.description || "",
            sun: item.attributes?.sun_requirements,
            spread: item.attributes?.spread ? `${item.attributes.spread} cm` : undefined,
            rowSpacing: item.attributes?.row_spacing ? `${item.attributes.row_spacing} cm` : undefined,
            sowingMethod: item.attributes?.sowing_method,
          }));
          setOpenFarmSuggestions(results);
        })
        .catch(() => setOpenFarmSuggestions([]));

      // Swedish tips lookup
      if (zone) {
        supabase
          .from("swedish_crop_tips" as any)
          .select("*")
          .ilike("crop_name", `%${trimmed}%`)
          .eq("zone", zone)
          .limit(1)
          .then(({ data }) => {
            setSwedishTip((data as any)?.[0] || null);
          });
      }

      // Community insights lookup
      if (zone) {
        supabase
          .from("community_insights" as any)
          .select("*")
          .ilike("crop_name", `%${trimmed}%`)
          .eq("zone", zone)
          .limit(1)
          .then(({ data }) => {
            const row = (data as any)?.[0];
            setCommunityInsight(row && row.sample_count >= 3 ? row : null);
          });
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, zone]);

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

  const applyOpenFarmSuggestion = (s: OpenFarmSuggestion) => {
    setName(s.name);
    const infoLines: string[] = [];
    if (s.sun) infoLines.push(`Solbehov: ${s.sun}`);
    if (s.sowingMethod) infoLines.push(`Såmetod: ${s.sowingMethod}`);
    if (s.spread) infoLines.push(`Bredd: ${s.spread}`);
    if (s.rowSpacing) infoLines.push(`Radavstånd: ${s.rowSpacing}`);
    if (infoLines.length > 0) {
      setNotes((prev) => prev ? prev + "\n\n" + infoLines.join("\n") : infoLines.join("\n"));
    }
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

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating * 2) / 2;
    return Array.from({ length: 5 }, (_, i) => (i + 1 <= rounded ? "⭐" : "☆")).join("");
  };

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

      {/* OpenFarm suggestions */}
      {openFarmSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Från global fröbas 🌍</p>
          <div className="flex flex-wrap gap-1.5">
            {openFarmSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyOpenFarmSuggestion(s)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-border bg-card text-foreground hover:border-primary/40 transition-colors"
              >
                🌱 {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Swedish tip card */}
      {swedishTip && (
        <div className="bg-green-500/10 rounded-lg px-3 py-2 space-y-1">
          <p className="text-sm font-medium text-green-700">🇸🇪 Tips för Zon {swedishTip.zone}</p>
          <div className="text-xs text-green-700 space-y-0.5">
            {swedishTip.sow_indoor_start && (
              <p>Så inomhus: {monthRange(swedishTip.sow_indoor_start, swedishTip.sow_indoor_end)}</p>
            )}
            {swedishTip.sow_outdoor_start && (
              <p>Direktså: {monthRange(swedishTip.sow_outdoor_start, swedishTip.sow_outdoor_end)}</p>
            )}
            {swedishTip.harvest_start && (
              <p>Skörd: {monthRange(swedishTip.harvest_start, swedishTip.harvest_end)}</p>
            )}
            {swedishTip.days_to_harvest && <p>Tid till skörd: ~{swedishTip.days_to_harvest} dagar</p>}
            {swedishTip.spacing_cm && <p>Plantavstånd: {swedishTip.spacing_cm} cm</p>}
            {swedishTip.difficulty && <p>{DIFFICULTY_BADGE[swedishTip.difficulty] || swedishTip.difficulty}</p>}
            {swedishTip.tips && <p className="italic mt-1">{swedishTip.tips}</p>}
          </div>
          {(() => {
            const schoolTipMap: Record<string, string | null | undefined> = {
              "naturens-vag": swedishTip.school_naturens_vag_tip,
              "precisionsodlaren": swedishTip.school_precisionsodlaren_tip,
              "hackaren": swedishTip.school_hackaren_tip,
              "traditionalisten": swedishTip.school_traditionalisten_tip,
            };
            const schoolEmojis: Record<string, string> = { "naturens-vag": "🌾", precisionsodlaren: "🔬", hackaren: "⚡", traditionalisten: "📖" };
            const schoolNames: Record<string, string> = { "naturens-vag": "Naturens väg", precisionsodlaren: "Precisionsodlaren", hackaren: "Hackaren", traditionalisten: "Traditionalisten" };
            const tip = school ? schoolTipMap[school] : null;
            if (!tip) return null;
            return (
              <div className="mt-2 pt-2 border-t border-green-500/20">
                <span className="text-xs bg-accent text-accent-foreground rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                  {schoolEmojis[school!]} {schoolNames[school!]}
                </span>
                <p className="text-sm text-foreground mt-1">{tip}</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Community insights card */}
      {communityInsight && (
        <div className="bg-blue-500/10 rounded-lg px-3 py-2 space-y-1">
          <p className="text-sm font-medium text-blue-700">👥 Från svenska odlare i zon {communityInsight.zone}</p>
          <div className="text-xs text-blue-700 space-y-0.5">
            {communityInsight.avg_success_rating && (
              <p>{renderStars(communityInsight.avg_success_rating)} ({communityInsight.avg_success_rating.toFixed(1)}/5)</p>
            )}
            <ConfidenceBadge
              level={communityInsight.confidence_level as any}
              sampleCount={communityInsight.sample_count}
              showCount={true}
            />
            {communityInsight.typical_sow_month_start && (
              <p>Typisk sådd: {monthRange(communityInsight.typical_sow_month_start, communityInsight.typical_sow_month_end)}</p>
            )}
            {communityInsight.typical_harvest_month_start && (
              <p>Typisk skörd: {monthRange(communityInsight.typical_harvest_month_start, communityInsight.typical_harvest_month_end)}</p>
            )}
          </div>
          {communityInsight.confidence_level === "tidig" && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Tidig data – rekommendationen stärks i takt med att fler odlare bidrar.
            </p>
          )}
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-2">Kategori</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value); setEmoji(c.emoji); }}
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
