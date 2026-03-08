import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil, X, Save } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useDiaryEntries, useAddDiaryEntry, useUpdateDiaryEntry, useDeleteDiaryEntry } from "@/hooks/useDiary";
import type { DiaryEntry } from "@/hooks/useDiary";

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

interface EntryFormData {
  entry_date: Date;
  title: string;
  content: string;
  mood: number | null;
  activities: string[];
}

function EntryForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<EntryFormData>;
  onSave: (data: EntryFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [date, setDate] = useState<Date>(initial?.entry_date || new Date());
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [activities, setActivities] = useState<string[]>(initial?.activities || []);

  const toggleActivity = (a: string) => {
    setActivities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      {/* Date picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Datum</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "d MMMM yyyy", { locale: sv })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Title */}
      <Input
        placeholder="Vad hände i trädgården idag?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Content */}
      <Textarea
        placeholder="Beskriv dagen, vad du sådde, skördade, observerade..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />

      {/* Mood */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Hur mådde du i trädgården idag?
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
                  ? "bg-primary/20 ring-2 ring-primary scale-110"
                  : "bg-muted hover:bg-accent"
              )}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Aktiviteter
        </label>
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

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="growmate"
          className="flex-1"
          disabled={isSaving}
          onClick={() => onSave({ entry_date: date, title, content, mood, activities })}
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSaving ? "Sparar..." : "Spara"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

function getMoodEmoji(mood: number | null) {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.emoji || "";
}

export function DiaryScreen() {
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useDiaryEntries(seasonYear);
  const addEntry = useAddDiaryEntry();
  const updateEntry = useUpdateDiaryEntry();
  const deleteEntry = useDeleteDiaryEntry();

  const handleAdd = (data: EntryFormData) => {
    addEntry.mutate(
      {
        entry_date: format(data.entry_date, "yyyy-MM-dd"),
        title: data.title || undefined,
        content: data.content || undefined,
        mood: data.mood ?? undefined,
        activities: data.activities,
        season_year: seasonYear,
      },
      { onSuccess: () => setShowAdd(false) }
    );
  };

  const handleUpdate = (id: string, data: EntryFormData) => {
    updateEntry.mutate(
      {
        id,
        entry_date: format(data.entry_date, "yyyy-MM-dd"),
        title: data.title || null,
        content: data.content || null,
        mood: data.mood,
        activities: data.activities,
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-display text-foreground">Odlingsdagbok 📔</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSeasonYear((y) => y - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[3rem] text-center">
              {seasonYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSeasonYear((y) => y + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!showAdd && !editingId && (
          <Button
            variant="growmate"
            className="w-full"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ny anteckning
          </Button>
        )}
      </div>

      <div className="px-4 space-y-3">
        {/* Add form */}
        {showAdd && (
          <EntryForm
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            isSaving={addEntry.isPending}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-8">
            <span className="text-2xl">📔</span>
            <p className="text-muted-foreground text-sm mt-2">Laddar dagboken...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && !showAdd && (
          <div className="text-center py-12">
            <span className="text-4xl">📝</span>
            <p className="text-foreground font-medium mt-3">Inga anteckningar ännu</p>
            <p className="text-muted-foreground text-sm mt-1">
              Börja logga din odlingsresa med foton, anteckningar och humör
            </p>
          </div>
        )}

        {/* Entries list */}
        {entries.map((entry) =>
          editingId === entry.id ? (
            <EntryForm
              key={entry.id}
              initial={{
                entry_date: new Date(entry.entry_date),
                title: entry.title || "",
                content: entry.content || "",
                mood: entry.mood,
                activities: entry.activities || [],
              }}
              onSave={(data) => handleUpdate(entry.id, data)}
              onCancel={() => setEditingId(null)}
              isSaving={updateEntry.isPending}
            />
          ) : (
            <div
              key={entry.id}
              className="rounded-2xl bg-card border border-border p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.entry_date), "d MMM yyyy", { locale: sv })}
                    </span>
                    {entry.mood && (
                      <span className="text-sm">{getMoodEmoji(entry.mood)}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.title || (entry.content ? entry.content.slice(0, 60) + (entry.content.length > 60 ? "..." : "") : "Ingen text")}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setEditingId(entry.id)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteEntry.mutate(entry.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Activity chips */}
              {entry.activities && entry.activities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.activities.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
