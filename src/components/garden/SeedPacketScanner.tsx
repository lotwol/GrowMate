import { useState, useRef } from "react";
import { Camera, X, Loader2, ScanLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface ScannedSeedData {
  name?: string;
  category?: "grönsak" | "ört" | "frukt" | "bär" | "blomma";
  quantity?: string;
  best_before?: string;
  purchased_from?: string;
  cost?: number;
  sow_indoor?: string;
  sow_outdoor?: string;
  harvest_time?: string;
  spacing?: string;
  notes?: string;
}

interface SeedPacketScannerProps {
  onScanComplete: (data: ScannedSeedData) => void;
  onSkip: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SeedPacketScanner({ onScanComplete, onSkip }: SeedPacketScannerProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setError(null);

    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Bilden är för stor (max 5 MB)");
        continue;
      }
      const base64 = await fileToBase64(file);
      newImages.push(base64);
    }
    setImages((prev) => [...prev, ...newImages].slice(0, 2));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScan = async () => {
    if (images.length === 0) return;
    setIsScanning(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("scan-seed-packet", {
        body: { images },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (data?.success && data.data) {
        onScanComplete(data.data);
      } else {
        throw new Error("Kunde inte tolka fröpåsen");
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      setError("Kunde inte läsa fröpåsen. Försök med en tydligare bild eller fyll i manuellt.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          <h3 className="font-display text-foreground">Skanna fröpåse</h3>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Ta kort på fröpåsens framsida (och baksida om du vill). AI:n läser av och fyller i informationen åt dig.
      </p>

      {/* Image preview area */}
      <div className="flex gap-3">
        {images.map((img, i) => (
          <div key={i} className="relative w-28 h-36 rounded-xl overflow-hidden border border-border bg-muted">
            <img src={img} alt={`Fröpåse ${i + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 text-foreground flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-background/80 text-muted-foreground">
              {i === 0 ? "Fram" : "Bak"}
            </span>
          </div>
        ))}

        {images.length < 2 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-medium">
              {images.length === 0 ? "Framsida" : "Baksida"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="growmate"
          className="flex-1"
          onClick={handleScan}
          disabled={images.length === 0 || isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Analyserar...
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4 mr-1.5" />
              Skanna ({images.length}/2 bilder)
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onSkip} className="text-muted-foreground">
          Manuellt
        </Button>
      </div>
    </div>
  );
}
