'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { STAGES } from './stages';

/**
 * Phase 2.0 only — temporary visible mesh at the hero stage so we can confirm
 * the Canvas is rendering, the three-point rig is lighting things, and the
 * scroll-cued camera Y is actually moving. Replaced in Phase 2.1 by the
 * <WallPanel /> + <Roller /> hero composition.
 *
 * A torus knot is the standard rendering test shape: enough surface curvature
 * variation that the rim light reads, key-light shadows wrap the form, and
 * any tone-mapping issue is immediately visible.
 */
export function TestMesh() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.3;
    ref.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh
      ref={ref}
      position={[0, STAGES.hero.y, 0]}
      castShadow
      receiveShadow
    >
      <torusKnotGeometry args={[1, 0.32, 160, 24]} />
      <meshStandardMaterial color="#1F3F6E" roughness={0.42} metalness={0.08} />
    </mesh>
  );
}
