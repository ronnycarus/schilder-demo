'use client';

import { EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Phase 2.0 / 2.1-hotfix — cheapest cinematic post-fx only:
 *  - ACESFilmic ToneMapping (the spec's primary tonemap; spec §5)
 *
 * Vignette was dropped here in 2.1-hotfix Bug 1 — postprocessing's Vignette
 * pass darkens the framebuffer including transparent pixels, which made the
 * <Canvas alpha:true> background read as mid-gray instead of letting the
 * body's Plaster White show through. The vignette look is now implemented
 * via a CSS overlay (canvas-vignette.tsx) that doesn't touch the WebGL
 * framebuffer at all — cleaner architecture and alpha-safe.
 *
 * Bloom + SSAO + ChromaticAberration + Noise land in Phase 2.3 once the
 * geometry that benefits from them exists.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
