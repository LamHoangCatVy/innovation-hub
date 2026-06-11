"use client";

import dynamic from "next/dynamic";

const OrbitPlaceholder = () => (
  <div className="relative h-[430px] overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-2xl shadow-brand/10 sm:h-[520px] lg:h-[590px]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_72%_24%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,253,250,0.75))]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-28 w-28 rounded-full border border-emerald-200 bg-gradient-to-br from-brand to-brand-light shadow-2xl shadow-brand/25" />
    </div>
  </div>
);

const DepartmentOrbit = dynamic(() => import("@/components/landing/department-orbit"), {
  ssr: false,
  loading: OrbitPlaceholder,
});

const SupernovaOrbit = dynamic(() => import("@/components/landing/supernova-orbit"), {
  ssr: false,
  loading: OrbitPlaceholder,
});

export function OrbitSwitcher({ variant }: { variant: "department" | "supernova" }) {
  return variant === "supernova" ? <SupernovaOrbit /> : <DepartmentOrbit />;
}
