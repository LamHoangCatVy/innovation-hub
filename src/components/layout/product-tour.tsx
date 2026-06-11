"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="sidebar"]',
    title: "Menu Điều hướng",
    description: "Từ đây bạn có thể truy cập tất cả các chức năng: Tổng quan, Đề xuất mới, Bản nháp, Phê duyệt PIC, và Nhà Chung.",
    position: "right",
  },
  {
    selector: '[data-tour="new-idea"]',
    title: "Đề xuất Sáng kiến mới",
    description: "Nhấn vào đây để bắt đầu tạo một sáng kiến mới. Bạn sẽ được hướng dẫn từng bước: nhập thông tin, chọn khối thụ hưởng, và gửi để AI chấm điểm.",
    position: "right",
  },
  {
    selector: '[data-tour="role-switcher"]',
    title: "Chuyển đổi vai trò",
    description: "Bạn có thể chuyển đổi giữa Admin (quản trị toàn hệ thống) và Staff (nhân viên các khối). Mỗi vai trò có quyền hạn và giao diện khác nhau.",
    position: "bottom",
  },
  {
    selector: '[data-tour="review"]',
    title: "Phê duyệt Sáng kiến (PIC)",
    description: "Tại đây bạn có thể xem và phê duyệt các sáng kiến thuộc khối mình phụ trách. Chọn Approve, Reject hoặc Yêu cầu chỉnh sửa.",
    position: "right",
  },
  {
    selector: '[data-tour="hub"]',
    title: "Nhà Chung",
    description: "Khám phá tất cả sáng kiến đã được phê duyệt. Bạn có thể upvote, bình luận, lọc theo khối và điểm số.",
    position: "right",
  },
  {
    selector: '[data-tour="yumai"]',
    title: "YumAI Assistant",
    description: "Trợ lý AI thông minh của bạn! Hỏi bất cứ điều gì về quy trình đổi mới sáng tạo: cách tạo sáng kiến, tiêu chí chấm điểm, quy trình phê duyệt...",
    position: "left",
  },
];

export function ProductTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const dismissed = localStorage.getItem("vpb_tour_done");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem("vpb_tour_done", "1");
  }, []);

  useEffect(() => {
    if (!visible) return;
    const current = TOUR_STEPS[step];
    const el = document.querySelector(current?.selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const rect = el.getBoundingClientRect();
    const pos = current.position;
    const style: React.CSSProperties = {};
    const gap = 16;

    switch (pos) {
      case "right":
        style.top = rect.top + rect.height / 2;
        style.left = rect.right + gap;
        style.transform = "translateY(-50%)";
        break;
      case "left":
        style.top = rect.top + rect.height / 2;
        style.right = window.innerWidth - rect.left + gap;
        style.transform = "translateY(-50%)";
        break;
      case "top":
        style.top = rect.top - gap;
        style.left = rect.left + rect.width / 2;
        style.transform = "translate(-50%, -100%)";
        break;
      case "bottom":
        style.top = rect.bottom + gap;
        style.left = rect.left + rect.width / 2;
        style.transform = "translateX(-50%)";
        break;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTooltipStyle(style);
  }, [step, visible]);

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40 transition-colors" onClick={dismiss} />

      <div
        className="fixed z-[80] w-[320px] bg-surface-elevated border border-border rounded-xl shadow-2xl p-5 transition-all duration-300"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
            {step + 1}/{TOUR_STEPS.length}
          </span>
          <button onClick={dismiss} className="p-0.5 hover:bg-surface-alt rounded text-text-muted cursor-pointer">
            <X size={14} />
          </button>
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-1">{current?.title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed">{current?.description}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn("w-1.5 h-1.5 rounded-full transition-all", i === step ? "bg-brand w-4" : "bg-border")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {isLast ? (
              <button onClick={dismiss} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand-light cursor-pointer">
                Hoàn tất
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-brand text-white hover:bg-brand-light cursor-pointer"
              >
                Tiếp <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {current && (
        <div
          className="fixed z-[75] border-2 border-brand rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] transition-all duration-300 pointer-events-none animate-pulse"
          style={{
            top: (document.querySelector(current.selector)?.getBoundingClientRect().top ?? 0) - 4,
            left: (document.querySelector(current.selector)?.getBoundingClientRect().left ?? 0) - 4,
            width: (document.querySelector(current.selector)?.getBoundingClientRect().width ?? 0) + 8,
            height: (document.querySelector(current.selector)?.getBoundingClientRect().height ?? 0) + 8,
          }}
        />
      )}
    </>
  );
}
