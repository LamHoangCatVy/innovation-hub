"use client";

import dynamic from "next/dynamic";

const OrbitPlaceholder = () => (
  <div className="cosmic-orbit-canvas relative h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#05080f] shadow-2xl shadow-brand/20 sm:h-[520px] lg:h-[590px]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(16,185,129,0.28),transparent_42%),radial-gradient(circle_at_74%_22%,rgba(56,189,248,0.22),transparent_40%),linear-gradient(160deg,#070b14,#05080f)]" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-28 w-28 rounded-full bg-gradient-to-br from-brand to-brand-light shadow-[0_0_70px_rgba(16,185,129,0.7)]" />
    </div>
  </div>
);

const CosmicOrbit = dynamic(() => import("@/components/landing/cosmic-orbit"), {
  ssr: false,
  loading: OrbitPlaceholder,
});

export function OrbitSwitcher({ variant }: { variant: "department" | "supernova" }) {
  return <CosmicOrbit energetic={variant === "supernova"} />;
}
