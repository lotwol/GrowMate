import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const CROP_EMOJIS = [
  // Grönsaker
  "🥕", "🍅", "🥒", "🌽", "🥬", "🥦", "🧅", "🧄", "🥔", "🫑", "🌶️", "🍆", "🫛",
  // Frukt
  "🍎", "🍐", "🍊", "🍋", "🍇", "🍓", "🍒", "🍑", "🥝", "🍌", "🫐", "🥭",
  // Örter & blommor
  "🌿", "🌱", "🍃", "☘️", "🌸", "🌻", "🌺", "🌷", "🌹", "💐", "🪻", "🪴",
  // Bär
  "🫐", "🍇", "🍓", "🍒",
];

// Deduplicate
const UNIQUE_EMOJIS = [...new Set(CROP_EMOJIS)];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md";
}

export function EmojiPicker({ value, onChange, size = "md" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-xl border border-input bg-background hover:border-primary/40 transition-colors flex items-center justify-center",
            size === "sm" ? "w-8 h-8 text-lg" : "w-10 h-10 text-xl"
          )}
          title="Välj emoji"
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="text-xs text-muted-foreground mb-2 px-1">Välj ikon för din gröda</p>
        <div className="grid grid-cols-8 gap-1">
          {UNIQUE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onChange(emoji); setOpen(false); }}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-md text-base hover:bg-accent transition-colors",
                value === emoji && "bg-primary/20 ring-1 ring-primary"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
