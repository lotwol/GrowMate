import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content: string | null;
  mood_garden: number | null;
  wellbeing_physical: number | null;
  wellbeing_mental: number | null;
  wellbeing_social: number | null;
  activities: string[];
  season_year: number | null;
  created_at: string;
  updated_at: string;
}

export function useDiaryEntries(year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["diary_entries", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_entries" as any)
        .select("*")
        .eq("user_id", user!.id)
        .eq("season_year", year)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DiaryEntry[];
    },
    enabled: !!user,
  });
}

export function useAddDiaryEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Record<string, any>) => {
      const { error } = await supabase.from("diary_entries" as any).insert({
        ...entry,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary_entries"] }),
  });
}

export function useUpdateDiaryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("diary_entries" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary_entries"] }),
  });
}

export function useDeleteDiaryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diary_entries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary_entries"] }),
  });
}
