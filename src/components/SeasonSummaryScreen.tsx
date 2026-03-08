import { useMemo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useCropsForCalendar, useDiaryEntriesForCalendar } from "@/hooks/useCalendarData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { findRecipes } from "@/data/harvestRecipes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GrowingSchool } from "@/types/onboarding";
import { useEarnedBadges, useSeasonBadges } from "@/hooks/useBadges";

const STATUS_COLORS: Record<string, string> = {
  skördad: "bg-primary text-primary-foreground",
  utplanterad: "bg-growmate-sun/80 text-foreground",
  grodd: "bg-growmate-leaf-light text-foreground",
  sådd: "bg-growmate-sun/40 text-foreground",
  planerad: "bg-muted text-muted-foreground",
  misslyckad: "bg-destructive/80 text-white",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

function getTagline(cropCount: number) {
  if (cropCount <= 2) return "En försiktig start – varje frö räknas 🌱";
  if (cropCount <= 7) return "En fin odlingssäsong med bra variation 🌿";
  if (cropCount <= 15) return "En produktiv säsong – du är på god väg! 🌻";
  return "Imponerande säsong – en riktig odlare! 🏆";
}

function getMoodEmoji(avg: number) {
  if (avg >= 4.5) return "🌟";
  if (avg >= 3.5) return "😊";
  if (avg >= 2.5) return "🙂";
  if (avg >= 1.5) return "😐";
  return "😔";
}

function AnimatedNumber({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 800;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <span ref={ref}>{current.toFixed(decimals)}</span>;
}

function FadeSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SeasonSummaryScreenProps {
  year: number;
  name: string;
  zone: string | null;
  school: GrowingSchool | null;
  onBack: () => void;
}

export function SeasonSummaryScreen({ year: initialYear, name, zone, school, onBack }: SeasonSummaryScreenProps) {
  const [year, setYear] = useState(initialYear);
  const { data: crops = [] } = useCropsForCalendar(year);
  const { data: diary = [] } = useDiaryEntriesForCalendar(year);
  const [harvestsExpanded, setHarvestsExpanded] = useState(false);
  const [recipeCrop, setRecipeCrop] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalCrops = crops.length;
    const harvested = crops.filter((c) => c.status === "skördad").length;
    const diaryDays = diary.filter((d) => d.mood_garden !== null || d.title).length;
    const moods = diary.filter((d) => d.mood_garden !== null).map((d) => d.mood_garden!);
    const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
    const mentals = diary.filter((d) => d.wellbeing_mental !== null).map((d) => d.wellbeing_mental!);
    const avgMental = mentals.length > 0 ? mentals.reduce((a, b) => a + b, 0) / mentals.length : 0;
    const physicals = diary.filter((d) => d.wellbeing_physical !== null).map((d) => d.wellbeing_physical!);
    const avgPhysical = physicals.length > 0 ? physicals.reduce((a, b) => a + b, 0) / physicals.length : 0;
    return { totalCrops, harvested, diaryDays, avgMood, avgMental, avgPhysical, hasMood: moods.length > 0, hasMental: mentals.length > 0, hasPhysical: physicals.length > 0 };
  }, [crops, diary]);

  const hasData = crops.length > 0 || diary.length > 0;

  const chartData = useMemo(() => {
    const byMonth: Record<number, { mood: number[]; mental: number[]; physical: number[] }> = {};
    diary.forEach((d) => {
      const m = new Date(d.entry_date).getMonth();
      if (!byMonth[m]) byMonth[m] = { mood: [], mental: [], physical: [] };
      if (d.mood_garden !== null) byMonth[m].mood.push(d.mood_garden);
      if (d.wellbeing_mental !== null) byMonth[m].mental.push(d.wellbeing_mental);
      if (d.wellbeing_physical !== null) byMonth[m].physical.push(d.wellbeing_physical);
    });
    const months = Object.keys(byMonth).map(Number).sort((a, b) => a - b);
    return months.map((m) => ({
      name: MONTH_NAMES[m],
      Humör: byMonth[m].mood.length ? +(byMonth[m].mood.reduce((a, b) => a + b, 0) / byMonth[m].mood.length).toFixed(1) : null,
      Sinne: byMonth[m].mental.length ? +(byMonth[m].mental.reduce((a, b) => a + b, 0) / byMonth[m].mental.length).toFixed(1) : null,
      Kropp: byMonth[m].physical.length ? +(byMonth[m].physical.reduce((a, b) => a + b, 0) / byMonth[m].physical.length).toFixed(1) : null,
    }));
  }, [diary]);

  const schoolReflection = useMemo(() => {
    const failed = crops.filter((c) => c.status === "misslyckad");
    const harvestedNames = crops.filter((c) => c.status === "skördad").map((c) => c.name);
    switch (school) {
      case "naturens-vag":
        return `Du odlar i naturens rytm – varje obalans du noterat är ett steg mot djupare förståelse. ${stats.totalCrops} grödor fick växa i sin egen takt.`;
      case "precisionsodlaren":
        return `Dina loggdata visar ${stats.diaryDays} datapunkter. ${failed.length > 0 ? `Nästa år: fokusera på ${failed[0].name}.` : "Fortsätt logga för ännu bättre precision."}`;
      case "hackaren":
        return `Du har hittat smarta genvägar. ${stats.harvested} grödor skördade på minimal tid – imponerande ratio! ${stats.totalCrops > 5 ? "Du maximerar din tid." : ""}`;
      case "traditionalisten":
        return `En säsong i linje med generationers visdom. ${stats.totalCrops} grödor odlade med beprövade metoder. ${harvestedNames.length > 0 ? `${harvestedNames.slice(0, 3).join(", ")} – tidlösa klassiker.` : ""}`;
      default:
        return `En fin säsong med ${stats.totalCrops} grödor och ${stats.diaryDays} loggade dagar.`;
    }
  }, [school, crops, stats]);

  const handleShare = async () => {
    const moodStr = stats.hasMood ? `Medelhumör: ${getMoodEmoji(stats.avgMood)}` : "";
    const text = `🌱 Min odlingssäsong ${year} via GrowMate\n${stats.totalCrops} grödor • ${stats.diaryDays} loggdagar${moodStr ? ` • ${moodStr}` : ""}\n#GrowMate #Trädgård`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const STAT_CARDS = [
    { emoji: "🌱", label: "Grödor odlade", value: stats.totalCrops, decimals: 0 },
    { emoji: "📅", label: "Dagar loggade", value: stats.diaryDays, decimals: 0 },
    { emoji: "🌾", label: "Skördar", value: stats.harvested, decimals: 0 },
    { emoji: "💚", label: "Medelhumör", value: stats.avgMood, decimals: 1, suffix: stats.hasMood ? ` ${getMoodEmoji(stats.avgMood)}` : "", hide: !stats.hasMood },
    { emoji: "🧠", label: "Mentalt välmående", value: stats.avgMental, decimals: 1, hide: !stats.hasMental },
    { emoji: "💪", label: "Fysiskt välmående", value: stats.avgPhysical, decimals: 1, hide: !stats.hasPhysical },
  ];

  const LEGEND = [
    { label: "Skördad", color: "bg-primary" },
    { label: "Pågående", color: "bg-growmate-sun/80" },
    { label: "Planerad", color: "bg-muted" },
    { label: "Misslyckad", color: "bg-destructive/80" },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header bar with year navigation */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-foreground flex-1">Din säsong</h1>
        <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
          <button onClick={() => setYear((y) => y - 1)} className="p-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground px-1 min-w-[3rem] text-center">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="p-1 text-muted-foreground hover:text-foreground" disabled={year >= new Date().getFullYear()}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-4 max-w-md mx-auto">
        {/* Empty state */}
        {!hasData && (
          <div className="text-center py-16 space-y-3">
            <span className="text-5xl">📭</span>
            <p className="text-lg font-display text-foreground">Inga data för {year}</p>
            <p className="text-sm text-muted-foreground">Navigera till ett år där du har grödor eller dagboksinlägg.</p>
          </div>
        )}

        {hasData && (
          <>
            {/* HERO */}
            <FadeSection>
              <div className="text-center space-y-2 py-6">
                <p className="text-7xl font-display text-primary">{year}</p>
                <p className="text-lg font-medium text-foreground">{name}</p>
                {zone && <p className="text-sm text-muted-foreground">Zon {zone}</p>}
                <p className="text-sm text-muted-foreground mt-2 italic">{getTagline(stats.totalCrops)}</p>
              </div>
            </FadeSection>

            {/* STATS */}
            <FadeSection>
              <h2 className="font-display text-foreground mb-3">Siffror som spelar roll</h2>
              <div className="grid grid-cols-2 gap-3">
                {STAT_CARDS.filter((s) => !s.hide).map((s) => (
                  <div key={s.label} className="rounded-2xl bg-card border border-border p-4 text-center space-y-1">
                    <span className="text-2xl">{s.emoji}</span>
                    <p className="text-2xl font-display text-foreground">
                      <AnimatedNumber target={s.value} decimals={s.decimals} />
                      {(s as any).suffix || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeSection>

            {/* CROPS */}
            <FadeSection>
              <h2 className="font-display text-foreground mb-3">Grödornas resa</h2>
              {crops.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga grödor registrerade för {year}.</p>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                    {crops.map((crop) => (
                      <span key={crop.id} className={cn("inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shrink-0 whitespace-nowrap", STATUS_COLORS[crop.status] || STATUS_COLORS.planerad)}>
                        {crop.emoji || "🌱"} {crop.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {LEGEND.map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={cn("w-2.5 h-2.5 rounded-full", l.color)} />
                        <span className="text-[10px] text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </FadeSection>

            {/* HARVESTS */}
            {(() => {
              const harvested = crops.filter((c) => c.status === "skördad");
              if (harvested.length === 0) return null;
              const showAll = harvestsExpanded || harvested.length <= 5;
              const visible = showAll ? harvested : harvested.slice(0, 5);
              return (
                <FadeSection>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-foreground">Dina skördar</h2>
                    {harvested.length > 5 && (
                      <button onClick={() => setHarvestsExpanded(!harvestsExpanded)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                        {harvestsExpanded ? "Visa färre" : `Visa alla (${harvested.length})`}
                        {harvestsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {visible.map((crop) => (
                      <div key={crop.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                        <span className="text-lg">{crop.emoji || "🌱"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{crop.name}</p>
                          {crop.harvest_date && <p className="text-xs text-muted-foreground">Skördad {crop.harvest_date}</p>}
                        </div>
                        {findRecipes(crop.name) && (
                          <button onClick={() => setRecipeCrop(crop.name)} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0">
                            🍽️ Recept
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </FadeSection>
              );
            })()}

            {/* Recipe dialog */}
            <Dialog open={!!recipeCrop} onOpenChange={(v) => !v && setRecipeCrop(null)}>
              <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle>🍽️ Recept med {recipeCrop}</DialogTitle>
                </DialogHeader>
                {recipeCrop && findRecipes(recipeCrop)?.map((r) => (
                  <div key={r.name} className="rounded-xl bg-accent/50 border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <span className="text-xs text-muted-foreground">{r.difficulty} {r.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                ))}
              </DialogContent>
            </Dialog>

            {/* CHART */}
            <FadeSection>
              <h2 className="font-display text-foreground mb-3">Välmående över säsongen</h2>
              {chartData.length < 3 ? (
                <div className="rounded-2xl bg-card border border-border p-6 text-center">
                  <span className="text-3xl">📊</span>
                  <p className="text-sm text-muted-foreground mt-2">Fortsätt logga för att se din kurva</p>
                  <p className="text-xs text-muted-foreground">(minst 3 månader med data)</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Humör" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="Sinne" stroke="hsl(210 80% 55%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="Kropp" stroke="hsl(30 80% 55%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </FadeSection>

            {/* REFLECTION */}
            <FadeSection>
              <h2 className="font-display text-foreground mb-3">Reflektion</h2>
              <div className="rounded-2xl bg-gradient-to-br from-accent to-secondary p-5 border border-border">
                <p className="text-sm text-foreground leading-relaxed">{schoolReflection}</p>
              </div>
            </FadeSection>

            {/* SHARE */}
            <FadeSection>
              <Button variant="growmate-outline" size="lg" className="w-full" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Dela din säsong
              </Button>
            </FadeSection>
          </>
        )}
      </div>
    </div>
  );
}
