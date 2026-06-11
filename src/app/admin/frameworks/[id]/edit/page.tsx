"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriterionInput {
  id?: string;
  name: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
}

export default function EditFrameworkPage() {
  const router = useRouter();
  const params = useParams();
  const frameworkId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formula, setFormula] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [criteria, setCriteria] = useState<CriterionInput[]>([]);
  const [blockMapping, setBlockMapping] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/frameworks/${frameworkId}`)
      .then((r) => r.json())
      .then((data) => {
        setName(data.name || "");
        setDescription(data.description || "");
        setFormula(data.formula || "");
        setIsActive(data.isActive ?? true);
        setCriteria(data.criteria?.length ? data.criteria : [{ name: "", description: "", weight: 1, minScore: 1, maxScore: 5 }]);
        setBlockMapping(data.blockMapping || []);
      })
      .finally(() => setLoading(false));
  }, [frameworkId]);

  const addCriterion = () => setCriteria([...criteria, { name: "", description: "", weight: 1, minScore: 1, maxScore: 5 }]);
  const removeCriterion = (index: number) => setCriteria(criteria.filter((_, i) => i !== index));
  const updateCriterion = (index: number, field: keyof CriterionInput, value: string | number) => {
    setCriteria(criteria.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };
  const toggleBlock = (code: string) => {
    setBlockMapping((prev) => (prev.includes(code) ? prev.filter((b) => b !== code) : [...prev, code]));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !formula.trim()) { setError("Tên và công thức là bắt buộc"); return; }
    setSubmitting(true);
    setError("");
    try {
      await fetch(`/api/frameworks/${frameworkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, formula, isActive, criteria, blockMapping }),
      });
      router.push("/admin/frameworks");
    } catch {
      setError("Không thể cập nhật framework");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-12"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/frameworks"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
          <h1 className="text-2xl font-bold text-text-primary">Chỉnh sửa Framework</h1>
        </div>

        <Card className="p-8 space-y-6">
          <div>
            <Label>Tên Framework *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
          </div>
          <div>
            <Label>Công thức *</Label>
            <Input value={formula} onChange={(e) => setFormula(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Label>Trạng thái</Label>
            <button
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium border cursor-pointer transition-all",
                isActive ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-border bg-surface-alt text-text-muted"
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Danh mục tiêu chí ({criteria.length})</Label>
              <Button variant="outline" size="sm" onClick={addCriterion}><Plus size={14} /> Thêm</Button>
            </div>
            <div className="space-y-3">
              {criteria.map((c, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-lg bg-surface-alt border border-border">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Tên tiêu chí" value={c.name} onChange={(e) => updateCriterion(i, "name", e.target.value)} />
                    <Input placeholder="Mô tả" value={c.description} onChange={(e) => updateCriterion(i, "description", e.target.value)} />
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Trọng số" value={c.weight} onChange={(e) => updateCriterion(i, "weight", parseFloat(e.target.value) || 1)} className="w-24" />
                      <Input type="number" placeholder="Min" value={c.minScore} onChange={(e) => updateCriterion(i, "minScore", parseInt(e.target.value) || 1)} className="w-20" />
                      <Input type="number" placeholder="Max" value={c.maxScore} onChange={(e) => updateCriterion(i, "maxScore", parseInt(e.target.value) || 5)} className="w-20" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeCriterion(i)}><Trash2 size={14} className="text-red-400" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Gắn cho các khối</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {["RB", "CMB", "CIB", "Treasury", "IB", "Card", "Bancass", "Digital", "WM", "FI", "Ops", "Risk", "Legal", "Fin", "HR", "IT", "Strategy", "Marketing", "Audit", "Admin"].map((code) => (
                <button key={code} onClick={() => toggleBlock(code)}
                  className={cn("px-2 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer",
                    blockMapping.includes(code) ? "border-brand bg-brand/15 text-brand" : "border-border text-text-muted hover:border-brand/30")}
                >{code}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3">
            <Link href="/admin/frameworks"><Button variant="outline">Hủy</Button></Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Spinner size={16} /> : <Save size={16} />} Cập nhật
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
