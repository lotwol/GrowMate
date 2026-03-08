import { useMemo, useEffect, useRef } from "react";
import { ALL_BADGES, type Badge } from "@/data/badges";
import { useAllCrops } from "@/hooks/useGarden";
import { useDiaryEntries } from "@/hooks/useDiary";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "growmate_badges_seen";

function getSeenBadges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setSeenBadges(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function computeDiaryStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useEarnedBadges(school: string | null) {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const { data: allCrops = [] } = useAllCrops();
  const { data: diaryEntries = [] } = useDiaryEntries(currentYear);

  // Community contributions
  const { data: communityCount = 0 } = useQuery({
    queryKey: ["community_count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("community_growing_data")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  // Seed shares by user
  const { data: seedShareCount = 0 } = useQuery({
    queryKey: ["seed_share_count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("seed_shares")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count || 0;
    },
  });

  const earned = useMemo(() => {
    const ids = new Set<string>();

    // Crop-based
    if (allCrops.length >= 1) ids.add("FIRST_CROP");
    if (allCrops.length >= 5) ids.add("FIVE_CROPS");
    if (allCrops.length >= 10) ids.add("TEN_CROPS");

    const harvested = allCrops.filter((c) => c.status === "skördad");
    if (harvested.length >= 1) ids.add("FIRST_HARVEST");
    if (harvested.length >= 5) ids.add("FIVE_HARVESTS");

    // Diary-based
    const diaryDates = diaryEntries.map((d) => d.entry_date);
    const streak = computeDiaryStreak(diaryDates);
    if (streak >= 7) ids.add("DIARY_STREAK_7");
    if (streak >= 30) ids.add("DIARY_STREAK_30");

    const wellbeingCount = diaryEntries.filter(
      (d) => d.wellbeing_mental !== null || d.wellbeing_physical !== null || d.wellbeing_social !== null
    ).length;
    if (wellbeingCount >= 10) ids.add("WELLBEING_TRACKER");

    // Community
    if (communityCount > 0) ids.add("COMMUNITY_CONTRIBUTOR");
    if (communityCount > 0) ids.add("ZONE_EXPERT");

    // Seed shares
    if (seedShareCount > 0) ids.add("SEED_SHARER");

    // School
    if (school) ids.add("SCHOOL_MASTER");

    return ids;
  }, [allCrops, diaryEntries, communityCount, seedShareCount, school]);

  const earnedBadges = useMemo(
    () => ALL_BADGES.filter((b) => earned.has(b.id)),
    [earned]
  );
  const notYetEarned = useMemo(
    () => ALL_BADGES.filter((b) => !earned.has(b.id)),
    [earned]
  );

  return { earned: earnedBadges, notYetEarned };
}

export function useNewBadgeNotifications(earnedBadges: Badge[]) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || earnedBadges.length === 0) return;
    shown.current = true;

    const seen = getSeenBadges();
    const newBadges = earnedBadges.filter((b) => !seen.includes(b.id));

    if (newBadges.length > 0) {
      // Small delay so the app settles
      setTimeout(() => {
        newBadges.forEach((badge, i) => {
          setTimeout(() => {
            toast(
              `${badge.emoji} Nytt märke: ${badge.name}!`,
              {
                description: badge.description,
                duration: 4000,
              }
            );
          }, i * 1200);
        });
      }, 1500);

      setSeenBadges([...seen, ...newBadges.map((b) => b.id)]);
    }
  }, [earnedBadges]);
}

/** Filter badges relevant to a specific season year based on crop/diary data */
export function useSeasonBadges(
  earnedBadges: Badge[],
  crops: { status: string }[],
  diaryEntries: { entry_date: string; wellbeing_mental: number | null; wellbeing_physical: number | null; wellbeing_social: number | null }[]
) {
  return useMemo(() => {
    const seasonRelevant = new Set<string>();

    if (crops.length >= 1) seasonRelevant.add("FIRST_CROP");
    if (crops.length >= 5) seasonRelevant.add("FIVE_CROPS");
    if (crops.length >= 10) seasonRelevant.add("TEN_CROPS");

    const harvested = crops.filter((c) => c.status === "skördad");
    if (harvested.length >= 1) seasonRelevant.add("FIRST_HARVEST");
    if (harvested.length >= 5) seasonRelevant.add("FIVE_HARVESTS");

    const wellbeingCount = diaryEntries.filter(
      (d) => d.wellbeing_mental !== null || d.wellbeing_physical !== null || d.wellbeing_social !== null
    ).length;
    if (wellbeingCount >= 10) seasonRelevant.add("WELLBEING_TRACKER");

    const diaryDates = diaryEntries.map((d) => d.entry_date);
    const streak = computeDiaryStreak(diaryDates);
    if (streak >= 7) seasonRelevant.add("DIARY_STREAK_7");
    if (streak >= 30) seasonRelevant.add("DIARY_STREAK_30");

    return earnedBadges.filter((b) => seasonRelevant.has(b.id));
  }, [earnedBadges, crops, diaryEntries]);
}
