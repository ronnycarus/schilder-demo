'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLenis } from 'lenis/react';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';
type Variant = 'rect' | 1 | 2 | 3;

/**
 * Mask shapes. 'rect' is a clean axis-aligned rectangle — the only safe
 * choice when the wrapper shrink-wraps a single line of text, because the
 * brushy variants get their organic edges flattened by the SVG's
 * preserveAspectRatio="none" stretch and produce mid-letter artifacts
 * (the Phase 2.1 hero shipped with the brushy variant 1 and showed partial
 * letters at every scroll position). 1/2/3 stay available for larger
 * masked surfaces — Phase 6.4 portfolio reveals will use them.
 */
const MASK_PATHS: Record<Variant, string> = {
  rect: 'M 0 0 L 200 0 L 200 100 L 0 100 Z',
  1: 'M 5 8 C 30 4 70 14 110 6 C 150 0 180 12 195 5 C 200 30 197 60 195 80 C 196 92 192 98 175 95 C 130 92 80 100 30 96 C 12 94 4 88 6 70 C 4 50 8 28 5 8 Z',
  2: 'M 8 12 Q 50 4 100 10 T 195 8 Q 200 50 195 90 Q 100 100 5 92 Q 4 50 8 12 Z',
  3: 'M 4 10 C 60 0 140 18 196 4 C 200 40 198 70 196 96 C 130 100 70 90 4 96 C 2 60 6 30 4 10 Z'
};

function buildMaskUrl(variant: Variant): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100' preserveAspectRatio='none'><path d='${MASK_PATHS[variant]}' fill='black'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export interface ScrollDrivenMaskProps {
  variant?: Variant;
  direction?: Direction;
  /** Scroll progress range [start, end]. Default [0, 0.4] matches hero roller sweep. */
  range?: [number, number];
  reducedMotion?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * DOM-side companion to the hero's 3D roller. Shares the same Lenis scroll
 * progress, so the headline reveals in lockstep with the roller's sweep
 * across the wall — they animate as one continuous gesture.
 *
 * Implementation
 * --------------
 * Subscribes to Lenis directly and writes the resulting [0..100] value into
 * a CSS custom property `--mp` on the wrapper element. mask-size uses
 * calc(var(--mp) * 1%) on the active axis. No React re-renders per frame:
 * Lenis fires its callback, we mutate one DOM style property, browser
 * recomputes mask. The wrapper is always present in the React tree.
 *
 * Layout
 * ------
 * `display: block; width: fit-content` — the wrapper shrink-wraps the
 * masked content rather than stretching to its parent's width. Without
 * this, the mask SVG (preserveAspectRatio: none) gets stretched across
 * the parent's full width even when the headline is only ~600px wide,
 * which can leave bits of the headline outside the masked region.
 *
 * SSR
 * ---
 * `--mp` is initialized inline to '0' so server-rendered HTML already has
 * the correct starting value; the useEffect that sets `--mp` only runs
 * after hydration, and without the inline default there'd be a flash of
 * fully-visible content during the gap.
 */
export function ScrollDrivenMask({
  variant = 'rect',
  direction = 'ltr',
  range = [0, 0.4],
  reducedMotion: reducedMotionProp,
  className,
  children
}: ScrollDrivenMaskProps) {
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
    }
  }, [variant, direction, reducedMotion]);

  useLenis((lenis) => {
    const el = wrapperRef.current;
    if (!el || reducedMotion) return;
    const [start, end] = range;
    const span = end - start;
    if (span <= 0) return;
    const progress = lenis.progress ?? 0;
    const localProgress = Math.max(0, Math.min(1, (progress - start) / span));
    el.style.setProperty('--mp', String(localProgress * 100));
  });

  // Inline initial style — guarantees --mp is 0 (or 100 for reduced-motion)
  // on the very first paint, before the useEffect runs.
  const initialStyle: CSSProperties = {
    ['--mp' as string]: reducedMotion ? '100' : '0'
  } as CSSProperties;

  return (
    <div
      ref={wrapperRef}
      style={initialStyle}
      className={cn('block w-fit will-change-[mask-size]', className)}
    >
      {children}
    </div>
  );
}
