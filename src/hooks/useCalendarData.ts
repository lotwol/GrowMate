import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCropsForCalendar(year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crops_calendar", year, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crops")
        .select("id, name, sow_date, harvest_date, status, emoji, season_year")
        .eq("user_id", user!.id)
        .eq("season_year", year);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useDiaryEntriesForCalendar(year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["diary_calendar", year, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("entry_date, mood_garden, title")
        .eq("user_id", user!.id)
        .eq("season_year", year);
      if (error) throw error;
      return (data || []) as { entry_date: string; mood_garden: number | null; title: string | null }[];
    },
    enabled: !!user,
  });
}

export function useSwedishCropTips(zone?: string | null) {
  return useQuery({
    queryKey: ["swedish_crop_tips", zone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("swedish_crop_tips")
        .select("*")
        .eq("zone", zone!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!zone,
    staleTime: Infinity,
  });
}
