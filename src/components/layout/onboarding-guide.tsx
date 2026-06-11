"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Lightbulb, Brain, Users, Globe, Award, X, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  {
    icon: Lightbulb,
    title: "Chào mừng đến với Innovation Hub!",
    description: "Nền tảng đổi mới sáng tạo giúp bạn đề xuất, chấm điểm và triển khai sáng kiến toàn ngân hàng.",
  },
  {
    icon: Brain,
    title: "Bước 1: Đề xuất Sáng kiến",
    description: "Vào menu \"Đề xuất mới\", mô tả ý tưởng của bạn. Hệ thống sẽ tự động lưu nháp mỗi 30 giây.",
    tips: ["Viết tiêu đề rõ ràng, dưới 150 ký tự", "Mô tả càng chi tiết, điểm AI càng chính xác", "Chọn đúng khối thụ hưởng để được chấm đúng tiêu chí"],
  },
  {
    icon: Award,
    title: "Bước 2: AI Tự động Chấm điểm",
    description: "Sau khi gửi, AI sẽ phân tích nội dung và chấm điểm dựa trên framework của khối bạn chọn.",
    tips: ["Điểm từ 0-100 dựa trên tiêu chí RICE hoặc Operational", "Nếu thiếu thông tin, AI sẽ gợi ý bổ sung", "Bạn có thể chỉnh sửa và gửi lại"],
  },
  {
    icon: Users,
    title: "Bước 3: PIC Phê duyệt",
    description: "Đầu mối phê duyệt (PIC) của khối sẽ xem xét sáng kiến và đưa ra quyết định.",
    tips: ["Approve → Sáng kiến lên Nhà Chung", "Reject → Nhận feedback và sửa lại", "Bạn sẽ được thông báo khi có kết quả"],
  },
  {
    icon: Globe,
    title: "Bước 4: Nhà Chung",
    description: "Sáng kiến được phê duyệt sẽ xuất hiện trên Nhà Chung để toàn bộ ngân hàng xem và tương tác.",
    tips: ["Upvote sáng kiến bạn thấy hay", "Bình luận, thảo luận với đồng nghiệp", "Lọc theo khối, điểm số để khám phá"],
  },
];

export function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem("vpb_onboarding_done");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("vpb_onboarding_done", "1");
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surface-elevated border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-brand-light p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <current.icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">HƯỚNG DẪN</p>
                <p className="text-white font-semibold">{current.title}</p>
              </div>
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-text-primary">{current.description}</p>

          {current.tips && (
            <div className="space-y-2">
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-brand/5 border border-brand/10">
                  <span className="text-xs text-brand font-mono mt-0.5">{i + 1}.</span>
                  <p className="text-sm text-text-secondary">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === step ? "bg-brand w-6" : "bg-border"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} /> Trước
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer"
              >
                Tiếp <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="flex items-center gap-1 px-6 py-2 rounded-lg text-sm bg-brand text-white hover:bg-brand-light transition-colors cursor-pointer"
              >
                Bắt đầu!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
