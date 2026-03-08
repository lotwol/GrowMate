import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Info, ArrowLeft } from "lucide-react";
import { OnboardingData, DEFAULT_ONBOARDING } from "@/types/onboarding";

const PROFILES = [
  { id: "sinnesron", emoji: "🌿", title: "Sinnesron", reason: "...stänga av hjärnan och arbeta med händerna", description: "Du odlar för att hitta lugn och närvaro", color: "bg-growmate-leaf-light" },
  { id: "skordeglädjen", emoji: "🥕", title: "Skördeglädjen", reason: "...äta det jag själv odlat", description: "Du odlar för den otroliga smaken av hemmaodlat", color: "bg-growmate-warm" },
  { id: "lararen", emoji: "👨‍👧", title: "Läraren", reason: "...odla med mina barn", description: "Du odlar för att lära och dela med de unga", color: "bg-growmate-sky/30" },
  { id: "experimenteraren", emoji: "🧪", title: "Experimenteraren", reason: "...testa nytt varje säsong", description: "Du odlar för nyfikenhetens skull", color: "bg-growmate-sun/30" },
  { id: "självhushållaren", emoji: "🏡", title: "Självhushållaren", reason: "...bli mer självförsörjande", description: "Du odlar för oberoende och hållbarhet", color: "bg-growmate-bloom/20" },
] as const;

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

interface OnboardingQuizProps {
  onComplete: (data: OnboardingData) => void;
  initialData?: OnboardingData;
}

