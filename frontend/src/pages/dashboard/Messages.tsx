import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Messages() {
  const { user } = useAuth();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const { conversations, messages, loadingConvs, loadingMsgs, sendMessage } = useMessages(activeConv);

  useEffect(() => {
    if (!activeConv && conversations.length) {
      setActiveConv(conversations[0].id);
    }
  }, [activeConv, conversations]);

  const activeMessages = useMemo(() => messages, [messages]);

  return (
    <DashboardShell title="Messages">
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-[32rem] flex-col gap-4 md:h-[calc(100dvh-10rem)] md:flex-row">
        <div className="bento-card w-full overflow-y-auto md:block md:w-80 md:shrink-0">
          <h3 className="mb-3 font-display text-sm font-bold text-foreground">Conversations</h3>
          {loadingConvs && <p className="text-xs text-muted-foreground">Loading conversations...</p>}
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveConv(conversation.id)}
                className={`w-full rounded-xl p-3 text-left transition-colors ${
                  activeConv === conversation.id ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                    {(conversation.other_name || "?")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-foreground">
                        {conversation.other_name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conversation.last_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.last_message || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
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
    </DashboardShell>
  );
}
