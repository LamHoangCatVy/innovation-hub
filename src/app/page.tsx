"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserSwitcher } from "@/components/layout/user-switcher";
import {
  Sparkles, ArrowRight, Lightbulb, Brain, ShieldCheck, Globe,
  Zap, Award, ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-sm text-brand mb-6">
            <Sparkles size={16} />
            Nền tảng Đổi mới Sáng tạo Toàn Ngân hàng
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary leading-tight mb-4">
            Nơi mọi ý tưởng<br />
            <span className="text-brand">đều được lắng nghe</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Innovation Hub là nền tảng dân chủ hóa sáng kiến - từ giao dịch viên đến lãnh đạo,
            mọi cấp bậc đều có quyền đề xuất ý tưởng, được AI chấm điểm minh bạch
            và phản biện bởi chuyên gia đầu ngành trong từng khối.
          </p>
          <Link href="/innovations/new">
            <Button size="lg"><ArrowRight size={18} /> Gửi Sáng kiến ngay</Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface-alt border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold text-text-primary">Quy trình Dân chủ Sáng kiến</h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg">
              Mọi ý tưởng đều đi qua quy trình minh bạch, công bằng và chuyên nghiệp
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: Lightbulb, title: "Đề xuất", desc: "Nhân viên bất kỳ gửi sáng kiến qua form chuẩn hóa. Hệ thống tự động lưu nháp." },
              { step: 2, icon: Brain, title: "AI Chấm điểm", desc: "AI phân tích và chấm điểm theo bộ tiêu chí chuyên biệt của từng khối kinh doanh hoặc vận hành." },
              { step: 3, icon: ShieldCheck, title: "PIC Phản biện", desc: "Chuyên gia đầu ngành trong khối xem xét, góp ý và đưa ra quyết định phê duyệt." },
              { step: 4, icon: Globe, title: "Công khai & Học hỏi", desc: "Sáng kiến được duyệt lên Nhà Chung để toàn ngân hàng tham khảo, upvote và thảo luận." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-surface-elevated border border-border rounded-xl p-6 text-center h-full">
                  <div className="w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={28} className="text-brand" />
                  </div>
                  <p className="text-xs font-bold text-brand mb-2">BƯỚC {item.step}</p>
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
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-bold text-text-primary">Hệ sinh thái Đổi mới Toàn diện</h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg">
              Không chỉ là nơi lưu trữ ý tưởng - Innovation Hub là nền tảng đổi mới sáng tạo end-to-end
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Dân chủ & Minh bạch", desc: "Mọi cấp bậc đều có tiếng nói ngang nhau. AI chấm điểm khách quan, không thiên vị." },
              { icon: Award, title: "Chuyên môn hóa theo khối", desc: "2 bộ framework cho Kinh doanh & Vận hành. PIC là chuyên gia phản biện." },
              { icon: Lightbulb, title: "Kết nối 20 Khối", desc: "Nhà Chung là không gian giao lưu, học hỏi và chia sẻ sáng kiến xuyên suốt." },
              { icon: ShieldCheck, title: "Đo lường & Cải tiến", desc: "Dashboard real-time theo dõi KPI đổi mới sáng tạo toàn ngân hàng." },
              { icon: Brain, title: "AI-Assisted Scoring", desc: "LLM chấm điểm tự động, phân tích ngữ nghĩa, nhận xét chi tiết từng tiêu chí." },
              { icon: Globe, title: "Quy trình Chuẩn hóa", desc: "Luồng E2E 7 bước: Đề xuất → Auto-save → Phân loại → AI → PIC → Hub → Hoàn tất." },
            ].map((f, i) => (
              <div key={i} className="bg-surface-elevated border border-border rounded-xl p-6 hover:border-brand/30 transition-colors">
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
