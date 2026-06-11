"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BANK_BLOCKS } from "@/lib/constants";

type DepartmentBlock = (typeof BANK_BLOCKS)[number];

const businessBlocks = BANK_BLOCKS.filter((block) => block.category === "BUSINESS");
const operationsBlocks = BANK_BLOCKS.filter((block) => block.category === "OPERATIONS");

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent) => setReducedMotion(event.matches);

    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

function useWebGLAvailable() {
  return useMemo(() => {
    if (typeof document === "undefined") return false;

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      return Boolean(context);
    } catch {
      return false;
    }
  }, []);
}

function OrbitRing({ radius, color, opacity }: { radius: number; color: string; opacity: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 144]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Core() {
  const coreRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y = clock.elapsedTime * 0.18;
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <sphereGeometry args={[0.78, 48, 48]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={0.18}
          roughness={0.18}
          metalness={0.18}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.018, 8, 96]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[0.98, 0.3, 0.38]}>
        <torusGeometry args={[1.14, 0.01, 8, 96]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.28} />
      </mesh>
    </group>
  );
}



function DepartmentNode({
  block,
  angle,
  radius,
  y,
  index,
  isSlowed,
  reducedMotion,
  onHover,
}: {
  block: DepartmentBlock;
  angle: number;
  radius: number;
  y: number;
  index: number;
  isSlowed: boolean;
  reducedMotion: boolean;
  onHover: (block: DepartmentBlock | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRef = useRef<THREE.Mesh>(null);
  const isBusiness = block.category === "BUSINESS";
  const nodeColor = isBusiness ? "#0284C7" : "#059669";
  const beamColor = isBusiness ? "#38BDF8" : "#34D399";
  const orbitSpeed = isBusiness ? 0.16 : -0.12;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = reducedMotion ? 0 : orbitSpeed * (isSlowed ? 0.28 : 1);
    groupRef.current.rotation.y = angle + clock.elapsedTime * speed;

    if (!nodeRef.current || reducedMotion) return;
    const lift = Math.sin(clock.elapsedTime * 1.7 + index) * 0.035;
    nodeRef.current.position.y = y + lift;
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(block);
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(null);
  };

  return (
    <group ref={groupRef} rotation={[0, angle, 0]}>

      <mesh
        ref={nodeRef}
        position={[radius, y, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[isBusiness ? 0.16 : 0.145, 24, 24]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={0.16}
          roughness={0.28}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[radius, y, 0]} scale={isBusiness ? 1.18 : 1.08}>
        <sphereGeometry args={[isBusiness ? 0.2 : 0.18, 18, 18]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitScene({
  hovered,
  reducedMotion,
  onHover,
}: {
  hovered: DepartmentBlock | null;
  reducedMotion: boolean;
  onHover: (block: DepartmentBlock | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.68} />
      <directionalLight position={[3.5, 4, 5]} intensity={1.1} />
      <pointLight position={[-4, 2, 4]} intensity={0.5} color="#A7F3D0" />

      <group rotation={[-0.28, 0, 0]}>
        <OrbitRing radius={3.05} color="#0EA5E9" opacity={0.22} />
        <OrbitRing radius={4.15} color="#10B981" opacity={0.2} />
        <Core />

        {operationsBlocks.map((block, index) => (
          <DepartmentNode
            key={block.code}
            block={block}
            angle={(index / operationsBlocks.length) * Math.PI * 2}
            radius={3.05}
            y={index % 2 === 0 ? 0.22 : -0.16}
            index={index}
            isSlowed={Boolean(hovered)}
            reducedMotion={reducedMotion}
            onHover={onHover}
          />
        ))}

        {businessBlocks.map((block, index) => (
          <DepartmentNode
            key={block.code}
            block={block}
            angle={(index / businessBlocks.length) * Math.PI * 2}
            radius={4.15}
            y={index % 2 === 0 ? 0.36 : -0.24}
            index={index + operationsBlocks.length}
            isSlowed={Boolean(hovered)}
            reducedMotion={reducedMotion}
            onHover={onHover}
          />
        ))}
      </group>
    </>
  );
}

function StaticOrbitFallback() {
  const blocks = [...businessBlocks, ...operationsBlocks];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[min(74vw,430px)] w-[min(74vw,430px)]">
        <div className="absolute inset-[9%] rounded-full border border-sky-300/50" />
        <div className="absolute inset-[22%] rounded-full border border-emerald-300/60" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200 bg-gradient-to-br from-brand to-brand-light shadow-2xl shadow-brand/25" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-xl" />

        {blocks.map((block, index) => {
          const isBusiness = block.category === "BUSINESS";
          const ringRadius = isBusiness ? 41 : 29;
          const angle = (index / blocks.length) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + Math.cos(angle) * ringRadius;
          const top = 50 + Math.sin(angle) * ringRadius;

          return (
            <div
              key={block.code}
              className={[
                "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[9px] font-bold shadow-sm",
                isBusiness
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              ].join(" ")}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={block.name}
            >
              {block.code.slice(0, 2)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DepartmentOrbit() {
  const reducedMotion = usePrefersReducedMotion();
  const webglAvailable = useWebGLAvailable();
  const [hovered, setHovered] = useState<DepartmentBlock | null>(null);
  const activeBlock = hovered ?? {
    code: "20 khối",
    name: "Toàn ngân hàng cùng đề xuất, phản biện và lan tỏa sáng kiến",
    category: "BUSINESS",
  };

  return (
    <div
      className="department-orbit-canvas relative h-[430px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-2xl shadow-brand/10 backdrop-blur sm:h-[520px] lg:h-[590px]"
      aria-label="Minh họa 20 khối ngân hàng kết nối quanh Innovation Hub"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_72%_24%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,253,250,0.75))]" />
      <div className="absolute inset-x-8 top-8 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        <span>Department Orbit</span>
        <span>{BANK_BLOCKS.length} khối</span>
      </div>

      {webglAvailable ? (
        <Canvas
          className="h-full w-full"
          camera={{ position: [0, 5.1, 8.2], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ height: "100%", width: "100%" }}
        >
          <OrbitScene hovered={hovered} reducedMotion={reducedMotion} onHover={setHovered} />
        </Canvas>
      ) : (
        <StaticOrbitFallback />
      )}

      <div className="pointer-events-none absolute inset-x-5 bottom-5 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-lg shadow-slate-200/70 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {hovered ? "Khối đang kết nối" : "Innovation Hub"}
            </p>
            <p className="mt-1 text-lg font-bold text-text-primary">{activeBlock.code}</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-text-secondary">{activeBlock.name}</p>
          </div>
          <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
            AI scoring
          </div>
        </div>
      </div>
    </div>
  );
}
