import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

const USER_ID = "demo-user"; // Temporary until auth is added

export type Garden = Tables<"gardens">;
export type Crop = Tables<"crops">;
export type SeedItem = Tables<"seed_inventory">;

export function useGardens() {
  return useQuery({
    queryKey: ["gardens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gardens")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useGardenCrops(gardenId?: string) {
  return useQuery({
    queryKey: ["crops", gardenId],
    queryFn: async () => {
      let query = supabase.from("crops").select("*").eq("user_id", USER_ID);
      if (gardenId) query = query.eq("garden_id", gardenId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllCrops() {
  return useQuery({
    queryKey: ["crops", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("*, gardens(name)")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSeedInventory() {
  return useQuery({
    queryKey: ["seed_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seed_inventory")
        .select("*")
        .eq("user_id", USER_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddGarden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (garden: Omit<TablesInsert<"gardens">, "user_id">) => {
      const { data, error } = await supabase
        .from("gardens")
        .insert({ ...garden, user_id: USER_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gardens"] }),
  });
}

export function useAddCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (crop: Omit<TablesInsert<"crops">, "user_id">) => {
      const { data, error } = await supabase
        .from("crops")
        .insert({ ...crop, user_id: USER_ID })
        .select()
        .single();
      if (error) throw error;
      return data;
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (seed: Omit<TablesInsert<"seed_inventory">, "user_id">) => {
      const { data, error } = await supabase
        .from("seed_inventory")
        .insert({ ...seed, user_id: USER_ID })
        .select()
        .single();
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
