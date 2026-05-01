'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

export interface DripProps {
  width?: number;
  height?: number;
  color?: string;
  duration?: number;
  delay?: number;
  ease?: string;
  play?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

const PATH = 'M 6 0 C 6 0 3 24 3 40 A 4 4 0 0 0 9 40 C 9 24 6 0 6 0 Z';

export function Drip({
  width = 14,
  height = 60,
  color = 'currentColor',
  duration = 1.1,
  delay = 0,
  ease = 'elastic.out(1, 0.5)',
  play = true,
  reducedMotion: reducedMotionProp,
  className
}: DripProps) {
  const dropRef = useRef<SVGPathElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;

  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    if (reducedMotion) {
      gsap.set(el, { scaleY: 1, transformOrigin: 'top center' });
      return;
    }

    if (!play) {
      gsap.set(el, { scaleY: 0, transformOrigin: 'top center' });
      return;
    }

    gsap.set(el, { scaleY: 0, transformOrigin: 'top center' });
    const tween = gsap.to(el, {
      scaleY: 1,
      duration,
      delay,
      ease
    });

    return () => {
      tween.kill();
    };
  }, [play, reducedMotion, duration, delay, ease]);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 60"
      aria-hidden
      className={cn('overflow-visible', className)}
    >
      {/* Anchor mark — always visible at the source point so idle cells aren't blank */}
      <line
        x1="2"
        y1="0"
        x2="10"
        y2="0"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.25"
      />
      <path
        ref={dropRef}
        d={PATH}
        fill={color}
        style={{ willChange: 'transform' }}
      />
    </svg>
  );
}
