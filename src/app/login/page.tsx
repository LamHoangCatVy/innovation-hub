"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  username: z.string().min(1, "Vui lòng nhập tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServerError(data.error || "Đăng nhập thất bại");
      return;
    }
    const next = searchParams.get("next");
    const fallback = data.user?.role === "ADMIN" ? "/dashboard" : "/hub";
    router.push(next && next.startsWith("/") ? next : fallback);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Innovation Hub</h1>
          <p className="text-sm text-text-secondary mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface-elevated border border-border rounded-2xl shadow-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Tên đăng nhập
            </label>
            <Input
              {...register("username")}
              placeholder="vd: admin"
              autoComplete="username"
              autoFocus
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Mật khẩu
            </label>
            <Input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            <LogIn size={16} />
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <p className="text-xs text-text-muted text-center pt-2">
            Tài khoản demo: <span className="font-medium text-text-secondary">admin</span> /{" "}
            <span className="font-medium text-text-secondary">Innovation@2026</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
