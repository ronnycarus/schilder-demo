'use client';

import { useFrame } from '@react-three/fiber';
import { useLenis } from 'lenis/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { WallPanel, type WallPanelHandle } from '../meshes/wall-panel';
import { Roller } from '../meshes/roller';
import { STAGES } from '../stages';

/**
 * Hero composition — drives the roller's diagonal sweep and the wall's
 * paint-mask accumulation off scroll progress 0..0.4 per spec §6.1.
 *
 * Path
 * ----
 * Roller travels from world (8, hero.y + 3, 0.18) — upper-right, just off
 * the right edge of the camera frustum — to (-8, hero.y - 3, 0.18) —
 * lower-left, off the left edge. The path stays at z=0.18 so the sleeve
 * surface (radius 0.18) just grazes the wall plane at z=0. Linear lerp
 * with t = clamp(progress / 0.4).
 *
 * Paint mask
 * ----------
 * For every frame in active range (0 < t < 1), HeroStage projects the
 * roller's world (x, y) onto the wall's UV coordinates:
 *   u = x / WALL_W + 0.5
 *   v = y / WALL_H + 0.5  (relative to wall position)
 * and calls wall.paintAt(u, v, STAMP_INTENSITY). The wall queues these
 * stamps and applies them additively in its own useFrame (priority 1, so
 * it always runs AFTER HeroStage's priority-0 useFrame this same frame —
 * no one-frame delay).
 *
 * Sleeve orientation note
 * -----------------------
 * For Phase 2.1 the sleeve stays vertical (along world Y); the diagonal
 * is in the motion only. A perpendicular-to-motion sleeve rotation will
 * land in Phase 2.6 polish — needs careful quaternion math and isn't on
 * the critical path.
 */

// Spec §6.1: "from top-left, drags diagonally across the hero". Motion goes
// upper-left → lower-right, so painted region grows from the left — DOM
// headline reveal in ScrollDrivenMask uses ltr to match.
const ROLLER_START = new THREE.Vector3(-8, STAGES.hero.y + 3, 0.18);
const ROLLER_END = new THREE.Vector3(8, STAGES.hero.y - 3, 0.18);
const WALL_W = 20;
const WALL_H = 12;
const SCROLL_END = 0.4;
const STAMP_INTENSITY = 0.4;

export function HeroStage() {
  const wallRef = useRef<WallPanelHandle>(null);
  const rollerRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useLenis((lenis) => {
    progressRef.current = lenis.progress ?? 0;
  });

  useFrame(() => {
    const t = Math.max(0, Math.min(1, progressRef.current / SCROLL_END));

    tmpVec.lerpVectors(ROLLER_START, ROLLER_END, t);

    if (rollerRef.current) {
      rollerRef.current.position.copy(tmpVec);
    }

    if (t > 0 && t < 1 && wallRef.current) {
      const u = tmpVec.x / WALL_W + 0.5;
      const v = (tmpVec.y - STAGES.hero.y) / WALL_H + 0.5;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        wallRef.current.paintAt(u, v, STAMP_INTENSITY);
      }
    }
  });

  return (
    <group>
      <WallPanel ref={wallRef} position={[0, STAGES.hero.y, 0]} />
      <Roller ref={rollerRef} paintLevel={1} paintColor="#1F3F6E" />
    </group>
  );
}
