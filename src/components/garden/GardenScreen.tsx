import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Leaf, Package, Sprout, Trash2, Pencil, ChevronLeft, ChevronRight, Map } from "lucide-react";
import { useGardens, useAllCrops, useSeedInventory, useAddGarden, useAddCrop, useUpdateCrop, useUpdateCropStatus, useDeleteCrop, useDeleteGarden, useAddSeed, useGardenLayout } from "@/hooks/useGarden";
import { AddGardenForm, GARDEN_TYPES } from "@/components/garden/AddGardenForm";
import { AddCropForm } from "@/components/garden/AddCropForm";
import { AddSeedForm } from "@/components/garden/AddSeedForm";
import { EditCropForm } from "@/components/garden/EditCropForm";
import { GardenLayoutEditor } from "@/components/garden/GardenLayoutEditor";
import type { Database } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

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

export function GardenScreen() {
  const [tab, setTab] = useState<Tab>("ytor");
  const [showAddGarden, setShowAddGarden] = useState(false);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [showAddSeed, setShowAddSeed] = useState(false);
  const [editingCropId, setEditingCropId] = useState<string | null>(null);
  const [layoutGardenId, setLayoutGardenId] = useState<string | null>(null);
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());

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
              return (
                <div key={crop.id} className="rounded-2xl bg-card border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_EMOJI[crop.category] || "🌱"}</span>
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
                          onClick={() => updateStatus.mutate({ id: crop.id, status: s })}
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
