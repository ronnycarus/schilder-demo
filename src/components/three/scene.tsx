'use client';

import { Lighting } from './lighting';
import { PostFX } from './post-fx';
import { ScrollCamera } from './scroll-camera';
import { WallPanel } from './meshes/wall-panel';
import { Roller } from './meshes/roller';
import { STAGES } from './stages';

/**
 * Single shared scene composed inside the root Canvas.
 *
 * Ordering: ScrollCamera (state-only, no JSX), Lighting, content, then PostFX.
 * Effects must be the last children so the EffectComposer wraps the rendered
 * frame.
 *
 * Phase 2.1 commit 3: roller geometry placed statically off-center for visual
 * verification. Scroll-driven path + paint-mask hook-up land in commit 5.
 */
export function Scene() {
  return (
    <>
      <ScrollCamera />
      <Lighting />
      <WallPanel position={[0, STAGES.hero.y, 0]} />
      <Roller position={[3, STAGES.hero.y + 1, 0.6]} paintLevel={1} paintColor="#1F3F6E" />
      <PostFX />
    </>
  );
}
