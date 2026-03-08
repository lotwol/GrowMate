import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Mic, MicOff, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface GrowMateChatProps {
  zone?: string | null;
  profiles?: string[];
  school?: string | null;
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hej! 🌱 Jag är GrowMate – din odlingskompis. Fråga mig om sådd, skadegörare, gödning, eller bara berätta vad du har på gång i trädgården. Du kan också tala in din fråga!",
};

export function GrowMateChat({ zone, profiles }: GrowMateChatProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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
      // Build conversation history (exclude welcome message)
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map(
        ({ role, content }) => ({ role, content })
      );

      const { data, error } = await supabase.functions.invoke("growmate-chat", {
        body: { messages: history, zone: zone || undefined, profiles },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.content || "Jag kunde tyvärr inte svara just nu. Försök igen!",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Oj, något gick fel! 😔 Jag kunde inte nå AI-tjänsten just nu. Försök igen om en liten stund.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput(
        "Jag har tomater och basilika som frön, och en balkong på ca 6 kvm. Har du tips?"
      );
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">GrowMate Bot</p>
            <p className="text-xs text-muted-foreground">
              Din AI-odlingskompis
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
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
              {msg.content}
            </div>
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={cn(
              "shrink-0 rounded-full",
              isRecording && "bg-destructive/10 text-destructive"
            )}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isRecording ? "🎙 Lyssnar..." : "Ställ en fråga om odling..."
            }
            className="flex-1 bg-background rounded-full border border-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="growmate"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {isRecording && (
          <p className="text-xs text-center text-destructive mt-2 animate-pulse-soft">
            Tryck på mikrofonen igen för att stoppa inspelningen
          </p>
        )}
      </div>
    </div>
  );
}
