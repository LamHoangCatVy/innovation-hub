"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Send, User, Sparkles, Loader2, Heart } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface YumAIPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function YumAIPanel({ open, onToggle }: YumAIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Chào bạn! Mình là YumAI - trợ lý của Tổ Công tác Đổi mới Sáng tạo \n\nMình có thể giúp bạn:\n• Hướng dẫn gửi sáng kiến\n• Tư vấn cách viết cho điểm cao\n• Giải thích framework chấm điểm\n• Align ý tưởng với chiến lược khối\n\nBạn muốn hỏi gì hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, thinking]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setInput("");
    setSending(true);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .map((m) => ({ role: m.role, content: m.text }))
            .concat([{ role: "user" as const, content: userMsg }]),
        }),
      });

      const data = await res.json();
      setMessages((p) => [...p, { role: "ai", text: data.reply || "YumAI đang suy nghĩ... Bạn hỏi lại nhé!" }]);
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Úi, có lỗi kết nối rồi. Bạn kiểm tra lại mạng và thử lại giúp mình nhé!" }]);
    } finally {
      setSending(false);
      setThinking(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={onToggle}
          data-tour="yumai"
          className="fixed right-4 bottom-4 z-50 group"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-light shadow-lg shadow-brand/25 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-xl cursor-pointer">
              <Sparkles size={22} className="text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-brand flex items-center justify-center">
              <Heart size={10} className="text-brand fill-brand" />
            </span>
          </div>
        </button>
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-40 h-screen w-[420px] bg-surface-elevated border-l border-border shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-brand/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-md">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text-primary">YumAI</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Online</span>
              </div>
              <p className="text-[11px] text-text-muted">Trợ lý Tổ Công tác ĐMST</p>
            </div>
          </div>
          <button onClick={onToggle} className="p-2 hover:bg-surface-alt rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "")}>
              {m.role === "ai" && (
                <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={14} className="text-brand" />
                </div>
              )}
              <div className={cn("space-y-1", m.role === "user" ? "items-end" : "")}>
                {m.role === "ai" && (
                  <span className="text-[10px] text-text-muted font-medium ml-1">YumAI</span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed max-w-[85%]",
                    m.role === "user"
                      ? "bg-brand text-white rounded-br-md ml-auto"
                      : "bg-surface-alt text-text-primary rounded-bl-md border border-border/50"
                  )}
                >
                  {m.text}
                </div>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-brand" />
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-brand" />
              </div>
              <div className="bg-surface-alt border border-border/50 rounded-2xl rounded-bl-md px-5 py-3.5">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-brand/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 bg-surface-alt rounded-xl p-1.5 border border-border focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10 transition-all">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Hỏi YumAI bất cứ điều gì..."
              disabled={sending}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="p-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-text-muted text-center mt-2">
            YumAI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
          </p>
        </div>
      </div>
    </>
  );
}
