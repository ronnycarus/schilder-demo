'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useLenis } from 'lenis/react';
import { useRef } from 'react';
import { CAMERA_TRAVEL } from './stages';

/**
 * Maps Lenis scroll progress (0..1) to camera.position.y across the stage
 * world-space. Lenis already lerps the scroll position itself, so we set the
 * camera Y directly per frame — no extra damping here.
 */
export function ScrollCamera() {
  const { camera } = useThree();
  const progressRef = useRef(0);

  useLenis((lenis) => {
    progressRef.current = lenis.progress ?? 0;
  });

  useFrame(() => {
    camera.position.y = progressRef.current * CAMERA_TRAVEL;
  });

  return null;
}
