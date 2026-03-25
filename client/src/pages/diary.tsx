import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookHeart, Send, Loader2, MessageCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import type { DiaryEntry } from "@shared/schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DiaryPage() {
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // Fetch diary entries
  const { data: entries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary/entries"],
  });

  // Start new diary entry
  const startEntry = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/diary/start", {});
      return res.json();
    },
    onSuccess: (data) => {
      setActiveEntryId(data.id);
      const parsed = JSON.parse(data.messages) as ChatMessage[];
      setMessages(parsed);
      qc.invalidateQueries({ queryKey: ["/api/diary/entries"] });
    },
  });

  // Send message to Roshi
  const sendMessage = useMutation({
    mutationFn: async ({ entryId, message }: { entryId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/diary/${entryId}/message`, {
        message,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const parsed = JSON.parse(data.messages) as ChatMessage[];
      setMessages(parsed);
      setIsLoading(false);
      qc.invalidateQueries({ queryKey: ["/api/diary/entries"] });
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  // Load an existing entry
  const loadEntry = (entry: DiaryEntry) => {
    setActiveEntryId(entry.id);
    const parsed = JSON.parse(entry.messages) as ChatMessage[];
    setMessages(parsed);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeEntryId || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);
    sendMessage.mutate({ entryId: activeEntryId, message: userMsg });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewEntry = () => {
    setActiveEntryId(null);
    setMessages([]);
    startEntry.mutate();
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Entry list — sidebar on desktop, collapsible on mobile */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/50 shrink-0">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-sm font-medium" data-testid="text-diary-title">Diary</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewEntry}
            disabled={startEntry.isPending}
            data-testid="button-new-entry"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>
        <ScrollArea className="h-32 md:h-[calc(100vh-10rem)]">
          <div className="px-2 pb-2 space-y-1">
            {entries.length === 0 && (
              <div className="text-center py-8 px-4">
                <BookHeart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Start a diary entry after a meditation session.
                  Roshi will guide your reflection.
                </p>
              </div>
            )}
            {entries.map((entry) => {
              const preview = (() => {
                try {
                  const msgs = JSON.parse(entry.messages) as ChatMessage[];
                  const first = msgs.find(m => m.role === "assistant");
                  return first?.content.slice(0, 60) + "..." || "New entry";
                } catch {
                  return "New entry";
                }
              })();
              return (
                <button
                  key={entry.id}
                  onClick={() => loadEntry(entry)}
                  className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${
                    activeEntryId === entry.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  }`}
                  data-testid={`button-entry-${entry.id}`}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                  </div>
                  <div className="text-xs truncate">{preview}</div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeEntryId ? (
          <>
            <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border/50"
                      }`}
                      data-testid={`chat-message-${i}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Roshi</div>
                      )}
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border/50 p-3">
              <div className="flex gap-2 items-end max-w-2xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reflect on your practice..."
                  className="resize-none min-h-[2.5rem] max-h-32"
                  rows={1}
                  data-testid="input-diary-message"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">Meditation Diary</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-[16rem]">
                After a meditation session, Roshi will guide you through a 
                reflective conversation about your practice.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNewEntry}
                disabled={startEntry.isPending}
                data-testid="button-start-diary"
              >
                {startEntry.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                Start Entry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
