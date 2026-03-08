import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Garden = Tables<"gardens">;
export type Crop = Tables<"crops">;
export type SeedItem = Tables<"seed_inventory">;

export function useGardens() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gardens", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gardens").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllCrops(seasonYear?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crops", "all", user?.id, seasonYear],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("crops").select("*, gardens(name)").eq("user_id", user!.id);
      if (seasonYear) {
        query = query.eq("season_year", seasonYear);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSeedInventory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["seed_inventory", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seed_inventory").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddGarden() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (garden: Omit<TablesInsert<"gardens">, "user_id">) => {
      const { data, error } = await supabase
        .from("gardens").insert({ ...garden, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gardens"] }),
  });
}

export function useAddCrop() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (crop: Omit<TablesInsert<"crops">, "user_id">) => {
      const { data, error } = await supabase
        .from("crops").insert({ ...crop, user_id: user!.id, season_year: crop.season_year || new Date().getFullYear() }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crops"] }),
  });
}

export function useUpdateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TablesInsert<"crops">>) => {
      const { error } = await supabase.from("crops").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crops"] }),
  });
}

export function useUpdateCropStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crops").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crops"] }),
  });
}

export function useDeleteCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crops"] }),
  });
}

export function useAddSeed() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seed: Omit<TablesInsert<"seed_inventory">, "user_id">) => {
      const { data, error } = await supabase
        .from("seed_inventory").insert({ ...seed, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seed_inventory"] }),
  });
}

export function useDeleteGarden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gardens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gardens"] });
      qc.invalidateQueries({ queryKey: ["crops"] });
    },
  });
}

// --- Layout hooks ---

export interface LayoutZone {
  id: string;
  name: string;
  color: string;
  cells: [number, number][];
}

export interface GardenLayout {
  id: string;
  garden_id: string;
  season_year: number;
  layout_type: string;
  rows: number;
  cols: number;
  photo_url: string | null;
  zones: LayoutZone[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useGardenLayout(gardenId: string | null, seasonYear: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["garden_layout", gardenId, seasonYear],
    enabled: !!user && !!gardenId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_layouts")
        .select("*")
        .eq("garden_id", gardenId!)
        .eq("season_year", seasonYear)
        .maybeSingle();
      if (error) throw error;
      return data as GardenLayout | null;
    },
  });
}

export function useUpsertLayout() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (layout: { garden_id: string; season_year: number; rows: number; cols: number; zones: LayoutZone[]; layout_type?: string; photo_url?: string }) => {
      const { data, error } = await supabase
        .from("garden_layouts")
        .upsert({
          ...layout,
          zones: layout.zones as any,
          user_id: user!.id,
        }, { onConflict: "garden_id,season_year" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garden_layout"] }),
  });
}

export function useCropPlacements(layoutId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crop_placements", layoutId],
    enabled: !!user && !!layoutId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crop_placements")
        .select("*, crops(name, category)")
        .eq("layout_id", layoutId!);
      if (error) throw error;
      return data;
    },
  });
}

export function usePlaceCrop() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (placement: { layout_id: string; crop_id: string; zone_id?: string; cell_row?: number; cell_col?: number }) => {
      const { error } = await supabase
        .from("crop_placements")
        .upsert({ ...placement, user_id: user!.id }, { onConflict: "layout_id,crop_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop_placements"] }),
  });
}

export function useRemovePlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ layoutId, cropId }: { layoutId: string; cropId: string }) => {
      const { error } = await supabase
        .from("crop_placements")
        .delete()
        .eq("layout_id", layoutId)
        .eq("crop_id", cropId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop_placements"] }),
  });
}
