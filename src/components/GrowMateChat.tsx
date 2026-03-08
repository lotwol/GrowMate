import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Mic, Square, Loader2, Leaf, Plus, ChevronLeft, Trash2, MessageSquare, Sparkles, CalendarPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import {
  useChatConversations,
  useChatMessages,
  useCreateConversation,
  useSaveChatMessage,
  useUpdateConversationTitle,
  useDeleteConversation,
} from "@/hooks/useChat";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface CalendarAction {
  title: string;
  event_date: string;
  description?: string;
  emoji?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  calendarActions?: CalendarAction[];
  calendarSaved?: boolean;
}

interface GrowMateChatProps {
  zone?: string | null;
  profiles?: string[];
  school?: string | null;
}

const SCHOOL_WELCOME: Record<string, string> = {
  "naturens-vag": "Hej! Jag är GrowMaten. Jag hjälper dig odla i samklang med naturen – inga onödiga kemikalier, inget krångel. Vad funderar du på? 🌿",
  precisionsodlaren: "Hej! Jag är GrowMaten. Jag kan hjälpa dig optimera varje aspekt av odlingen – datum, avstånd, data. Vad vill du förbättra? 📊",
  hackaren: "Tja! Jag är GrowMaten. Jag gillar genvägar lika mycket som du. Vad vill du lösa med minsta möjliga ansträngning? ⚡",
  traditionalisten: "God dag! Jag är GrowMaten. Jag respekterar beprövade metoder och gammal kunskap. Vad kan jag hjälpa dig med? 🌻",
};

const DEFAULT_WELCOME = "Hej! 🌱 Jag är GrowMate – din odlingskompis. Fråga mig om sådd, skadegörare, gödning, eller bara berätta vad du har på gång i trädgården. Du kan också tala in din fråga!";

function getWelcomeMessage(school?: string | null): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: (school && SCHOOL_WELCOME[school]) || DEFAULT_WELCOME,
  };
}

