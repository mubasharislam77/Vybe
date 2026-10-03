'use client';

import { Component, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';

// Real product model. Drop a dedicated /models/hoodie.glb here to swap it.
const MODEL_URL = '/models/sweatshirt.glb';
const TARGET_HEIGHT = 3; // model is auto-centered and scaled to this height

export type Detail = {
  label: string;
  body: string;
  focus: [number, number, number]; // point on the garment the camera zooms to
  dir: [number, number, number]; // direction from focus out to the camera
  dist: number; // zoom distance (smaller = closer)
  marker: boolean; // show an annotation marker (overview stop = false)
};

/**
 * Detail stops, tuned for the sweatshirt model (auto-scaled to height 3,
 * centered at origin, front = +Z). Adjust focus/dir/dist per model.
 */
export const DETAILS: Detail[] = [
  { label: 'VYBE Hoodie', body: 'Every stitch, up close.', focus: [0, 0, 0], dir: [0, 0.05, 1], dist: 4.6, marker: false },
  { label: '380 GSM Fleece', body: 'Brushed-back loop-knit cotton — heavyweight, holds its shape.', focus: [0.2, 0.4, 0.78], dir: [0.15, 0.1, 1], dist: 1.8, marker: true },
  { label: 'Double-Stitch Seams', body: 'Twin-needle construction that survives every wash.', focus: [-1.0, 0.0, 0.5], dir: [-0.5, 0.05, 0.9], dist: 1.6, marker: true },
  { label: 'Ribbed Collar', body: "Dense 2×2 rib that won't stretch out.", focus: [0, 1.2, 0.4], dir: [0, 0.25, 1], dist: 1.7, marker: true },
  { label: 'Reinforced Hem', body: 'Ribbed waistband with a clean drop-shoulder fall.', focus: [0.1, -1.25, 0.6], dir: [0, -0.15, 1], dist: 1.7, marker: true },
  { label: 'Crack-Proof Print', body: 'Plastisol-cured VYBE graphic. Desi soul, western edge.', focus: [0, 0.4, -0.78], dir: [0, 0.1, -1], dist: 2.0, marker: true },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const camPos = (d: Detail) =>
  new THREE.Vector3(...d.focus).add(new THREE.Vector3(...d.dir).normalize().multiplyScalar(d.dist));

export default function HoodieScene({
  progress,
  activeIndex,
}: {
  progress: React.MutableRefObject<number>;
  activeIndex: number;
}) {
  const active = DETAILS[activeIndex] ?? DETAILS[0];
  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#ffffff', '#14141a', 0.7]} />
      <directionalLight position={[3, 5, 5]} intensity={2.6} />
      <pointLight position={[-5, 2, 3]} intensity={30} color="#d4ff3f" />
      <pointLight position={[5, -2, -4]} intensity={22} color="#ff3d68" />

      <ModelBoundary>
        <GarmentModel />
      </ModelBoundary>

      <CameraDolly progress={progress} />

      {/* one marker at a time — the active detail */}
      {active.marker && (
        <group position={active.focus}>
          <mesh>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#d4ff3f" toneMapped={false} />
          </mesh>
          <Html position={[0, 0, 0]} center distanceFactor={undefined} zIndexRange={[20, 0]}>
            <div className="w-60 -translate-y-1/2 translate-x-6 border border-white/10 bg-ink-900/85 p-4 backdrop-blur-md">
              <span className="mb-1 block h-px w-8 bg-vybe" />
              <p className="font-display text-[10px] tracking-[0.3em] text-vybe">DETAIL</p>
              <h3 className="mt-1 font-display text-lg leading-tight text-chalk">{active.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-chalk/60">{active.body}</p>
            </div>
          </Html>
        </group>
      )}
    </>
  );
}

function GarmentModel() {
  const { scene } = useGLTF(MODEL_URL);
  const object = useMemo(() => {
    const obj = scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    obj.position.sub(center);
    const scale = TARGET_HEIGHT / (size.y || 1);
    obj.scale.setScalar(scale);
    // re-center after scaling (scale is applied about origin, position was in model units)
    obj.position.multiplyScalar(scale);
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return obj;
  }, [scene]);

  return <primitive object={object} />;
}

function CameraDolly({ progress }: { progress: React.MutableRefObject<number> }) {
  const look = useRef(new THREE.Vector3(0, 0, 0));
  useFrame((state) => {
    const N = DETAILS.length;
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    const seg = p * (N - 1);
    const i = Math.min(N - 2, Math.floor(seg));
    const f = smooth(seg - i);
    const a = DETAILS[i];
    const b = DETAILS[i + 1];

    const pos = camPos(a).lerp(camPos(b), f);
    const target = new THREE.Vector3(...a.focus).lerp(new THREE.Vector3(...b.focus), f);
    // pull back mid-transition -> "zoom out then zoom in"
    const pull = Math.sin(f * Math.PI) * 1.4;
    pos.add(pos.clone().sub(target).normalize().multiplyScalar(pull));

    state.camera.position.lerp(pos, 0.1);
    look.current.lerp(target, 0.12);
    state.camera.lookAt(look.current);
  });
  return null;
}

/** Keeps a bad/missing .glb from crashing the section. */
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

useGLTF.preload(MODEL_URL);
