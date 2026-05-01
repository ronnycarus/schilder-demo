'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';
type Variant = 1 | 2 | 3;

export interface PaintMaskProps {
  direction?: Direction;
  duration?: number;
  delay?: number;
  ease?: string;
  play?: boolean;
  reducedMotion?: boolean;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

const MASK_PATHS: Record<Variant, string> = {
  1: 'M 5 8 C 30 4 70 14 110 6 C 150 0 180 12 195 5 C 200 30 197 60 195 80 C 196 92 192 98 175 95 C 130 92 80 100 30 96 C 12 94 4 88 6 70 C 4 50 8 28 5 8 Z',
  2: 'M 8 12 Q 50 4 100 10 T 195 8 Q 200 50 195 90 Q 100 100 5 92 Q 4 50 8 12 Z',
  3: 'M 4 10 C 60 0 140 18 196 4 C 200 40 198 70 196 96 C 130 100 70 90 4 96 C 2 60 6 30 4 10 Z'
};

function buildMaskUrl(variant: Variant): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' preserveAspectRatio='none'><path d='${MASK_PATHS[variant]}' fill='black'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export function PaintMask({
  direction = 'ltr',
  duration = 1.2,
  delay = 0,
  ease = 'power2.inOut',
  play = true,
  reducedMotion: reducedMotionProp,
  variant = 1,
  className,
  children
}: PaintMaskProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const isHorizontal = direction === 'ltr' || direction === 'rtl';
    const position =
      direction === 'ltr'
        ? '0% 50%'
        : direction === 'rtl'
          ? '100% 50%'
          : direction === 'ttb'
            ? '50% 0%'
            : '50% 100%';
    const sizeExpr = isHorizontal
      ? 'calc(var(--mp, 0) * 1%) 100%'
      : '100% calc(var(--mp, 0) * 1%)';

    const maskUrl = buildMaskUrl(variant);
    el.style.setProperty('mask-image', maskUrl);
    el.style.setProperty('-webkit-mask-image', maskUrl);
    el.style.setProperty('mask-repeat', 'no-repeat');
    el.style.setProperty('-webkit-mask-repeat', 'no-repeat');
    el.style.setProperty('mask-position', position);
    el.style.setProperty('-webkit-mask-position', position);
    el.style.setProperty('mask-size', sizeExpr);
    el.style.setProperty('-webkit-mask-size', sizeExpr);

    if (reducedMotion) {
      el.style.setProperty('--mp', '100');
      return;
    }

    if (!play) {
      el.style.setProperty('--mp', '0');
      return;
    }

    el.style.setProperty('--mp', '0');
    const tween = gsap.to(el, {
      '--mp': 100,
      duration,
      delay,
      ease
    } as gsap.TweenVars);

    return () => {
      tween.kill();
    };
  }, [variant, direction, play, reducedMotion, duration, delay, ease]);

  return (
    <div
      ref={wrapperRef}
      className={cn('relative will-change-[mask-size]', className)}
    >
      {children}
    </div>
  );
}
