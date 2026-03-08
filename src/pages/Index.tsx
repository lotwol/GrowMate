import { useState } from "react";
import { OnboardingQuiz } from "@/components/OnboardingQuiz";
import { Dashboard } from "@/components/Dashboard";
import { GrowMateChat } from "@/components/GrowMateChat";
import { BottomNav } from "@/components/BottomNav";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

type Tab = "home" | "garden" | "chat" | "diary" | "profile";

const Index = () => {
  const [profiles, setProfiles] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  if (!profiles) {
    return <OnboardingQuiz onComplete={(p) => setProfiles(p)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background relative">
      {activeTab === "home" && (
        <Dashboard
          profile={profile}
          onNavigateChat={() => setActiveTab("chat")}
        />
      )}
      {activeTab === "garden" && (
        <PlaceholderScreen
          emoji="🌱"
          title="Min Odling"
          description="Här kommer du kunna se alla dina grödor, fröinventarie och odlingsplan. Kommer snart!"
        />
      )}
      {activeTab === "chat" && (
        <div className="h-screen">
          <GrowMateChat />
        </div>
      )}
      {activeTab === "diary" && (
        <PlaceholderScreen
          emoji="📔"
          title="Odlingsdagbok"
          description="Logga din odlingsresa med foton, anteckningar och säsongsbetyg. Kommer snart!"
        />
      )}
      {activeTab === "profile" && (
        <PlaceholderScreen
          emoji="👤"
          title="Min Profil"
          description="Hantera din odlingsprofil, zon och välmående-inställningar. Kommer snart!"
        />
      )}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
};

export default Index;
