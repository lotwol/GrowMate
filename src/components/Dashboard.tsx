import { useState, useEffect, useMemo } from "react";
import heroImage from "@/assets/hero-garden.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Leaf,
  Sun,
  Droplets,
  CalendarDays,
  Heart,
  BookOpen,
  Thermometer,
  Users,
  ChevronRight,
  BarChart3,
  Lightbulb,
  ShoppingCart,
} from "lucide-react";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";
import { useCropsForCalendar, useDiaryEntriesForCalendar } from "@/hooks/useCalendarData";
import { supabase } from "@/integrations/supabase/client";
import type { GrowingSchool } from "@/types/onboarding";
import { findBadNeighbors } from "@/data/companionPlanting";

const MONTH_TIPS: Record<number, { title: string; description: string }> = {
  1: { title: "Januaritips", description: "Planera årets odling och beställ fröer" },
  2: { title: "Februaritips", description: "Börja förså chili och paprika inomhus" },
  3: { title: "Mars-tips", description: "Dags att förså tomat, paprika och chili inomhus" },
  4: { title: "Apriltips", description: "Härda av plantor och börja direktså utomhus" },
  5: { title: "Maj-tips", description: "Plantera ut efter sista frosten – kolla din zon!" },
  6: { title: "Junitips", description: "Vattna regelbundet och gödsla tomater" },
  7: { title: "Julitips", description: "Skörda och så höstgrödor som grönkål" },
  8: { title: "Augustitips", description: "Skörda sommargrödor och planera hösten" },
  9: { title: "Septembertips", description: "Sista skördarna och jordförbättring" },
  10: { title: "Oktobertips", description: "Täck rabatter och plantera vitlök" },
  11: { title: "Novembertips", description: "Rensa och förbered för vintern" },
  12: { title: "Decembertips", description: "Vila, planera och drömma om nästa säsong" },
};

const ZONE_SOW_TIPS: Record<string, string> = {
  I: "Sallad kan direktsås om 3 veckor",
  II: "Sallad kan direktsås om 4 veckor",
  III: "Sallad kan direktsås om 4 veckor",
  IV: "Sallad kan direktsås om 5 veckor",
  V: "Sallad kan direktsås om 6 veckor",
  VI: "Sallad kan direktsås om 7 veckor",
  VII: "Sallad kan direktsås om 8 veckor",
  VIII: "Sallad kan direktsås om 9 veckor",
};

const QUICK_ACTIONS = [
  { icon: Leaf, label: "Min odling", desc: "Se dina grödor", tab: "garden" as const },
  { icon: BookOpen, label: "Dagbok", desc: "Logga aktivitet", tab: "diary" as const },
  { icon: ShoppingCart, label: "Inköpslista", desc: "Vad behöver du?", tab: "shopping" as const },
  { icon: CalendarDays, label: "Kalender", desc: "Såningsschema", tab: "calendar" as const },
];

