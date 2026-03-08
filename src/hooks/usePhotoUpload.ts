import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Kunde inte komprimera bilden"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Kunde inte läsa bilden"));
    img.src = url;
  });
}

export function usePhotoUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhoto = async (file: File, path: string): Promise<string> => {
    if (!user) throw new Error("Du måste vara inloggad");
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const fullPath = `${user.id}/${path}`;
      const { error } = await supabase.storage
        .from("growmate-photos")
        .upload(fullPath, compressed, { contentType: "image/jpeg", upsert: false });
      if (error) throw new Error("Uppladdning misslyckades: " + error.message);
      const { data: urlData } = supabase.storage
        .from("growmate-photos")
        .getPublicUrl(fullPath);
      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (url: string): Promise<void> => {
    if (!user) return;
    // Extract path from public URL
    const match = url.match(/growmate-photos\/(.+)$/);
    if (!match) return;
    const { error } = await supabase.storage
      .from("growmate-photos")
      .remove([match[1]]);
    if (error) console.error("Kunde inte ta bort foto:", error);
  };

  return { uploadPhoto, deletePhoto, isUploading };
}
