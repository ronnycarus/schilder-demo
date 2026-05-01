'use client';

import { forwardRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { createSleevePaintMaterial } from '../shaders/paint/sleeve-paint-shader';
import { createWoodMaterial } from '../shaders/wood/wood-shader';

export interface RollerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Roller's paint color (drives sleeve paint shader). */
  paintColor?: string;
  /** 0..1 — how saturated the sleeve is with paint. */
  paintLevel?: number;
}

/**
 * Roller — strictly procedural per spec §3.1. No GLB cheats.
 *
 * Local coordinate system (before world placement)
 * ------------------------------------------------
 *      +Y     sleeve axis (length 1.4, radius 0.18)
 *       │
 *       │     frame: bezier-tube U-shape from (0, +0.75, 0) up to apex
 *       │     (0, 0, 0.55) and back down to (0, -0.75, 0); the U opens
 *       │     toward +Z — i.e., the "front" of the roller
 *       │
 *       └──── +Z   handle: capsule extending away from the apex along +Z
 *
 * Materials
 * ---------
 * - Sleeve: createSleevePaintMaterial — uPaintLevel-driven mix between
 *   fabric and paint, fabric-weave vertex wobble for tactile surface
 * - End caps: matte plastic black
 * - Frame: brushed steel (metalness 1.0, roughness 0.35)
 * - Handle: createWoodMaterial — sin-band grain distorted by FBM
 *
 * The whole thing is grouped under a forwarded ref so HeroStage can drive
 * position/rotation per scroll progress without React re-renders.
 */
export const Roller = forwardRef<THREE.Group, RollerProps>(
  (
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      paintColor = '#1F3F6E',
      paintLevel = 0
    },
    ref
  ) => {
    const sleeveMaterial = useMemo(() => createSleevePaintMaterial(), []);
    const handleMaterial = useMemo(() => createWoodMaterial(), []);

    // Drive sleeve paint uniforms from props without rebuilding the material.
    useEffect(() => {
      const u = sleeveMaterial.userData.uniforms;
      u.uPaintColor.value.set(paintColor);
      u.uPaintLevel.value = paintLevel;
    }, [paintColor, paintLevel, sleeveMaterial]);

    // Cleanup GPU resources on unmount.
    useEffect(() => {
      return () => {
        sleeveMaterial.dispose();
        handleMaterial.dispose();
      };
    }, [sleeveMaterial, handleMaterial]);

    const frameGeometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.75, 0),
        new THREE.Vector3(0, 0.55, 0.30),
        new THREE.Vector3(0, 0, 0.55),
        new THREE.Vector3(0, -0.55, 0.30),
        new THREE.Vector3(0, -0.75, 0)
      ]);
      return new THREE.TubeGeometry(curve, 64, 0.014, 8, false);
    }, []);

    return (
      <group ref={ref} position={position} rotation={rotation}>
        {/* Sleeve — paint-aware shader */}
        <mesh castShadow material={sleeveMaterial}>
          <cylinderGeometry args={[0.18, 0.18, 1.4, 64, 1, true]} />
        </mesh>

        {/* End caps */}
        <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#141417" roughness={0.55} metalness={0.0} />
        </mesh>
        <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#141417" roughness={0.55} metalness={0.0} />
        </mesh>

        {/* Frame — brushed steel bezier-tube */}
        <mesh geometry={frameGeometry} castShadow>
          <meshStandardMaterial color="#3a3c40" metalness={1.0} roughness={0.35} />
        </mesh>

        {/* Handle — wood-grain capsule */}
        <mesh
          position={[0, 0, 0.7]}
          rotation={[Math.PI / 2, 0, 0]}
          material={handleMaterial}
          castShadow
        >
          <capsuleGeometry args={[0.04, 0.18, 8, 16]} />
        </mesh>
      </group>
    );
  }
);
Roller.displayName = 'Roller';
