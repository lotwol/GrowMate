import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useSaveProfile } from "@/hooks/useProfile";
import { AuthScreen } from "@/components/AuthScreen";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { Dashboard } from "@/components/Dashboard";
import { GrowMateChat } from "@/components/GrowMateChat";
import { BottomNav } from "@/components/BottomNav";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { GardenScreen } from "@/components/garden/GardenScreen";
import { OnboardingData } from "@/types/onboarding";

type Tab = "home" | "garden" | "chat" | "diary" | "profile";

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
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {activeTab === "home" && (
        <Dashboard profile={onboardingData.profiles[0]} onNavigateChat={() => setActiveTab("chat")} onNavigate={(tab) => setActiveTab(tab as Tab)} />
      )}
      {activeTab === "garden" && <GardenScreen />}
      {activeTab === "chat" && (
        <div className="h-screen pb-16"><GrowMateChat zone={onboardingData.zone} profiles={onboardingData.profiles} /></div>
      )}
      {activeTab === "diary" && (
        <PlaceholderScreen emoji="📔" title="Odlingsdagbok" description="Logga din odlingsresa med foton, anteckningar och säsongsbetyg. Kommer snart!" />
      )}
      {activeTab === "profile" && (
        <ProfileScreen data={onboardingData} onEdit={() => setEditingProfile(true)} onSignOut={signOut} />
      )}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
