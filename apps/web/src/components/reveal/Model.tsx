'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import type { Group } from 'three';

/**
 * Real 3D hoodie model — "Hoodie Character" by Quaternius (CC0, via Poly Pizza).
 * File: apps/web/public/models/hoodie.glb  (~1.46 MB)
 *
 * Model facts (measured): ~1.87u tall, feet at y≈0, faces +Z (toward camera),
 * rigged with 24 clips. We play "Idle_Neutral" so it stands naturally instead
 * of the T-pose bind. Scroll rotates the whole group; the idle animates the bones.
 *
 * To use a different model, drop a new .glb here and retune SCALE / Y_OFFSET.
 */

const MODEL_URL = '/models/hoodie.glb';
const SCALE = 1.05;
const Y_OFFSET = -1.15; // sinks feet to the contact-shadow plane, frames the torso

// Same reveal "stops" as the procedural mannequin so markers stay aligned.
const STOPS: [number, number][] = [
  [0.0, 0],
  [0.18, 0],
  [0.36, -Math.PI * 0.32],
  [0.56, -Math.PI * 0.6],
  [0.78, -Math.PI],
  [1.0, -Math.PI * 2],
];

function rotationForProgress(p: number): number {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, r0] = STOPS[i];
    const [p1, r1] = STOPS[i + 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0 || 1);
      const e = t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
      return r0 + (r1 - r0) * e;
    }
  }
  return STOPS[STOPS.length - 1][1];
}

export default function Model({
  progress,
}: {
  progress: React.MutableRefObject<number>;
}) {
  const group = useRef<Group>(null);
  const current = useRef(0);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, group);

  // SkeletonUtils.clone (not scene.clone) correctly re-binds bones for a
  // skinned/rigged model so the Idle animation actually deforms the mesh.
  const model = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((o) => {
      o.frustumCulled = false;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    if (!names.length) return;
    const idle =
      names.find((n) => /Idle_Neutral/i.test(n)) ??
      names.find((n) => /Idle$/i.test(n)) ??
      names[0];
    const action = actions[idle];
    action?.reset().fadeIn(0.5).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, names]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = rotationForProgress(progress.current);
    current.current += (target - current.current) * Math.min(1, delta * 4);
    group.current.rotation.y = current.current;
  });

  return (
    <group ref={group} position={[0, Y_OFFSET, 0]} scale={SCALE}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
