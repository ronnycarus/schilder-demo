'use client';

import { Lighting } from './lighting';
import { PostFX } from './post-fx';
import { ScrollCamera } from './scroll-camera';
import { TestMesh } from './test-mesh';

/**
 * Single shared scene composed inside the root Canvas.
 *
 * Ordering: ScrollCamera (state-only, no JSX), Lighting, content, then PostFX.
 * Effects must be the last children so the EffectComposer wraps the rendered
 * frame.
 */
export function Scene() {
  return (
    <>
      <ScrollCamera />
      <Lighting />
      <TestMesh />
      <PostFX />
    </>
  );
}
