import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil, Save, CalendarDays } from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { sv } from "date-fns/locale";
import { useDiaryEntries, useAddDiaryEntry, useUpdateDiaryEntry, useDeleteDiaryEntry } from "@/hooks/useDiary";
import type { DiaryEntry } from "@/hooks/useDiary";
import { PhotoStrip } from "@/components/PhotoStrip";

// ── Constants ──

const MOOD_OPTIONS = [
  { value: 1, emoji: "😔" },
  { value: 2, emoji: "😐" },
  { value: 3, emoji: "🙂" },
  { value: 4, emoji: "😊" },
  { value: 5, emoji: "🌟" },
];

const ACTIVITY_OPTIONS = [
  "Sådde", "Planterade om", "Skördade", "Vattnade",
  "Rensade ogräs", "Gödslade", "Observerade", "Annat",
];

type DiaryTab = "dagbok" | "wellbeing";

interface DiaryScreenProps {
  initialTab?: "dagbok" | "wellbeing";
  onNavigate?: (tab: string) => void;
}

// ── Diary Entry Form ──

function DiaryEntryForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: { entry_date: string; title: string; content: string; mood_garden: number | null; activities: string[]; photo_urls?: string[] };
  onSave: (data: { entry_date: string; title: string; content: string; mood_garden: number | null; activities: string[]; photo_urls: string[] }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [date, setDate] = useState(initial?.entry_date || format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [mood, setMood] = useState<number | null>(initial?.mood_garden ?? null);
  const [activities, setActivities] = useState<string[]>(initial?.activities || []);
  const [photoUrls, setPhotoUrls] = useState<string[]>(initial?.photo_urls || []);

  const toggleActivity = (a: string) =>
    setActivities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      {/* Date */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Datum</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Input
        placeholder="Vad hände i trädgården idag?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        placeholder="Beskriv dagen – vad du sådde, skördade, observerade..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      {/* Mood */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Hur var dagen i trädgården?
        </label>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              className={cn(
                "w-10 h-10 rounded-xl text-xl transition-all",
                mood === m.value
                  ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                  : "bg-card border border-border hover:bg-accent"
              )}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Aktiviteter</label>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleActivity(a)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activities.includes(a)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="growmate"
          className="flex-1"
          disabled={isSaving}
          onClick={() => onSave({ entry_date: date, title, content, mood_garden: mood, activities })}
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSaving ? "Sparar..." : "Spara"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Avbryt</Button>
      </div>
    </div>
  );
}

// ── Wellbeing Tab ──

function WellbeingSlider({
  label,
  description,
  value,
  onChange,
  labels,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  labels: { low: string; mid: string; high: string };
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Slider
        min={1}
        max={5}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="py-2"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{labels.low}</span>
        <span>{labels.mid}</span>
        <span>{labels.high}</span>
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score <= 2) return "bg-destructive";
  if (score <= 3) return "bg-growmate-sun";
  return "bg-primary";
}

function getReflection(avg: number) {
  if (avg < 2.5) return "Det är okej att ha tuffa perioder. Trädgården finns här när du behöver den. 🌱";
  if (avg <= 3.5) return "En balanserad vecka. Varje stund i naturen är ett steg framåt. 🌿";
  return "Vilken fin vecka! Du bär med dig energin ut i odlingen. 🌻";
}

function WellbeingTab({ entries, year }: { entries: DiaryEntry[]; year: number }) {
  const addEntry = useAddDiaryEntry();
  const updateEntry = useUpdateDiaryEntry();
  const [physical, setPhysical] = useState(3);
  const [mental, setMental] = useState(3);
  const [social, setSocial] = useState(3);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhysical, setEditPhysical] = useState(3);
  const [editMental, setEditMental] = useState(3);
  const [editSocial, setEditSocial] = useState(3);
  const [editNote, setEditNote] = useState("");

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeekEntry = useMemo(() => {
    return entries.find((e) => {
      const d = new Date(e.entry_date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd }) &&
        e.wellbeing_physical !== null;
    });
  }, [entries, weekStart, weekEnd]);

  const pastCheckins = useMemo(() => {
    return entries.filter(
      (e) => e.wellbeing_physical !== null && e !== thisWeekEntry
    );
  }, [entries, thisWeekEntry]);

  const handleSave = () => {
    addEntry.mutate(
      {
        entry_date: format(now, "yyyy-MM-dd"),
        title: "Veckoincheckning",
        content: note || null,
        wellbeing_physical: physical,
        wellbeing_mental: mental,
        wellbeing_social: social,
        season_year: year,
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setEditPhysical(entry.wellbeing_physical || 3);
    setEditMental(entry.wellbeing_mental || 3);
    setEditSocial(entry.wellbeing_social || 3);
    setEditNote(entry.content || "");
  };

  const handleUpdateEntry = () => {
    if (!editingId) return;
    updateEntry.mutate(
      {
        id: editingId,
        wellbeing_physical: editPhysical,
        wellbeing_mental: editMental,
        wellbeing_social: editSocial,
        content: editNote || null,
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleEditCurrentWeek = () => {
    if (thisWeekEntry) handleEdit(thisWeekEntry);
  };

  const showEntry = thisWeekEntry || (saved ? null : undefined);
  const displayedEntry = thisWeekEntry;
  const avg = displayedEntry
    ? ((displayedEntry.wellbeing_physical || 3) + (displayedEntry.wellbeing_mental || 3) + (displayedEntry.wellbeing_social || 3)) / 3
    : saved
      ? (physical + mental + social) / 3
      : 0;

  const renderEditForm = (onSave: () => void, onCancel: () => void, isSaving: boolean) => (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-5 animate-fade-in">
      <WellbeingSlider
        label="🏃 Kroppen"
        description="Hur mår kroppen?"
        value={editPhysical}
        onChange={setEditPhysical}
        labels={{ low: "😴 Trött", mid: "😌 Lagom", high: "💪 Pigg och stark" }}
      />
      <WellbeingSlider
        label="🧠 Sinnet"
        description="Hur mår sinnet?"
        value={editMental}
        onChange={setEditMental}
        labels={{ low: "😟 Tung", mid: "😌 Neutral", high: "🌟 Lätt och klar" }}
      />
      <WellbeingSlider
        label="🤝 Kontakten"
        description="Hur känns kontakten med andra?"
        value={editSocial}
        onChange={setEditSocial}
        labels={{ low: "🧍 Isolerad", mid: "👋 Lagom", high: "🤝 Nära och kopplad" }}
      />
      <Textarea
        placeholder="Något du vill minnas från veckan? (valfritt)"
        value={editNote}
        onChange={(e) => setEditNote(e.target.value)}
        rows={2}
      />
      <div className="flex gap-2">
        <Button variant="growmate" className="flex-1" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Sparar..." : "Uppdatera"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Avbryt</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Intro card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent to-secondary p-4 border border-border">
        <p className="text-sm text-foreground leading-relaxed">
          Odling påverkar hela dig – inte bara det du skördar. Ta en stund varje vecka och stäm av hur du mår. Forskning visar att tid i naturen stärker både kropp, sinne och relationer. 🌿
        </p>
      </div>

      <h3 className="font-display text-foreground">Denna veckas incheckning</h3>

      {editingId === thisWeekEntry?.id ? (
        renderEditForm(handleUpdateEntry, () => setEditingId(null), updateEntry.isPending)
      ) : displayedEntry ? (
        /* Show existing check-in */
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {format(new Date(displayedEntry.entry_date), "d MMMM yyyy", { locale: sv })}
            </p>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleEditCurrentWeek}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Ändra
            </Button>
          </div>
          <div className="flex gap-4">
            {[
              { label: "Kropp", score: displayedEntry.wellbeing_physical || 3 },
              { label: "Sinne", score: displayedEntry.wellbeing_mental || 3 },
              { label: "Kontakt", score: displayedEntry.wellbeing_social || 3 },
            ].map((d) => (
              <div key={d.label} className="flex flex-col items-center gap-1">
                <div className={cn("w-4 h-4 rounded-full", getScoreColor(d.score))} />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
                <span className="text-xs font-medium text-foreground">{d.score}/5</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-accent/50 p-3">
            <p className="text-sm text-foreground">{getReflection(avg)}</p>
          </div>
          {displayedEntry.content && (
            <p className="text-xs text-muted-foreground italic">"{displayedEntry.content}"</p>
          )}
        </div>
      ) : saved ? (
        /* Just saved confirmation */
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3 animate-fade-in">
          <div className="flex gap-4 justify-center">
            {[
              { label: "Kropp", score: physical },
              { label: "Sinne", score: mental },
              { label: "Kontakt", score: social },
            ].map((d) => (
              <div key={d.label} className="flex flex-col items-center gap-1">
                <div className={cn("w-4 h-4 rounded-full", getScoreColor(d.score))} />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
                <span className="text-xs font-medium text-foreground">{d.score}/5</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-accent/50 p-3">
            <p className="text-sm text-foreground">{getReflection(avg)}</p>
          </div>
        </div>
      ) : (
        /* Check-in form */
        <div className="rounded-2xl bg-card border border-border p-4 space-y-5 animate-fade-in">
          <WellbeingSlider
            label="🏃 Kroppen"
            description="Hur mår kroppen?"
            value={physical}
            onChange={setPhysical}
            labels={{ low: "😴 Trött", mid: "😌 Lagom", high: "💪 Pigg och stark" }}
          />
          <WellbeingSlider
            label="🧠 Sinnet"
            description="Hur mår sinnet?"
            value={mental}
            onChange={setMental}
            labels={{ low: "😟 Tung", mid: "😌 Neutral", high: "🌟 Lätt och klar" }}
          />
          <WellbeingSlider
            label="🤝 Kontakten"
            description="Hur känns kontakten med andra?"
            value={social}
            onChange={setSocial}
            labels={{ low: "🧍 Isolerad", mid: "👋 Lagom", high: "🤝 Nära och kopplad" }}
          />

          <Textarea
            placeholder="Något du vill minnas från veckan? (valfritt)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />

          <Button
            variant="growmate"
            className="w-full"
            onClick={handleSave}
            disabled={addEntry.isPending}
          >
            {addEntry.isPending ? "Sparar..." : "Spara incheckning"}
          </Button>
        </div>
      )}

      {/* Past check-ins */}
      {pastCheckins.length > 0 && (
        <>
          <h3 className="font-display text-foreground mt-2">Tidigare veckor</h3>
          <div className="space-y-2">
            {pastCheckins.map((e) =>
              editingId === e.id ? (
                <div key={e.id}>
                  <p className="text-xs text-muted-foreground mb-2">
                    {format(new Date(e.entry_date), "d MMMM yyyy", { locale: sv })}
                  </p>
                  {renderEditForm(handleUpdateEntry, () => setEditingId(null), updateEntry.isPending)}
                </div>
              ) : (
                <div key={e.id} className="rounded-xl bg-card border border-border p-3 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground min-w-[5rem]">
                    {format(new Date(e.entry_date), "d MMM", { locale: sv })}
                  </span>
                  <div className="flex gap-2">
                    <div className={cn("w-3 h-3 rounded-full", getScoreColor(e.wellbeing_physical || 3))} title="Kropp" />
                    <div className={cn("w-3 h-3 rounded-full", getScoreColor(e.wellbeing_mental || 3))} title="Sinne" />
                    <div className={cn("w-3 h-3 rounded-full", getScoreColor(e.wellbeing_social || 3))} title="Kontakt" />
                  </div>
                  {e.content && (
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {e.content.slice(0, 40)}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={() => handleEdit(e)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main DiaryScreen ──

function getMoodEmoji(mood: number | null) {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.emoji || "";
}

export function DiaryScreen({ initialTab = "dagbok", onNavigate }: DiaryScreenProps) {
  const [tab, setTab] = useState<DiaryTab>(initialTab);
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useDiaryEntries(seasonYear);
  const addEntry = useAddDiaryEntry();
  const updateEntry = useUpdateDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();

  // Filter diary entries (no wellbeing scores) vs wellbeing entries
  const diaryEntries = entries.filter((e) => e.wellbeing_physical === null);

  const handleAdd = (data: { entry_date: string; title: string; content: string; mood_garden: number | null; activities: string[] }) => {
    addEntry.mutate(
      {
        entry_date: data.entry_date,
        title: data.title || null,
        content: data.content || null,
        mood_garden: data.mood_garden,
        activities: data.activities,
        season_year: seasonYear,
      },
      { onSuccess: () => setShowAdd(false) }
    );
  };

  const handleUpdate = (id: string, data: { entry_date: string; title: string; content: string; mood_garden: number | null; activities: string[] }) => {
    updateEntry.mutate(
      {
        id,
        entry_date: data.entry_date,
        title: data.title || null,
        content: data.content || null,
        mood_garden: data.mood_garden,
        activities: data.activities,
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-6 pb-3">
        {/* Tab bar */}
        <div className="bg-muted rounded-xl p-1 flex mb-4">
          {([
            { id: "dagbok" as DiaryTab, label: "Dagbok 📔" },
            { id: "wellbeing" as DiaryTab, label: "Välmående 💚" },
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

        {/* Year selector */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display text-foreground">
            {tab === "dagbok" ? "Odlingsdagbok" : "Välmående"}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSeasonYear((y) => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[3rem] text-center">{seasonYear}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSeasonYear((y) => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {tab === "dagbok" && !showAdd && !editingId && (
          <div className="space-y-2">
            <Button variant="growmate" className="w-full" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Ny anteckning
            </Button>
            {onNavigate && (
              <Button variant="outline" className="w-full" onClick={() => onNavigate("calendar")}>
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Visa kalender
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-3">
        {tab === "dagbok" ? (
          <>
            {showAdd && (
              <DiaryEntryForm
                onSave={handleAdd}
                onCancel={() => setShowAdd(false)}
                isSaving={addEntry.isPending}
              />
            )}

            {isLoading && (
              <div className="text-center py-8">
                <span className="text-2xl">📔</span>
                <p className="text-muted-foreground text-sm mt-2">Laddar dagboken...</p>
              </div>
            )}

            {!isLoading && diaryEntries.length === 0 && !showAdd && (
              <div className="text-center py-12">
                <span className="text-4xl">📝</span>
                <p className="text-foreground font-medium mt-3">Inga anteckningar ännu</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Börja logga din odlingsresa med anteckningar och humör
                </p>
              </div>
            )}

            {diaryEntries.map((entry) =>
              editingId === entry.id ? (
                <DiaryEntryForm
                  key={entry.id}
                  initial={{
                    entry_date: entry.entry_date,
                    title: entry.title || "",
                    content: entry.content || "",
                    mood_garden: entry.mood_garden,
                    activities: entry.activities || [],
                  }}
                  onSave={(data) => handleUpdate(entry.id, data)}
                  onCancel={() => setEditingId(null)}
                  isSaving={updateEntry.isPending}
                />
              ) : (
                <div key={entry.id} className="rounded-2xl bg-card border border-border p-4 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.entry_date), "d MMMM yyyy", { locale: sv })}
                        </span>
                        {entry.mood_garden && (
                          <span className="text-sm">{getMoodEmoji(entry.mood_garden)}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {entry.title || (entry.content
                          ? (entry.content.length > 80 ? entry.content.slice(0, 80) + "..." : entry.content)
                          : <span className="text-muted-foreground italic">Ingen text</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(entry.id)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry.mutate(entry.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {entry.activities && entry.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.activities.map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </>
        ) : (
          <WellbeingTab entries={entries} year={seasonYear} />
        )}
      </div>
    </div>
  );
}
