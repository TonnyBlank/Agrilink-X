import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export type Conversation = {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message: string | null;
  last_at: string;
  unread_a: number;
  unread_b: number;
  created_at: string;
  other_name?: string;
  other_photo_url?: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function useMessages(activeConversationId: string | null) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const conversationsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);

    try {
      const data = await apiFetch<Conversation[]>("/messages/conversations");
      const enriched = await Promise.all(
        data.map(async (conversation) => {
          const otherId =
            conversation.participant_a === user.id
              ? conversation.participant_b
              : conversation.participant_a;

          try {
            const profile = await apiFetch<{ full_name: string | null; photo_url: string | null }>(
              `/profiles/${otherId}`,
              {},
              { auth: false },
            );
            return {
              ...conversation,
              other_name: profile.full_name || "Unknown",
              other_photo_url: profile.photo_url || null,
            };
          } catch {
            return { ...conversation, other_name: "Unknown", other_photo_url: null };
          }
        }),
      );

      setConversations(enriched);
    } catch (error) {
      console.error("Failed to load conversations", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  const loadMessages = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    setLoadingMsgs(true);
    try {
      const data = await apiFetch<Message[]>(`/messages/conversations/${activeConversationId}`);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMsgs(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!user) return;

    conversationsChannelRef.current = supabase
      .channel(`conversations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          void loadConversations();
        },
      )
      .subscribe();

    return () => {
      if (conversationsChannelRef.current) {
        void supabase.removeChannel(conversationsChannelRef.current);
      }
    };
  }, [loadConversations, user]);

  useEffect(() => {
    if (!activeConversationId) return;

    channelRef.current = supabase
      .channel(`msgs-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((item) => item.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new as Message];
          });
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
      }
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!user || !activeConversationId) return;

    setConversations((prev) =>
      prev.map((conversation) => {
        if (conversation.id !== activeConversationId) return conversation;
        return conversation.participant_a === user.id
          ? { ...conversation, unread_a: 0 }
          : { ...conversation, unread_b: 0 };
      }),
    );
  }, [activeConversationId, user]);

  const sendMessage = async (body: string) => {
    if (!user || !activeConversationId || !body.trim()) return;

    try {
      const message = await apiFetch<Message>(`/messages/conversations/${activeConversationId}/send`, {
        method: "POST",
        body: { body: body.trim() } as unknown as BodyInit,
      });
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      await loadConversations();
    } catch (error) {
      toast.error("Failed to send: " + (error as Error).message);
    }
  };

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const conversation = await apiFetch<{ id: string }>("/messages/conversations", {
        method: "POST",
        body: { other_user_id: otherUserId } as unknown as BodyInit,
      });
      await loadConversations();
      return conversation.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start conversation";
      toast.error(message);
      return null;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return false;

    try {
      await apiFetch<void>(`/messages/conversations/${conversationId}`, {
        method: "DELETE",
      });
      setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
      if (activeConversationId === conversationId) {
        setMessages([]);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete conversation";
      toast.error(message);
      return false;
    }
  };

  return {
    conversations,
    messages,
    loadingConvs,
    loadingMsgs,
    sendMessage,
    startConversation,
    deleteConversation,
    refetch: loadConversations,
  };
}
