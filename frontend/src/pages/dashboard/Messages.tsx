import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type FarmerSearchResult = {
  user_id: string;
  full_name: string | null;
  county: string | null;
  farm_size: string | null;
};

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [farmerQuery, setFarmerQuery] = useState("");
  const [farmerResults, setFarmerResults] = useState<FarmerSearchResult[]>([]);
  const [searchingFarmers, setSearchingFarmers] = useState(false);
  const [openingFarmerId, setOpeningFarmerId] = useState<string | null>(null);
  const { conversations, messages, loadingConvs, loadingMsgs, sendMessage, startConversation, deleteConversation } = useMessages(activeConv);

  useEffect(() => {
    if (!activeConv && conversations.length) {
      setActiveConv(conversations[0].id);
    }
  }, [activeConv, conversations]);

  useEffect(() => {
    let cancelled = false;

    const searchFarmers = async () => {
      if (!farmerQuery.trim()) {
        setFarmerResults([]);
        return;
      }

      setSearchingFarmers(true);
      try {
        const data = await apiFetch<FarmerSearchResult[]>(
          `/profiles/farmers?q=${encodeURIComponent(farmerQuery.trim())}`,
        );
        if (!cancelled) {
          setFarmerResults(data.slice(0, 6));
        }
      } catch (error) {
        console.error("Failed to search farmers", error);
        if (!cancelled) {
          toast.error("Failed to search farmers");
        }
      } finally {
        if (!cancelled) {
          setSearchingFarmers(false);
        }
      }
    };

    void searchFarmers();

    return () => {
      cancelled = true;
    };
  }, [farmerQuery]);

  const activeMessages = useMemo(() => messages, [messages]);
  const conversationItems = useMemo(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        other_user_id: user
          ? conversation.participant_a === user.id
            ? conversation.participant_b
            : conversation.participant_a
          : null,
        unread_count: user
          ? conversation.participant_a === user.id
            ? conversation.unread_a
            : conversation.unread_b
          : 0,
      })),
    [conversations, user],
  );

  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingConversationId(conversationId);
    try {
      const deleted = await deleteConversation(conversationId);
      if (deleted && activeConv === conversationId) {
        const nextConversation = conversations.find((conversation) => conversation.id !== conversationId);
        setActiveConv(nextConversation?.id ?? null);
      }
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleOpenFarmerConversation = async (farmerId: string) => {
    setOpeningFarmerId(farmerId);
    try {
      const conversationId = await startConversation(farmerId);
      if (conversationId) {
        setActiveConv(conversationId);
        setFarmerQuery("");
        setFarmerResults([]);
      }
    } finally {
      setOpeningFarmerId(null);
    }
  };

  const handleOpenProfile = (userId: string) => {
    navigate(`/dashboard/farmers/${userId}`);
  };

  return (
    <DashboardShell title="Messages">
      <div className="space-y-4">
        <section className="rounded-[1.75rem] border border-emerald-200/60 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] p-5 shadow-sm dark:border-emerald-500/30 dark:bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.96))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">How Messaging Works</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Search a farmer, open their full profile page, or jump straight into a conversation from this section.
              </p>
            </div>
            <div className="w-full max-w-md space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={farmerQuery}
                  onChange={(e) => setFarmerQuery(e.target.value)}
                  placeholder="Search a farmer by name, county, or farm size"
                  className="rounded-xl bg-white pl-9 dark:bg-card/90"
                />
              </div>
              {searchingFarmers && <p className="text-xs text-muted-foreground">Searching farmers...</p>}
              {!searchingFarmers && !!farmerQuery.trim() && !farmerResults.length && (
                <p className="text-xs text-muted-foreground">No farmers matched your search.</p>
              )}
              {!!farmerResults.length && (
                <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white/90 p-2 dark:border-emerald-500/20 dark:bg-card/90">
                  {farmerResults.map((farmer) => (
                    <div
                      key={farmer.user_id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{farmer.full_name || "Farmer"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[farmer.county, farmer.farm_size].filter(Boolean).join(" • ") || "Farm profile"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(farmer.user_id)}
                          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleOpenFarmerConversation(farmer.user_id)}
                          disabled={openingFarmerId === farmer.user_id}
                          className="text-xs font-semibold text-primary disabled:opacity-50"
                        >
                          {openingFarmerId === farmer.user_id ? "Opening..." : "Chat"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-emerald-700 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300">1. Search farmer</span>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-emerald-700 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300">2. View profile page</span>
              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-emerald-700 dark:border-emerald-500/30 dark:bg-background/70 dark:text-emerald-300">3. Start chat</span>
            </div>
          </div>
        </section>

        <div className="flex h-[calc(100dvh-8.5rem)] min-h-[32rem] flex-col gap-4 md:h-[calc(100dvh-10rem)] md:flex-row">
          <div className="bento-card w-full overflow-y-auto md:block md:w-80 md:shrink-0">
            <h3 className="mb-3 font-display text-sm font-bold text-foreground">Conversations</h3>
            {loadingConvs && <p className="text-xs text-muted-foreground">Loading conversations...</p>}
            <div className="space-y-1">
              {conversationItems.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`w-full rounded-xl p-3 transition-colors ${
                    activeConv === conversation.id ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => conversation.other_user_id && handleOpenProfile(conversation.other_user_id)}
                      className="shrink-0"
                    >
                      {conversation.other_photo_url ? (
                        <img
                          src={conversation.other_photo_url}
                          alt={conversation.other_name || "Profile photo"}
                          className="h-8 w-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                          {(conversation.other_name || "?")[0]}
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveConv(conversation.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {conversation.other_name || "Unknown"}
                          </span>
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            {conversation.unread_count ?? 0}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(conversation.last_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.last_message || "No messages yet"}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteConversation(conversation.id)}
                      disabled={deletingConversationId === conversation.id}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background/70 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card flex flex-1 flex-col">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConv(conversation.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    activeConv === conversation.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {conversation.other_name || "Unknown"}
                </button>
              ))}
            </div>
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto pr-2">
              {loadingMsgs && <p className="text-xs text-muted-foreground">Loading messages...</p>}
              {activeMessages.map((message, index) => {
                const mine = message.sender_id === user?.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[75%] rounded-2xl p-3 text-sm ${
                        mine
                          ? "rounded-br-lg bg-primary text-primary-foreground"
                          : "rounded-bl-lg bg-muted text-foreground"
                      }`}
                    >
                      <p>{message.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {!loadingMsgs && !activeMessages.length && (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {activeConv ? "No messages in this conversation yet." : "Select a conversation to begin."}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    void sendMessage(input);
                    setInput("");
                  }
                }}
              />
              <Button
                className="shrink-0 rounded-xl sm:w-auto"
                onClick={() => {
                  if (!input.trim()) return;
                  void sendMessage(input);
                  setInput("");
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
