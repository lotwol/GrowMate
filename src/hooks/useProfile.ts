import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { OnboardingData } from "@/types/onboarding";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (onboarding: OnboardingData) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: onboarding.name,
          zone: onboarding.zone,
          location: onboarding.location,
          profiles: onboarding.profiles,
          custom_reason: onboarding.customReason || null,
          planner_score: onboarding.plannerScore,
          time_score: onboarding.timeScore,
          result_vs_joy_score: onboarding.resultVsJoyScore,
          onboarding_completed: true,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
