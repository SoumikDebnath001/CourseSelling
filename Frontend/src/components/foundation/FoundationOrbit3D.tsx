"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Sparkles, useTexture, Preload } from "@react-three/drei";
import * as THREE from "three";

/** Cricket gear textures that orbit the foundation logo. */
const ICON_SRCS = [
  "/brand/Bowling.png",
  "/brand/bat.png",
  "/brand/gloves.png",
  "/brand/helmet.png",
  "/brand/umpire.png",
];

const ORBIT_RADIUS = 1.95;

/** Make a loaded texture look crisp and color-correct for our flat-shaded planes. */
function tuneTexture(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function aspectOf(tex: THREE.Texture) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (img?.width && img?.height) return img.width / img.height;
  return 1;
}

/** One billboarded cricket icon travelling along the tilted orbit. */
function OrbitIcon({
  texture,
  index,
  count,
  speed,
}: {
  texture: THREE.Texture;
  index: number;
  count: number;
  speed: number;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const base = (index / count) * Math.PI * 2;
  const aspect = aspectOf(texture);
  const size = 1.05;

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + base;
    const x = Math.cos(t) * ORBIT_RADIUS;
    const z = Math.sin(t) * ORBIT_RADIUS;
    const g = group.current;
    if (!g) return;
    g.position.set(x, 0, z);

    // Depth cue: icons at the front (z > 0) grow & brighten, those behind
    // shrink & fade so the ring reads as genuinely 3D.
    const depth = (z / ORBIT_RADIUS + 1) / 2; // 0 (back) → 1 (front)
    const scale = THREE.MathUtils.lerp(0.62, 1.12, depth);
    g.scale.setScalar(scale);
    if (mat.current) mat.current.opacity = THREE.MathUtils.lerp(0.45, 1, depth);
  });

  return (
    <group ref={group}>
      <Billboard>
        <mesh scale={[size * aspect, size, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={mat}
            map={texture}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

/** The foundation logo, floating on a glowing white disc at the centre. */
function CenterLogo({ texture }: { texture: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const aspect = aspectOf(texture);
  const logoH = 1.7;

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <Billboard>
        {/* soft outer glow */}
        <mesh position={[0, 0, -0.06]}>
          <circleGeometry args={[1.85, 64]} />
          <meshBasicMaterial color="#bbf7d0" transparent opacity={0.35} depthWrite={false} />
        </mesh>
        {/* white disc */}
        <mesh position={[0, 0, -0.03]}>
          <circleGeometry args={[1.42, 64]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        {/* brand ring accent */}
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[1.42, 1.5, 64]} />
          <meshBasicMaterial color="#dcfce7" toneMapped={false} />
        </mesh>
        {/* logo */}
        <mesh scale={[logoH * aspect, logoH, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

/** Faint elliptical guide showing the orbit path. */
function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[ORBIT_RADIUS, 0.01, 16, 160]} />
      <meshBasicMaterial color="#86efac" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

/** The whole orbital system: tilted, pointer-reactive, self-animating. */
function System({ logoSrc, onReady }: { logoSrc: string; onReady: () => void }) {
  const root = useRef<THREE.Group>(null);
  const icons = useTexture(ICON_SRCS, (t) => {
    (Array.isArray(t) ? t : [t]).forEach(tuneTexture);
  });
  const logo = useTexture(logoSrc, (t) => tuneTexture(t as THREE.Texture));

  useEffect(() => {
    onReady();
  }, [onReady]);

  const TILT = -0.52;
  useFrame((state) => {
    const r = root.current;
    if (!r) return;
    // gentle pointer parallax layered on the fixed tilt
    const targetY = state.pointer.x * 0.35;
    const targetX = TILT + state.pointer.y * 0.18;
    r.rotation.y = THREE.MathUtils.lerp(r.rotation.y, targetY, 0.06);
    r.rotation.x = THREE.MathUtils.lerp(r.rotation.x, targetX, 0.06);
  });

  return (
    <group ref={root} rotation={[TILT, 0, 0]}>
      <OrbitRing />
      <CenterLogo texture={logo as THREE.Texture} />
      {(icons as THREE.Texture[]).map((tex, i) => (
        <OrbitIcon
          key={ICON_SRCS[i]}
          texture={tex}
          index={i}
          count={ICON_SRCS.length}
          speed={0.32}
        />
      ))}
    </group>
  );
}

export interface FoundationOrbit3DProps {
  logoSrc?: string;
  className?: string;
}

/**
 * 3D centrepiece for the foundation section: the logo floats at the centre while
 * cricket-gear icons orbit it on a tilted ring with real depth, lighting and a
 * gentle pointer parallax. Renders client-side only; a static logo is shown until
 * the WebGL scene is ready.
 */
export default function FoundationOrbit3D({
  logoSrc = "/brand/logo.png",
  className = "",
}: FoundationOrbit3DProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0.15, 6.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[4, 3, 5]} intensity={0.6} color="#16a34a" />
        <pointLight position={[-5, -2, 3]} intensity={0.5} color="#7c3aed" />
        <Suspense fallback={null}>
          <System logoSrc={logoSrc} onReady={() => setReady(true)} />
          <Sparkles count={48} scale={[8, 5, 4]} size={2.4} speed={0.35} color="#a78bfa" opacity={0.45} />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Static fallback shown until the scene paints (and for no-WebGL). */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-2xl ring-[8px] ring-brand-50 sm:h-52 sm:w-52">
          <Image
            src={logoSrc}
            alt="Foundation"
            width={220}
            height={220}
            className="h-24 w-24 animate-pulse object-contain sm:h-32 sm:w-32"
          />
        </div>
      </div>
    </div>
  );
}
