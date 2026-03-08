import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { Plus, Send, X, Sprout, MapPin, Calendar, Package, MessageCircle } from "lucide-react";
import {
  useSeedShares,
  useMyShares,
  useCreateSeedShare,
  useExpressSeedInterest,
  useUpdateSeedShareStatus,
  type SeedShare,
} from "@/hooks/useSeedShares";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const CROP_EMOJIS: Record<string, string> = {
  tomat: "🍅", morot: "🥕", sallat: "🥬", gurka: "🥒", potatis: "🥔",
  lök: "🧅", vitlök: "🧄", paprika: "🫑", squash: "🎃", pumpa: "🎃",
  böna: "🫘", ärta: "🫛", majs: "🌽", jordgubbe: "🍓", hallon: "🫐",
  blåbär: "🫐", dill: "🌿", basilika: "🌿", persilja: "🌿", solros: "🌻",
};

function getCropEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CROP_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🌱";
}

interface FrobyteTabProps {
  zone?: string | null;
}

export function FrobyteTab({ zone }: FrobyteTabProps) {
  const { user } = useAuth();
  const [zoneFilter, setZoneFilter] = useState<string | null>(zone || null);
  const { shares, loading, reload } = useSeedShares(zoneFilter);
  const { shares: myShares, reload: reloadMine } = useMyShares();
  const { create, submitting: creating } = useCreateSeedShare();
  const { express, submitting: expressing } = useExpressSeedInterest();
  const { update, submitting: updating } = useUpdateSeedShareStatus();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showInterestSheet, setShowInterestSheet] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState("");

  // Create form state
  const [cropName, setCropName] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [harvestYear, setHarvestYear] = useState(new Date().getFullYear());
  const [notes, setNotes] = useState("");

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (cropName.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from("swedish_crop_tips")
        .select("crop_name")
        .ilike("crop_name", `%${cropName}%`)
        .limit(6);
      const unique = [...new Set((data || []).map((d) => d.crop_name))];
      setSuggestions(unique);
      setShowSuggestions(unique.length > 0);
    };
    fetchSuggestions();
  }, [cropName]);

  const handleCreate = async () => {
    if (!cropName.trim() || !zone) return;
    const ok = await create({
      crop_name: cropName.trim(),
      variety: variety.trim() || undefined,
      zone,
      quantity_description: quantity.trim() || undefined,
      harvest_year: harvestYear,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setCropName("");
      setVariety("");
      setQuantity("");
      setNotes("");
      setShowCreateSheet(false);
      reload();
      reloadMine();
    }
  };

  const handleInterest = async () => {
    if (!showInterestSheet) return;
    const ok = await express(showInterestSheet, interestMessage.trim() || undefined);
    if (ok) {
      setInterestMessage("");
      setShowInterestSheet(null);
      reload();
    }
  };

  const handleMarkGone = async (id: string) => {
    const ok = await update(id, "gone");
    if (ok) {
      reload();
      reloadMine();
    }
  };

  if (!zone) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <span className="text-2xl">🗺️</span>
        <p className="text-sm text-muted-foreground mt-2">
          Ange din zon i profilen för att använda fröbyte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative pb-20">
      {/* Filter row */}
      <div className="flex gap-2">
        <button
          onClick={() => setZoneFilter(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            !zoneFilter
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          )}
        >
          Alla zoner
        </button>
        <button
          onClick={() => setZoneFilter(zone)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            zoneFilter === zone
              ? "border-primary bg-accent text-accent-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40"
          )}
        >
          Min zon ({zone})
        </button>
      </div>

      {/* My shares */}
      {myShares.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Mina delade frön</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {myShares.map((s) => (
              <div
                key={s.id}
                className="flex-shrink-0 rounded-xl bg-card border border-border px-3 py-2 min-w-[140px] space-y-1"
              >
                <p className="text-sm font-medium text-foreground truncate">
                  {getCropEmoji(s.crop_name)} {s.crop_name}
                </p>
                {(s.interest_count || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                    <MessageCircle className="w-3 h-3" />
                    {s.interest_count} intresserade
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-7 text-destructive hover:text-destructive"
                  onClick={() => handleMarkGone(s.id)}
                  disabled={updating}
                >
                  Markera som slut
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available shares */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      ) : shares.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <span className="text-2xl">🌱</span>
          <p className="text-sm text-muted-foreground mt-2">
            Inga frön att byta just nu {zoneFilter ? `i zon ${zoneFilter}` : ""} – var den första!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shares.map((share) => (
            <SeedShareCard
              key={share.id}
              share={share}
              isOwn={share.user_id === user?.id}
              onInterest={() => setShowInterestSheet(share.id)}
              onRemove={() => handleMarkGone(share.id)}
              updating={updating}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreateSheet(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create sheet */}
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Dela frön 🌱</SheetTitle>
            <SheetDescription>Lägg upp frön du vill dela med andra odlare</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">Gröda *</label>
              <Input
                placeholder="T.ex. Tomat, Morot..."
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onMouseDown={() => {
                        setCropName(s);
                        setShowSuggestions(false);
                      }}
                    >
                      {getCropEmoji(s)} {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sort / Variety (valfritt)</label>
              <Input placeholder="T.ex. San Marzano" value={variety} onChange={(e) => setVariety(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Antal frön</label>
              <Input placeholder="T.ex. ca 30 frön, ett kuvert" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Skördeår</label>
              <div className="flex gap-2">
                {[new Date().getFullYear(), new Date().getFullYear() - 1].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setHarvestYear(y)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      harvestYear === y
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Anteckning (valfritt, max 200 tecken)</label>
              <Textarea
                placeholder="T.ex. 'Bra sort för balkong'"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                rows={2}
                maxLength={200}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{notes.length}/200</p>
            </div>

            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">
                🗺️ Zon {zone} anges automatiskt så att andra odlare i din zon kan hitta dina frön.
              </p>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={handleCreate}
              disabled={!cropName.trim() || creating}
            >
              <Sprout className="w-4 h-4 mr-1.5" />
              {creating ? "Delar..." : "Dela frön"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Interest sheet */}
      <Sheet open={!!showInterestSheet} onOpenChange={(open) => !open && setShowInterestSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Visa intresse ✉️</SheetTitle>
            <SheetDescription>Skriv ett kort meddelande till odlaren (valfritt)</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="T.ex. 'Hej! Jag skulle gärna vilja ha lite frön.'"
              value={interestMessage}
              onChange={(e) => setInterestMessage(e.target.value)}
              rows={3}
            />
            <Button
              variant="default"
              className="w-full"
              onClick={handleInterest}
              disabled={expressing}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {expressing ? "Skickar..." : "Skicka intresse"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SeedShareCard({
  share,
  isOwn,
  onInterest,
  onRemove,
  updating,
}: {
  share: SeedShare;
  isOwn: boolean;
  onInterest: () => void;
  onRemove: () => void;
  updating: boolean;
}) {
  return (
    <div className="rounded-xl bg-card border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {getCropEmoji(share.crop_name)} {share.crop_name}
            {share.variety && <span className="text-muted-foreground font-normal"> · {share.variety}</span>}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              <MapPin className="w-3 h-3" /> Zon {share.zone}
            </span>
            {share.harvest_year && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                <Calendar className="w-3 h-3" /> {share.harvest_year}
              </span>
            )}
            {share.quantity_description && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                <Package className="w-3 h-3" /> {share.quantity_description}
              </span>
            )}
          </div>
        </div>
        {(share.interest_count || 0) > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 flex-shrink-0">
            <MessageCircle className="w-3 h-3" />
            {share.interest_count}
          </span>
        )}
      </div>

      {share.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2">{share.notes}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(share.created_at), { addSuffix: true, locale: sv })}
        </p>
        {isOwn ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={updating}
          >
            Ta bort
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onInterest}>
            Jag är intresserad
          </Button>
        )}
      </div>
    </div>
  );
}
