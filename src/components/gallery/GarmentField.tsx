'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Mesh, Group, Points } from 'three';
import { GALLERY } from '@/lib/gallery';

const COUNT = GALLERY.length;
const SPACING = 5.5;
const RADIUS = 3.6;
const START_Z = 8;
const LOGO_Z = -COUNT * SPACING - 5;
const END_CAM_Z = LOGO_Z + 9; // camera comes to rest just in front of the logo

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function GarmentField({
  progress,
}: {
  progress: React.MutableRefObject<number>;
}) {
  const textures = useTexture(GALLERY.map((g) => g.src));
  const logoTex = useTexture('/vybe-logo.png');

  useMemo(() => {
    const list = Array.isArray(textures) ? textures : [textures];
    for (const t of list) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
    logoTex.colorSpace = THREE.SRGBColorSpace;
  }, [textures, logoTex]);

  return (
    <>
      <fogExp2 attach="fog" args={['#08080a', 0.024]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[-6, 4, 4]} intensity={60} color="#d4ff3f" />
      <pointLight position={[6, -3, -8]} intensity={50} color="#ff3d68" />

      <CameraRig progress={progress} />
      <Dust />

      {(Array.isArray(textures) ? textures : [textures]).map((tex, i) => (
        <Garment key={i} texture={tex} index={i} />
      ))}

      <LogoMark texture={logoTex} progress={progress} />
    </>
  );
}

function Garment({ texture, index }: { texture: THREE.Texture; index: number }) {
  const ref = useRef<Group>(null);
  const img = texture.image as HTMLImageElement | undefined;
  const aspect = img && img.width ? img.width / img.height : 0.7;
  const H = 3.7;
  const W = H * aspect;

  const { x, y, z } = useMemo(() => {
    const ang = index * 0.72;
    return {
      x: Math.cos(ang) * RADIUS,
      y: Math.sin(ang) * RADIUS * 0.5,
      z: -index * SPACING,
    };
  }, [index]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = y + Math.sin(t * 0.55 + index) * 0.2;
    ref.current.rotation.y = Math.sin(t * 0.4 + index * 1.3) * 0.35;
    ref.current.rotation.z = Math.sin(t * 0.3 + index) * 0.035;
  });

  return (
    <group ref={ref} position={[x, y, z]}>
      {/* matte frame */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[W + 0.16, H + 0.16]} />
        <meshBasicMaterial color="#0b0b0d" side={THREE.DoubleSide} />
      </mesh>
      {/* photo */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function LogoMark({
  texture,
  progress,
}: {
  texture: THREE.Texture;
  progress: React.MutableRefObject<number>;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
    const s = 2.4 + Math.max(0, progress.current - 0.7) * 2.5;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[0, 0.3, LOGO_Z]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  useFrame((state) => {
    const p = easeInOut(THREE.MathUtils.clamp(progress.current, 0, 1));
    const targetZ = START_Z + (END_CAM_Z - START_Z) * p;
    const cam = state.camera;
    cam.position.z += (targetZ - cam.position.z) * 0.08;
    cam.position.x += (Math.sin(p * Math.PI * 2) * 1.3 - cam.position.x) * 0.06;
    cam.position.y += (Math.cos(p * Math.PI * 1.6) * 0.7 - cam.position.y) * 0.06;
    cam.lookAt(0, 0, cam.position.z - 8);
  });
  return null;
}

function Dust() {
  const ref = useRef<Points>(null);
  const geo = useMemo(() => {
    const N = 320;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -Math.random() * (COUNT * SPACING + 12) + 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color="#d4ff3f" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

useTexture.preload(GALLERY.map((g) => g.src));
useTexture.preload('/vybe-logo.png');
