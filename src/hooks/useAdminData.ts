import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAlgorithmStats() {
  return useQuery({
    queryKey: ["admin-algorithm-stats"],
    queryFn: async () => {
      const [
        contributionsRes,
        insightsRes,
        confidenceRes,
        weeklyRes,
        recentEventsRes,
      ] = await Promise.all([
        supabase.from("community_growing_data").select("id", { count: "exact", head: true }),
        supabase.from("community_insights").select("id", { count: "exact", head: true }),
        supabase.from("community_insights").select("confidence_level"),
        supabase.from("community_growing_data").select("created_at"),
        supabase.from("algorithm_learning_log").select("*").order("created_at", { ascending: false }).limit(10),
      ]);

      // Confidence distribution
      const confDist: Record<string, number> = { tidig: 0, växande: 0, tillförlitlig: 0, stark: 0 };
      (confidenceRes.data || []).forEach((r) => {
        const level = r.confidence_level as string;
        if (level && level in confDist) confDist[level]++;
      });

      // Weekly contributions for last 12 weeks
      const now = new Date();
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      const weeklyMap = new Map<string, number>();
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(twelveWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const key = `w${i + 1}`;
        weeklyMap.set(key, 0);
      }
      (weeklyRes.data || []).forEach((r) => {
        const d = new Date(r.created_at as string);
        if (d >= twelveWeeksAgo) {
          const weekIndex = Math.floor((d.getTime() - twelveWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const clampedIndex = Math.min(weekIndex, 11);
          const key = `w${clampedIndex + 1}`;
          weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
        }
      });
      const weekly_contributions = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }));

      return {
        total_contributions: contributionsRes.count || 0,
        total_insights: insightsRes.count || 0,
        total_seed_shares: 0,
        total_interests: 0,
        confidence_distribution: confDist,
        weekly_contributions,
        recent_events: recentEventsRes.data || [],
      };
    },
    staleTime: 30000,
  });
}

export function useTopDeviations() {
  return useQuery({
    queryKey: ["admin-top-deviations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_insights")
        .select("*")
        .or("sow_deviation_weeks.gt.2,harvest_deviation_weeks.gt.2")
        .order("sow_deviation_weeks", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

export function useZoneCoverage() {
  return useQuery({
    queryKey: ["admin-zone-coverage"],
    queryFn: async () => {
      const [contribRes, insightsRes] = await Promise.all([
        supabase.from("community_growing_data").select("zone"),
        supabase.from("community_insights").select("zone"),
      ]);

      const zones = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
      const contribMap = new Map<string, number>();
      const insightMap = new Map<string, number>();

      (contribRes.data || []).forEach((r) => {
        contribMap.set(r.zone, (contribMap.get(r.zone) || 0) + 1);
      });
      (insightsRes.data || []).forEach((r) => {
        insightMap.set(r.zone, (insightMap.get(r.zone) || 0) + 1);
      });

      return zones.map((zone) => ({
        zone,
        contributions: contribMap.get(zone) || 0,
        insights: insightMap.get(zone) || 0,
      }));
    },
    staleTime: 30000,
  });
}
