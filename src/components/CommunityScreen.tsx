import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { sv } from "date-fns/locale";
import { Send, Check } from "lucide-react";
import { FrobyteTab } from "@/components/community/FrobyteTab";

interface CommunityInsight {
  id: string;
  crop_name: string;
  zone: string;
  sample_count: number | null;
  avg_success_rating: number | null;
  typical_sow_month_start: number | null;
  typical_sow_month_end: number | null;
  typical_harvest_month_start: number | null;
  typical_harvest_month_end: number | null;
  confidence_level: string | null;
}

interface LearningLogEntry {
  id: string;
  crop_name: string;
  zone: string;
  event_type: string;
  deviation_description: string | null;
  created_at: string;
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const monthRange = (start?: number | null, end?: number | null) => {
  if (!start) return null;
  const s = MONTH_NAMES[start - 1];
  const e = end ? MONTH_NAMES[end - 1] : s;
  return s === e ? s : `${s}–${e}`;
};

const renderStars = (rating: number) => {
  const rounded = Math.round(rating * 2) / 2;
  return Array.from({ length: 5 }, (_, i) => (i + 1 <= rounded ? "⭐" : "☆")).join("");
};

const EVENT_ICONS: Record<string, string> = {
  sow_deviation: "🔍",
  harvest_deviation: "🔍",
  baseline_confirmed: "✅",
  confidence_upgrade: "📈",
  new_insight: "🌱",
};

interface CommunityScreenProps {
  zone?: string | null;
}

type CommunityTab = "bidra" | "zon";

export function CommunityScreen({ zone }: CommunityScreenProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<CommunityTab>("zon");
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [logEntries, setLogEntries] = useState<LearningLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Bidra form state
  const [userCrops, setUserCrops] = useState<{ name: string; sow_date: string | null; harvest_date: string | null }[]>([]);
  const [cropName, setCropName] = useState("");
  const [sowDate, setSowDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [gardenType, setGardenType] = useState("");
  const [successRating, setSuccessRating] = useState<number | null>(null);
  const [notesPublic, setNotesPublic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (zone) {
        const { data } = await supabase
          .from("community_insights" as any)
          .select("*")
          .eq("zone", zone)
          .order("sample_count", { ascending: false });
        setInsights((data as any) || []);
      }

      const { data: logData } = await supabase
        .from("algorithm_learning_log" as any)
        .select("*")
        .in("event_type", ["sow_deviation", "harvest_deviation", "baseline_confirmed", "confidence_upgrade", "new_insight"])
        .order("created_at", { ascending: false })
        .limit(5);
      setLogEntries((logData as any) || []);

      // Load user's crops for easy selection
      if (user) {
        const { data: crops } = await supabase
          .from("crops" as any)
          .select("name, sow_date, harvest_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        setUserCrops((crops as any) || []);
      }

      setLoading(false);
    }
    load();
  }, [zone, user]);

  const selectCrop = (crop: { name: string; sow_date: string | null; harvest_date: string | null }) => {
    setCropName(crop.name);
    if (crop.sow_date) setSowDate(crop.sow_date);
    if (crop.harvest_date) setHarvestDate(crop.harvest_date);
  };

  const handleSubmit = async () => {
    if (!cropName.trim() || !zone) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("community_growing_data" as any)
        .insert({
          crop_name: cropName.trim(),
          zone,
          season_year: new Date().getFullYear(),
          sow_date: sowDate || null,
          harvest_date: harvestDate || null,
          garden_type: gardenType || null,
          success_rating: successRating,
          notes_public: notesPublic.trim() || null,
        } as any);
      if (error) throw error;
      setSubmitted(true);
      setCropName("");
      setSowDate("");
      setHarvestDate("");
      setGardenType("");
      setSuccessRating(null);
      setNotesPublic("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const GARDEN_TYPES = ["friland", "balkong", "växthus", "pallkrage", "kruka"];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-6 pb-3">
        <h2 className="text-lg font-display text-foreground mb-4">Community</h2>

        {/* Tab bar */}
        <div className="bg-muted rounded-xl p-1 flex mb-4">
          {([
            { id: "zon" as CommunityTab, label: "Din zon 🗺️" },
            { id: "bidra" as CommunityTab, label: "Bidra 🤝" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                tab === t.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {tab === "zon" ? (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : !zone ? (
              <div className="rounded-2xl bg-card border border-border p-6 text-center">
                <span className="text-2xl">🗺️</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Ange din zon i profilen för att se data från odlare nära dig.
                </p>
              </div>
            ) : insights.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-6 text-center">
                <span className="text-2xl">🌱</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Ingen community-data för zon {zone} ännu. Var först att bidra!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map((insight) => (
                  <div key={insight.id} className="rounded-xl bg-card border border-border p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{insight.crop_name}</p>
                      <ConfidenceBadge
                        level={insight.confidence_level as any}
                        sampleCount={insight.sample_count || 0}
                        showCount={true}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {insight.avg_success_rating && (
                        <p>{renderStars(insight.avg_success_rating)} ({insight.avg_success_rating.toFixed(1)}/5)</p>
                      )}
                      {insight.typical_sow_month_start && (
                        <p>Typisk sådd: {monthRange(insight.typical_sow_month_start, insight.typical_sow_month_end)}</p>
                      )}
                      {insight.typical_harvest_month_start && (
                        <p>Typisk skörd: {monthRange(insight.typical_harvest_month_start, insight.typical_harvest_month_end)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Algorithm learning log */}
            <div className="mt-6">
              <h3 className="font-display text-lg text-foreground mb-3">Algoritmens senaste lärande 🧠</h3>
              {logEntries.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    🌱 Algoritmen samlar in data. Lärandet syns här när tillräckligt många odlare har bidragit.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logEntries.map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-card border border-border px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{EVENT_ICONS[entry.event_type] || "🌱"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {entry.crop_name} · Zon {entry.zone}
                          </p>
                          {entry.deviation_description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {entry.deviation_description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: sv })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Intro */}
            <div className="rounded-2xl bg-gradient-to-br from-accent to-secondary p-4 border border-border">
              <p className="text-sm text-foreground leading-relaxed">
                🤝 Dela dina odlingsresultat anonymt med andra odlare i din zon. Ju fler som bidrar, desto smartare blir algoritmens rekommendationer!
              </p>
            </div>

            {!zone ? (
              <div className="rounded-2xl bg-card border border-border p-6 text-center">
                <span className="text-2xl">🗺️</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Ange din zon i profilen för att kunna bidra.
                </p>
              </div>
            ) : submitted ? (
              <div className="rounded-2xl bg-card border border-primary/30 p-6 text-center animate-fade-in">
                <Check className="w-10 h-10 text-primary mx-auto" />
                <p className="text-foreground font-medium mt-3">Tack för ditt bidrag! 🌱</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Din data hjälper andra odlare i zon {zone}.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
                <h3 className="font-display text-foreground">Dela en gröda</h3>

                {/* Quick select from user's crops */}
                {userCrops.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Välj från dina grödor</p>
                    <div className="flex flex-wrap gap-1.5">
                      {userCrops.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectCrop(c)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            cropName === c.name
                              ? "border-primary bg-accent text-accent-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Crop name */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gröda *</label>
                  <Input
                    placeholder="T.ex. Tomat, Morot, Sallad..."
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Sådatum</label>
                    <Input type="date" value={sowDate} onChange={(e) => setSowDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Skördedatum</label>
                    <Input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
                  </div>
                </div>

                {/* Garden type */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Odlingstyp</label>
                  <div className="flex flex-wrap gap-1.5">
                    {GARDEN_TYPES.map((gt) => (
                      <button
                        key={gt}
                        type="button"
                        onClick={() => setGardenType(gardenType === gt ? "" : gt)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize",
                          gardenType === gt
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {gt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Success rating */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Hur gick det?</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSuccessRating(successRating === v ? null : v)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-xl transition-all",
                          successRating === v
                            ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                            : "bg-card border border-border hover:bg-accent"
                        )}
                      >
                        {v <= 1 ? "😔" : v <= 2 ? "😐" : v <= 3 ? "🙂" : v <= 4 ? "😊" : "🌟"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tips till andra odlare (valfritt)</label>
                  <Textarea
                    placeholder="T.ex. 'Sorten X fungerade bäst i pallkrage'"
                    value={notesPublic}
                    onChange={(e) => setNotesPublic(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">
                    🔒 Din data delas anonymt – inget kopplas till ditt konto. Zon {zone} anges automatiskt.
                  </p>
                </div>

                <Button
                  variant="growmate"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!cropName.trim() || submitting}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  {submitting ? "Skickar..." : "Dela med communityn"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
