import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Info } from "lucide-react";

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
  onComplete: (profiles: string[]) => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [zone, setZone] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [manualZone, setManualZone] = useState(false);

  const LOCATION_ZONES: Record<string, { zone: string; desc: string }> = {
    "malmö": { zone: "I", desc: "Sydligaste Sverige – mildast klimat" },
    "lund": { zone: "I", desc: "Sydligaste Sverige – mildast klimat" },
    "helsingborg": { zone: "I", desc: "Sydligaste Sverige – mildast klimat" },
    "kristianstad": { zone: "I", desc: "Sydligaste Sverige – mildast klimat" },
    "ystad": { zone: "I", desc: "Sydligaste Sverige – mildast klimat" },
    "göteborg": { zone: "II", desc: "Västkusten – milt maritimt klimat" },
    "halmstad": { zone: "II", desc: "Västkusten – milt maritimt klimat" },
    "kalmar": { zone: "II", desc: "Sydöstra kusten" },
    "växjö": { zone: "III", desc: "Småland – lite kallare vintrar" },
    "jönköping": { zone: "III", desc: "Småland – lite kallare vintrar" },
    "linköping": { zone: "III", desc: "Östergötland" },
    "norrköping": { zone: "III", desc: "Östergötland" },
    "stockholm": { zone: "III", desc: "Stockholmsregionen" },
    "nyköping": { zone: "III", desc: "Södermanland" },
    "västerås": { zone: "IV", desc: "Mälardalen" },
    "örebro": { zone: "IV", desc: "Mellansverige" },
    "uppsala": { zone: "IV", desc: "Uppland" },
    "karlstad": { zone: "IV", desc: "Värmland" },
    "borlänge": { zone: "V", desc: "Dalarna" },
    "falun": { zone: "V", desc: "Dalarna" },
    "gävle": { zone: "V", desc: "Gästrikland" },
    "sundsvall": { zone: "V", desc: "Medelpad" },
    "härnösand": { zone: "V", desc: "Ångermanland" },
    "östersund": { zone: "VI", desc: "Jämtland – kort men intensiv säsong" },
    "umeå": { zone: "VI", desc: "Västerbotten" },
    "luleå": { zone: "VII", desc: "Norrbotten – utmanande men möjligt" },
    "kiruna": { zone: "VIII", desc: "Fjällnära – kort säsong, ljusa nätter" },
    "gällivare": { zone: "VIII", desc: "Fjällnära – kort säsong, ljusa nätter" },
  };

  const zones = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

  const suggestedZone = useMemo(() => {
    const loc = location.toLowerCase().trim();
    if (!loc) return null;
    // Exact match first
    if (LOCATION_ZONES[loc]) return LOCATION_ZONES[loc];
    // Partial match
    const match = Object.entries(LOCATION_ZONES).find(([key]) => key.includes(loc) || loc.includes(key));
    return match ? match[1] : null;
  }, [location]);

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
            {/* "Annat" option */}
            <button
              onClick={() => {
                setShowCustom(!showCustom);
                if (showCustom) {
                  setSelectedProfiles((prev) => prev.filter((p) => p !== "annat"));
                  setCustomReason("");
                }
              }}
              className={cn(
                "w-full text-left rounded-2xl p-4 border-2 transition-all duration-200 border-dashed",
                showCustom
                  ? "border-primary bg-accent shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                  ✨
                </span>
                <div>
                  <p className="font-medium text-foreground">Annat</p>
                  <p className="text-sm text-muted-foreground italic">
                    "Jag odlar för att..." – berätta med egna ord!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hjälp oss förstå fler anledningar till odling
                  </p>
                </div>
              </div>
            </button>

            {showCustom && (
              <div className="animate-fade-in pl-2">
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value.trim() && !selectedProfiles.includes("annat")) {
                      setSelectedProfiles((prev) => [...prev, "annat"]);
                    } else if (!e.target.value.trim()) {
                      setSelectedProfiles((prev) => prev.filter((p) => p !== "annat"));
                    }
                  }}
                  placeholder="Berätta varför du odlar – allt räknas! 🌱"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
                />
              </div>
            )}
          </div>

          <Button
            variant="growmate"
            size="lg"
            className="w-full"
            onClick={() => (selectedProfiles.length > 0 || (showCustom && customReason.trim())) && setStep(2)}
            disabled={selectedProfiles.length === 0 && !(showCustom && customReason.trim())}
          >
            Nästa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="max-w-md w-full mx-auto space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Steg 2 av 2</p>
          <h2 className="text-2xl font-display text-foreground">
            Var odlar du?
          </h2>
          <p className="text-muted-foreground text-sm">
            Vi föreslår en odlingszon baserat på var du bor
          </p>
        </div>

        {/* Location input */}
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Skriv din stad, t.ex. Stockholm"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setManualZone(false);
            }}
            className="w-full rounded-full border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
        </div>

        {/* Suggested zone */}
        {suggestedZone && !manualZone && (
          <div className="rounded-2xl bg-accent/60 border border-primary/20 p-4 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">{suggestedZone.zone}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Vi föreslår Zon {suggestedZone.zone}
                </p>
                <p className="text-sm text-muted-foreground">
                  {suggestedZone.desc}
                </p>
              </div>
            </div>
            <Button
              variant="growmate"
              size="sm"
              className="w-full"
              onClick={() => setZone(suggestedZone.zone)}
            >
              {zone === suggestedZone.zone ? "✓ Vald" : "Välj Zon " + suggestedZone.zone}
            </Button>
          </div>
        )}

        {/* No match or manual */}
        {location.trim() && !suggestedZone && !manualZone && (
          <div className="rounded-2xl bg-card border border-border p-4 text-center space-y-2 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Vi hittade inte din stad – men du kan välja zon manuellt nedan.
            </p>
          </div>
        )}

        {/* Microclimat info + manual toggle */}
        <div className="rounded-2xl bg-secondary/50 border border-border p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground text-sm mb-1">Om mikroklimat</p>
              <p>
                Odlingszonerna är en guide – ditt faktiska klimat kan skilja sig. 
                Stadsmiljöer, sydvända lägen och kustnära platser kan vara varmare. 
                Högt belägna eller vindexponerade platser kan vara kallare.
              </p>
            </div>
          </div>
          {!manualZone && (
            <button
              onClick={() => setManualZone(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Jag vill välja zon manuellt →
            </button>
          )}
        </div>

        {/* Manual zone grid */}
        {(manualZone || (!suggestedZone && location.trim())) && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-foreground">Välj din zon:</p>
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
                  {z}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1 pt-1">
              <span>I–II: Skåne, Halland, Blekinge</span>
              <span>III–IV: Svealand, Götaland</span>
              <span>V–VI: Norrlands kust, Jämtland</span>
              <span>VII–VIII: Norrlands inland, fjäll</span>
            </div>
          </div>
        )}

        <Button
          variant="growmate"
          size="lg"
          className="w-full"
          onClick={() => zone && selectedProfiles.length > 0 && onComplete(selectedProfiles)}
          disabled={!zone}
        >
          Starta min odling 🌱
        </Button>
      </div>
    </div>
  );
}
