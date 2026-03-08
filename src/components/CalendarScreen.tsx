import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCropsForCalendar,
  useDiaryEntriesForCalendar,
  useCalendarEvents,
  useSwedishCropTips,
} from "@/hooks/useCalendarData";

const MONTH_NAMES_SV = [
  "Januari", "Februari", "Mars", "April", "Maj", "Juni",
  "Juli", "Augusti", "September", "Oktober", "November", "December",
];
const MONTH_ABBR_SV = [
  "jan", "feb", "mar", "apr", "maj", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];
const WEEKDAY_HEADERS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

const MOOD_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#84cc16",
  5: "#22c55e",
};

function getSeasonRange(zone?: string | null): [number, number] {
  if (!zone) return [4, 10];
  if (["I", "II"].includes(zone)) return [3, 10];
  if (["III", "IV"].includes(zone)) return [4, 10];
  if (["V", "VI"].includes(zone)) return [5, 9];
  return [6, 8];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Monday = 0
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function fmt(d: string) {
  return d; // yyyy-mm-dd
}

interface CalendarScreenProps {
  zone?: string | null;
  onBack: () => void;
}

export function CalendarScreen({ zone, onBack }: CalendarScreenProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);

  const { data: crops, isLoading: cropsLoading } = useCropsForCalendar(viewYear);
  const { data: diaryEntries, isLoading: diaryLoading } = useDiaryEntriesForCalendar(viewYear);
  const { data: calendarEvents, isLoading: eventsLoading } = useCalendarEvents(viewYear);
  const { data: tips, isLoading: tipsLoading } = useSwedishCropTips(zone);

  const isLoading = cropsLoading || diaryLoading || tipsLoading || eventsLoading;

  // Calendar events map
  const eventDates = useMemo(() => {
    const map = new Map<string, { title: string; emoji: string }[]>();
    (calendarEvents || []).forEach((e) => {
      const arr = map.get(e.event_date) || [];
      arr.push({ title: e.title, emoji: e.emoji });
      map.set(e.event_date, arr);
    });
    return map;
  }, [calendarEvents]);

  // Build lookup maps
  const sowDates = useMemo(() => {
    const map = new Map<string, string[]>();
    (crops || []).forEach((c) => {
      if (c.sow_date) {
        const arr = map.get(c.sow_date) || [];
        arr.push(c.name);
        map.set(c.sow_date, arr);
      }
    });
    return map;
  }, [crops]);

  const harvestDates = useMemo(() => {
    const map = new Map<string, string[]>();
    (crops || []).forEach((c) => {
      if (c.harvest_date) {
        const arr = map.get(c.harvest_date) || [];
        arr.push(c.name);
        map.set(c.harvest_date, arr);
      }
    });
    return map;
  }, [crops]);

  const diaryMap = useMemo(() => {
    const map = new Map<string, { mood: number | null; title: string | null }>();
    (diaryEntries || []).forEach((e) => {
      // Use mood_garden if set, otherwise derive from wellbeing averages
      let mood = e.mood_garden;
      if (mood == null) {
        const scores = [e.wellbeing_physical, e.wellbeing_mental, e.wellbeing_social].filter(
          (s): s is number => s != null
        );
        if (scores.length > 0) {
          mood = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
      }
      map.set(e.entry_date, { mood, title: e.title });
    });
    return map;
  }, [diaryEntries]);

  // Season arc
  const [seasonStart, seasonEnd] = getSeasonRange(zone);
  const seasonMonths = Array.from(
    { length: seasonEnd - seasonStart + 1 },
    (_, i) => seasonStart + i
  );

  const todayFraction = useMemo(() => {
    const totalDays =
      (seasonEnd - seasonStart + 1) * 30;
    const elapsed =
      (currentMonth - seasonStart) * 30 + currentDay;
    if (elapsed < 0) return 0;
    if (elapsed > totalDays) return 1;
    return elapsed / totalDays;
  }, [seasonStart, seasonEnd, currentMonth, currentDay]);

  const seasonStage = useMemo(() => {
    if (currentMonth < seasonStart)
      return { text: "Säsongen börjar snart 🌱", stage: "pre" };
    if (currentMonth > seasonEnd)
      return { text: "Säsongen är slut – vila och planering ❄️", stage: "post" };
    const third = (seasonEnd - seasonStart + 1) / 3;
    const pos = currentMonth - seasonStart;
    if (pos < third)
      return { text: "Tidig säsong – sådd och plantering 🌱", stage: "early" };
    if (pos < third * 2)
      return { text: "Högsäsong – växt och vård 🌿", stage: "mid" };
    return { text: "Sen säsong – skörd och avslutning 🥕", stage: "late" };
  }, [currentMonth, seasonStart, seasonEnd]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);
  const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

  const calendarCells = useMemo(() => {
    const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];
    // Previous month padding
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth - 1 < 1 ? 12 : viewMonth - 1;
      const y = viewMonth - 1 < 1 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        inMonth: false,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        inMonth: true,
        dateStr: `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
    // Next month padding
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = viewMonth + 1 > 12 ? 1 : viewMonth + 1;
        const y = viewMonth + 1 > 12 ? viewYear + 1 : viewYear;
        cells.push({
          day: d,
          inMonth: false,
          dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        });
      }
    }
    return cells;
  }, [viewYear, viewMonth, daysInMonth, firstDow, prevMonthDays]);

  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

  // Upcoming tasks
  const sowingTasks = useMemo(() => {
    if (!tips) return [];
    const cropNames = new Set((crops || []).map((c) => c.name.toLowerCase()));
    return tips.filter((t) => {
      const inIndoor =
        t.sow_indoor_start && t.sow_indoor_end &&
        viewMonth >= t.sow_indoor_start && viewMonth <= t.sow_indoor_end;
      const inOutdoor =
        t.sow_outdoor_start && t.sow_outdoor_end &&
        viewMonth >= t.sow_outdoor_start && viewMonth <= t.sow_outdoor_end;
      return (inIndoor || inOutdoor) && !cropNames.has(t.crop_name.toLowerCase());
    }).map((t) => {
      const isIndoor =
        t.sow_indoor_start && t.sow_indoor_end &&
        viewMonth >= t.sow_indoor_start && viewMonth <= t.sow_indoor_end;
      return { ...t, sowType: isIndoor ? "Inomhus" : "Utomhus" };
    });
  }, [tips, crops, viewMonth]);

  const harvestTasks = useMemo(() => {
    if (!crops || !tips) return [];
    const todayTs = today.getTime();
    const weekFromNow = todayTs + 7 * 86400000;
    return (crops || [])
      .filter((c) => c.status !== "skördad" && c.sow_date)
      .map((c) => {
        const tip = tips.find(
          (t) => t.crop_name.toLowerCase() === c.name.toLowerCase()
        );
        if (!tip?.days_to_harvest || !c.sow_date) return null;
        const sowDate = new Date(c.sow_date);
        const expectedHarvest = new Date(
          sowDate.getTime() + tip.days_to_harvest * 86400000
        );
        if (expectedHarvest.getTime() <= weekFromNow) {
          return {
            name: c.name,
            sowDate: c.sow_date,
            daysToHarvest: tip.days_to_harvest,
          };
        }
        return null;
      })
      .filter(Boolean) as { name: string; sowDate: string; daysToHarvest: number }[];
  }, [crops, tips, today]);

  // Wellbeing sparkline (last 30 days)
  const wellbeingData = useMemo(() => {
    if (!diaryEntries) return [];
    const thirtyDaysAgo = new Date(
      today.getTime() - 30 * 86400000
    );
    return diaryEntries
      .map((e) => {
        let mood = e.mood_garden;
        if (mood == null) {
          const scores = [e.wellbeing_physical, e.wellbeing_mental, e.wellbeing_social].filter(
            (s): s is number => s != null
          );
          if (scores.length > 0) mood = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
        return { date: e.entry_date, mood };
      })
      .filter((e): e is { date: string; mood: number } => e.mood != null && new Date(e.date) >= thirtyDaysAgo)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [diaryEntries, today]);

  const sparklineData = useMemo(() => {
    if (wellbeingData.length === 0) return null;
    const w = 300;
    const h = 50;
    const thirtyDaysAgo = today.getTime() - 30 * 86400000;
    const range = 30 * 86400000;
    const points = wellbeingData.map((d) => {
      const x = ((new Date(d.date).getTime() - thirtyDaysAgo) / range) * w;
      const y = h - ((d.mood - 1) / 4) * h;
      return { x, y, mood: d.mood };
    });
    if (points.length === 1) {
      return { points, line: null, area: null };
    }
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area =
      line +
      ` L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
    return { line, area, points };
  }, [wellbeingData, today]);

  function navigateMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  function formatSwedishDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTH_ABBR_SV[d.getMonth()]}`;
  }

  const diffBadgeClass = (diff: string | null) => {
    if (diff === "lätt") return "bg-green-100 text-green-700";
    if (diff === "medel") return "bg-yellow-100 text-yellow-700";
    if (diff === "avancerad") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  // Season arc SVG
  function renderSeasonArc() {
    const w = 320;
    const h = 120;
    const pad = 30;
    const arcW = w - pad * 2;
    const cy = h - 10;
    const rx = arcW / 2;
    const ry = 70;
    const cx = w / 2;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 160 }}>
        {/* Arc path */}
        <path
          d={`M ${pad},${cy} A ${rx},${ry} 0 0 1 ${w - pad},${cy}`}
          fill="none"
          className="stroke-primary"
          strokeWidth={3}
          strokeLinecap="round"
        />
        {/* Month ticks */}
        {seasonMonths.map((m, i) => {
          const frac = seasonMonths.length <= 1 ? 0.5 : i / (seasonMonths.length - 1);
          const angle = Math.PI * (1 - frac);
          const tx = cx - rx * Math.cos(angle);
          const ty = cy - ry * Math.sin(angle);
          return (
            <g key={m}>
              <circle cx={tx} cy={ty} r={2} className="fill-muted-foreground" />
              <text
                x={tx}
                y={ty + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={9}
              >
                {MONTH_ABBR_SV[m - 1]}
              </text>
            </g>
          );
        })}
        {/* Today dot */}
        {(() => {
          const frac = Math.max(0, Math.min(1, todayFraction));
          const angle = Math.PI * (1 - frac);
          const dx = cx - rx * Math.cos(angle);
          const dy = cy - ry * Math.sin(angle);
          return (
            <>
              <circle cx={dx} cy={dy} r={7} className="fill-primary/30 animate-pulse" />
              <circle cx={dx} cy={dy} r={4} className="fill-primary" />
            </>
          );
        })()}
      </svg>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="flex-1 text-center font-display text-lg">Säsongskalender</h1>
        <span className="text-sm text-muted-foreground">{currentYear}</span>
      </div>

      <div className="px-4 space-y-6 mt-2">
        {/* Season Arc */}
        <div className="text-center">
          {renderSeasonArc()}
          <p className="text-sm text-muted-foreground mt-1">{seasonStage.text}</p>
          {zone && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">Zon {zone}</p>
          )}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-display text-base">
            {MONTH_NAMES_SV[viewMonth - 1]} {viewYear}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr && cell.inMonth;
              const hasSow = cell.inMonth && sowDates.has(cell.dateStr);
              const hasHarvest = cell.inMonth && harvestDates.has(cell.dateStr);
              const diary = cell.inMonth ? diaryMap.get(cell.dateStr) : undefined;
              const hasDiary = !!diary;
              const moodColor = diary?.mood ? MOOD_COLORS[diary.mood] : undefined;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center py-1"
                  style={{ minHeight: 48 }}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : cell.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/30"
                    }`}
                  >
                    {cell.day}
                  </div>
                  {cell.inMonth && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasSow && (
                        <span
                          className="block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#22c55e" }}
                        />
                      )}
                      {hasHarvest && (
                        <span
                          className="block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#f97316" }}
                        />
                      )}
                      {hasDiary && (
                        <span
                          className="block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#3b82f6" }}
                        />
                      )}
                    </div>
                  )}
                  {moodColor && (
                    <span
                      className="block w-2 h-2 rounded-full mt-0.5"
                      style={{ backgroundColor: moodColor }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div>
          <h2 className="font-display text-lg mb-3">Att göra nu 📋</h2>
          <div className="space-y-2">
            {sowingTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-card border border-border p-4 flex items-start gap-3"
              >
                <span className="text-xl">🌱</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Dags att så {t.crop_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.sowType}</p>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 inline-flex items-center gap-1 mt-1">
                    📖 Standardråd
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${diffBadgeClass(t.difficulty)}`}
                >
                  {t.difficulty}
                </span>
              </div>
            ))}
            {harvestTasks.map((t) => (
              <div
                key={t.name + t.sowDate}
                className="rounded-2xl bg-card border border-border p-4 flex items-start gap-3"
              >
                <span className="text-xl">🥕</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {t.name} kan vara klar att skörda
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sådd {formatSwedishDate(t.sowDate)}, ~{t.daysToHarvest} dagar
                  </p>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 inline-flex items-center gap-1 mt-1">
                    📖 Standardråd
                  </span>
                </div>
              </div>
            ))}
            {sowingTasks.length === 0 && harvestTasks.length === 0 && (
              <div className="rounded-2xl bg-card border border-border p-6 text-center">
                <span className="text-2xl">🌿</span>
                <p className="text-sm text-muted-foreground mt-2">
                  Allt ser bra ut – njut av trädgården!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wellbeing sparkline */}
        <div>
          <h2 className="font-display text-lg mb-3">
            Välmående de senaste 30 dagarna 💚
          </h2>
          {sparklineData ? (
            <div className="rounded-2xl bg-card border border-border p-4">
              <svg viewBox="0 0 300 50" className="w-full" style={{ height: 60 }}>
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.2} />
                    <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {sparklineData.area && (
                  <path d={sparklineData.area} fill="url(#sparkFill)" />
                )}
                {sparklineData.line && (
                  <polyline
                    points={sparklineData.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    className="stroke-primary"
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                )}
                {sparklineData.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={sparklineData.points.length === 1 ? 5 : 3}
                    className="fill-primary"
                  />
                ))}
                {sparklineData.points.length === 1 && (
                  <circle
                    cx={sparklineData.points[0].x}
                    cy={sparklineData.points[0].y}
                    r={9}
                    className="fill-primary/20 animate-pulse"
                  />
                )}
              </svg>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-6 text-center">
              <span className="text-2xl">💚</span>
              <p className="text-sm text-muted-foreground mt-2">
                Logga hur du mår i Dagboken för att se din välmåendekurva 💚
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
