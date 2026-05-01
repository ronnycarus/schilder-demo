'use client';

import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { createPlasterMaterial } from '../shaders/wall/plaster-shader';

export interface WallPanelProps {
  /** [width, height] in world units. Default [20, 12] per spec §3.6. */
  size?: [number, number];
  /** Plane subdivisions for vertex displacement quality. Default [128, 64]. */
  subdivisions?: [number, number];
  plasterColor?: string;
  /** Max plaster surface displacement, world units. Default 0.04. */
  plasterDepth?: number;
  position?: [number, number, number];
}

/**
 * WallPanel — the showcase plaster surface. Phase 2.1 base version: plaster
 * only, no paint mask. The paint mask render-target layer comes next commit.
 *
 * Geometry: PlaneGeometry with high subdivisions so the per-vertex FBM
 * displacement actually reads. 128 segments wide × 64 tall = 8,256 verts;
 * cheap on the GPU but enough resolution to make the surface feel uneven.
 */
export const WallPanel = forwardRef<THREE.Mesh, WallPanelProps>(
  (
    {
      size = [20, 12],
      subdivisions = [128, 64],
      plasterColor = '#F2EDE2',
      plasterDepth = 0.04,
      position = [0, 0, 0]
    },
    ref
  ) => {
    const geometry = useMemo(
      () =>
        new THREE.PlaneGeometry(size[0], size[1], subdivisions[0], subdivisions[1]),
      [size, subdivisions]
    );

    const material = useMemo(
      () => createPlasterMaterial({ plasterColor, plasterDepth }),
      [plasterColor, plasterDepth]
    );

    return (
      <mesh
        ref={ref}
        geometry={geometry}
        material={material}
        position={position}
        receiveShadow
      />
    );
  }
);
WallPanel.displayName = 'WallPanel';
