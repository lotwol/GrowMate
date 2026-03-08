import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Leaf, Package, Sprout, Trash2, Pencil, ChevronLeft, ChevronRight, Map, Star, Camera, Flower2, X, AlertTriangle } from "lucide-react";
import { findCompanionData, findBadNeighbors } from "@/data/companionPlanting";
import { useGardens, useAllCrops, useSeedInventory, useAddGarden, useAddCrop, useUpdateCrop, useUpdateCropStatus, useDeleteCrop, useDeleteGarden, useAddSeed, useGardenLayout } from "@/hooks/useGarden";
import { AddGardenForm, GARDEN_TYPES } from "@/components/garden/AddGardenForm";
import { AddCropForm } from "@/components/garden/AddCropForm";
import { AddSeedForm } from "@/components/garden/AddSeedForm";
import { EditCropForm } from "@/components/garden/EditCropForm";
import { GardenLayoutEditor } from "@/components/garden/GardenLayoutEditor";
import { PhotoStrip } from "@/components/PhotoStrip";
import type { Database } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "ytor" | "grödor" | "frön";

const GARDEN_TYPE_EMOJI: Record<string, string> = {
  friland: "🌾", balkong: "🏙️", växthus: "🏡", pallkrage: "📦", kruka: "🪴",
};

const CATEGORY_EMOJI: Record<string, string> = {
  grönsak: "🥕", ört: "🌿", frukt: "🍎", bär: "🫐", blomma: "🌸",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planerad: { label: "Planerad", color: "bg-muted text-muted-foreground" },
  sådd: { label: "Sådd", color: "bg-growmate-sun/20 text-foreground" },
  grodd: { label: "Grodd", color: "bg-growmate-leaf-light text-foreground" },
  utplanterad: { label: "Utplanterad", color: "bg-primary/20 text-foreground" },
  skördad: { label: "Skördad", color: "bg-primary text-primary-foreground" },
  misslyckad: { label: "Misslyckad", color: "bg-destructive/20 text-destructive" },
};

