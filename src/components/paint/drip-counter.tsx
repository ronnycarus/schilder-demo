'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

export interface DripCounterProps {
  value: number | string;
  duration?: number;
  delay?: number;
  staggerEach?: number;
  ease?: string;
  play?: boolean;
  reducedMotion?: boolean;
  className?: string;
  ariaLabel?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function DripCounter({
  value,
  duration = 1.1,
  delay = 0,
  staggerEach = 0.09,
  ease = 'elastic.out(1, 0.55)',
  play = true,
  reducedMotion: reducedMotionProp,
  className,
  ariaLabel
}: DripCounterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;

  const text = String(value);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const columns = Array.from(
      root.querySelectorAll<HTMLDivElement>('[data-digit-column]')
    );

    if (reducedMotion) {
      columns.forEach((col) => {
        const t = Number(col.dataset.target ?? '0');
        gsap.set(col, { y: `-${t}em` });
      });
      return;
    }

    if (!play) {
      columns.forEach((col) => gsap.set(col, { y: '1em' }));
      return;
    }

    const tweens = columns.map((col, i) => {
      const t = Number(col.dataset.target ?? '0');
      gsap.set(col, { y: '1em' });
      return gsap.to(col, {
        y: `-${t}em`,
        duration,
        delay: delay + i * staggerEach,
        ease
      });
    });

    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [text, play, reducedMotion, duration, delay, staggerEach, ease]);

  return (
    <span
      ref={containerRef}
      className={cn(
        'inline-flex items-baseline font-display font-bold leading-none tabular-nums',
        className
      )}
      {...(ariaLabel
        ? { role: 'img' as const, 'aria-label': ariaLabel }
        : { 'aria-label': text })}
    >
      {Array.from(text).map((char, i) => {
        if (/\d/.test(char)) {
          const target = Number(char);
          return (
            <span
              key={i}
              aria-hidden
              className="relative inline-block overflow-hidden align-baseline"
              style={{ height: '1em', width: '1ch' }}
            >
              <div
                data-digit-column
                data-target={target}
                className="absolute inset-x-0 top-0 will-change-transform"
              >
                {DIGITS.map((d) => (
                  <span
                    key={d}
                    className="block text-center"
                    style={{ height: '1em', lineHeight: 1 }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </span>
          );
        }
        return (
          <span key={i} aria-hidden className="inline-block">
            {char}
          </span>
        );
      })}
    </span>
  );
}
