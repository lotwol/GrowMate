import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { Dashboard } from "@/components/Dashboard";
import { GrowMateChat } from "@/components/GrowMateChat";
import { BottomNav } from "@/components/BottomNav";
import { DiaryScreen } from "@/components/DiaryScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { GardenScreen } from "@/components/garden/GardenScreen";
import { CalendarScreen } from "@/components/CalendarScreen";
import { CommunityScreen } from "@/components/CommunityScreen";
import { AdminScreen } from "@/components/AdminScreen";
import { OnboardingData } from "@/types/onboarding";

type Tab = "home" | "garden" | "chat" | "diary" | "diary-wellbeing" | "profile" | "calendar" | "community" | "admin";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const saveProfile = useSaveProfile();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [editingProfile, setEditingProfile] = useState(false);

  // Loading
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in">
          <span className="text-4xl">🌱</span>
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Needs onboarding or editing
  if (!profile?.onboarding_completed || editingProfile) {
    const initialData: OnboardingData | undefined = profile?.onboarding_completed
      ? {
          name: profile.display_name || "",
          profiles: profile.profiles || [],
          customReason: profile.custom_reason || "",
          zone: profile.zone || null,
          location: profile.location || "",
          plannerScore: profile.planner_score || 50,
          timeScore: profile.time_score || 5,
          resultVsJoyScore: profile.result_vs_joy_score || 50,
          school: (profile as any).school || null,
        }
      : undefined;

    return (
      <OnboardingQuiz
        initialData={initialData}
        onComplete={(data) => {
          saveProfile.mutate(data, {
            onSuccess: () => {
              setEditingProfile(false);
              setActiveTab("home");
            },
          });
        }}
      />
    );
  }

  const onboardingData: OnboardingData = {
    name: profile.display_name || "",
    profiles: profile.profiles || [],
    customReason: profile.custom_reason || "",
    zone: profile.zone || null,
    location: profile.location || "",
    plannerScore: profile.planner_score || 50,
    timeScore: profile.time_score || 5,
    resultVsJoyScore: profile.result_vs_joy_score || 50,
    school: (profile as any).school || null,
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {activeTab === "home" && (
        <Dashboard profile={onboardingData.profiles[0]} zone={onboardingData.zone} onNavigateChat={() => setActiveTab("chat")} onNavigate={(tab) => setActiveTab(tab as Tab)} />
      )}
      {activeTab === "garden" && <GardenScreen zone={onboardingData.zone} school={onboardingData.school} />}
      {activeTab === "calendar" && (
        <CalendarScreen zone={onboardingData.zone} school={onboardingData.school} onBack={() => setActiveTab("home")} />
      )}
      {activeTab === "chat" && (
        <div className="h-screen pb-16"><GrowMateChat zone={onboardingData.zone} profiles={onboardingData.profiles} school={onboardingData.school} /></div>
      )}
      {activeTab === "diary" && <DiaryScreen onNavigate={(tab) => setActiveTab(tab as Tab)} />}
      {activeTab === "diary-wellbeing" && <DiaryScreen initialTab="wellbeing" onNavigate={(tab) => setActiveTab(tab as Tab)} />}
      {activeTab === "community" && <CommunityScreen zone={onboardingData.zone} />}
      {activeTab === "profile" && (
        <ProfileScreen data={onboardingData} onEdit={() => setEditingProfile(true)} onSignOut={signOut} onOpenAdmin={() => setActiveTab("admin")} />
      )}
      {activeTab === "admin" && (
        <AdminScreen onBack={() => setActiveTab("profile")} />
      )}
      <BottomNav active={["diary-wellbeing", "calendar", "community"].includes(activeTab) ? "home" : activeTab as any} onNavigate={(tab) => setActiveTab(tab as Tab)} />
    </div>
  );
};

export default Index;
