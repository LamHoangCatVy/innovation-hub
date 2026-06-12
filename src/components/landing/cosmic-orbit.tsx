"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { BANK_BLOCKS } from "@/lib/constants";

type DepartmentBlock = (typeof BANK_BLOCKS)[number];

const businessBlocks = BANK_BLOCKS.filter((block) => block.category === "BUSINESS");
const operationsBlocks = BANK_BLOCKS.filter((block) => block.category === "OPERATIONS");

const SKY = "#38BDF8";
const SKY_DEEP = "#0EA5E9";
const EMERALD = "#34D399";
const EMERALD_DEEP = "#10B981";

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

/** Subtle camera float for parallax/depth — eased, and frozen while hovering. */
function Rig({ reducedMotion, hoverRef }: { reducedMotion: boolean; hoverRef: React.RefObject<string | null> }) {
  const target = useRef(new THREE.Vector3(0, 5.1, 8.2));
  useFrame((state) => {
    // Only advance the target when not paused; the camera eases toward it both
    // ways, so freezing on hover and resuming are both smooth (no jump).
    if (!reducedMotion && hoverRef.current === null) {
      const t = state.clock.elapsedTime;
      target.current.set(Math.sin(t * 0.15) * 0.6, 5.1 + Math.sin(t * 0.22) * 0.35, 8.2);
    }
    state.camera.position.lerp(target.current, 0.04);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function GlowRing({ radius, color, opacity }: { radius: number; color: string; opacity: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.018, 12, 180]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Core({ reducedMotion }: { reducedMotion: boolean }) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!coreRef.current || reducedMotion) return;
    coreRef.current.rotation.y += delta * 0.5; // steady, visible self-rotation
  });

  return (
    <group ref={coreRef} rotation={[0.35, 0, 0.12]}>
      {/* bright emissive sun with a churning surface (bloom turns this into a glow) */}
      <mesh>
        <sphereGeometry args={[0.82, 96, 96]} />
        <MeshDistortMaterial
          color={EMERALD}
          emissive={EMERALD_DEEP}
          emissiveIntensity={2.2}
          roughness={0.3}
          metalness={0.1}
          distort={reducedMotion ? 0 : 0.28}
          speed={1.8}
        />
      </mesh>

      {/* additive glow shells */}
      <mesh scale={1.35}>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshBasicMaterial color={EMERALD} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={1.9}>
        <sphereGeometry args={[0.82, 24, 24]} />
        <meshBasicMaterial color={EMERALD_DEEP} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2.4} distance={9} color={EMERALD} />
      {/* core halo rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.06, 0.02, 12, 120]} />
        <meshBasicMaterial color={EMERALD} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.98, 0.3, 0.38]}>
        <torusGeometry args={[1.2, 0.012, 12, 120]} />
        <meshBasicMaterial color={SKY} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Expanding shockwave ring emitted from the core periodically. */
function Shockwave({ reducedMotion, period, hoverRef }: { reducedMotion: boolean; period: number; hoverRef: React.RefObject<string | null> }) {
  const waveRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = waveRef.current;
    if (!mesh) return;
    if (reducedMotion || hoverRef.current !== null) {
      mesh.visible = false;
      return;
    }
    const time = clock.elapsedTime % period;
    if (time < 1.6) {
      mesh.visible = true;
      const progress = time / 1.6;
      const scale = 1 + progress * 5;
      mesh.scale.set(scale, scale, scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
    } else {
      mesh.visible = false;
    }
  });
  return (
    <mesh ref={waveRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
      <torusGeometry args={[1, 0.035, 16, 140]} />
      <meshBasicMaterial color={EMERALD} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function Beam({ radius, y, color, beamRef }: { radius: number; y: number; color: string; beamRef: React.RefObject<THREE.Mesh | null> }) {
  const { position, quaternion, length } = useMemo(() => {
    const end = new THREE.Vector3(radius, y, 0);
    const dir = end.clone();
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: end.clone().multiplyScalar(0.5), quaternion: q, length: len };
  }, [radius, y]);

  return (
    <mesh ref={beamRef} position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.012, 0.004, length, 6]} />
      {/* hidden by default — only the hovered node's beam fades in */}
      <meshBasicMaterial color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

const DepartmentNode = memo(function DepartmentNode({
  block,
  angle,
  radius,
  y,
  index,
  reducedMotion,
  energetic,
  period,
  hoverRef,
  onHover,
}: {
  block: DepartmentBlock;
  angle: number;
  radius: number;
  y: number;
  index: number;
  reducedMotion: boolean;
  energetic: boolean;
  period: number;
  hoverRef: React.RefObject<string | null>;
  onHover: (block: DepartmentBlock | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const isBusiness = block.category === "BUSINESS";
  const nodeColor = isBusiness ? SKY : EMERALD;
  const deepColor = isBusiness ? SKY_DEEP : EMERALD_DEEP;
  const orbitSpeed = isBusiness ? 0.16 : -0.12;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    // Hover is read from a ref each frame — no React re-render, no stutter.
    const isHovered = hoverRef.current === block.code;
    const anyHover = hoverRef.current !== null;
    const frozen = reducedMotion || anyHover;

    // Accumulate rotation by delta·speed so changing/stopping the speed never
    // teleports the planet. When hovering, speed is 0 → a clean, stable freeze.
    if (!frozen) groupRef.current.rotation.y += delta * orbitSpeed;

    const t = clock.elapsedTime;

    if (nodeRef.current) {
      if (!frozen) nodeRef.current.position.y = y + Math.sin(t * 1.7 + index) * 0.04;
      const targetScale = isHovered ? 1.5 : 1;
      nodeRef.current.scale.setScalar(THREE.MathUtils.lerp(nodeRef.current.scale.x, targetScale, 0.15));

      let burst = 0;
      if (!frozen) {
        const time = t % period;
        if (time < 1.6) {
          const currentRadius = 1 + (time / 1.6) * 5;
          const dist = Math.abs(currentRadius - radius);
          if (dist < 0.6) burst = (0.6 - dist) * (energetic ? 2.0 : 1.3);
        }
      }
      const mat = nodeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (isHovered ? 2.6 : 1.25) + burst;
    }

    if (haloRef.current) {
      const pulse = 0.16 + (frozen ? 0 : Math.sin(t * 2 + index) * 0.05) + (isHovered ? 0.3 : 0);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    if (beamRef.current) {
      // Beam only appears for the hovered node — steady (no shimmer) for stability.
      const m = beamRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = THREE.MathUtils.lerp(m.opacity, isHovered ? 0.42 : 0, 0.2);
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(block);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(null);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} rotation={[0, angle, 0]}>
      <Beam radius={radius} y={y} color={nodeColor} beamRef={beamRef} />

      <mesh
        ref={nodeRef}
        position={[radius, y, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[isBusiness ? 0.17 : 0.15, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={deepColor}
          emissiveIntensity={1.25}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* additive halo */}
      <mesh ref={haloRef} position={[radius, y, 0]} scale={isBusiness ? 2.1 : 1.95}>
        <sphereGeometry args={[isBusiness ? 0.17 : 0.15, 18, 18]} />
        <meshBasicMaterial color={nodeColor} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
});

const OrbitScene = memo(function OrbitScene({
  hoverRef,
  reducedMotion,
  energetic,
  onHover,
}: {
  hoverRef: React.RefObject<string | null>;
  reducedMotion: boolean;
  energetic: boolean;
  onHover: (block: DepartmentBlock | null) => void;
}) {
  const period = energetic ? 4.5 : 6.5;
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3.5, 4, 5]} intensity={0.5} />
      <pointLight position={[-5, 3, 4]} intensity={0.6} color={SKY} />

      <Stars radius={60} depth={40} count={energetic ? 2200 : 1500} factor={3} fade speed={reducedMotion ? 0 : 0.6} />
      <Sparkles
        count={energetic ? 90 : 60}
        scale={[11, 7, 11]}
        size={3}
        speed={reducedMotion ? 0 : 0.4}
        opacity={0.7}
        color={EMERALD}
      />

      <group rotation={[-0.3, 0, 0]}>
        <GlowRing radius={3.05} color={SKY} opacity={0.32} />
        <GlowRing radius={4.15} color={EMERALD} opacity={0.3} />
        <Shockwave reducedMotion={reducedMotion} period={period} hoverRef={hoverRef} />
        <Core reducedMotion={reducedMotion} />

        {operationsBlocks.map((block, index) => (
          <DepartmentNode
            key={block.code}
            block={block}
            angle={(index / operationsBlocks.length) * Math.PI * 2}
            radius={3.05}
            y={index % 2 === 0 ? 0.22 : -0.16}
            index={index}
            reducedMotion={reducedMotion}
            energetic={energetic}
            period={period}
            hoverRef={hoverRef}
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
            reducedMotion={reducedMotion}
            energetic={energetic}
            period={period}
            hoverRef={hoverRef}
            onHover={onHover}
          />
        ))}
      </group>

      <EffectComposer>
        <Bloom intensity={1.25} luminanceThreshold={0.15} luminanceSmoothing={0.6} mipmapBlur radius={0.7} />
      </EffectComposer>
    </>
  );
});

function StaticOrbitFallback() {
  const blocks = [...businessBlocks, ...operationsBlocks];
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-[min(74vw,430px)] w-[min(74vw,430px)]">
        <div className="absolute inset-[9%] rounded-full border border-sky-400/30" />
        <div className="absolute inset-[22%] rounded-full border border-emerald-400/40" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand to-brand-light shadow-[0_0_60px_rgba(16,185,129,0.7)]" />
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/40 blur-xl" />
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
                "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[9px] font-bold",
                isBusiness
                  ? "border-sky-400/40 bg-sky-500/20 text-sky-200 shadow-[0_0_14px_rgba(56,189,248,0.5)]"
                  : "border-emerald-400/40 bg-emerald-500/20 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.5)]",
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

export default function CosmicOrbit({ energetic = false }: { energetic?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const webglAvailable = useWebGLAvailable();
  // hovered (state) drives only the DOM readout card; hoverRef drives the 3D
  // scene each frame so pointer moves never re-render the canvas.
  const [hovered, setHovered] = useState<DepartmentBlock | null>(null);
  const hoverRef = useRef<string | null>(null);
  const handleHover = useCallback((block: DepartmentBlock | null) => {
    hoverRef.current = block ? block.code : null;
    setHovered(block);
  }, []);
  const activeBlock = hovered ?? {
    code: "20 khối",
    name: "Toàn ngân hàng cùng đề xuất, phản biện và lan tỏa sáng kiến",
    category: "BUSINESS" as const,
  };

  return (
    <div
      className="cosmic-orbit-canvas relative h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#05080f] shadow-2xl shadow-brand/20 sm:h-[520px] lg:h-[590px]"
      aria-label="Minh họa 20 khối ngân hàng kết nối quanh Innovation Hub"
    >
      {/* nebula backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(16,185,129,0.28),transparent_42%),radial-gradient(circle_at_74%_22%,rgba(56,189,248,0.22),transparent_40%),radial-gradient(circle_at_22%_82%,rgba(14,165,233,0.16),transparent_45%),linear-gradient(160deg,#070b14,#05080f)]" />

      <div className="absolute inset-x-8 top-8 z-10 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
        <span className={energetic ? "text-amber-300/80" : "text-emerald-300/80"}>
          {energetic ? "Supernova Burst" : "Cosmic Orbit"}
        </span>
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
          <Rig reducedMotion={reducedMotion} hoverRef={hoverRef} />
          <OrbitScene hoverRef={hoverRef} reducedMotion={reducedMotion} energetic={energetic} onHover={handleHover} />
        </Canvas>
      ) : (
        <StaticOrbitFallback />
      )}

      {/* hover readout — dark glass */}
      <div className="pointer-events-none absolute inset-x-5 bottom-5 z-10 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {hovered ? "Khối đang kết nối" : "Innovation Hub"}
            </p>
            <p className="mt-1 text-lg font-bold text-white">{activeBlock.code}</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-white/70">{activeBlock.name}</p>
          </div>
          <div className="hidden rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200 sm:block">
            AI scoring
          </div>
        </div>
      </div>
    </div>
  );
}
