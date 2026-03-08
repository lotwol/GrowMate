import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

export type ActionType = "ADD_CROP" | "ADD_REMINDER" | "LOG_DIARY";

export interface ChatAction {
  type: ActionType;
  data: Record<string, any>;
}

const ACTION_CONFIG: Record<ActionType, { emoji: string; title: string; confirmLabel: string }> = {
  ADD_CROP: { emoji: "🌱", title: "Lägga till gröda", confirmLabel: "Lägg till i Min Odling" },
  ADD_REMINDER: { emoji: "🔔", title: "Sätta påminnelse", confirmLabel: "Sätt påminnelse" },
  LOG_DIARY: { emoji: "📝", title: "Logga i dagboken", confirmLabel: "Logga" },
};

interface ActionCardProps {
  action: ChatAction;
  onConfirm: (action: ChatAction) => Promise<void>;
  onDismiss: () => void;
}

export function ActionCard({ action, onConfirm, onDismiss }: ActionCardProps) {
  const [status, setStatus] = useState<"pending" | "loading" | "done" | "dismissed">("pending");
  const config = ACTION_CONFIG[action.type];

  if (status === "done") {
    return (
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 flex items-center gap-2 animate-fade-in">
        <Check className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-primary">Klart!</span>
      </div>
    );
  }

  if (status === "dismissed") return null;

  const renderDetails = () => {
    const { data } = action;
    switch (action.type) {
      case "ADD_CROP":
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {data.emoji || "🌱"} {data.name}
            </p>
            {data.sowDate && <p className="text-xs text-muted-foreground">Sår: {data.sowDate}</p>}
            {data.harvestDate && <p className="text-xs text-muted-foreground">Skördar: {data.harvestDate}</p>}
            {data.notes && <p className="text-xs text-muted-foreground italic">{data.notes}</p>}
          </div>
        );
      case "ADD_REMINDER":
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{data.text}</p>
            {data.date && <p className="text-xs text-muted-foreground">📅 {data.date}</p>}
          </div>
        );
      case "LOG_DIARY":
        return (
          <div className="space-y-1">
            {data.title && <p className="text-sm font-medium text-foreground">{data.title}</p>}
            {data.content && <p className="text-xs text-muted-foreground line-clamp-2">{data.content}</p>}
            {data.mood && <p className="text-xs text-muted-foreground">Humör: {"⭐".repeat(data.mood)}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-accent/60 border border-border p-3 space-y-3 animate-fade-in">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span>{config.emoji}</span> {config.title}
      </div>
      {renderDetails()}
      <div className="flex gap-2">
        <Button
          variant="growmate"
          size="sm"
          disabled={status === "loading"}
          onClick={async () => {
            setStatus("loading");
            try {
              await onConfirm(action);
              setStatus("done");
            } catch {
              setStatus("pending");
            }
          }}
        >
          {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {config.confirmLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={status === "loading"}
          onClick={() => {
            setStatus("dismissed");
            onDismiss();
          }}
        >
          Avvisa
        </Button>
      </div>
    </div>
  );
}

/** Parse <action>...</action> blocks from AI response text */
export function parseActions(text: string): { cleanText: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];
  const cleanText = text.replace(/<action>\s*([\s\S]*?)\s*<\/action>/g, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.type && parsed.data) {
        actions.push(parsed as ChatAction);
      }
    } catch {
      // ignore malformed
    }
    return "";
  }).trim();

  return { cleanText, actions };
}