// Harvest contribution inline card
function HarvestContribution({
  crop,
  zone,
  gardenType,
  onDone,
}: {
  crop: any;
  zone: string;
  gardenType?: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleShare = async () => {
    setSubmitting(true);
    try {
      await supabase.from("community_growing_data" as any).insert({
        crop_name: crop.name,
        zone,
        season_year: crop.season_year || new Date().getFullYear(),
        sow_date: crop.sow_date || null,
        harvest_date: new Date().toISOString().split("T")[0],
        success_rating: rating || null,
        garden_type: gardenType || null,
        notes_public: note.trim() || null,
      } as any);
      toast.success("Tack! Din data hjälper svenska odlare 🌱");
    } catch {
      // silent fail
    }
    onDone();
  };

  return (
    <div className="rounded-xl bg-accent/50 border border-border p-3 space-y-3 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-foreground">Bra jobbat! 🌟 Hjälp andra svenska odlare?</p>
        <p className="text-xs text-muted-foreground">Din anonyma data hjälper GrowMate lära sig vad som funkar i ditt klimat.</p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Hur gick säsongen?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              className={cn("text-lg transition-transform", v <= rating ? "scale-110" : "opacity-40")}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        maxLength={140}
        placeholder="Något du vill dela? (visas anonymt)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex gap-2">
        <Button variant="growmate" size="sm" onClick={handleShare} disabled={submitting}>
          Dela anonymt
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Hoppa över
        </Button>
      </div>
    </div>
  );
}

interface GardenScreenProps {
  zone?: string | null;
  school?: string | null;
}

export function GardenScreen({ zone, school }: GardenScreenProps) {
  const [tab, setTab] = useState<Tab>("ytor");
  const [showAddGarden, setShowAddGarden] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showAddSeed, setShowAddSeed] = useState(false);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [layoutGardenId, setLayoutGardenId] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [contributingCropId, setContributingCropId] = useState<string | null>(null);
  const [dismissedContributions, setDismissedContributions] = useState<Set<string>>(new Set());
  const [photoCropId, setPhotoCropId] = useState<string | null>(null);
  const [companionCropId, setCompanionCropId] = useState<string | null>(null);

  const allCropNames = useMemo(() => crops.map((c: any) => c.name as string), [crops]);

  const { data: gardens = [], isLoading: gardensLoading } = useGardens();
  const { data: crops = [], isLoading: cropsLoading } = useAllCrops(seasonYear);
  const { data: seeds = [], isLoading: seedsLoading } = useSeedInventory();

  const layoutGarden = gardens.find(g => g.id === layoutGardenId);
  const { data: currentLayout } = useGardenLayout(layoutGardenId, seasonYear);

  const addGarden = useAddGarden();
  const addCrop = useAddCrop();
  const addSeed = useAddSeed();
  const updateCrop = useUpdateCrop();
  const updateStatus = useUpdateCropStatus();
  const deleteCrop = useDeleteCrop();
  const deleteGarden = useDeleteGarden();

  const tabs: { id: Tab; label: string; icon: typeof Leaf; count: number }[] = [
    { id: "ytor", label: "Ytor", icon: Sprout, count: gardens.length },
    { id: "grödor", label: "Grödor", icon: Leaf, count: crops.length },
    { id: "frön", label: "Frön", icon: Package, count: seeds.length },
  ];

  const statuses = Constants.public.Enums.crop_status;

  const handleStatusChange = (cropId: string, status: string) => {
    updateStatus.mutate(
      { id: cropId, status: status as any },
      {
        onSuccess: () => {
          if (status === "skördad" && zone && !dismissedContributions.has(cropId)) {
            setContributingCropId(cropId);
          }
        },
      }
    );
  };

  const dismissContribution = (cropId: string) => {
    setDismissedContributions((prev) => new Set(prev).add(cropId));
    setContributingCropId(null);
  };

  // Layout editor view
  if (layoutGardenId && layoutGarden) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-6">
        <div className="max-w-md mx-auto">
          <GardenLayoutEditor
            gardenId={layoutGardenId}
            gardenName={layoutGarden.name}
            seasonYear={seasonYear}
            layout={currentLayout || null}
            crops={crops as any}
            onClose={() => setLayoutGardenId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with year selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-display text-foreground">Min Odling 🌱</h1>
          <div className="flex items-center gap-1 bg-muted rounded-lg px-1 py-0.5">
            <button onClick={() => setSeasonYear(y => y - 1)} className="p-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground px-1 min-w-[3rem] text-center">{seasonYear}</span>
            <button onClick={() => setSeasonYear(y => y + 1)} className="p-1 text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", tab === t.id ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground")}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ytor tab */}
        {tab === "ytor" && (
          <div className="space-y-3">
            {showAddGarden ? (
              <AddGardenForm
                onSubmit={(g) => { addGarden.mutate(g, { onSuccess: () => setShowAddGarden(false) }); }}
                onCancel={() => setShowAddGarden(false)}
                isLoading={addGarden.isPending}
              />
            ) : (
              <Button variant="growmate-outline" className="w-full" onClick={() => setShowAddGarden(true)}>
                <Plus className="w-4 h-4 mr-1" /> Lägg till odlingsyta
              </Button>
            )}

            {gardensLoading && <p className="text-center text-muted-foreground text-sm py-8">Laddar...</p>}

            {!gardensLoading && gardens.length === 0 && !showAddGarden && (
              <div className="text-center py-12 space-y-2">
                <span className="text-4xl">🌾</span>
                <p className="text-muted-foreground text-sm">Inga odlingsytor ännu. Lägg till din första!</p>
              </div>
            )}

            {gardens.map((garden) => {
              const gardenCrops = crops.filter((c: any) => c.garden_id === garden.id);
              return (
                <div key={garden.id} className="rounded-2xl bg-card border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {Array.isArray(garden.type)
                          ? garden.type.map((t) => GARDEN_TYPE_EMOJI[t] || "🌱").join("")
                          : GARDEN_TYPE_EMOJI[garden.type as string] || "🌱"}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{garden.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {Array.isArray(garden.type) ? garden.type.join(", ") : garden.type}{garden.size_sqm ? ` · ${garden.size_sqm} m²` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setLayoutGardenId(garden.id)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Visa layout">
                        <Map className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteGarden.mutate(garden.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {garden.notes && <p className="text-xs text-muted-foreground italic">{garden.notes}</p>}
                  {gardenCrops.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {gardenCrops.map((c: any) => (
                        <span key={c.id} className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                          {(c as any).emoji || CATEGORY_EMOJI[c.category] || "🌱"} {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Grödor tab */}
        {tab === "grödor" && (
          <div className="space-y-3">
            {showAddCrop ? (
              <AddCropForm
                gardens={gardens}
                zone={zone}
                school={school}
                onSubmit={(c) => { addCrop.mutate({ ...c, season_year: seasonYear }, { onSuccess: () => setShowAddCrop(false) }); }}
                onCancel={() => setShowAddCrop(false)}
                isLoading={addCrop.isPending}
              />
            ) : (
              <Button variant="growmate-outline" className="w-full" onClick={() => setShowAddCrop(true)}>
                <Plus className="w-4 h-4 mr-1" /> Lägg till gröda
              </Button>
            )}

            {cropsLoading && <p className="text-center text-muted-foreground text-sm py-8">Laddar...</p>}

            {!cropsLoading && crops.length === 0 && !showAddCrop && (
              <div className="text-center py-12 space-y-2">
                <span className="text-4xl">🌱</span>
                <p className="text-muted-foreground text-sm">Inga grödor för {seasonYear}. Lägg till din första!</p>
              </div>
            )}

            {crops.map((crop: any) => {
              if (editingCropId === crop.id) {
                return (
                  <EditCropForm
                    key={crop.id}
                    crop={crop}
                    gardens={gardens}
                    onSave={(updates) => {
                      updateCrop.mutate(updates as any, { onSuccess: () => setEditingCropId(null) });
                    }}
                    onCancel={() => setEditingCropId(null)}
                    isLoading={updateCrop.isPending}
                  />
                );
              }

              const statusConf = STATUS_CONFIG[crop.status] || STATUS_CONFIG.planerad;
              const cropGarden = gardens.find((g) => g.id === crop.garden_id);
              const gardenType = cropGarden?.type
                ? (Array.isArray(cropGarden.type) ? cropGarden.type[0] : cropGarden.type)
                : undefined;

              return (
                <div key={crop.id} className="space-y-2">
                  <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Most recent photo thumbnail */}
                        {(crop as any).photo_urls?.length > 0 ? (
                          <img
                            src={(crop as any).photo_urls[(crop as any).photo_urls.length - 1]}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-xl">{(crop as any).emoji || CATEGORY_EMOJI[crop.category] || "🌱"}</span>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{crop.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {crop.gardens?.name || "Ingen yta"}
                            {crop.sow_date ? ` · Sådd ${crop.sow_date}` : ""}
                            {crop.cost ? ` · ${crop.cost} kr` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPhotoCropId(photoCropId === crop.id ? null : crop.id)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                          <Camera className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCropId(crop.id)} className="text-muted-foreground hover:text-primary transition-colors p-1">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCrop.mutate(crop.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {statuses.map((s) => {
                        const conf = STATUS_CONFIG[s] || STATUS_CONFIG.planerad;
                        return (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(crop.id, s)}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border transition-all",
                              crop.status === s
                                ? `${conf.color} border-transparent font-medium`
                                : "border-border text-muted-foreground hover:border-primary/30"
                            )}
                          >
                            {conf.label}
                          </button>
                        );
                      })}
                    </div>

                    {crop.notes && <p className="text-xs text-muted-foreground italic">{crop.notes}</p>}

                    {/* Companion planting badge */}
                    {crops.length >= 2 && findCompanionData(crop.name) && (
                      <button
                        onClick={() => setCompanionCropId(companionCropId === crop.id ? null : crop.id)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                      >
                        <Flower2 className="w-3 h-3" /> Grannar 🌿
                      </button>
                    )}

                    {/* Companion planting sheet */}
                    {companionCropId === crop.id && (() => {
                      const data = findCompanionData(crop.name);
                      if (!data) return null;
                      const badWithExisting = data.avoid.filter((a) =>
                        allCropNames.some((n) => n !== crop.name && n.toLowerCase().includes(a.toLowerCase()))
                      );
                      return (
                        <div className="rounded-xl bg-card border border-border p-3 space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">Bra grannar till {crop.name}</p>
                            <button onClick={() => setCompanionCropId(null)} className="text-muted-foreground hover:text-foreground">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {badWithExisting.length > 0 && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              <p className="text-xs text-destructive">
                                Du har {badWithExisting.join(", ")} nära {crop.name} – de trivs inte ihop
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">✅ Bra grannar</p>
                            <div className="flex flex-wrap gap-1">
                              {data.good.map((g) => (
                                <span key={g} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">🌱 {g}</span>
                              ))}
                            </div>
                          </div>
                          {data.avoid.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">❌ Undvik</p>
                              <div className="flex flex-wrap gap-1">
                                {data.avoid.map((a) => (
                                  <span key={a} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">⚠️ {a}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Inline photo strip for this crop */}
                    {photoCropId === crop.id && (
                      <PhotoStrip
                        photos={(crop as any).photo_urls || []}
                        onPhotosChange={(urls) => {
                          updateCrop.mutate({ id: crop.id, photo_urls: urls } as any);
                        }}
                        storagePath={`crops/${crop.id}`}
                      />
                    )}
                  </div>

                  {/* Harvest contribution card */}
                  {contributingCropId === crop.id && zone && (
                    <HarvestContribution
                      crop={crop}
                      zone={zone}
                      gardenType={gardenType}
                      onDone={() => dismissContribution(crop.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Frön tab */}
        {tab === "frön" && (
          <div className="space-y-3">
            {showAddSeed ? (
              <AddSeedForm
                onSubmit={(s) => { addSeed.mutate(s, { onSuccess: () => setShowAddSeed(false) }); }}
                onCancel={() => setShowAddSeed(false)}
                isLoading={addSeed.isPending}
              />
            ) : (
              <Button variant="growmate-outline" className="w-full" onClick={() => setShowAddSeed(true)}>
                <Plus className="w-4 h-4 mr-1" /> Lägg till frö
              </Button>
            )}

            {seedsLoading && <p className="text-center text-muted-foreground text-sm py-8">Laddar...</p>}

            {!seedsLoading && seeds.length === 0 && !showAddSeed && (
              <div className="text-center py-12 space-y-2">
                <span className="text-4xl">🌰</span>
                <p className="text-muted-foreground text-sm">Inget i fröinventariet ännu.</p>
              </div>
            )}

            {seeds.map((seed) => (
              <div key={seed.id} className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CATEGORY_EMOJI[seed.category] || "🌱"}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{seed.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {seed.quantity || "–"}{seed.purchased_from ? ` · från ${seed.purchased_from}` : ""}{seed.cost ? ` · ${seed.cost} kr` : ""}
                    </p>
                    {seed.best_before && (
                      <p className="text-xs text-muted-foreground">Bäst före: {seed.best_before}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
