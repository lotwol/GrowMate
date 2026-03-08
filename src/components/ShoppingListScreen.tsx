import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Share2, Trash2, ShoppingCart, Plus, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useShoppingItems, type ShoppingItem } from "@/hooks/useShoppingList";
import { SEED_SHOPS, getShopSearchUrl } from "@/data/seedShops";

const CHECKED_KEY = (year: number) => `growmate_shopping_${year}`;
const CUSTOM_KEY = (year: number) => `growmate_custom_shopping_${year}`;

interface CustomItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ShoppingListScreenProps {
  onBack: () => void;
}

export function ShoppingListScreen({ onBack }: ShoppingListScreenProps) {
  const year = new Date().getFullYear();
  const { urgent, later, seedChecks, suggestions, inStock } = useShoppingItems(year);

  // Checked state (existing key preserved)
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(CHECKED_KEY(year));
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Custom items
  const [customItems, setCustomItems] = useState<CustomItem[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_KEY(year));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newItemText, setNewItemText] = useState("");
  const [shopSheetCrop, setShopSheetCrop] = useState<string | null>(null);
  const [inStockExpanded, setInStockExpanded] = useState(false);

  useEffect(() => {
    localStorage.setItem(CHECKED_KEY(year), JSON.stringify([...checked]));
  }, [checked, year]);

  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY(year), JSON.stringify(customItems));
  }, [customItems, year]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustomItem = () => {
    const text = newItemText.trim();
    if (!text) return;
    setCustomItems((prev) => [...prev, { id: `custom-${Date.now()}`, text, checked: false }]);
    setNewItemText("");
  };

  const toggleCustom = (id: string) => {
    setCustomItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const removeCustom = (id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearChecked = () => {
    setChecked(new Set());
    setCustomItems((prev) => prev.map((i) => ({ ...i, checked: false })));
  };

  const allItems = useMemo(() => [...urgent, ...later, ...seedChecks, ...suggestions], [urgent, later, seedChecks, suggestions]);
  const checkedCount = allItems.filter((i) => checked.has(i.id)).length + customItems.filter((i) => i.checked).length;

  const toBuyCount = urgent.length + later.length + seedChecks.length + suggestions.length;
  const customCount = customItems.length;

  // Share
  const handleShare = async () => {
    let text = `🛒 Min odlingsinköpslista – GrowMate ${year}\n\n`;

    const uncheckedUrgent = urgent.filter((i) => !checked.has(i.id));
    if (uncheckedUrgent.length > 0) {
      text += `🔴 Behövs snart:\n${uncheckedUrgent.map((i) => `- ${i.emoji} ${i.name}${i.sowDate ? ` (${i.sowDate})` : ""}`).join("\n")}\n\n`;
    }

    const uncheckedLater = later.filter((i) => !checked.has(i.id));
    if (uncheckedLater.length > 0) {
      text += `🟡 Senare:\n${uncheckedLater.map((i) => `- ${i.emoji} ${i.name}`).join("\n")}\n\n`;
    }

    const uncheckedSupplies = suggestions.filter((i) => !checked.has(i.id));
    if (uncheckedSupplies.length > 0) {
      text += `🛒 Tillbehör:\n${uncheckedSupplies.map((i) => `- ${i.emoji} ${i.name}`).join("\n")}\n\n`;
    }

    const uncheckedCustom = customItems.filter((i) => !i.checked);
    if (uncheckedCustom.length > 0) {
      text += `📝 Övrigt:\n${uncheckedCustom.map((i) => `- ${i.text}`).join("\n")}\n\n`;
    }

    if (inStock.length > 0) {
      text += `✅ I lager:\n${inStock.map((i) => `- ${i.name}`).join("\n")}`;
    }

    if (navigator.share) {
      try { await navigator.share({ text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const isEmpty = toBuyCount === 0 && customCount === 0 && inStock.length === 0;

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
        {/* Summary bar */}
        {!isEmpty && (
          <div className="rounded-xl bg-muted/50 border border-border px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>
              <strong className="text-foreground">{toBuyCount}</strong> att köpa
              {inStock.length > 0 && <> · <strong className="text-foreground">{inStock.length}</strong> i lager</>}
              {customCount > 0 && <> · <strong className="text-foreground">{customCount}</strong> egna</>}
            </span>
          </div>
        )}

        {/* Section 1: Urgent */}
        {urgent.length > 0 && (
          <Section title="🔴 Behövs inom 3 veckor">
            {urgent.map((item) => (
              <SeedBuyItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} onShop={() => setShopSheetCrop(item.cropName || item.name)} />
            ))}
          </Section>
        )}

        {/* Section 2: Later */}
        {later.length > 0 && (
          <Section title="🟡 Senare i säsongen">
            {later.map((item) => (
              <SeedBuyItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} onShop={() => setShopSheetCrop(item.cropName || item.name)} />
            ))}
          </Section>
        )}

        {/* Section 3: Seed checks */}
        {seedChecks.length > 0 && (
          <Section title="⏰ Kontrollera frölager">
            {seedChecks.map((item) => (
              <SeedBuyItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} onShop={() => setShopSheetCrop(item.cropName || item.name)} />
            ))}
          </Section>
        )}

        {/* Section 4: Supplies */}
        {suggestions.length > 0 && (
          <Section title="🛒 Tillbehör & förnödenheter">
            {suggestions.map((item) => (
              <CheckItem key={item.id} item={item} checked={checked.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </Section>
        )}

        {/* Section 5: Custom items */}
        <Section title="📝 Egna varor">
          {customItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <button
                onClick={() => toggleCustom(item.id)}
                className={cn(
                  "flex-1 flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                  item.checked ? "bg-muted/50 border-border opacity-60" : "bg-card border-border hover:border-primary/30"
                )}
              >
                <Checkbox checked={item.checked} />
                <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>{item.text}</span>
              </button>
              <button onClick={() => removeCustom(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => { e.preventDefault(); addCustomItem(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="T.ex. ny hacka, blomkrukor, gödning..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" variant="growmate" size="icon" className="shrink-0 h-10 w-10" disabled={!newItemText.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </Section>

        {/* Section 6: In stock (collapsible) */}
        {inStock.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setInStockExpanded((v) => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <h2 className="font-display text-foreground text-sm flex-1">✅ I lager ({inStock.length})</h2>
              {inStockExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {inStockExpanded && (
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 space-y-2 animate-fade-in">
                {inStock.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
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

      {/* Shop sheet */}
      <Sheet open={!!shopSheetCrop} onOpenChange={(v) => { if (!v) setShopSheetCrop(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg">Köp frön till {shopSheetCrop}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 pt-2">
            {SEED_SHOPS.map((shop) => (
              <a
                key={shop.id}
                href={getShopSearchUrl(shop.id, shopSheetCrop || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <span className="text-2xl">{shop.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{shop.name}</p>
                  <p className="text-xs text-muted-foreground">{shop.note}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            ))}
            <p className="text-[11px] text-muted-foreground text-center pt-2">
              GrowMate tjänar inget på dessa länkar – vi visar butiker vi tror på.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// --- Sub-components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-foreground text-sm">{title}</h2>
      {children}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={cn(
      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
      checked ? "bg-primary border-primary" : "border-muted-foreground/30"
    )}>
      {checked && <span className="text-primary-foreground text-xs">✓</span>}
    </div>
  );
}

function CheckItem({ item, checked, onToggle }: { item: ShoppingItem; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        checked ? "bg-muted/50 border-border opacity-60" : "bg-card border-border hover:border-primary/30"
      )}
    >
      <Checkbox checked={checked} />
      <span className="text-sm shrink-0">{item.emoji}</span>
      <span className={cn("text-sm flex-1", checked && "line-through text-muted-foreground")}>{item.name}</span>
    </button>
  );
}

function SeedBuyItem({ item, checked, onToggle, onShop }: { item: ShoppingItem; checked: boolean; onToggle: () => void; onShop: () => void }) {
  return (
    <div className={cn(
      "rounded-xl border p-3 transition-all space-y-2",
      checked ? "bg-muted/50 border-border opacity-60" : "bg-card border-border"
    )}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
        <Checkbox checked={checked} />
        <span className="text-lg shrink-0">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", checked && "line-through text-muted-foreground")}>{item.name}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {item.sowDate && <span className="text-xs text-muted-foreground">{item.sowDate}</span>}
            {item.reason && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{item.reason}</span>
            )}
          </div>
        </div>
      </button>
      {!checked && (
        <button
          onClick={onShop}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors ml-8"
        >
          Hitta frön 🛒
        </button>
      )}
    </div>
  );
}
