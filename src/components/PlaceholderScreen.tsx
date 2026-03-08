import { Leaf } from "lucide-react";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  emoji: string;
}

export function PlaceholderScreen({ title, description, emoji }: PlaceholderScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24">
      <div className="text-center space-y-4 animate-fade-in">
        <span className="text-5xl">{emoji}</span>
        <h2 className="text-xl font-display text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
      </div>
    </div>
  );
}
