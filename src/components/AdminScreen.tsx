import { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { useAlgorithmStats, useTopDeviations, useZoneCoverage } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface AdminScreenProps {
  onBack: () => void;
}

const MONTH_NAMES = ["", "jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function AdminScreen({ onBack }: AdminScreenProps) {
  const { data: stats, isLoading: statsLoading } = useAlgorithmStats();
  const { data: deviations } = useTopDeviations();
  const { data: zones } = useZoneCoverage();
  const [aggregating, setAggregating] = useState(false);

  const handleAggregate = async () => {
    setAggregating(true);
    try {
      const { data, error } = await supabase.functions.invoke("aggregate-community-insights");
      if (error) throw error;
      toast({
        title: "✅ Klar!",
        description: `${data?.processed ?? 0} insikter uppdaterade, ${data?.confidence_upgrades ?? 0} konfidensnivåer höjda, ${data?.deviations_found ?? 0} avvikelser identifierade`,
      });
    } catch {
      toast({ title: "Fel", description: "Något gick fel – kontrollera Edge Function-loggar", variant: "destructive" });
    } finally {
      setAggregating(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const confDist = stats?.confidence_distribution || { tidig: 0, växande: 0, tillförlitlig: 0, stark: 0 };
  const confTotal = Object.values(confDist).reduce((a, b) => a + b, 0);
  const strongReliable = (confDist.stark || 0) + (confDist.tillförlitlig || 0);
  const confInsight = confTotal === 0
    ? "🌱 Algoritmen samlar in data – håll ut!"
    : strongReliable > confTotal * 0.5
      ? "✅ Algoritmen har god datakvalitet"
      : confDist.tidig === confTotal
        ? "🌱 Algoritmen samlar in data – håll ut!"
        : "📈 Algoritmen växer stadigt";

  const weekly = stats?.weekly_contributions || [];
  const maxWeekly = Math.max(...weekly.map((w) => w.count), 1);
  const first6Avg = weekly.slice(0, 6).reduce((a, b) => a + b.count, 0) / 6;
  const last6Avg = weekly.slice(6).reduce((a, b) => a + b.count, 0) / 6;
  const trendLabel = last6Avg > first6Avg * 1.1
    ? { text: "↑ Växande", cls: "text-emerald-600" }
    : last6Avg < first6Avg * 0.9
      ? { text: "↓ Avtagande", cls: "text-orange-500" }
      : { text: "→ Stabil", cls: "text-muted-foreground" };

  const maxZoneContrib = Math.max(...(zones || []).map((z) => z.contributions), 1);

  const confColors: Record<string, string> = {
    tidig: "bg-muted",
    växande: "bg-green-200",
    tillförlitlig: "bg-emerald-400",
    stark: "bg-primary",
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg flex-1">GrowMate Admin 🧠</h1>
        <span className="text-xs text-muted-foreground">Only you see this 👀</span>
      </div>

      <div className="px-4 pt-6 max-w-md mx-auto space-y-8">
        {/* Section 1 — Datainsamling */}
        <section className="space-y-3">
          <h2 className="font-display text-lg">Datainsamling</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: stats?.total_contributions, label: "Bidrag totalt", emoji: "🌱" },
              { value: stats?.total_insights, label: "Aktiva insikter", emoji: "🧠" },
              { value: stats?.total_seed_shares, label: "Fröannonser", emoji: "🌾" },
              { value: stats?.total_interests, label: "Fröintressen", emoji: "💚" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl bg-card border border-border p-4 text-center">
                <div className="text-3xl font-bold text-primary">{card.value ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.emoji} {card.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 — Konfidensfördelning */}
        <section className="space-y-3">
          <h2 className="font-display text-lg">Insiktskvalitet</h2>
          {confTotal > 0 ? (
            <>
              <div className="h-4 rounded-full overflow-hidden flex">
                {(["tidig", "växande", "tillförlitlig", "stark"] as const).map((level) => {
                  const pct = (confDist[level] / confTotal) * 100;
                  if (pct === 0) return null;
                  return <div key={level} className={`${confColors[level]} h-full`} style={{ width: `${pct}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {(["tidig", "växande", "tillförlitlig", "stark"] as const).map((level) => (
                  <span key={level} className="flex items-center gap-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${confColors[level]}`} />
                    {level} ({confDist[level]})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-4 rounded-full bg-muted" />
          )}
          <p className="text-sm text-muted-foreground">{confInsight}</p>
        </section>

        {/* Section 3 — Sparkline */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Tillväxt de senaste 12 veckorna</h2>
            <span className={`text-sm ${trendLabel.cls}`}>{trendLabel.text}</span>
          </div>
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {weekly.map((w, i) => {
              const h = Math.max((w.count / maxWeekly) * 70, 2);
              const opacity = 0.3 + (i / 11) * 0.7;
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full relative flex justify-center">
                    {i === weekly.length - 1 && w.count > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary absolute -top-2" />
                    )}
                    <div
                      className="w-full rounded-sm bg-primary"
                      style={{ height: h, opacity }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{w.week}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4 — Zonkarta */}
        <section className="space-y-3">
          <h2 className="font-display text-lg">Täckning per zon</h2>
          <div className="space-y-2">
            {(zones || []).map((z) => {
              const pct = (z.contributions / maxZoneContrib) * 100;
              const barColor = z.contributions === 0 ? "bg-muted" : z.contributions < 5 ? "bg-yellow-200" : "bg-primary/60";
              return (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-8">Zon {z.zone}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(pct, z.contributions > 0 ? 5 : 0)}%` }} />
                  </div>
                  {z.contributions > 0 ? (
                    <span className="text-xs text-muted-foreground w-8 text-right">{z.contributions}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground w-16 text-right">(inga data)</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5 — Avvikelser */}
        <section className="space-y-3">
          <h2 className="font-display text-lg">Där community-data avviker från baslinjen 🔍</h2>
          <p className="text-sm text-muted-foreground">Här lär sig algoritmen något nytt jämfört med standardråden</p>
          {(!deviations || deviations.length === 0) ? (
            <div className="rounded-2xl bg-accent/40 p-4 text-center text-sm text-muted-foreground">
              🎯 Inga signifikanta avvikelser ännu. Det betyder antingen att baslinjen stämmer bra – eller att det behövs mer data. Kom tillbaka när fler har bidragit!
            </div>
          ) : (
            <div className="space-y-3">
              {deviations.map((d) => {
                const sowDev = d.sow_deviation_weeks ? Number(d.sow_deviation_weeks) : 0;
                const harvestDev = d.harvest_deviation_weeks ? Number(d.harvest_deviation_weeks) : 0;
                const sowEarlier = (d.typical_sow_month_start ?? 0) < (d.baseline_sow_start ?? 0);
                const harvestEarlier = (d.typical_harvest_month_start ?? 0) < (d.baseline_harvest_start ?? 0);

                const devBadgeCls = (dev: number) =>
                  dev > 4 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";

                return (
                  <div key={d.id} className="rounded-2xl bg-card border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.crop_name} · Zon {d.zone}</span>
                      <ConfidenceBadge level={d.confidence_level as any} sampleCount={d.sample_count} />
                    </div>
                    {sowDev > 2 && (
                      <div className="text-sm flex items-center gap-2 flex-wrap">
                        <span>🌱 Sådd</span>
                        <span className="text-muted-foreground">Baslinje: {MONTH_NAMES[d.baseline_sow_start ?? 0]}</span>
                        <span>→</span>
                        <span className="text-primary">Community: {MONTH_NAMES[d.typical_sow_month_start ?? 0]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${devBadgeCls(sowDev)}`}>{sowDev}v</span>
                      </div>
                    )}
                    {harvestDev > 2 && (
                      <div className="text-sm flex items-center gap-2 flex-wrap">
                        <span>🥕 Skörd</span>
                        <span className="text-muted-foreground">Baslinje: {MONTH_NAMES[d.baseline_harvest_start ?? 0]}</span>
                        <span>→</span>
                        <span className="text-primary">Community: {MONTH_NAMES[d.typical_harvest_month_start ?? 0]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${devBadgeCls(harvestDev)}`}>{harvestDev}v</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">
                      {sowDev > 2 && (
                        sowEarlier
                          ? `Svenska odlare i zon ${d.zone} sår ${d.crop_name} tidigare än standardråden anger`
                          : `Svenska odlare i zon ${d.zone} väntar längre med att så ${d.crop_name}`
                      )}
                      {sowDev > 2 && harvestDev > 2 && ". "}
                      {harvestDev > 2 && (
                        harvestEarlier
                          ? `Svenska odlare i zon ${d.zone} skördar ${d.crop_name} tidigare än standardråden anger`
                          : `Svenska odlare i zon ${d.zone} skördar ${d.crop_name} senare än standardråden anger`
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 6 — Algoritmhändelser */}
        <section className="space-y-3">
          <h2 className="font-display text-lg">Algoritmens logg</h2>
          {(stats?.recent_events || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga loggade händelser ännu.</p>
          ) : (
            <div className="space-y-2">
              {(stats?.recent_events || []).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                    {ev.created_at ? format(new Date(ev.created_at), "d MMM", { locale: sv }) : "–"}
                  </span>
                  <span>
                    {ev.event_type === "confidence_upgrade" ? "📈" : ev.event_type === "deviation_detected" ? "🔍" : ev.event_type === "new_insight" ? "🆕" : "📝"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{ev.crop_name} · Zon {ev.zone}</span>
                    {ev.deviation_description && (
                      <p className="text-xs text-muted-foreground truncate">{ev.deviation_description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 7 — Verktyg */}
        <section className="space-y-3 pb-8">
          <h2 className="font-display text-lg">Verktyg</h2>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleAggregate}
            disabled={aggregating}
          >
            {aggregating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aggregerar...</>
            ) : (
              "Kör aggregering nu 🔄"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Aggregeringen körs automatiskt via schema eller kan triggas manuellt här. Resultaten syns direkt i Community-fliken.
          </p>
        </section>
      </div>
    </div>
  );
}
