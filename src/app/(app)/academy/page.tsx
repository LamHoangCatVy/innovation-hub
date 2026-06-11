"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Lightbulb, Brain, FileText, Target, Award,
  BookOpen, ArrowRight, CheckCircle2, Star
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MODULES = [
  {
    icon: Lightbulb,
    title: "Module 1: Tư duy Đổi mới Sáng tạo",
    desc: "Hiểu về innovation mindset. Cách nhận diện vấn đề và phát triển ý tưởng đột phá trong môi trường ngân hàng.",
    topics: ["Design Thinking cơ bản", "Problem Statement Framework", "Ideation techniques"],
    duration: "20 phút",
  },
  {
    icon: FileText,
    title: "Module 2: Viết Sáng kiến Hiệu quả",
    desc: "Học cách viết Executive Summary, Pain Points và Giải pháp chi tiết để đạt điểm AI cao nhất.",
    topics: ["Cấu trúc Executive Summary", "Mô tả Pain Points thuyết phục", "Kế hoạch triển khai SMART"],
    duration: "25 phút",
  },
  {
    icon: Brain,
    title: "Module 3: Hiểu về AI Chấm điểm",
    desc: "Cách AI phân tích và chấm điểm sáng kiến. Chiến lược tối ưu để đạt điểm cao với RICE và Operational Framework.",
    topics: ["RICE Framework (Reach, Impact, Confidence, Effort)", "Operational Framework", "Cách tính Normalised Score"],
    duration: "30 phút",
  },
  {
    icon: Target,
    title: "Module 4: Align với Chiến lược Khối",
    desc: "Cách đảm bảo sáng kiến của bạn phù hợp với chiến lược và KPI của khối, tăng tỉ lệ được phê duyệt.",
    topics: ["OKR & KPI alignment", "Business case writing", "Stakeholder analysis"],
    duration: "25 phút",
  },
  {
    icon: Award,
    title: "Module 5: Best Practices & Case Studies",
    desc: "Học từ các sáng kiến thành công. Phân tích case study thực tế từ các khối trong ngân hàng.",
    topics: ["Top sáng kiến 2026", "Bài học từ sáng kiến bị từ chối", "PIC feedback patterns"],
    duration: "20 phút",
  },
];

const RESOURCES = [
  { icon: BookOpen, title: "Cẩm nang ĐMST", desc: "Tài liệu hướng dẫn toàn diện về quy trình đổi mới sáng tạo." },
  { icon: Star, title: "Template Sáng kiến", desc: "Mẫu form chuẩn giúp bạn viết sáng kiến chuyên nghiệp." },
  { icon: CheckCircle2, title: "Checklist Trước khi Gửi", desc: "Danh sách kiểm tra để đảm bảo sáng kiến đạt chuẩn." },
];

export default function AcademyPage() {
  return (
    <>
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={24} className="text-brand" />
            <Badge variant="success">Beta</Badge>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Innovation Academy</h1>
          <p className="text-text-secondary mt-1">
            Học viện Đổi mới Sáng tạo - Nơi bạn phát triển kỹ năng và kiến thức để tạo ra những sáng kiến đột phá
          </p>
        </div>

        {/* Progress */}
        <Card className="p-6 bg-gradient-to-r from-brand/5 to-transparent border-brand/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Lộ trình học tập của bạn</p>
              <p className="text-xs text-text-muted mt-1">Hoàn thành 5 modules để nhận chứng chỉ Innovation Champion</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand">0/5</p>
              <p className="text-xs text-text-muted">Modules hoàn thành</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-surface-alt rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: "0%" }} />
          </div>
        </Card>

        {/* Modules */}
        <div className="grid gap-4">
          {MODULES.map((m, i) => (
            <Card key={i} className="p-6 flex items-start gap-5 hover:border-brand/30 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                <m.icon size={24} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary group-hover:text-brand transition-colors">{m.title}</h3>
                  <Badge>{m.duration}</Badge>
                </div>
                <p className="text-sm text-text-secondary mb-3">{m.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {m.topics.map((t, j) => (
                    <span key={j} className="text-xs px-2 py-1 rounded-md bg-surface-alt text-text-muted border border-border">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight size={20} className="text-text-muted group-hover:text-brand group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
            </Card>
          ))}
        </div>

        {/* Resources */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-4">Tài nguyên</h2>
          <div className="grid grid-cols-3 gap-4">
            {RESOURCES.map((r, i) => (
              <Card key={i} className="p-5 text-center hover:border-brand/30 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center mx-auto mb-3">
                  <r.icon size={20} className="text-brand" />
                </div>
                <h3 className="font-semibold text-text-primary text-sm mb-1">{r.title}</h3>
                <p className="text-xs text-text-secondary">{r.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="p-8 text-center bg-gradient-to-r from-brand/5 to-transparent border-brand/20">
          <GraduationCap size={40} className="mx-auto text-brand mb-3" />
          <h3 className="text-lg font-bold text-text-primary mb-2">Sẵn sàng nâng tầm sáng kiến của bạn?</h3>
          <p className="text-text-secondary text-sm mb-4">
            Hoàn thành Innovation Academy để trở thành Innovation Champion và nhận huy hiệu đặc biệt.
          </p>
          <Link href="/innovations/new">
            <Button>Bắt đầu với Sáng kiến đầu tiên <ArrowRight size={16} /></Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
