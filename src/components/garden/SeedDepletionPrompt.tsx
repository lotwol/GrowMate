import { Button } from "@/components/ui/button";

interface SeedDepletionPromptProps {
  seedName: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export function SeedDepletionPrompt({ seedName, onConfirm, onSkip }: SeedDepletionPromptProps) {
  return (
    <div className="rounded-xl bg-accent/50 border border-border p-3 space-y-2 animate-fade-in">
      <p className="text-sm text-foreground">
        🫘 Vill du minska lagret av <span className="font-medium">{seedName}</span> med 1 portion?
      </p>
      <div className="flex gap-2">
        <Button variant="growmate" size="sm" onClick={onConfirm}>
          Ja, minska
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Behåll antal
        </Button>
      </div>
    </div>
  );
}
