import { useState, useRef } from "react";
import { Camera, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoViewer } from "./PhotoViewer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { toast } from "sonner";

interface PhotoStripProps {
  photos: string[];
  onPhotosChange: (urls: string[]) => void;
  storagePath: string; // e.g. "diary/1234" or "crops/crop-id"
}

export function PhotoStrip({ photos, onPhotosChange, storagePath }: PhotoStripProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const { uploadPhoto, deletePhoto, isUploading } = usePhotoUpload();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleFile = async (file: File) => {
    setShowPicker(false);
    try {
      const timestamp = Date.now();
      const url = await uploadPhoto(file, `${storagePath}/${timestamp}.jpg`);
      onPhotosChange([...photos, url]);
      toast.success("Foto tillagt!");
    } catch (err: any) {
      toast.error(err.message || "Kunde inte ladda upp foto");
    }
  };

  const handleRemove = async (index: number) => {
    const url = photos[index];
    await deletePhoto(url);
    onPhotosChange(photos.filter((_, i) => i !== index));
    setLongPressIndex(null);
    toast.success("Foto borttaget");
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {/* Add button */}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          disabled={isUploading}
          className={cn(
            "w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 shrink-0 transition-colors",
            "hover:border-primary/40 hover:bg-accent/50",
            isUploading && "opacity-50"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Foto</span>
            </>
          )}
        </button>

        {/* Thumbnails */}
        {photos.map((url, i) => (
          <div key={url} className="relative shrink-0">
            <button
              type="button"
              className="w-20 h-20 rounded-xl overflow-hidden border border-border"
              onClick={() => setViewerIndex(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                setLongPressIndex(i);
              }}
              onTouchStart={() => {
                longPressTimer.current = setTimeout(() => setLongPressIndex(i), 500);
              }}
              onTouchEnd={() => clearTimeout(longPressTimer.current)}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
            {longPressIndex === i && (
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md z-10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Dismiss long-press overlay */}
      {longPressIndex !== null && (
        <div className="fixed inset-0 z-40" onClick={() => setLongPressIndex(null)} />
      )}

      {/* Photo source picker sheet */}
      <Sheet open={showPicker} onOpenChange={setShowPicker}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="text-center">Lägg till foto</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="growmate-outline"
              size="lg"
              className="w-full"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="w-5 h-5 mr-2" />
              Ta foto
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Plus className="w-5 h-5 mr-2" />
              Välj från bibliotek
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Full-screen viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
