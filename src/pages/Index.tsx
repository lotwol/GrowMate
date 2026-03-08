import { useState } from "react";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { Dashboard } from "@/components/Dashboard";
import { GrowMateChat } from "@/components/GrowMateChat";
import { BottomNav } from "@/components/BottomNav";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { OnboardingData } from "@/types/onboarding";

type Tab = "home" | "garden" | "chat" | "diary" | "profile";

const Index = () => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [editingProfile, setEditingProfile] = useState(false);

  if (!onboardingData || editingProfile) {
    return (
      <OnboardingQuiz
        initialData={editingProfile ? onboardingData! : undefined}
        onComplete={(data) => {
          setOnboardingData(data);
          setEditingProfile(false);
          setActiveTab("home");
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {activeTab === "home" && (
        <Dashboard profile={onboardingData.profiles[0]} onNavigateChat={() => setActiveTab("chat")} />
      )}
      {activeTab === "garden" && (
        <PlaceholderScreen emoji="🌱" title="Min Odling" description="Här kommer du kunna se alla dina grödor, fröinventarie och odlingsplan. Kommer snart!" />
      )}
      {activeTab === "chat" && (
        <div className="h-screen"><GrowMateChat /></div>
      )}
      {activeTab === "diary" && (
        <PlaceholderScreen emoji="📔" title="Odlingsdagbok" description="Logga din odlingsresa med foton, anteckningar och säsongsbetyg. Kommer snart!" />
      )}
      {activeTab === "profile" && (
        <ProfileScreen data={onboardingData} onEdit={() => setEditingProfile(true)} />
      )}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
