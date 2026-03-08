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
} from "lucide-react";

const SEASON_TIPS = [
  {
    icon: Sun,
    title: "Mars-tips",
    description: "Dags att förså tomat, paprika och chili inomhus",
    color: "bg-growmate-sun/20 text-growmate-earth",
  },
  {
    icon: Droplets,
    title: "Vattning",
    description: "Håll jämn fukt i fönsterbrädan – inte för blött",
    color: "bg-growmate-sky/20 text-growmate-sky",
  },
  {
    icon: CalendarDays,
    title: "Kommande",
    description: "Sallad kan direktsås om 4 veckor",
    color: "bg-growmate-leaf-light text-primary",
  },
];

const QUICK_ACTIONS = [
  { icon: Leaf, label: "Min odling", desc: "Se dina grödor" },
  { icon: BookOpen, label: "Dagbok", desc: "Logga aktivitet" },
  { icon: Heart, label: "Välmående", desc: "Veckoincheckning" },
  { icon: CalendarDays, label: "Kalender", desc: "Såningsschema" },
];

interface DashboardProps {
  profile: string;
  onNavigateChat: () => void;
}

export function Dashboard({ profile, onNavigateChat }: DashboardProps) {
  const profileEmojis: Record<string, string> = {
    sinnesron: "🌿",
    "skordeglädjen": "🥕",
    lararen: "👨‍👧",
    experimenteraren: "🧪",
    "självhushållaren": "🏡",
  };

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
            God morgon! {profileEmojis[profile] || "🌱"}
          </h1>
          <p className="text-sm text-foreground/80 mt-1">
            Säsongen har börjat – dags att planera din odling
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6 -mt-2">
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
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
            {SEASON_TIPS.map((tip) => (
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
              <Button variant="growmate-soft" size="sm" className="mt-3">
                Veckoincheckning
              </Button>
            </div>
          </div>
        </div>

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
