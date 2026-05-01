'use client';

import { Lighting } from './lighting';
import { PostFX } from './post-fx';
import { ScrollCamera } from './scroll-camera';
import { WallPanel } from './meshes/wall-panel';
import { STAGES } from './stages';

/**
 * Single shared scene composed inside the root Canvas.
 *
 * Ordering: ScrollCamera (state-only, no JSX), Lighting, content, then PostFX.
 * Effects must be the last children so the EffectComposer wraps the rendered
 * frame.
 *
 * Phase 2.1 keeps the wall as a bare plaster surface; the roller and the
 * paint-mask hook-up land in subsequent commits.
 */
export function Scene() {
  return (
    <>
      <ScrollCamera />
      <Lighting />
      <WallPanel position={[0, STAGES.hero.y, 0]} />
      <PostFX />
    </>
  );
}
