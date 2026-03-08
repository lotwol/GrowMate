import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarPlus, ChevronDown, Sprout, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const MONTH_NAMES_SV = [
  "", "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];

const SCHOOL_INFO: Record<string, { emoji: string; label: string; key: string }> = {
  "naturens-vag": { emoji: "🌾", label: "Naturens väg", key: "school_naturens_vag_tip" },
  precisionsodlaren: { emoji: "🔬", label: "Precisionsodlaren", key: "school_precisionsodlaren_tip" },
  hackaren: { emoji: "⚡", label: "Hackaren", key: "school_hackaren_tip" },
  traditionalisten: { emoji: "📖", label: "Traditionalisten", key: "school_traditionalisten_tip" },
};

interface SeedItem {
  id: string;
  name: string;
  category: string;
  quantity: string | null;
}

interface TipData {
  id: string;
  crop_name: string;
  crop_name_latin?: string | null;
  category: string;
  difficulty?: string | null;
  tips?: string | null;
  spacing_cm?: number | null;
  days_to_harvest?: number | null;
  sow_indoor_start?: number | null;
  sow_indoor_end?: number | null;
  sow_outdoor_start?: number | null;
  sow_outdoor_end?: number | null;
  harvest_start?: number | null;
  harvest_end?: number | null;
  school_hackaren_tip?: string | null;
  school_naturens_vag_tip?: string | null;
  school_precisionsodlaren_tip?: string | null;
  school_traditionalisten_tip?: string | null;
  sowType?: string;
}

interface TipDetailSheetProps {
  tip: TipData | null;
  open: boolean;
  onClose: () => void;
  seeds: SeedItem[];
  userSchool?: string | null;
}

export function TipDetailSheet({ tip, open, onClose, seeds, userSchool }: TipDetailSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [linkedSeedId, setLinkedSeedId] = useState<string | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const [showAllSchools, setShowAllSchools] = useState(false);

  if (!tip) return null;

  const matchingSeeds = seeds.filter(
    (s) => s.name.toLowerCase().includes(tip.crop_name.toLowerCase()) ||
           tip.crop_name.toLowerCase().includes(s.name.toLowerCase())
  );

  const diffBadgeClass = (diff: string | null | undefined) => {
    if (diff === "lätt") return "bg-green-100 text-green-700";
    if (diff === "medel") return "bg-yellow-100 text-yellow-700";
    if (diff === "avancerad") return "bg-red-100 text-red-700";
    return "bg-muted text-muted-foreground";
  };

  const formatMonthRange = (start: number | null | undefined, end: number | null | undefined) => {
    if (!start || !end) return null;
    if (start === end) return MONTH_NAMES_SV[start];
    return `${MONTH_NAMES_SV[start]}–${MONTH_NAMES_SV[end]}`;
  };

  const handleSaveReminder = async () => {
    if (!user || !reminderDate) return;
    setSavingReminder(true);
    const dateStr = format(reminderDate, "yyyy-MM-dd");
    const linkedSeed = linkedSeedId ? seeds.find((s) => s.id === linkedSeedId) : null;
    const description = linkedSeed
      ? `${tip.sowType === "Inomhus" ? "Inomhussådd" : "Utomhussådd"} – frö: ${linkedSeed.name}`
      : `${tip.sowType === "Inomhus" ? "Inomhussådd" : "Utomhussådd"}`;

    const { error } = await supabase.from("calendar_events" as any).insert({
      user_id: user.id,
      title: `Så ${tip.crop_name}`,
      event_date: dateStr,
      description,
      emoji: "🌱",
      event_type: "reminder",
    } as any);

    if (error) {
      toast({ title: "Kunde inte spara påminnelse", variant: "destructive" });
    } else {
      toast({ title: `📅 Påminnelse tillagd: Så ${tip.crop_name} den ${format(reminderDate, "d MMMM", { locale: sv })}` });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      setReminderDate(undefined);
      setLinkedSeedId(null);
    }
    setSavingReminder(false);
  };

  // Collect school tips
  const schoolTips = Object.entries(SCHOOL_INFO)
    .map(([key, info]) => ({
      school: key,
      ...info,
      tip: (tip as any)[info.key] as string | null,
    }))
    .filter((s) => s.tip);

  const userSchoolTip = userSchool
    ? schoolTips.find((s) => s.school === userSchool)
    : null;
  const otherSchoolTips = schoolTips.filter((s) => s.school !== userSchool);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="font-display text-lg flex items-center gap-2">
            🌱 {tip.crop_name}
            {tip.crop_name_latin && (
              <span className="text-xs text-muted-foreground font-normal italic">
                ({tip.crop_name_latin})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Quick info row */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full ${diffBadgeClass(tip.difficulty)}`}>
              {tip.difficulty || "Okänd"}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {tip.category}
            </span>
            {tip.spacing_cm && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {tip.spacing_cm} cm avstånd
              </span>
            )}
            {tip.days_to_harvest && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                ~{tip.days_to_harvest} dagar till skörd
              </span>
            )}
          </div>

          {/* Sowing & harvest periods */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Perioder</h3>
            <div className="grid grid-cols-2 gap-2">
              {tip.sow_indoor_start && (
                <div className="rounded-xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">🏠 Inomhussådd</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatMonthRange(tip.sow_indoor_start, tip.sow_indoor_end)}
                  </p>
                </div>
              )}
              {tip.sow_outdoor_start && (
                <div className="rounded-xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">🌤️ Utomhussådd</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatMonthRange(tip.sow_outdoor_start, tip.sow_outdoor_end)}
                  </p>
                </div>
              )}
              {tip.harvest_start && (
                <div className="rounded-xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">🥕 Skörd</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatMonthRange(tip.harvest_start, tip.harvest_end)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* General tips */}
          {tip.tips && (
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-foreground">Allmänna tips</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.tips}</p>
            </div>
          )}

          {/* School-specific tips */}
          {schoolTips.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Tips från odlingsskolorna</h3>

              {/* User's school tip highlighted */}
              {userSchoolTip && (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span>{userSchoolTip.emoji}</span>
                    <span className="text-xs font-medium text-primary">{userSchoolTip.label}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Din skola</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{userSchoolTip.tip}</p>
                </div>
              )}

              {/* Other schools */}
              {otherSchoolTips.length > 0 && (
                <>
                  {!showAllSchools && (
                    <button
                      onClick={() => setShowAllSchools(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ChevronDown className="w-3 h-3" />
                      Visa tips från {otherSchoolTips.length} andra {otherSchoolTips.length === 1 ? "skola" : "skolor"}
                    </button>
                  )}
                  {showAllSchools && otherSchoolTips.map((s) => (
                    <div key={s.school} className="rounded-xl bg-accent/40 p-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span>{s.emoji}</span>
                        <span className="text-xs font-medium text-foreground">{s.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.tip}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Link to seed */}
          {matchingSeeds.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-primary" /> Koppla till ditt fröförråd
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchingSeeds.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLinkedSeedId(linkedSeedId === s.id ? null : s.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      linkedSeedId === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/30"
                    )}
                  >
                    🌾 {s.name} {s.quantity ? `(${s.quantity})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add reminder */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-primary" /> Lägg till påminnelse
            </h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-left",
                      !reminderDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    {reminderDate
                      ? format(reminderDate, "d MMMM yyyy", { locale: sv })
                      : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {reminderDate && (
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleSaveReminder}
                disabled={savingReminder}
              >
                {savingReminder ? "Sparar..." : `📅 Spara påminnelse – Så ${tip.crop_name}`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