export function OnboardingQuiz({ onComplete, initialData }: OnboardingQuizProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData || DEFAULT_ONBOARDING);
  const [showCustom, setShowCustom] = useState(!!initialData?.customReason);
  const [manualZone, setManualZone] = useState(false);

  const update = (partial: Partial<OnboardingData>) => setData((d) => ({ ...d, ...partial }));

  const zones = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const totalSteps = 4;

  // Levenshtein
  const levenshtein = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  };

  const locationSuggestions = useMemo(() => {
    const loc = data.location.toLowerCase().trim();
    if (!loc || loc.length < 2) return [];
    if (LOCATION_ZONES[loc]) return [];
    const scored = Object.keys(LOCATION_ZONES).map((city) => {
      let score = 100;
      if (city.startsWith(loc)) score = 0;
      else if (city.includes(loc) || loc.includes(city)) score = 1;
      else score = levenshtein(loc, city.substring(0, Math.max(loc.length, 3)));
      return { city, score };
    });
    return scored.filter((s) => s.score <= 3).sort((a, b) => a.score - b.score).slice(0, 3).map((s) => s.city);
  }, [data.location]);

  const suggestedZone = useMemo(() => {
    const loc = data.location.toLowerCase().trim();
    if (!loc || !LOCATION_ZONES[loc]) return null;
    return { ...LOCATION_ZONES[loc], city: loc };
  }, [data.location]);

  // Philosophical reflection based on slider combo
  const getReflection = () => {
    const { timeScore, resultVsJoyScore } = data;
    const lowTime = timeScore <= 5;
    const highTime = timeScore >= 15;
    const wantsResult = resultVsJoyScore > 65;
    const wantsJoy = resultVsJoyScore < 35;

    if (lowTime && wantsResult) {
      return { emoji: "🌱", text: "Du vill mycket men har lite tid – det är helt mänskligt. Vi hjälper dig välja rätt så att varje minut räknas. Men kom ihåg: ibland är det bästa resultatet att man tog sig ut överhuvudtaget." };
    }
    if (lowTime && wantsJoy) {
      return { emoji: "☀️", text: "Perfekt – du söker glädjen utan press. Några krukor på balkongen och solen i ansiktet kan vara precis allt du behöver." };
    }
    if (highTime && wantsResult) {
      return { emoji: "🥕", text: "Du är redo att satsa – och du kommer skörda! Med tid och ambition kan vi bygga något riktigt fint tillsammans." };
    }
    if (highTime && wantsJoy) {
      return { emoji: "🧘", text: "Du har tid och söker lugnet. Trädgården väntar på dig som en meditation utan instruktioner." };
    }
    return { emoji: "🌿", text: "En fin balans – vi skräddarsyr upplevelsen efter just dig. Du kan alltid justera senare." };
  };

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
      <ArrowLeft className="w-4 h-4" />
      <span>Tillbaka</span>
    </button>
  );

  const StepIndicator = ({ current }: { current: number }) => (
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i < current ? "w-6 bg-primary" : i === current ? "w-6 bg-primary/60" : "w-3 bg-border")} />
      ))}
    </div>
  );

  // Step 0: Welcome
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
              value={data.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full rounded-full border border-input bg-background px-6 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
            <Button variant="growmate" size="lg" className="w-full" onClick={() => data.name.trim() && setStep(1)} disabled={!data.name.trim()}>
              Kom igång
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Why do you grow?
  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col px-6 py-8">
        <div className="max-w-md w-full mx-auto space-y-5 animate-fade-in">
          <BackButton onClick={() => setStep(0)} />
          <StepIndicator current={0} />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-foreground">Hej {data.name}! Varför odlar du?</h2>
            <p className="text-muted-foreground">Välj en eller flera – ditt svar formar hela upplevelsen</p>
          </div>
          <div className="space-y-3">
            {PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => update({ profiles: data.profiles.includes(profile.id) ? data.profiles.filter((p) => p !== profile.id) : [...data.profiles, profile.id] })}
                className={cn("w-full text-left rounded-2xl p-4 border-2 transition-all duration-200", data.profiles.includes(profile.id) ? "border-primary bg-accent shadow-md" : "border-transparent bg-card hover:border-primary/30")}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0", profile.color)}>{profile.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground">{profile.title}</p>
                    <p className="text-sm text-muted-foreground italic">"Jag odlar för att {profile.reason}"</p>
                    <p className="text-xs text-muted-foreground mt-1">{profile.description}</p>
                  </div>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setShowCustom(!showCustom);
                if (showCustom) {
                  update({ profiles: data.profiles.filter((p) => p !== "annat"), customReason: "" });
                }
              }}
              className={cn("w-full text-left rounded-2xl p-4 border-2 transition-all duration-200 border-dashed", showCustom ? "border-primary bg-accent shadow-md" : "border-border bg-card hover:border-primary/30")}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">✨</span>
                <div>
                  <p className="font-medium text-foreground">Annat</p>
                  <p className="text-sm text-muted-foreground italic">"Jag odlar för att..." – berätta med egna ord!</p>
                </div>
              </div>
            </button>
            {showCustom && (
              <div className="animate-fade-in pl-2">
                <textarea
                  value={data.customReason}
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ customReason: val, profiles: val.trim() && !data.profiles.includes("annat") ? [...data.profiles, "annat"] : !val.trim() ? data.profiles.filter((p) => p !== "annat") : data.profiles });
                  }}
                  placeholder="Berätta varför du odlar – allt räknas! 🌱"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
                />
              </div>
            )}
          </div>
          <Button
            variant="growmate" size="lg" className="w-full"
            onClick={() => setStep(2)}
            disabled={data.profiles.length === 0 && !(showCustom && data.customReason.trim())}
          >
            Nästa
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Personality & time
  if (step === 2) {
    const reflection = getReflection();
    return (
      <div className="min-h-screen flex flex-col px-6 py-8">
        <div className="max-w-md w-full mx-auto space-y-5 animate-fade-in">
          <BackButton onClick={() => setStep(1)} />
          <StepIndicator current={1} />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-foreground">Berätta lite om dig 🪞</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Var ärlig mot dig själv – det finns inga fel svar. Du kan alltid ändra det här senare.
            </p>
          </div>

          <div className="space-y-6">
            {/* Planner vs Spontaneous */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Hur odlar du helst?</p>
              <div className="space-y-2">
                <input
                  type="range" min={0} max={100} value={data.plannerScore}
                  onChange={(e) => update({ plannerScore: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={cn(data.plannerScore < 40 && "text-foreground font-medium")}>🎲 Spontan & fri</span>
                  <span className={cn(data.plannerScore > 60 && "text-foreground font-medium")}>📋 Planerar allt</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                {data.plannerScore < 30 ? "Du gillar att följa magkänslan – vi håller det flexibelt!" : data.plannerScore > 70 ? "Struktur är din grej – vi ger dig scheman och påminnelser." : "Lite av varje – perfekt balans."}
              </p>
            </div>

            {/* Time per week */}
            {(() => {
              const timeSteps = [1, 2, 3, 5, 8, 10, 15, 20, 30, 40];
              const stepIndex = timeSteps.findIndex((t) => t >= data.timeScore) === -1 ? timeSteps.length - 1 : timeSteps.findIndex((t) => t >= data.timeScore);
              const displayHours = data.timeScore;
              const timeLabel = displayHours <= 2 ? "Perfekt för balkonglådor och krukor – varje stund räknas!" : displayHours <= 5 ? "Några timmar ger mycket – vi hjälper dig prioritera." : displayHours <= 10 ? "Bra utrymme – du kan ha en fin liten köksträdgård." : displayHours <= 20 ? "Du kan odla på riktigt – köksträdgård med variation!" : "Wow, nästan heltid! Du kan bygga något fantastiskt.";
              return (
                <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Hur mycket tid har du för odling i veckan?</p>
                  <div className="space-y-2">
                    <input
                      type="range" min={1} max={40} step={1} value={data.timeScore}
                      onChange={(e) => update({ timeScore: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>⏱️ 1h</span>
                      <span className="text-base font-medium text-foreground">{displayHours}h / vecka</span>
                      <span>🌻 40h</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{timeLabel}</p>
                </div>
              );
            })()}

            {/* Result vs Joy */}
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Vad är viktigast för dig?</p>
              <div className="space-y-2">
                <input
                  type="range" min={0} max={100} value={data.resultVsJoyScore}
                  onChange={(e) => update({ resultVsJoyScore: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={cn(data.resultVsJoyScore < 40 && "text-foreground font-medium")}>🧘 Glädjen i att påta</span>
                  <span className={cn(data.resultVsJoyScore > 60 && "text-foreground font-medium")}>🥕 Resultatet på tallriken</span>
                </div>
              </div>
            </div>

            {/* Philosophical reflection */}
            <div className="rounded-2xl bg-accent/60 border border-primary/20 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{reflection.emoji}</span>
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  {reflection.text}
                </p>
              </div>
            </div>
          </div>

          <Button variant="growmate" size="lg" className="w-full" onClick={() => setStep(3)}>
            Nästa
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Zone
  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      <div className="max-w-md w-full mx-auto space-y-5 animate-fade-in">
        <BackButton onClick={() => setStep(2)} />
        <StepIndicator current={2} />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display text-foreground">Var odlar du?</h2>
          <p className="text-muted-foreground text-sm">Vi föreslår en odlingszon baserat på var du bor</p>
        </div>

        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder="Skriv din stad, t.ex. Stockholm" value={data.location}
            onChange={(e) => { update({ location: e.target.value }); setManualZone(false); }}
            className="w-full rounded-full border border-input bg-background pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body"
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-fade-in">
              <p className="text-xs text-muted-foreground px-4 pt-2 pb-1">Menade du:</p>
              {locationSuggestions.map((city) => (
                <button key={city} onClick={() => { update({ location: city.charAt(0).toUpperCase() + city.slice(1) }); setManualZone(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="capitalize">{city}</span>
                  <span className="text-xs text-muted-foreground ml-auto">Zon {LOCATION_ZONES[city].zone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {suggestedZone && !manualZone && (
          <div className="rounded-2xl bg-accent/60 border border-primary/20 p-4 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-bold text-sm">{suggestedZone.zone}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Vi föreslår Zon {suggestedZone.zone}</p>
                <p className="text-sm text-muted-foreground">{suggestedZone.desc}</p>
              </div>
            </div>
            <Button variant="growmate" size="sm" className="w-full" onClick={() => update({ zone: suggestedZone.zone })}>
              {data.zone === suggestedZone.zone ? "✓ Vald" : "Välj Zon " + suggestedZone.zone}
            </Button>
          </div>
        )}

        {data.location.trim() && !suggestedZone && !manualZone && (
          <div className="rounded-2xl bg-card border border-border p-4 text-center space-y-2 animate-fade-in">
            <p className="text-sm text-muted-foreground">Vi hittade inte din stad – men du kan välja zon manuellt nedan.</p>
          </div>
        )}

        <div className="rounded-2xl bg-secondary/50 border border-border p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground text-sm mb-1">Om mikroklimat</p>
              <p>Odlingszonerna är en guide – ditt faktiska klimat kan skilja sig. Stadsmiljöer, sydvända lägen och kustnära platser kan vara varmare. Högt belägna eller vindexponerade platser kan vara kallare.</p>
            </div>
          </div>
          {!manualZone && (
            <button onClick={() => setManualZone(true)} className="text-xs font-medium text-primary hover:underline">
              Jag vill välja zon manuellt →
            </button>
          )}
        </div>

        {(manualZone || (!suggestedZone && data.location.trim())) && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-foreground">Välj din zon:</p>
            <div className="grid grid-cols-4 gap-2">
              {zones.map((z) => (
                <button key={z} onClick={() => update({ zone: z })}
                  className={cn("py-3 rounded-xl font-medium text-sm border-2 transition-all", data.zone === z ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40")}>
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

        <Button variant="growmate" size="lg" className="w-full" onClick={() => data.zone && onComplete(data)} disabled={!data.zone}>
          Starta min odling 🌱
        </Button>
      </div>
    </div>
  );
}
