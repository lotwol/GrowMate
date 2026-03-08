import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Share2, Trash2, ShoppingCart } from "lucide-react";
import { useShoppingItems } from "@/hooks/useShoppingList";

const STORAGE_KEY = (year: number) => `growmate_shopping_${year}`;

interface ShoppingListScreenProps {
  onBack: () => void;
}

export function ShoppingListScreen({ onBack }: ShoppingListScreenProps) {
  const year = new Date().getFullYear();
  const { toBuy, suggestions, inStock } = useShoppingItems(year);

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(year));
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY(year), JSON.stringify([...checked]));
  }, [checked, year]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearChecked = () => setChecked(new Set());

  const allItems = useMemo(() => [...toBuy, ...suggestions], [toBuy, suggestions]);

  const handleShare = async () => {
    const uncheckedBuy = toBuy.filter((i) => !checked.has(i.id));
    const uncheckedSugg = suggestions.filter((i) => !checked.has(i.id));

    let text = `🛒 Min odlingsinköpslista – GrowMate\n\n`;
    if (uncheckedBuy.length > 0) {
      text += `Frön att köpa:\n${uncheckedBuy.map((i) => `- ${i.emoji} ${i.name}`).join("\n")}\n\n`;
    }
    if (uncheckedSugg.length > 0) {
      text += `Övrigt:\n${uncheckedSugg.map((i) => `- ${i.emoji} ${i.name}`).join("\n")}\n\n`;
    }
    if (inStock.length > 0) {
      text += `Redan hemma:\n${inStock.map((i) => `- ${i.name}`).join("\n")}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const checkedCount = allItems.filter((i) => checked.has(i.id)).length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-foreground flex-1">Inköpslista 🛒</h1>
        <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 space-y-6 mt-4 max-w-md mx-auto">
        {/* Section 1: Seeds to buy */}
        {toBuy.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display text-foreground text-sm">Frön att köpa</h2>
            {toBuy.map((item) => (
              <CheckItem
                key={item.id}
                item={item}
                checked={checked.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        )}

        {/* Section 2: Supplies */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display text-foreground text-sm">Såddsatser & tillbehör</h2>
            {suggestions.map((item) => (
              <CheckItem
                key={item.id}
                item={item}
                checked={checked.has(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
        )}

        {/* Section 3: In stock */}
        {inStock.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display text-foreground text-sm">Du har redan hemma</h2>
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 space-y-2">
              {inStock.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-primary">✅</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {toBuy.length === 0 && suggestions.length === 0 && inStock.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Lägg till planerade grödor i Min Odling för att generera en inköpslista.
            </p>
          </div>
        )}

        {/* Clear checked */}
        {checkedCount > 0 && (
          <Button variant="growmate-outline" size="sm" className="w-full" onClick={clearChecked}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Rensa klara ({checkedCount})
          </Button>
        )}
      </div>
    </div>
  );
}

function CheckItem({
  item,
  checked,
  onToggle,
}: {
  item: { id: string; emoji: string; name: string };
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        checked
          ? "bg-muted/50 border-border opacity-60"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
          checked ? "bg-primary border-primary" : "border-muted-foreground/30"
        )}
      >
        {checked && <span className="text-primary-foreground text-xs">✓</span>}
      </div>
      <span className="text-sm shrink-0">{item.emoji}</span>
      <span className={cn("text-sm flex-1", checked && "line-through text-muted-foreground")}>
        {item.name}
      </span>
    </button>
  );
}