export function GrowMateChat({ zone, profiles, school }: GrowMateChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage(school)]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSource, setVoiceSource] = useState(false);
  const [showLearningBanner, setShowLearningBanner] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useChatConversations();
  const { data: savedMessages } = useChatMessages(activeConversationId);
  const createConversation = useCreateConversation();
  const saveChatMessage = useSaveChatMessage();
  const updateTitle = useUpdateConversationTitle();
  const deleteConversation = useDeleteConversation();

  // Fetch user's garden data for AI context
  const [userContext, setUserContext] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    const fetchContext = async () => {
      const [cropsRes, gardensRes, diaryRes, seedsRes, eventsRes] = await Promise.all([
        supabase.from("crops").select("name, status, category, sow_date, harvest_date, emoji, notes, garden_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("gardens").select("name, type, size_sqm, notes").eq("user_id", user.id),
        supabase.from("diary_entries").select("title, content, activities, entry_date, mood_garden").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(10),
        supabase.from("seed_inventory").select("name, category, quantity, notes").eq("user_id", user.id),
        supabase.from("calendar_events" as any).select("title, event_date, description, emoji").eq("user_id", user.id).gte("event_date", new Date().toISOString().split("T")[0]).order("event_date", { ascending: true }).limit(20),
      ]);
      setUserContext({
        crops: cropsRes.data || [],
        gardens: gardensRes.data || [],
        recent_diary: diaryRes.data || [],
        seeds: seedsRes.data || [],
        calendar_events: eventsRes.data || [],
      });
    };
    fetchContext();
  }, [user]);

  const saveCalendarEvents = async (actions: CalendarAction[]) => {
    if (!user || actions.length === 0) return;
    const events = actions.map((a) => ({
      user_id: user.id,
      title: a.title,
      event_date: a.event_date,
      description: a.description || null,
      emoji: a.emoji || "📅",
      event_type: "growmate",
    }));
    const { error } = await supabase.from("calendar_events" as any).insert(events as any);
    if (error) {
      console.error("Failed to save calendar events:", error);
      toast({ title: "Kunde inte spara kalenderhändelser", variant: "destructive" });
    } else {
      toast({ title: `📅 ${actions.length} händelse${actions.length > 1 ? "r" : ""} tillagd${actions.length > 1 ? "a" : ""} i kalendern!` });
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    }
  };

  // When loading a saved conversation, populate messages
  useEffect(() => {
    if (savedMessages && activeConversationId) {
      const loaded: Message[] = savedMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(loaded.length > 0 ? loaded : [getWelcomeMessage(school)]);
    }
  }, [savedMessages, activeConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setShowHistory(false);
  };

  const openConversation = (id: string) => {
    setActiveConversationId(id);
    setShowHistory(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Create conversation if needed
      let convId = activeConversationId;
      if (!convId) {
        const conv = await createConversation.mutateAsync(text.slice(0, 60));
        convId = conv.id;
        setActiveConversationId(convId);
      }

      // Save user message
      await saveChatMessage.mutateAsync({
        conversationId: convId,
        role: "user",
        content: text,
      });

      // Build conversation history
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map(
        ({ role, content }) => ({ role, content })
      );

      const { data, error } = await supabase.functions.invoke("growmate-chat", {
        body: { messages: history, zone: zone || undefined, profiles, school: school || undefined, userContext },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const botContent = data?.content || "Jag kunde tyvärr inte svara just nu. Försök igen!";
      const calendarActions: CalendarAction[] = data?.calendar_actions || [];
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botContent,
        calendarActions: calendarActions.length > 0 ? calendarActions : undefined,
        calendarSaved: false,
      };
      setMessages((prev) => [...prev, botMsg]);

      // Auto-save calendar events
      if (calendarActions.length > 0) {
        await saveCalendarEvents(calendarActions);
        setMessages((prev) =>
          prev.map((m) => m.id === botMsg.id ? { ...m, calendarSaved: true } : m)
        );
      }

      // Save assistant message
      await saveChatMessage.mutateAsync({
        conversationId: convId,
        role: "assistant",
        content: botContent,
      });

      // Update title from first user message
      if (messages.filter((m) => m.role === "user").length === 0) {
        updateTitle.mutate({ id: convId, title: text.slice(0, 60) });
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oj, något gick fel! 😔 Försök igen om en liten stund.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscription = useCallback((text: string) => {
    setInput(text);
    setVoiceSource(true);
  }, []);

  const voice = useVoiceInput(handleVoiceTranscription);

  // History sidebar view
  if (showHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowHistory(false)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-medium text-sm text-foreground flex-1">Konversationer</h2>
          <Button variant="growmate" size="sm" onClick={startNewConversation}>
            <Plus className="w-4 h-4 mr-1" /> Ny
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {conversations.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mt-3">Inga sparade konversationer ännu</p>
            </div>
          )}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border p-3 cursor-pointer transition-all",
                c.id === activeConversationId
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button className="flex-1 text-left min-w-0" onClick={() => openConversation(c.id)}>
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.title || "Ny konversation"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(c.updated_at), "d MMM HH:mm", { locale: sv })}
                  </p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation.mutate(c.id);
                    if (c.id === activeConversationId) startNewConversation();
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">GrowMate Bot</p>
            <p className="text-xs text-muted-foreground">Din AI-odlingskompis</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setShowHistory(true)} title="Se historiska konversationer">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={startNewConversation}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showLearningBanner && messages.length <= 1 && (
          <div className="rounded-2xl bg-accent/60 border border-border px-4 py-3 flex items-start gap-2.5 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">GrowMate lär sig av dig 🌱</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ju mer du loggar – grödor, dagbok, fröer – desto bättre råd får du. Din data stannar hos dig och gör GrowMate smartare för varje säsong.
              </p>
            </div>
            <button onClick={() => setShowLearningBanner(false)} className="text-muted-foreground text-xs shrink-0 hover:text-foreground">✕</button>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] animate-fade-in",
              msg.role === "user" ? "ml-auto" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground border border-border rounded-bl-md"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {/* Calendar actions card */}
            {msg.calendarActions && msg.calendarActions.length > 0 && (
              <div className="mt-2 rounded-xl bg-accent/60 border border-border p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <CalendarPlus className="w-3.5 h-3.5 text-primary" />
                  {msg.calendarSaved ? "Tillagt i kalendern" : "Lägger till i kalendern..."}
                  {msg.calendarSaved && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                {msg.calendarActions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{a.emoji || "📅"}</span>
                    <span className="font-medium text-foreground">{a.title}</span>
                    <span>·</span>
                    <span>{a.event_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="max-w-[85%] mr-auto">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse-soft [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm">
        {/* Recording indicator */}
        {voice.status === "recording" && (
          <div className="flex items-center justify-center gap-3 mb-2 animate-fade-in">
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-4 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-destructive font-medium">
              Inspelning pågår... {voice.elapsedSeconds}s
            </span>
            <button
              onClick={voice.cancel}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Avbryt
            </button>
          </div>
        )}
        {voice.status === "processing" && (
          <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Tolkar röst...</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={voice.toggle}
            disabled={voice.status === "processing" || isLoading}
            className={cn(
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
              voice.status === "recording"
                ? "bg-destructive text-destructive-foreground animate-pulse scale-110 shadow-lg"
                : voice.status === "processing"
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {voice.status === "recording" ? (
              <Square className="w-4 h-4" />
            ) : voice.status === "processing" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 relative">
            {voiceSource && input && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🎤</span>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); setVoiceSource(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={voice.status === "recording" ? "🎙 Lyssnar..." : "Ställ en fråga om odling..."}
              className={cn(
                "w-full bg-background rounded-full border border-input py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                voiceSource && input ? "pl-9 pr-4" : "px-4"
              )}
            />
          </div>
          <Button
            variant="growmate"
            size="icon"
            onClick={() => { handleSend(); setVoiceSource(false); }}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
