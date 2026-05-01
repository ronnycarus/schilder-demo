'use client';

import { EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Phase 2.0 — cheapest cinematic post-fx only:
 *  - ACESFilmic ToneMapping (the spec's primary tonemap; spec §5)
 *  - Vignette (subtle darkening at the corners)
 *
 * Bloom + SSAO + ChromaticAberration + Noise land in Phase 2.3 once the
 * geometry that benefits from them (vertex-displaced wall, paint shader)
 * exists. Multisampling 0 because we'll route AA through the renderer.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette darkness={0.3} offset={0.3} />
    </EffectComposer>
  );
}
