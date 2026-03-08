import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

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
  const [tab, setTab] = useState<CommunityTab>("zon");
  const [insights, setInsights] = useState<CommunityInsight[]>([]);
  const [logEntries, setLogEntries] = useState<LearningLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const queries: Promise<any>[] = [];

      // Insights for zone
      if (zone) {
        queries.push(
          supabase
            .from("community_insights" as any)
            .select("*")
            .eq("zone", zone)
            .order("sample_count", { ascending: false })
            .then(({ data }) => setInsights((data as any) || []))
        );
      }

      // Learning log
      queries.push(
        supabase
          .from("algorithm_learning_log" as any)
          .select("*")
          .in("event_type", ["sow_deviation", "harvest_deviation", "baseline_confirmed", "confidence_upgrade", "new_insight"])
          .order("created_at", { ascending: false })
          .limit(5)
          .then(({ data }) => setLogEntries((data as any) || []))
      );

      await Promise.all(queries);
      setLoading(false);
    }
    load();
  }, [zone]);

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
          <div className="rounded-2xl bg-card border border-border p-6 text-center">
            <span className="text-2xl">🤝</span>
            <p className="text-foreground font-medium mt-3">Bidra med din odlingsdata</p>
            <p className="text-sm text-muted-foreground mt-1">
              Dela dina resultat anonymt med andra odlare i din zon. Funktionen kommer snart!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
