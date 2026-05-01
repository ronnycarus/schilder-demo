'use client';

import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';

export interface RollerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Sleeve color (placeholder; commit 4 swaps in the paint shader). */
  sleeveColor?: string;
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
 *       └──── +Z   handle: capsule extending away from the apex along +Z;
 *                  in world placement, +Z = away from the wall toward the
 *                  camera, so the painter "holds" the handle from the
 *                  near side.
 *
 *   end caps: two CircleGeometry discs at Y = ±0.7, normals along ±Y, plastic
 *   black. Closes the open-ended sleeve cylinder cleanly.
 *
 * Geometry choices
 * ----------------
 * - Sleeve: CylinderGeometry(0.18, 0.18, 1.4, 64, 1, true) — open-ended
 *   (last param) so the paint shader has full control of the side surface
 *   without contaminating it with cap topology.
 * - Frame: CatmullRomCurve3 of 5 control points → TubeGeometry(64 tubular
 *   segments, 0.014 radius, 8 radial segments). 64×8 = 512 verts; well
 *   within budget.
 * - Handle: CapsuleGeometry(0.04, 0.18, 8, 16) along default-Y, rotated to
 *   +Z. Wood shader will render it as a turned dowel in commit 4.
 *
 * The whole thing is grouped under a forwarded ref so parent HeroStage
 * components can drive position/rotation per scroll progress without
 * re-rendering React.
 */
export const Roller = forwardRef<THREE.Group, RollerProps>(
  (
    { position = [0, 0, 0], rotation = [0, 0, 0], sleeveColor = '#9CA0A6' },
    ref
  ) => {
    const frameGeometry = useMemo(() => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.75, 0),    // right end of sleeve
        new THREE.Vector3(0, 0.55, 0.30), // bend up + toward camera
        new THREE.Vector3(0, 0, 0.55),    // apex (top of U)
        new THREE.Vector3(0, -0.55, 0.30), // coming back down
        new THREE.Vector3(0, -0.75, 0)    // left end of sleeve
      ]);
      return new THREE.TubeGeometry(curve, 64, 0.014, 8, false);
    }, []);

    return (
      <group ref={ref} position={position} rotation={rotation}>
        {/* Sleeve — cylinder along local Y, open-ended */}
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.4, 64, 1, true]} />
          <meshStandardMaterial color={sleeveColor} roughness={0.85} metalness={0.0} />
        </mesh>

        {/* End cap — top (Y=+0.7), normal +Y */}
        <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#141417" roughness={0.55} metalness={0.0} />
        </mesh>

        {/* End cap — bottom (Y=-0.7), normal -Y */}
        <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#141417" roughness={0.55} metalness={0.0} />
        </mesh>

        {/* Frame — bezier-tube wire from one end of sleeve to the other */}
        <mesh geometry={frameGeometry} castShadow>
          <meshStandardMaterial color="#3a3c40" metalness={1.0} roughness={0.35} />
        </mesh>

        {/* Handle — capsule along +Z from apex (placeholder material; wood shader in commit 4) */}
        <mesh position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.18, 8, 16]} />
          <meshStandardMaterial color="#5E4632" roughness={0.7} metalness={0.0} />
        </mesh>
      </group>
    );
  }
);
Roller.displayName = 'Roller';
