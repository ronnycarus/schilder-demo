'use client';

import { ReactLenis } from 'lenis/react';
import type { LenisOptions } from 'lenis';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { ScrollTriggerSync } from './scroll-trigger-sync';

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  const options: LenisOptions = reducedMotion
    ? { duration: 0, lerp: 1, smoothWheel: false, syncTouch: false }
    : { duration: 1.2, lerp: 0.1, smoothWheel: true, syncTouch: false };

  return (
    <ReactLenis root options={options}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
