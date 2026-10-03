'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import * as THREE from 'three';

/**
 * Procedural stylized mannequin wearing a hoodie.
 *
 * This is a placeholder built entirely from primitives so the full scroll-reveal
 * experience works with zero external assets. To swap in a real free 3D model:
 *   1. Download a .glb (see public/models/README.md for free sources)
 *   2. Drop it at apps/web/public/models/hoodie.glb
 *   3. Replace <ProceduralFigure/> below with the <GLBModel/> shown in Model.tsx
 * Rotation + markers are driven by scroll and are model-agnostic.
 */

const HOODIE_COLOR = '#1a1a20';
const SKIN_COLOR = '#c8c1b4';
const ACCENT = '#d4ff3f';

// Rotation "stops": as scroll progresses the figure turns then holds at each
// reveal angle. [progress, targetYRotation(radians)]
const STOPS: [number, number][] = [
  [0.0, 0],
  [0.18, 0],
  [0.36, -Math.PI * 0.32], // 3/4 turn  -> fabric
  [0.56, -Math.PI * 0.6], //  side      -> stitching
  [0.78, -Math.PI], //        back      -> print
  [1.0, -Math.PI * 2], //     full turn back to front -> CTA
];

function rotationForProgress(p: number): number {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, r0] = STOPS[i];
    const [p1, r1] = STOPS[i + 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0 || 1);
      // smootherstep for the "turn, then settle" feel
      const e = t * t * t * (t * (t * 6 - 15) + 10);
      return r0 + (r1 - r0) * e;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export default function Mannequin({
  progress,
}: {
  progress: React.MutableRefObject<number>;
}) {
  const group = useRef<Group>(null);
  const current = useRef(0);

  useFrame((state, delta) => {
    if (!group.current) return;
    const target = rotationForProgress(progress.current);
    // ease toward target rotation
    current.current += (target - current.current) * Math.min(1, delta * 4);
    group.current.rotation.y = current.current;
    // gentle idle float
    group.current.position.y =
      -0.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      <ProceduralFigure />
    </group>
  );
}

function ProceduralFigure() {
  const hoodie = new THREE.MeshStandardMaterial({
    color: HOODIE_COLOR,
    roughness: 0.9,
    metalness: 0.02,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: SKIN_COLOR,
    roughness: 1,
    metalness: 0,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: '#2b2b31',
    roughness: 0.4,
    metalness: 0.7,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: ACCENT,
    roughness: 0.5,
    emissive: new THREE.Color(ACCENT),
    emissiveIntensity: 0.15,
  });

  return (
    <group>
      {/* Head (faceless mannequin) */}
      <mesh position={[0, 1.72, 0]} material={skin} castShadow>
        <sphereGeometry args={[0.32, 48, 48]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.42, 0]} material={skin} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.24, 32]} />
      </mesh>

      {/* Hood (behind neck) */}
      <mesh position={[0, 1.42, -0.18]} rotation={[0.5, 0, 0]} material={hoodie} castShadow>
        <sphereGeometry args={[0.42, 40, 40, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>

      {/* Torso / body of the hoodie */}
      <mesh position={[0, 0.75, 0]} scale={[1.18, 1, 0.8]} material={hoodie} castShadow>
        <capsuleGeometry args={[0.5, 0.95, 16, 32]} />
      </mesh>

      {/* Shoulders block for a boxy oversized fit */}
      <mesh position={[0, 1.18, 0]} scale={[1.55, 0.5, 0.85]} material={hoodie} castShadow>
        <sphereGeometry args={[0.34, 32, 32]} />
      </mesh>

      {/* Left sleeve */}
      <mesh
        position={[-0.62, 0.78, 0]}
        rotation={[0, 0, Math.PI * 0.12]}
        scale={[0.85, 1, 0.85]}
        material={hoodie}
        castShadow
      >
        <capsuleGeometry args={[0.19, 0.85, 12, 24]} />
      </mesh>
      {/* Right sleeve */}
      <mesh
        position={[0.62, 0.78, 0]}
        rotation={[0, 0, -Math.PI * 0.12]}
        scale={[0.85, 1, 0.85]}
        material={hoodie}
        castShadow
      >
        <capsuleGeometry args={[0.19, 0.85, 12, 24]} />
      </mesh>

      {/* Cuffs (ribbed) */}
      <mesh position={[-0.78, 0.33, 0]} rotation={[0, 0, Math.PI * 0.12]} material={metal}>
        <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
      </mesh>
      <mesh position={[0.78, 0.33, 0]} rotation={[0, 0, -Math.PI * 0.12]} material={metal}>
        <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
      </mesh>

      {/* Kangaroo pocket (front detail) */}
      <mesh position={[0, 0.5, 0.42]} scale={[1, 1, 0.5]} material={hoodie} castShadow>
        <boxGeometry args={[0.7, 0.34, 0.14]} />
      </mesh>

      {/* Waist hem (ribbed) */}
      <mesh position={[0, 0.2, 0]} scale={[1.12, 1, 0.78]} material={metal}>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 40]} />
      </mesh>

      {/* Drawstrings */}
      <mesh position={[-0.1, 1.15, 0.28]} material={accent}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
      </mesh>
      <mesh position={[0.1, 1.15, 0.28]} material={accent}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
      </mesh>

      {/* VYBE chest patch (accent) */}
      <mesh position={[0.22, 1.02, 0.44]} rotation={[0, 0, 0]} material={accent}>
        <boxGeometry args={[0.14, 0.05, 0.02]} />
      </mesh>

      {/* Stand pole + base */}
      <mesh position={[0, -0.55, 0]} material={metal}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 16]} />
      </mesh>
      <mesh position={[0, -1.08, 0]} material={metal}>
        <cylinderGeometry args={[0.42, 0.5, 0.06, 48]} />
      </mesh>
    </group>
  );
}
