"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

type Block = {
  position: [number, number, number];
  size: [number, number, number];
  highlighted: boolean;
};

function makeBlocks(count: number, seed: number): Block[] {
  // Simple deterministic PRNG so server/client & repeat renders stay stable.
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const blocks: Block[] = [];
  const cols = Math.ceil(Math.sqrt(count));
  const spacing = 1.35;
  const offset = (cols - 1) / 2;

  for (let i = 0; i < count; i++) {
    const gx = i % cols;
    const gz = Math.floor(i / cols);
    const height = 0.6 + rand() * 3.2;
    const jitterX = (rand() - 0.5) * 0.3;
    const jitterZ = (rand() - 0.5) * 0.3;

    blocks.push({
      position: [
        (gx - offset) * spacing + jitterX,
        height / 2 - 1.4,
        (gz - offset) * spacing + jitterZ,
      ],
      size: [0.6 + rand() * 0.3, height, 0.6 + rand() * 0.3],
      highlighted: rand() > 0.88,
    });
  }
  return blocks;
}

function BuildingBlocks({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const blocks = useMemo(() => makeBlocks(64, 42), []);

  const edgesByBlock = useMemo(
    () =>
      blocks.map((b) => new THREE.EdgesGeometry(new THREE.BoxGeometry(...b.size))),
    [blocks],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.045;
  });

  return (
    <group ref={groupRef}>
      {blocks.map((b, i) => (
        <group key={i} position={b.position}>
          <mesh>
            <boxGeometry args={b.size} />
            <meshBasicMaterial
              color={b.highlighted ? "#f59e0b" : "#0c1120"}
              transparent
              opacity={b.highlighted ? 0.12 : 0.5}
            />
          </mesh>
          <lineSegments geometry={edgesByBlock[i]}>
            <lineBasicMaterial
              color={b.highlighted ? "#fbbf24" : "#38bdf8"}
              transparent
              opacity={b.highlighted ? 0.9 : 0.35}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

function ScanPlane({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reducedMotion || !ref.current) return;
    const t = clock.getElapsedTime() * 0.35;
    const y = ((t % 4) / 4) * 5 - 1.8;
    ref.current.position.y = y;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.16 * (1 - Math.abs(y - 0.7) / 3.5);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[11, 11]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Floor() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(24, 24, 24, 24), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <lineSegments geometry={edges} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, 0]}>
      <lineBasicMaterial color="#1e2a45" transparent opacity={0.5} />
    </lineSegments>
  );
}

function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame(({ camera, clock, pointer }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.08) * 0.6 + pointer.x * 0.4;
    camera.position.y = 1.4 + Math.cos(t * 0.1) * 0.15 + pointer.y * 0.2;
    camera.lookAt(0, 0.2, 0);
  });
  return null;
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 6, 15]} />
      <BuildingBlocks reducedMotion={reducedMotion} />
      <Floor />
      <ScanPlane reducedMotion={reducedMotion} />
      {!reducedMotion && (
        <Sparkles count={80} scale={[9, 4, 9]} size={2} speed={0.25} color="#8ecbff" opacity={0.6} />
      )}
      <Rig reducedMotion={reducedMotion} />
    </>
  );
}

export default function BlueprintScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "low-power" }}
      camera={{ position: [0, 1.4, 9], fov: 45 }}
      frameloop={reducedMotion ? "demand" : "always"}
    >
      <Scene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
