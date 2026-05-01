'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

type Direction = 'ltr' | 'rtl';
type Variant = 1 | 2 | 3 | 4;

export interface BrushStrokeProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  direction?: Direction;
  play?: boolean;
  reducedMotion?: boolean;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
}

const STROKES: Record<Variant, string> = {
  1: 'M 4 18 C 50 10, 110 24, 196 14',
  2: 'M 4 14 Q 60 26 110 12 T 196 18',
  3: 'M 4 20 C 30 30, 90 6, 196 22',
  4: 'M 4 22 C 60 18, 130 8, 196 16'
};

const VIEWBOX_W = 200;
const VIEWBOX_H = 32;

export function BrushStroke({
  width = '100%',
  height = 24,
  color = 'currentColor',
  strokeWidth = 6,
  duration = 0.9,
  delay = 0,
  ease = 'power2.out',
  direction = 'ltr',
  play = true,
  reducedMotion: reducedMotionProp,
  variant = 1,
  className,
  ariaLabel
}: BrushStrokeProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (!pathRef.current) return;
    setLength(pathRef.current.getTotalLength());
  }, [variant]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !length) return;

    const offsetStart = direction === 'ltr' ? length : -length;

    if (reducedMotion) {
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: 0 });
      return;
    }

    if (!play) {
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: offsetStart });
      return;
    }

    gsap.set(path, { strokeDasharray: length, strokeDashoffset: offsetStart });
    const tween = gsap.to(path, {
      strokeDashoffset: 0,
      duration,
      delay,
      ease
    });

    return () => {
      tween.kill();
    };
  }, [length, play, reducedMotion, direction, duration, delay, ease]);

  const a11y = ariaLabel
    ? ({ role: 'img', 'aria-label': ariaLabel } as const)
    : ({ 'aria-hidden': true } as const);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      className={cn('overflow-visible', className)}
      {...a11y}
    >
      {ariaLabel && <title>{ariaLabel}</title>}
      <path
        ref={pathRef}
        d={STROKES[variant]}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
