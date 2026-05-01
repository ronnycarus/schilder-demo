'use client';

import { Lighting } from './lighting';
import { PostFX } from './post-fx';
import { ScrollCamera } from './scroll-camera';
import { HeroStage } from './stages/hero-stage';

/**
 * Single shared scene composed inside the root Canvas.
 *
 * Ordering: ScrollCamera (state-only, no JSX), Lighting, content, then PostFX.
 * Effects must be the last children so the EffectComposer wraps the rendered
 * frame.
 *
 * Each <XxxStage /> owns its own meshes + scroll-driven choreography. Phase
 * 2.4 will fan out into ServicesStage, ProcessStage, etc.
 */
export function Scene() {
  return (
    <>
      <ScrollCamera />
      <Lighting />
      <HeroStage />
      <PostFX />
    </>
  );
}
