/**
 * World-space Y positions for each scroll-orchestrated stage of the scene.
 * Camera tweens from (0, 0, ...) at scroll progress 0 down to (0, CAMERA_TRAVEL, ...)
 * at progress 1. Per spec §2.
 */

export type StageId =
  | 'hero'
  | 'services'
  | 'process'
  | 'portfolio'
  | 'palette'
  | 'testimonials'
  | 'contact';

export const STAGES: Record<StageId, { y: number }> = {
  hero: { y: 0 },
  services: { y: -10 },
  process: { y: -25 },
  portfolio: { y: -40 },
  palette: { y: -55 },
  testimonials: { y: -65 },
  contact: { y: -75 }
};

export const STAGE_ORDER: StageId[] = [
  'hero',
  'services',
  'process',
  'portfolio',
  'palette',
  'testimonials',
  'contact'
];

/** Y delta from the topmost (hero) to bottommost (contact) stage. */
export const CAMERA_TRAVEL = STAGES.contact.y;
