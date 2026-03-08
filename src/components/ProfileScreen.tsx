import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { OnboardingData } from "@/types/onboarding";
import { cn } from "@/lib/utils";
import { Settings, ChevronRight, User, MapPin, Clock, Sparkles, LogOut, Users, Bell } from "lucide-react";
import { useNotifications, getNotificationPermission, requestNotificationPermission } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PROFILE_LABELS: Record<string, { emoji: string; title: string }> = {
  sinnesron: { emoji: "🌿", title: "Sinnesron" },
  "skordeglädjen": { emoji: "🥕", title: "Skördeglädjen" },
  lararen: { emoji: "👨‍👧", title: "Läraren" },
  experimenteraren: { emoji: "🧪", title: "Experimenteraren" },
  "självhushållaren": { emoji: "🏡", title: "Självhushållaren" },
  annat: { emoji: "✨", title: "Annat" },
};

const SCHOOL_DISPLAY: Record<string, { emoji: string; title: string; desc: string }> = {
  "naturens-vag": { emoji: "🌾", title: "Naturens väg", desc: "Enkelt, tåligt och avslappnat" },
  precisionsodlaren: { emoji: "🔬", title: "Precisionsodlaren", desc: "Detaljerat, noggrant, maximalt" },
  hackaren: { emoji: "⚡", title: "Hackaren", desc: "Smarta genvägar, mer skörd" },
  traditionalisten: { emoji: "📖", title: "Traditionalisten", desc: "Beprövat och tidlöst" },
};

interface ProfileScreenProps {
  data: OnboardingData;
  shareGrowingData?: boolean;
  onEdit: () => void;
  onSignOut?: () => void;
  onOpenAdmin?: () => void;
}

