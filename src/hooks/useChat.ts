import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useChatConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat_conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ChatConversation[];
    },
    enabled: !!user,
  });
}

export function useChatMessages(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat_messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ChatMessage[];
    },
    enabled: !!user && !!conversationId,
  });
}

export function useCreateConversation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .insert({ user_id: user!.id, title } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChatConversation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_conversations"] }),
  });
}

export function useSaveChatMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, role, content }: { conversationId: string; role: "user" | "assistant"; content: string }) => {
      const { error } = await supabase
        .from("chat_messages" as any)
        .insert({ conversation_id: conversationId, user_id: user!.id, role, content } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat_messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["chat_conversations"] });
    },
  });
}

export function useUpdateConversationTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("chat_conversations" as any)
        .update({ title } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_conversations"] });
    },
  });
}
