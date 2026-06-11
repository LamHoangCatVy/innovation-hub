import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, CheckCircle2, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tổng quan Đổi mới Sáng tạo</h1>
          <p className="text-text-secondary mt-1">Trang tổng quan hoạt động sáng kiến toàn ngân hàng</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Tổng sáng kiến", value: "0", icon: Lightbulb, color: "text-brand" },
            { label: "Đã phê duyệt", value: "0", icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Đang xử lý", value: "0", icon: TrendingUp, color: "text-amber-400" },
            { label: "Người dùng", value: "0", icon: Users, color: "text-purple-400" },
          ].map((stat, i) => (
            <Card key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-alt border border-border flex items-center justify-center">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">Sáng kiến gần đây</h2>
            <Badge>Chưa có dữ liệu</Badge>
          </div>
          <p className="text-text-muted text-sm text-center py-12">
            Chưa có sáng kiến nào. Hãy bắt đầu bằng cách tạo đề xuất mới.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