export function ProfileScreen({ data, shareGrowingData = false, onEdit, onSignOut, onOpenAdmin }: ProfileScreenProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [logoTaps, setLogoTaps] = useState(0);
  const [sharing, setSharing] = useState(shareGrowingData);
  const [savingShare, setSavingShare] = useState(false);
  const { settings: notifSettings, updateSettings: updateNotifSettings } = useNotifications(data.zone);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setSharing(shareGrowingData); }, [shareGrowingData]);

  const toggleSharing = async (checked: boolean) => {
    if (!user) return;
    setSavingShare(true);
    const { error } = await supabase
      .from("profiles")
      .update({ share_growing_data: checked } as any)
      .eq("user_id", user.id);
    setSavingShare(false);
    if (error) {
      toast.error("Kunde inte spara inställningen");
      return;
    }
    setSharing(checked);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success(checked ? "Din odlingsdata delas nu automatiskt" : "Automatisk delning avstängd");
  };

  useEffect(() => {
    if (logoTaps > 0) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setLogoTaps(0), 3000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [logoTaps]);
  const plannerLabel = data.plannerScore < 35 ? "Spontan" : data.plannerScore > 65 ? "Planerare" : "Balanserad";
  const timeLabel = `${data.timeScore}h / vecka`;
  const resultLabel = data.resultVsJoyScore < 35 ? "Glädjen i processen" : data.resultVsJoyScore > 65 ? "Resultatet" : "Balans";
  const schoolInfo = data.school ? SCHOOL_DISPLAY[data.school] : null;

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto cursor-pointer select-none"
            onClick={() => {
              const next = logoTaps + 1;
              setLogoTaps(next);
              if (next >= 5) {
                onOpenAdmin?.();
                setLogoTaps(0);
              }
            }}
          >
            <User className="w-8 h-8 text-accent-foreground" />
          </div>
          {logoTaps >= 3 && logoTaps < 5 && (
            <p className="text-xs text-muted-foreground text-center">🔓</p>
          )}
          <h1 className="text-2xl font-display text-foreground">{data.name}</h1>
          {data.zone && (
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{data.location || "Okänd plats"} · Zon {data.zone}</span>
            </div>
          )}
        </div>

        {/* Profiles */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Mina odlarprofiler
          </p>
          <div className="flex flex-wrap gap-2">
            {data.profiles.map((p) => {
              const label = PROFILE_LABELS[p];
              return label ? (
                <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm">
                  {label.emoji} {label.title}
                </span>
              ) : null;
            })}
          </div>
          {data.customReason && (
            <p className="text-xs text-muted-foreground italic">"{data.customReason}"</p>
          )}
        </div>

        {/* School */}
        {schoolInfo && (
          <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Min odlingsskola
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{schoolInfo.emoji}</span>
              <div className="flex-1">
                <p className="font-medium text-foreground">{schoolInfo.title}</p>
                <p className="text-xs text-muted-foreground">{schoolInfo.desc}</p>
              </div>
              <button onClick={onEdit} className="text-xs text-primary hover:underline">Ändra</button>
            </div>
          </div>
        )}

        {/* Personality */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Min odlingsstil
          </p>
          <div className="space-y-3">
            <SliderDisplay label="Odlingsstil" value={plannerLabel} emoji={data.plannerScore < 35 ? "🎲" : data.plannerScore > 65 ? "📋" : "⚖️"} score={data.plannerScore} />
            <SliderDisplay label="Tid" value={timeLabel} emoji="⏱️" score={(data.timeScore / 40) * 100} />
            <SliderDisplay label="Fokus" value={resultLabel} emoji={data.resultVsJoyScore < 35 ? "🧘" : data.resultVsJoyScore > 65 ? "🥕" : "⚖️"} score={data.resultVsJoyScore} />
          </div>
        </div>

        {/* Community sharing */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Community-delning
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-foreground">Dela odlingsdata automatiskt</p>
              <p className="text-xs text-muted-foreground">
                Dina grödor, sådd- och skördedatum delas anonymt för att hjälpa andra odlare. Ingen personlig info delas.
              </p>
            </div>
            <Switch
              checked={sharing}
              onCheckedChange={toggleSharing}
              disabled={savingShare}
            />
          </div>
        </div>

        {/* Notification settings */}
        <NotificationSettings settings={notifSettings} onUpdate={updateNotifSettings} />

        {/* Edit button */}
        <Button variant="growmate-outline" size="lg" className="w-full" onClick={onEdit}>
          <Settings className="w-4 h-4 mr-2" />
          Ändra mina inställningar
        </Button>

        {onSignOut && (
          <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={onSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        )}
      </div>
    </div>
  );
}

function SliderDisplay({ label, value, emoji, score }: { label: string; value: string; emoji: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{emoji} {value}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function NotificationSettings({
  settings,
  onUpdate,
}: {
  settings: import("@/hooks/useNotifications").NotificationSettings;
  onUpdate: (partial: Partial<import("@/hooks/useNotifications").NotificationSettings>) => void;
}) {
  const perm = getNotificationPermission();
  const [permGranted, setPermGranted] = useState(perm === "granted");

  const handleEnableToggle = async (key: keyof typeof settings, checked: boolean) => {
    if (checked && !permGranted) {
      const granted = await requestNotificationPermission();
      setPermGranted(granted);
      if (!granted) return;
    }
    onUpdate({ [key]: checked });
  };

  const timeString = `${String(settings.wellbeingHour).padStart(2, "0")}:${String(settings.wellbeingMinute).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <p className="text-sm font-medium text-foreground flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" /> Notifikationer
      </p>

      {perm === "unsupported" && (
        <p className="text-xs text-muted-foreground">Din webbläsare stöder inte notifikationer.</p>
      )}

      {perm !== "unsupported" && (
        <>
          {/* Wellbeing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-foreground">Daglig välmåendepåminnelse</p>
                <p className="text-xs text-muted-foreground">Påminnelse att logga ditt välmående</p>
              </div>
              <Switch
                checked={settings.wellbeingEnabled}
                onCheckedChange={(c) => handleEnableToggle("wellbeingEnabled", c)}
              />
            </div>
            {settings.wellbeingEnabled && (
              <div className="flex items-center gap-2 pl-1">
                <span className="text-xs text-muted-foreground">Tid:</span>
                <Input
                  type="time"
                  value={timeString}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number);
                    if (!isNaN(h) && !isNaN(m)) onUpdate({ wellbeingHour: h, wellbeingMinute: m });
                  }}
                  className="w-28 h-8 text-sm"
                />
              </div>
            )}
          </div>

          {/* Sowing */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-foreground">Såningspåminnelser</p>
              <p className="text-xs text-muted-foreground">7 dagar innan rekommenderat sådatum</p>
            </div>
            <Switch
              checked={settings.sowingEnabled}
              onCheckedChange={(c) => handleEnableToggle("sowingEnabled", c)}
            />
          </div>

          {/* Harvest */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm text-foreground">Skördepåminnelser</p>
              <p className="text-xs text-muted-foreground">14 dagar innan beräknad skörd</p>
            </div>
            <Switch
              checked={settings.harvestEnabled}
              onCheckedChange={(c) => handleEnableToggle("harvestEnabled", c)}
            />
          </div>
        </>
      )}
    </div>
  );
}
