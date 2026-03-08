import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { findRecipes, type Recipe } from "@/data/harvestRecipes";
import type { GrowingSchool } from "@/types/onboarding";

function getSubtitle(school: GrowingSchool | string | null): string {
  switch (school) {
    case "naturens-vag":
      return "Naturen har gett dig en gåva – smaka på det!";
    case "precisionsodlaren":
      return "Skördad! Logga mängd och datum för din statistik.";
    case "hackaren":
      return "Boom! Minimal insats, maximal skörd.";
    case "traditionalisten":
      return "En fin skörd – farmor hade blivit nöjd.";
    default:
      return "Grattis till skörden! Dags att njuta.";
  }
}

const DIFFICULTY_LABEL: Record<string, string> = {
  "🟢": "Lätt",
  "🟡": "Medel",
  "🔴": "Avancerad",
};

// CSS confetti using pseudo-elements
function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.2 + Math.random() * 1,
      color: ["hsl(var(--primary))", "hsl(var(--growmate-sun))", "hsl(var(--growmate-leaf-light))", "hsl(30 80% 55%)", "hsl(280 60% 60%)"][i % 5],
      size: 4 + Math.random() * 4,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="rounded-xl bg-accent/50 border border-border p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{recipe.name}</p>
        <span className="text-xs text-muted-foreground">{recipe.difficulty} {recipe.time}</span>
      </div>
      <p className="text-xs text-muted-foreground">{recipe.description}</p>
    </div>
  );
}

interface HarvestCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  cropName: string;
  cropEmoji?: string;
  school: GrowingSchool | string | null;
  onLogDiary: () => void;
}

export function HarvestCelebrationModal({
  open,
  onClose,
  cropName,
  cropEmoji,
  school,
  onLogDiary,
}: HarvestCelebrationModalProps) {
  const recipes = findRecipes(cropName);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl overflow-hidden">
        {showConfetti && <Confetti />}
        <DialogHeader className="text-center relative z-20">
          <div className="text-5xl mb-1 text-center">{cropEmoji || "🎉"}</div>
          <DialogTitle className="text-center">🎉 {cropName} skördat!</DialogTitle>
          <DialogDescription className="text-center">
            {getSubtitle(school)}
          </DialogDescription>
        </DialogHeader>

        {recipes && recipes.length > 0 && (
          <div className="space-y-2 relative z-20">
            <p className="text-xs font-medium text-muted-foreground">🍽️ Receptinspiration</p>
            {recipes.map((r) => (
              <RecipeCard key={r.name} recipe={r} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1 relative z-20">
          <Button variant="growmate" onClick={onLogDiary}>
            📓 Logga i dagboken
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Standalone recipe list for use in SeasonSummary etc. */
export function RecipeList({ cropName }: { cropName: string }) {
  const recipes = findRecipes(cropName);
  if (!recipes) return null;
  return (
    <div className="space-y-2">
      {recipes.map((r) => (
        <RecipeCard key={r.name} recipe={r} />
      ))}
    </div>
  );
}
