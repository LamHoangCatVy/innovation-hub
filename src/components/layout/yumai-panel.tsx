"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";

interface YumAIPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function YumAIPanel({ open, onToggle }: YumAIPanelProps) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Xin chào! Tôi là YumAI, trợ lý đổi mới sáng tạo. Tôi có thể giúp bạn phân tích sáng kiến, đề xuất cải tiến, hoặc trả lời câu hỏi về quy trình." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((p) => [...p, { role: "user", text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { role: "ai", text: "Cảm ơn bạn! Tôi đang xử lý yêu cầu của bạn. Tính năng AI đầy đủ sẽ sớm được tích hợp với DeepSeek." }]);
    }, 800);
  };

  return (
    <>
      {!open && (
        <button
          onClick={onToggle}
          className="fixed right-4 bottom-4 z-50 w-12 h-12 rounded-full bg-brand text-white shadow-lg hover:bg-brand-light transition-all cursor-pointer flex items-center justify-center"
        >
          <MessageSquare size={20} />
        </button>
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-40 h-screen w-[400px] bg-surface-elevated border-l border-border shadow-xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-alt">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">YumAI Assistant</p>
              <p className="text-[10px] text-text-muted">Trợ lý Đổi mới Sáng tạo</p>
            </div>
          </div>
          <button onClick={onToggle} className="p-1.5 hover:bg-surface-alt rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "")}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-brand" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-surface-alt text-text-primary rounded-bl-md"
                )}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-brand" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-alt rounded-lg text-text-muted cursor-pointer">
              <MessageSquare size={16} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Hỏi YumAI..."
              className="flex-1 bg-surface-alt border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="p-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
