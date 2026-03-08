import { cn } from "@/lib/utils";
import { Home, MessageCircle, Leaf, BookOpen, User } from "lucide-react";

type Tab = "home" | "garden" | "chat" | "diary" | "profile";

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const TABS: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Hem" },
  
  { id: "chat", icon: MessageCircle, label: "GrowMate" },
  { id: "diary", icon: BookOpen, label: "Dagbok" },
  { id: "profile", icon: User, label: "Profil" },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="max-w-md mx-auto flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 pt-3 transition-colors",
              active === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon
              className={cn(
                "w-5 h-5",
                active === tab.id && "drop-shadow-sm"
              )}
            />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {active === tab.id && (
              <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
