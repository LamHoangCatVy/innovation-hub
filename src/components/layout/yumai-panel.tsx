"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "ai" | "system";
  text: string;
}

const SYSTEM_PROMPT = `Bạn là YumAI - trợ lý Đổi mới Sáng tạo của ngân hàng. Nhiệm vụ của bạn:
1. Hướng dẫn người dùng cách tạo sáng kiến mới từng bước
2. Tư vấn cách viết executive summary, pain points hiệu quả
3. Gợi ý các framework chấm điểm phù hợp
4. Phân tích sơ bộ chất lượng sáng kiến dựa trên tiêu chí
5. Trả lời câu hỏi về quy trình phê duyệt

Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt.`;

interface YumAIPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function YumAIPanel({ open, onToggle }: YumAIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Xin chào! Tôi là YumAI. Tôi có thể giúp bạn:\n\n1. Hướng dẫn tạo sáng kiến\n2. Phân tích chất lượng ý tưởng\n3. Tư vấn framework chấm điểm\n4. Giải đáp quy trình phê duyệt\n\nHãy hỏi tôi bất cứ điều gì!" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setInput("");
    setSending(true);

    try {
      const useLLM = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY && process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY.length > 10;

      if (useLLM) {
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.text })),
              { role: "user", content: userMsg },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || "Xin lỗi, tôi chưa hiểu. Bạn có thể hỏi lại?";
          setMessages((p) => [...p, { role: "ai", text: reply }]);
        } else {
          fallbackReply(userMsg);
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        fallbackReply(userMsg);
      }
    } catch {
      fallbackReply(userMsg);
    } finally {
      setSending(false);
    }
  };

  const fallbackReply = (msg: string) => {
    const lower = msg.toLowerCase();
    let reply: string;

    if (lower.includes("tạo") || lower.includes("mới") || lower.includes("sáng kiến") || lower.includes("đề xuất")) {
      reply = "Để tạo sáng kiến mới:\n\n1. Vào menu \"Đề xuất mới\" bên trái\n2. Điền Tiêu đề (max 150 ký tự)\n3. Viết Tóm tắt giải pháp - giải thích ý tưởng của bạn\n4. Mô tả Thực trạng & Nỗi đau - vấn đề cần giải quyết\n5. Chọn Khối thụ hưởng - ai sẽ được lợi từ sáng kiến\n6. Nhấn \"Gửi Sáng kiến\"\n\nAI sẽ tự động chấm điểm và đưa ra phản hồi!";
    } else if (lower.includes("điểm") || lower.includes("chấm") || lower.includes("score") || lower.includes("tiêu chí")) {
      reply = "Hệ thống dùng 2 bộ tiêu chí:\n\n**RICE Framework** (cho Khối Kinh doanh):\n- Reach: Quy mô thụ hưởng\n- Impact: Tác động tài chính\n- Confidence: Độ tin cậy dữ liệu\n- Effort: Nỗ lực triển khai\n\n**Operational Framework** (cho Khối Vận hành):\n- Time Saving, Cost Reduction, Employee Experience\n- OpRisk Mitigation, Compliance\n\nĐiểm cuối cùng quy về thang 100.";
    } else if (lower.includes("duyệt") || lower.includes("pic") || lower.includes("phê") || lower.includes("review")) {
      reply = "Quy trình phê duyệt:\n\n1. Bạn gửi sáng kiến → AI tự động chấm điểm\n2. Nếu đầy đủ → Chuyển đến PIC của khối\n3. PIC xem xét → Approve / Reject / Yêu cầu sửa\n4. Nếu Approve → Sáng kiến lên Nhà Chung\n5. Nếu bị từ chối → Bạn nhận feedback và có thể sửa lại\n\nBạn có thể theo dõi trạng thái trong phần chi tiết sáng kiến.";
    } else if (lower.includes("hướng dẫn") || lower.includes("help") || lower.includes("giúp")) {
      reply = "Tôi có thể giúp bạn:\n\n• Hướng dẫn tạo sáng kiến mới\n• Giải thích cách chấm điểm\n• Tư vấn quy trình phê duyệt\n• Phân tích chất lượng ý tưởng\n\nBạn muốn biết thêm về chủ đề nào?";
    } else {
      reply = "Cảm ơn câu hỏi của bạn! Hiện tại tôi đang chạy ở chế độ offline. Để kích hoạt AI đầy đủ, hãy thêm DEEPSEEK_API_KEY vào file .env.\n\nTôi vẫn có thể giúp bạn các chủ đề:\n• Tạo sáng kiến mới\n• Cách chấm điểm\n• Quy trình phê duyệt\n\nBạn muốn tìm hiểu thêm về gì?";
    }

    setMessages((p) => [...p, { role: "ai", text: reply }]);
  };

  return (
    <>
      {!open && (
        <button
          onClick={onToggle}
          className="fixed right-4 bottom-4 z-50 w-12 h-12 rounded-full bg-brand text-white shadow-lg hover:bg-brand-light transition-all cursor-pointer flex items-center justify-center animate-bounce"
        >
          <Sparkles size={20} />
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "")}>
              {m.role === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-brand" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
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
          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} className="text-brand animate-spin" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Hỏi YumAI bất cứ điều gì..."
              disabled={sending}
              className="flex-1 bg-surface-alt border border-border rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="p-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors cursor-pointer disabled:opacity-50"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
