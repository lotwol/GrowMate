import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Grid3X3, Camera, Plus, X, Paintbrush, Save, Loader2 } from "lucide-react";
import { useUpsertLayout, useCropPlacements, usePlaceCrop, useRemovePlacement, type LayoutZone, type GardenLayout, type Crop } from "@/hooks/useGarden";
import { supabase } from "@/integrations/supabase/client";

const ZONE_COLORS = [
  { bg: "hsl(142, 40%, 45%)", cell: "hsla(142, 40%, 45%, 0.2)" },   // sage green
  { bg: "hsl(158, 35%, 38%)", cell: "hsla(158, 35%, 38%, 0.2)" },   // teal green
  { bg: "hsl(120, 30%, 50%)", cell: "hsla(120, 30%, 50%, 0.2)" },   // soft green
  { bg: "hsl(170, 35%, 42%)", cell: "hsla(170, 35%, 42%, 0.2)" },   // mint
  { bg: "hsl(95, 30%, 48%)", cell: "hsla(95, 30%, 48%, 0.2)" },     // lime-green
  { bg: "hsl(150, 25%, 55%)", cell: "hsla(150, 25%, 55%, 0.2)" },   // pale moss
  { bg: "hsl(180, 25%, 42%)", cell: "hsla(180, 25%, 42%, 0.2)" },   // dark mint
  { bg: "hsl(105, 25%, 40%)", cell: "hsla(105, 25%, 40%, 0.2)" },   // forest
];

const CATEGORY_EMOJI: Record<string, string> = {
  grönsak: "🥕", ört: "🌿", frukt: "🍎", bär: "🫐", blomma: "🌸",
};

interface GardenLayoutEditorProps {
  gardenId: string;
  gardenName: string;
  seasonYear: number;
  layout: GardenLayout | null;
  crops: Crop[];
  onClose: () => void;
}

type Mode = "view" | "edit-grid" | "paint-zone" | "place-crop" | "setup";

