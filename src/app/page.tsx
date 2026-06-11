"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserSwitcher } from "@/components/layout/user-switcher";
import { BANK_BLOCKS } from "@/lib/constants";
import {
  Sparkles, ArrowRight, Lightbulb, Brain, ShieldCheck, Globe,
  Zap, Award, ChevronRight, Network, Building2
} from "lucide-react";

const DepartmentOrbit = dynamic(() => import("@/components/landing/department-orbit"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[430px] overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-2xl shadow-brand/10 sm:h-[520px] lg:h-[590px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_72%_24%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,253,250,0.75))]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-28 w-28 rounded-full border border-emerald-200 bg-gradient-to-br from-brand to-brand-light shadow-2xl shadow-brand/25" />
      </div>
    </div>
  ),
});

export default function LandingPage() {
  const workflow = [
    { step: 1, icon: Lightbulb, title: "Đề xuất", desc: "Nhân viên từ bất kỳ khối nào gửi sáng kiến qua form chuẩn hóa, có auto-save để không mất ý tưởng." },
    { step: 2, icon: Brain, title: "AI Chấm điểm", desc: "AI phân tích nội dung và chấm điểm theo framework phù hợp với khối kinh doanh hoặc vận hành." },
    { step: 3, icon: ShieldCheck, title: "PIC Phản biện", desc: "Chuyên gia đầu ngành xem xét, góp ý và đưa ra quyết định dựa trên dữ liệu đánh giá rõ ràng." },
    { step: 4, icon: Globe, title: "Nhà Chung", desc: "Sáng kiến được duyệt lên Hub để toàn ngân hàng tham khảo, upvote, thảo luận và nhân rộng." },
  ];

  const features = [
    { icon: Network, title: "Kết nối 20 khối", desc: "Mỗi khối là một điểm trong mạng lưới đổi mới, nhưng mọi sáng kiến đều quay về một Hub chung." },
    { icon: Brain, title: "AI scoring minh bạch", desc: "Framework riêng cho Kinh doanh và Vận hành giúp việc đánh giá nhất quán, có giải thích và dễ phản biện." },
    { icon: Award, title: "PIC theo chuyên môn", desc: "Sáng kiến được chuyển đúng chuyên gia của khối thụ hưởng để tăng chất lượng phản biện." },
    { icon: ShieldCheck, title: "Quản trị theo ngân hàng", desc: "Luồng phê duyệt rõ ràng, lưu vết trạng thái và phù hợp với môi trường kiểm soát nội bộ." },
    { icon: Zap, title: "Từ ý tưởng đến tác động", desc: "Ý tưởng tốt không nằm trong file rời rạc; chúng được đưa vào Hub để đo lường, học hỏi và triển khai." },
    { icon: Building2, title: "Một nền tảng chung", desc: "Từ giao dịch viên đến lãnh đạo, mọi vai trò đều có cùng một nơi để đề xuất và theo dõi sáng kiến." },
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-text-primary">Innovation Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <UserSwitcher />
            <Link href="/innovations/new">
              <Button>Đề xuất Sáng kiến</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-emerald-100 bg-[linear-gradient(135deg,#F8FAFC_0%,#FFFFFF_45%,#ECFDF5_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(14,165,233,0.1),transparent_28%),radial-gradient(circle_at_78%_26%,rgba(16,185,129,0.12),transparent_32%)] pointer-events-none" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 md:py-16 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-4 py-2 text-sm font-medium text-brand shadow-sm shadow-brand/5">
              <Sparkles size={16} />
              Nền tảng Đổi mới Sáng tạo Toàn Ngân hàng
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-text-primary sm:text-5xl lg:text-6xl">
              Mỗi khối ngân hàng là một quỹ đạo sáng kiến
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-text-secondary">
              Innovation Hub kết nối {BANK_BLOCKS.length} khối trên cùng một nền tảng: nhân sự gửi ý tưởng,
              AI chấm điểm minh bạch, PIC phản biện và sáng kiến tốt được lan tỏa vào Nhà Chung.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/innovations/new">
                <Button size="lg"><ArrowRight size={18} /> Gửi Sáng kiến ngay</Button>
              </Link>
              <Link href="/hub">
                <Button size="lg" variant="secondary">Xem Nhà Chung</Button>
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
              <div className="border-l border-brand/30 pl-3">
                <p className="font-bold text-text-primary">{BANK_BLOCKS.length} khối</p>
                <p className="text-text-muted">cùng kết nối</p>
              </div>
              <div className="border-l border-sky-300 pl-3">
                <p className="font-bold text-text-primary">AI scoring</p>
                <p className="text-text-muted">theo framework</p>
              </div>
              <div className="border-l border-emerald-300 pl-3">
                <p className="font-bold text-text-primary">PIC review</p>
                <p className="text-text-muted">đúng chuyên môn</p>
              </div>
            </div>
          </div>
          <DepartmentOrbit />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-alt border-b border-border py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 grid gap-4 md:grid-cols-[0.75fr_1fr] md:items-end">
            <h2 className="text-3xl font-bold text-text-primary">Từ một điểm sáng đến mạng lưới đổi mới</h2>
            <p className="text-lg leading-relaxed text-text-secondary">
              Quy trình được thiết kế cho môi trường ngân hàng: rõ vai trò, có AI hỗ trợ,
              có chuyên gia phản biện và có không gian học hỏi chung.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {workflow.map((item) => (
              <div key={item.step} className="relative">
                <div className="h-full rounded-lg border border-border bg-white/80 p-6 shadow-sm transition-colors hover:border-brand/30">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
                    <item.icon size={28} className="text-brand" />
                  </div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">Bước {item.step}</p>
                  <h3 className="font-bold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
                {item.step < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-border">
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 grid gap-4 md:grid-cols-[0.75fr_1fr] md:items-end">
            <h2 className="text-3xl font-bold text-text-primary">Hệ sinh thái đổi mới cho ngân hàng</h2>
            <p className="text-lg leading-relaxed text-text-secondary">
              Không chỉ là nơi lưu trữ ý tưởng. Hub tạo một đường đi chung để sáng kiến được chấm,
              phản biện, công khai và nhân rộng giữa các khối.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-border bg-surface-elevated p-6 transition-colors hover:border-brand/30">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-brand" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-brand to-brand-light">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Sẵn sàng đổi mới?</h2>
          <p className="text-white/80 text-lg mb-8">
            Mỗi sáng kiến là một bước tiến cho ngân hàng. Bắt đầu hành trình đổi mới của bạn ngay hôm nay.
          </p>
          <Link href="/innovations/new">
            <Button size="lg" className="!bg-white !text-brand hover:!bg-white/90">
              <ArrowRight size={18} /> Gửi Sáng kiến đầu tiên
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 text-center text-text-muted text-sm space-y-1">
          <p className="font-medium text-text-secondary">Innovation Hub</p>
          <p>Nền tảng Đổi mới Sáng tạo Toàn Ngân hàng</p>
          <p>Dân chủ - Minh bạch - Chuyên môn - Kết nối</p>
        </div>
      </footer>
    </div>
  );
}
