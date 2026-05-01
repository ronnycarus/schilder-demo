'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './scene';

export function CanvasStage() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4], fov: 45, near: 0.1, far: 200 }}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.NoToneMapping
        }}
        shadows="soft"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
