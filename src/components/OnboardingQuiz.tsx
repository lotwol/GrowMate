import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROFILES = [
  {
    id: "sinnesron",
    emoji: "🌿",
    title: "Sinnesron",
    reason: "...stänga av hjärnan och arbeta med händerna",
    description: "Du odlar för att hitta lugn och närvaro",
    color: "bg-growmate-leaf-light",
  },
  {
    id: "skordeglädjen",
    emoji: "🥕",
    title: "Skördeglädjen",
    reason: "...äta det jag själv odlat",
    description: "Du odlar för den otroliga smaken av hemmaodlat",
    color: "bg-growmate-warm",
  },
  {
    id: "lararen",
    emoji: "👨‍👧",
    title: "Läraren",
    reason: "...odla med mina barn",
    description: "Du odlar för att lära och dela med de unga",
    color: "bg-growmate-sky/30",
  },
  {
    id: "experimenteraren",
    emoji: "🧪",
    title: "Experimenteraren",
    reason: "...testa nytt varje säsong",
    description: "Du odlar för nyfikenhetens skull",
    color: "bg-growmate-sun/30",
  },
  {
    id: "självhushållaren",
    emoji: "🏡",
    title: "Självhushållaren",
    reason: "...bli mer självförsörjande",
    description: "Du odlar för oberoende och hållbarhet",
    color: "bg-growmate-bloom/20",
  },
] as const;

interface OnboardingQuizProps {
  onComplete: (profile: string) => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [zone, setZone] = useState<string | null>(null);

  const zones = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="space-y-3">
            <span className="text-5xl">🌱</span>
            <h1 className="text-3xl font-display text-foreground">GrowMate</h1>
            <p className="text-muted-foreground text-lg">Din odlingskompis</p>
          </div>
          <p className="text-foreground/80 text-base leading-relaxed">
            "Grow more than plants." Vi hjälper dig odla – och må bra på vägen.
          </p>
          <div className="space-y-3 pt-4">
            <input
              type="text"
              placeholder="Vad heter du?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full border border-input bg-background px-6 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
            <Button
              variant="growmate"
              size="lg"
              className="w-full"
              onClick={() => name.trim() && setStep(1)}
              disabled={!name.trim()}
            >
              Kom igång
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-12">
        <div className="max-w-md w-full mx-auto space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">Steg 1 av 2</p>
            <h2 className="text-2xl font-display text-foreground">
              Hej {name}! Varför odlar du?
            </h2>
             <p className="text-muted-foreground">
               Välj en eller flera – ditt svar formar hela upplevelsen
             </p>
          </div>

          <div className="space-y-3">
            {PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfiles((prev) =>
                  prev.includes(profile.id)
                    ? prev.filter((p) => p !== profile.id)
                    : [...prev, profile.id]
                )}
                className={cn(
                  "w-full text-left rounded-2xl p-4 border-2 transition-all duration-200",
                  selectedProfiles.includes(profile.id)
                    ? "border-primary bg-accent shadow-md"
                    : "border-transparent bg-card hover:border-primary/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      profile.color
                    )}
                  >
                    {profile.emoji}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      {profile.title}
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      "Jag odlar för att {profile.reason}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="growmate"
            size="lg"
            className="w-full"
            onClick={() => selectedProfile && setStep(2)}
            disabled={!selectedProfile}
          >
            Nästa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Steg 2 av 2</p>
          <h2 className="text-2xl font-display text-foreground">
            Vilken odlingszon bor du i?
          </h2>
          <p className="text-muted-foreground text-sm">
            Sverige har 8 odlingszoner. Zon I (söder) till VIII (norr).
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={cn(
                "py-3 rounded-xl font-medium text-sm border-2 transition-all",
                zone === z
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              Zon {z}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Osäker? Zon IV–V passar de flesta i Mellansverige.
        </p>

        <Button
          variant="growmate"
          size="lg"
          className="w-full"
          onClick={() => zone && selectedProfile && onComplete(selectedProfile)}
          disabled={!zone}
        >
          Starta min odling 🌱
        </Button>
      </div>
    </div>
  );
}