export function GardenLayoutEditor({ gardenId, gardenName, seasonYear, layout, crops, onClose }: GardenLayoutEditorProps) {
  const [mode, setMode] = useState<Mode>(layout ? "view" : "setup");
  const [rows, setRows] = useState(layout?.rows || 4);
  const [cols, setCols] = useState(layout?.cols || 6);
  const [zones, setZones] = useState<LayoutZone[]>((layout?.zones as any) || []);

  // Sync state when layout data arrives asynchronously
  useEffect(() => {
    if (layout) {
      setMode(prev => prev === "setup" ? "view" : prev);
      setRows(layout.rows);
      setCols(layout.cols);
      setZones((layout.zones as any) || []);
    }
  }, [layout?.id]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(layout?.photo_url || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsertLayout = useUpsertLayout();
  const { data: placements = [] } = useCropPlacements(layout?.id || null);
  const placeCrop = usePlaceCrop();
  const removePlacement = useRemovePlacement();

  const cellZoneMap = useMemo(() => {
    const map: Record<string, LayoutZone> = {};
    zones.forEach(z => z.cells.forEach(([r, c]) => { map[`${r}-${c}`] = z; }));
    return map;
  }, [zones]);

  const cellCropMap = useMemo(() => {
    const map: Record<string, any> = {};
    placements.forEach((p: any) => {
      if (p.cell_row !== null && p.cell_col !== null) {
        map[`${p.cell_row}-${p.cell_col}`] = p;
      }
    });
    return map;
  }, [placements]);

  const addZone = () => {
    if (!newZoneName.trim()) return;
    const newZone: LayoutZone = {
      id: `z-${Date.now()}`,
      name: newZoneName.trim(),
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      cells: [],
    };
    setZones(prev => [...prev, newZone]);
    setActiveZoneId(newZone.id);
    setNewZoneName("");
    setMode("paint-zone");
  };

  const toggleCellInZone = useCallback((row: number, col: number) => {
    if (!activeZoneId) return;
    setZones(prev => prev.map(z => {
      if (z.id !== activeZoneId) {
        return { ...z, cells: z.cells.filter(([r, c]) => !(r === row && c === col)) };
      }
      const has = z.cells.some(([r, c]) => r === row && c === col);
      return {
        ...z,
        cells: has
          ? z.cells.filter(([r, c]) => !(r === row && c === col))
          : [...z.cells, [row, col] as [number, number]],
      };
    }));
  }, [activeZoneId]);

  const handleCellAction = useCallback((row: number, col: number) => {
    if (mode === "paint-zone") {
      toggleCellInZone(row, col);
    } else if (mode === "place-crop" && selectedCropId && layout) {
      const key = `${row}-${col}`;
      const existing = cellCropMap[key];
      if (existing && existing.crop_id === selectedCropId) {
        removePlacement.mutate({ layoutId: layout.id, cellRow: row, cellCol: col });
      } else {
        placeCrop.mutate({
          layout_id: layout.id,
          crop_id: selectedCropId,
          cell_row: row,
          cell_col: col,
          zone_id: cellZoneMap[key]?.id,
        });
      }
    }
  }, [mode, activeZoneId, selectedCropId, layout, cellCropMap, cellZoneMap, toggleCellInZone, placeCrop, removePlacement]);

  const handlePointerDown = (row: number, col: number) => {
    if (mode === "paint-zone" || mode === "place-crop") {
      setIsPainting(true);
      handleCellAction(row, col);
    }
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (isPainting && (mode === "paint-zone" || mode === "place-crop")) {
      handleCellAction(row, col);
    }
  };

  const handlePointerUp = () => setIsPainting(false);

  const saveLayout = async () => {
    await upsertLayout.mutateAsync({
      garden_id: gardenId,
      season_year: seasonYear,
      rows,
      cols,
      zones,
      photo_url: photoUrl || undefined,
    });
    setMode("view");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!photoUrl) return;
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-garden-layout", {
        body: { image: photoUrl, rows, cols },
      });
      if (error) throw error;
      if (data?.zones) {
        setZones(data.zones.map((z: any, i: number) => ({
          id: `z-${Date.now()}-${i}`,
          name: z.name,
          color: ZONE_COLORS[i % ZONE_COLORS.length],
          cells: z.cells || [],
        })));
      }
    } catch (err) {
      console.error("Photo analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Setup screen
  if (mode === "setup") {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-foreground">Skapa layout – {gardenName}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Välj hur du vill skapa din odlingsöversikt</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("edit-grid")}
            className="rounded-xl border-2 border-border hover:border-primary/50 p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Grid3X3 className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium text-foreground">Manuellt rutnät</span>
            <span className="text-[10px] text-muted-foreground text-center">Rita upp zoner själv</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-border hover:border-primary/50 p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Camera className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium text-foreground">Foto → AI-skiss</span>
            <span className="text-[10px] text-muted-foreground text-center">Ta kort, AI ritar</span>
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => { handlePhotoUpload(e); setMode("edit-grid"); }} className="hidden" />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Rutnätsstorlek</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Rader</label>
              <input type="number" min={1} max={12} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-0.5" />
            </div>
            <span className="text-muted-foreground mt-4">×</span>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground">Kolumner</label>
              <input type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Number(e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-body mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeZone = zones.find(z => z.id === activeZoneId);
  const selectedCrop = crops.find(c => c.id === selectedCropId);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3 animate-fade-in" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-foreground text-sm">{gardenName} – {seasonYear}</h3>
        <div className="flex items-center gap-2">
          {mode !== "view" && (
            <Button size="sm" variant="growmate" onClick={saveLayout} disabled={upsertLayout.isPending} className="h-8 text-xs">
              <Save className="w-3 h-3 mr-1" />
              {upsertLayout.isPending ? "..." : "Spara"}
            </Button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Photo background + analyze button */}
      {photoUrl && (
        <div className="space-y-2">
          <img src={photoUrl} alt="Odlingsyta" className="w-full h-32 object-cover rounded-xl opacity-60" />
          {zones.length === 0 && (
            <Button size="sm" variant="outline" onClick={analyzePhoto} disabled={isAnalyzing} className="w-full h-8 text-xs">
              {isAnalyzing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />AI analyserar...</> : "🤖 Låt AI identifiera zoner"}
            </Button>
          )}
        </div>
      )}

      {/* Mode toolbar */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setMode("view")}
          className={cn("text-xs px-2.5 py-1 rounded-full border transition-all", mode === "view" ? "bg-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground")}
        >Överblick</button>
        <button
          onClick={() => setMode("edit-grid")}
          className={cn("text-xs px-2.5 py-1 rounded-full border transition-all", mode === "edit-grid" ? "bg-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground")}
        ><Grid3X3 className="w-3 h-3 inline mr-1" />Rutnät</button>
        <button
          onClick={() => setMode("paint-zone")}
          className={cn("text-xs px-2.5 py-1 rounded-full border transition-all", mode === "paint-zone" ? "bg-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground")}
        ><Paintbrush className="w-3 h-3 inline mr-1" />Zoner</button>
        <button
          onClick={() => setMode("place-crop")}
          className={cn("text-xs px-2.5 py-1 rounded-full border transition-all", mode === "place-crop" ? "bg-primary text-primary-foreground border-transparent" : "border-border text-muted-foreground")}
        >🌱 Placera</button>
      </div>

      {/* Grid size controls in edit mode */}
      {mode === "edit-grid" && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Storlek:</span>
          <input type="number" min={1} max={12} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-12 rounded border border-input bg-background px-2 py-1 text-xs text-foreground" />
          <span className="text-muted-foreground">×</span>
          <input type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Number(e.target.value))} className="w-12 rounded border border-input bg-background px-2 py-1 text-xs text-foreground" />
        </div>
      )}

      {/* Zone management in paint mode */}
      {mode === "paint-zone" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {zones.map(z => (
              <button
                key={z.id}
                onClick={() => setActiveZoneId(z.id === activeZoneId ? null : z.id)}
                className={cn("text-xs px-2 py-1 rounded-full border transition-all", z.id === activeZoneId ? "border-transparent font-medium text-white" : "border-border text-muted-foreground")}
                style={z.id === activeZoneId ? { backgroundColor: z.color } : undefined}
              >{z.name} ({z.cells.length})</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Ny zon, t.ex. Bädd 1" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <Button size="sm" variant="outline" onClick={addZone} disabled={!newZoneName.trim()} className="h-7 text-xs">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {activeZone ? (
            <p className="text-[10px] text-muted-foreground">🖌️ Dra fingret/musen över rutor för att måla "{activeZone.name}"</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Välj en zon ovan eller skapa en ny för att börja måla</p>
          )}
        </div>
      )}

      {/* Crop selector in place mode */}
      {mode === "place-crop" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {crops.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCropId(c.id === selectedCropId ? null : c.id)}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition-all",
                  c.id === selectedCropId
                    ? "border-primary bg-accent text-accent-foreground font-medium"
                    : "border-border text-muted-foreground"
                )}
              >{(c as any).emoji || CATEGORY_EMOJI[c.category] || "🌱"} {c.name}</button>
            ))}
            {crops.length === 0 && <p className="text-xs text-muted-foreground">Inga grödor för {seasonYear}</p>}
          </div>
          {selectedCrop ? (
            <p className="text-[10px] text-muted-foreground">🌱 Dra fingret/musen för att placera "{selectedCrop.name}" på flera rutor</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">Välj en gröda ovan och dra sedan över rutorna</p>
          )}
        </div>
      )}

      {/* The grid */}
      <div
        className={cn("grid gap-0.5 rounded-xl overflow-hidden border border-border select-none", (mode === "paint-zone" || mode === "place-crop") && "touch-none")}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const key = `${r}-${c}`;
          const zone = cellZoneMap[key];
          const cropPlacement = cellCropMap[key];
          const crop = cropPlacement ? crops.find(cr => cr.id === cropPlacement.crop_id) : null;

          return (
            <button
              key={key}
              onPointerDown={(e) => { e.preventDefault(); handlePointerDown(r, c); }}
              onPointerEnter={() => handlePointerEnter(r, c)}
              className={cn(
                "aspect-square flex items-center justify-center text-[10px] transition-all relative",
                mode === "view" ? "cursor-default" : "cursor-pointer hover:brightness-90",
                !zone && !crop ? "bg-muted/50" : "",
              )}
              style={zone ? { backgroundColor: zone.color + "33", borderColor: zone.color } : undefined}
              title={[zone?.name, crop?.name].filter(Boolean).join(" · ")}
            >
              {crop ? (
                <span className="text-sm">{(crop as any).emoji || CATEGORY_EMOJI[crop.category] || "🌱"}</span>
              ) : zone ? (
                <span className="text-[8px] text-muted-foreground leading-tight truncate px-0.5">{zone.name}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {zones.map(z => (
            <div key={z.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: z.color }} />
              {z.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}