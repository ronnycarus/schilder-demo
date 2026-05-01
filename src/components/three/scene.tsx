'use client';

/**
 * Single shared scene composed inside the root Canvas.
 *
 * Ordering note: ScrollCamera, Lighting, content, then PostFX. Effects must be
 * the last children so the EffectComposer wraps the rendered frame, not the
 * other way around.
 */
export function Scene() {
  return null;
}