const SCHOOL_META: Record<GrowingSchool, { emoji: string; label: string; badgeColor: string }> = {
  "naturens-vag": { emoji: "🌿", label: "Naturens väg", badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  precisionsodlaren: { emoji: "📊", label: "Precisionsodlaren", badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  hackaren: { emoji: "⚡", label: "Hackaren", badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  traditionalisten: { emoji: "🌻", label: "Traditionalisten", badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

const SCHOOL_TIP_COLUMN: Record<GrowingSchool, string> = {
  "naturens-vag": "school_naturens_vag_tip",
  precisionsodlaren: "school_precisionsodlaren_tip",
  hackaren: "school_hackaren_tip",
  traditionalisten: "school_traditionalisten_tip",
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

const SCHOOL_GREETINGS: Record<GrowingSchool, Record<string, string>> = {
  "naturens-vag": {
    morning: "God morgon, {name}. Hur mår trädgården idag? 🌿",
    afternoon: "Hej {name}. Naturen har sin egen takt – följ med. 🌿",
    evening: "Bra kväll, {name}. Lyssna på vad trädgården berättar. 🌙",
  },
  precisionsodlaren: {
    morning: "Morgon, {name}. Vad är dagens odlingsmål? 📊",
    afternoon: "Hej {name}. Dags att kolla statusen. 📊",
    evening: "Kväll, {name}. Dags att logga dagens observationer. 📝",
  },
  hackaren: {
    morning: "Hej {name}! Vad kan vi förenkla idag? ⚡",
    afternoon: "Yo {name}! Något smart hack på gång? ⚡",
    evening: "Kvällshack, {name} – något smart du noterade idag? 🔧",
  },
  traditionalisten: {
    morning: "God morgon, {name}. Farmor skulle vara stolt. 🌻",
    afternoon: "God eftermiddag, {name}. Tradition bär frukt. 🌻",
    evening: "God kväll, {name}. Dagens arbete är gjort. 🌾",
  },
};

function getSchoolGreeting(school: GrowingSchool | null, name: string): string {
  const tod = getTimeOfDay();
  if (school && SCHOOL_GREETINGS[school]) {
    return SCHOOL_GREETINGS[school][tod].replace("{name}", name);
  }
  const fallback = tod === "morning" ? "God morgon" : tod === "afternoon" ? "Hej" : "God kväll";
  return `${fallback}! 🌱`;
}

interface DashboardProps {
  profile: string;
  zone?: string | null;
  school?: GrowingSchool | null;
  name?: string;
  onNavigateChat: () => void;
  onNavigate: (tab: string) => void;
}

export function Dashboard({ profile, zone, school, name, onNavigateChat, onNavigate }: DashboardProps) {
  const { data: weather, isLoading: weatherLoading } = useWeather(zone);
  const currentYear = new Date().getFullYear();
  const { data: crops = [] } = useCropsForCalendar(currentYear);
  const { data: diary = [] } = useDiaryEntriesForCalendar(currentYear);
  const diaryDays = diary.filter((d) => d.mood_garden !== null || d.title).length;
  const month = new Date().getMonth() + 1;
  const monthTip = MONTH_TIPS[month] || MONTH_TIPS[3];
  const sowTip = zone ? (ZONE_SOW_TIPS[zone] || "Sallad kan direktsås snart") : "Sallad kan direktsås om 4 veckor";

  // Daily school tip
  const [dailyTip, setDailyTip] = useState<{ crop_name: string; tip: string } | null>(null);
  useEffect(() => {
    if (!zone || !school) return;
    const tipCol = SCHOOL_TIP_COLUMN[school];
    if (!tipCol) return;
    const fetchTip = async () => {
      const { data } = await supabase
        .from("swedish_crop_tips")
        .select(`crop_name, ${tipCol}`)
        .eq("zone", zone)
        .not(tipCol, "is", null);
      if (data && data.length > 0) {
        // Deterministic daily rotation based on date
        const dayOfYear = Math.floor((Date.now() - new Date(currentYear, 0, 0).getTime()) / 86400000);
        const idx = dayOfYear % data.length;
        const row = data[idx] as any;
        if (row[tipCol]) {
          setDailyTip({ crop_name: row.crop_name, tip: row[tipCol] });
        }
      }
    };
    fetchTip();
  }, [zone, school, currentYear]);

  // Companion planting warnings
  const badNeighbors = useMemo(() => findBadNeighbors(crops.map((c) => c.name)), [crops]);
  const [companionDismissed, setCompanionDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem("growmate_companion_dismissed");
      if (stored) {
        const { week } = JSON.parse(stored);
        const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        return week === currentWeek;
      }
    } catch {}
    return false;
  });
  const dismissCompanion = () => {
    const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    localStorage.setItem("growmate_companion_dismissed", JSON.stringify({ week: currentWeek }));
    setCompanionDismissed(true);
  };


  const tips = [
    // Tip 1: Weather (real or fallback)
    weather
      ? {
          icon: Thermometer,
          title: `${weather.emoji} ${weather.temperature}°C – ${weather.description}`,
          description: zone ? `Just nu i zon ${zone}` : "Aktuellt väder",
          color: "bg-growmate-sun/20 text-growmate-earth",
        }
      : {
          icon: Sun,
          title: monthTip.title,
          description: monthTip.description,
          color: "bg-growmate-sun/20 text-growmate-earth",
        },
    // Tip 2: Seasonal
    {
      icon: Droplets,
      title: "Vattning",
      description: "Håll jämn fukt i fönsterbrädan – inte för blött",
      color: "bg-growmate-sky/20 text-growmate-sky",
    },
    // Tip 3: Sowing
    {
      icon: CalendarDays,
      title: "Kommande",
      description: sowTip,
      color: "bg-growmate-leaf-light text-primary",
    },
  ];

  const greeting = getSchoolGreeting(school || null, name || "");
  const schoolMeta = school ? SCHOOL_META[school] : null;

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={heroImage}
          alt="Vacker trädgård i morgonljus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-display text-foreground drop-shadow-sm">
            {greeting}
          </h1>
          {schoolMeta && (
            <button
              onClick={() => onNavigate("profile")}
              className={cn(
                "inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105",
                schoolMeta.badgeColor
              )}
            >
              {schoolMeta.emoji} {schoolMeta.label}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-6 mt-3">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.tab)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <action.icon className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Season Tips */}
        <div>
          <h2 className="text-lg font-display text-foreground mb-3">
            Just nu i odlingen
          </h2>
          <div className="space-y-2">
            {weatherLoading && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            )}
            {(!weatherLoading ? tips : tips.slice(1)).map((tip) => (
              <div
                key={tip.title}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    tip.color
                  )}
                >
                  <tip.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {tip.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companion planting warning */}
        {badNeighbors.length > 0 && !companionDismissed && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">🌿</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Odlingstips</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {badNeighbors[0][0]} och {badNeighbors[0][1]} trivs inte ihop – överväg att flytta dem i din planering
                </p>
              </div>
              <button onClick={dismissCompanion} className="text-muted-foreground hover:text-foreground shrink-0">
                <span className="text-xs">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Daily School Tip */}
        {dailyTip && schoolMeta && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Dagens tips från {schoolMeta.label}</p>
                <p className="text-sm font-medium text-foreground">{dailyTip.crop_name}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{dailyTip.tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Wellbeing Check */}
        <div className="rounded-2xl bg-gradient-to-br from-accent to-secondary p-4 border border-border">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💚</span>
            <div className="flex-1">
              <h3 className="font-display text-foreground">
                Hur mår du idag?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Odling handlar inte bara om växter. Ta en stund och checka in
                med dig själv.
              </p>
              <Button variant="growmate-soft" size="sm" className="mt-3" onClick={() => onNavigate("diary-wellbeing")}>
                Checka in nu
              </Button>
            </div>
          </div>
        </div>

        {/* Season Summary Card */}
        <button
          onClick={() => onNavigate("season-summary")}
          className="w-full rounded-2xl bg-card border border-border p-4 text-left transition-all hover:border-primary/30 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Din säsong {currentYear}</p>
                <p className="text-xs text-muted-foreground">
                  {crops.length} grödor • {diaryDays} loggdagar
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {/* AI CTA */}
        <button
          onClick={onNavigateChat}
          className="w-full rounded-2xl bg-primary p-4 text-primary-foreground text-left transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Fråga GrowMate</p>
              <p className="text-xs text-primary-foreground/70">
                "Vilka frön ska jag så nu?" – prata eller skriv
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
