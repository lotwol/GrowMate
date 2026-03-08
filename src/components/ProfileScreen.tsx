import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "@/types/onboarding";
import { cn } from "@/lib/utils";
import { Settings, ChevronRight, User, MapPin, Clock, Sparkles } from "lucide-react";

const PROFILE_LABELS: Record<string, { emoji: string; title: string }> = {
  sinnesron: { emoji: "🌿", title: "Sinnesron" },
  "skordeglädjen": { emoji: "🥕", title: "Skördeglädjen" },
  lararen: { emoji: "👨‍👧", title: "Läraren" },
  experimenteraren: { emoji: "🧪", title: "Experimenteraren" },
  "självhushållaren": { emoji: "🏡", title: "Självhushållaren" },
  annat: { emoji: "✨", title: "Annat" },
};

interface ProfileScreenProps {
  data: OnboardingData;
  onEdit: () => void;
}

export function ProfileScreen({ data, onEdit }: ProfileScreenProps) {
  const plannerLabel = data.plannerScore < 35 ? "Spontan" : data.plannerScore > 65 ? "Planerare" : "Balanserad";
  const timeLabel = data.timeScore < 35 ? "Lite tid" : data.timeScore > 65 ? "Mycket tid" : "Lagom";
  const resultLabel = data.resultVsJoyScore < 35 ? "Glädjen i processen" : data.resultVsJoyScore > 65 ? "Resultatet" : "Balans";

  return (
    <div className="min-h-screen pb-24 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-accent-foreground" />
          </div>
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

        {/* Personality */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Min odlingsstil
          </p>
          <div className="space-y-3">
            <SliderDisplay label="Odlingsstil" value={plannerLabel} emoji={data.plannerScore < 35 ? "🎲" : data.plannerScore > 65 ? "📋" : "⚖️"} score={data.plannerScore} />
            <SliderDisplay label="Tid" value={timeLabel} emoji={data.timeScore < 35 ? "⏱️" : data.timeScore > 65 ? "🌻" : "⚖️"} score={data.timeScore} />
            <SliderDisplay label="Fokus" value={resultLabel} emoji={data.resultVsJoyScore < 35 ? "🧘" : data.resultVsJoyScore > 65 ? "🥕" : "⚖️"} score={data.resultVsJoyScore} />
          </div>
        </div>

        {/* Edit button */}
        <Button variant="growmate-outline" size="lg" className="w-full" onClick={onEdit}>
          <Settings className="w-4 h-4 mr-2" />
          Ändra mina inställningar
        </Button>
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
