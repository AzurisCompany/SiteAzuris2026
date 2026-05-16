"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * 3D Hero: a wavy plane of points + connecting line segments.
 * Echoes the Azuris "A" wave motif as a data flow surface.
 */

function WaveField({ count = 3200 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const size = 60;
  const grid = Math.round(Math.sqrt(count));
  const step = size / (grid - 1);

  // Build initial positions on a grid centered at origin
  const { positions, lineIndices, lineCount } = useMemo(() => {
    const positions = new Float32Array(grid * grid * 3);
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const i = (y * grid + x) * 3;
        positions[i] = -size / 2 + x * step;
        positions[i + 1] = 0;
        positions[i + 2] = -size / 2 + y * step;
      }
    }

    // Lines connect each point to its right and bottom neighbor (skip last col/row)
    const idxs: number[] = [];
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const i = y * grid + x;
        if (x < grid - 1) idxs.push(i, i + 1);
        if (y < grid - 1) idxs.push(i, i + grid);
      }
    }
    return {
      positions,
      lineIndices: new Uint32Array(idxs),
      lineCount: idxs.length,
    };
  }, [grid, step]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const arr = pointsRef.current?.geometry.attributes.position
      .array as Float32Array | undefined;
    if (!arr) return;

    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const i = (y * grid + x) * 3;
        const px = arr[i];
        const pz = arr[i + 2];
        const d = Math.sqrt(px * px + pz * pz);
        // Layered sin waves for organic motion
        arr[i + 1] =
          Math.sin(d * 0.18 - t * 1.0) * 1.4 +
          Math.sin(px * 0.22 + t * 0.7) * 0.6 +
          Math.cos(pz * 0.22 - t * 0.5) * 0.6;
      }
    }
    pointsRef.current!.geometry.attributes.position.needsUpdate = true;

    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Share buffer between points + lines
  const sharedGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setIndex(new THREE.BufferAttribute(lineIndices, 1));
    return g;
  }, [positions, lineIndices]);

  const pointsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  // Shared underlying array so updating one updates both
  pointsGeom.attributes.position = sharedGeom.attributes.position;

  return (
    <group rotation={[-Math.PI / 3.6, 0, 0]} position={[0, -2, 0]}>
      <lineSegments ref={linesRef} geometry={sharedGeom}>
        <lineBasicMaterial
          color="#14b7de"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </lineSegments>
      <points ref={pointsRef} geometry={pointsGeom}>
        <pointsMaterial
          color="#7dd3fc"
          size={0.12}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export function DataFlowHero({ count }: { count?: number }) {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 8, 22], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
      >
        <color attach="background" args={["#06101c"]} />
        <fog attach="fog" args={["#06101c", 25, 55]} />
        <ambientLight intensity={0.4} />
        <WaveField count={count} />
      </Canvas>
      {/* Glow overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(20,183,222,0.25) 0%, rgba(6,16,28,0) 70%)",
        }}
      />
      {/* Bottom vignette to bleed into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
    </div>
  );
}
