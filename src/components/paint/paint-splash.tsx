'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

export interface PaintSplashProps {
  size?: number;
  color?: string;
  duration?: number;
  delay?: number;
  play?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

type Blob = { cx: number; cy: number; r: number };

const BLOBS: Blob[] = [
  { cx: 0, cy: 0, r: 22 },
  { cx: 36, cy: -12, r: 6 },
  { cx: -32, cy: -18, r: 8 },
  { cx: 22, cy: 36, r: 5 },
  { cx: -26, cy: 32, r: 7 },
  { cx: 46, cy: 22, r: 3.5 },
  { cx: -42, cy: -2, r: 4.5 },
  { cx: -2, cy: -38, r: 4 },
  { cx: 0, cy: 40, r: 5.5 },
  { cx: 30, cy: -28, r: 3 },
  { cx: -18, cy: -30, r: 3.5 },
  { cx: 38, cy: 8, r: 2.5 }
];

export function PaintSplash({
  size = 140,
  color = 'currentColor',
  duration = 0.7,
  delay = 0,
  play = true,
  reducedMotion: reducedMotionProp,
  className
}: PaintSplashProps) {
  const groupRef = useRef<SVGGElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const circles = Array.from(group.querySelectorAll<SVGCircleElement>('circle'));

    if (reducedMotion) {
      circles.forEach((c, i) => {
        gsap.set(c, { attr: { r: BLOBS[i].r } });
      });
      return;
    }

    if (!play) {
      circles.forEach((c) => gsap.set(c, { attr: { r: 0 } }));
      return;
    }

    const tl = gsap.timeline({ delay });
    circles.forEach((c, i) => {
      const isCenter = i === 0;
      const t = isCenter ? 0 : 0.12 + Math.random() * 0.28;
      tl.fromTo(
        c,
        { attr: { r: 0 } },
        {
          attr: { r: BLOBS[i].r },
          duration: isCenter ? duration * 0.5 : duration,
          ease: isCenter ? 'back.out(1.6)' : 'back.out(1.8)'
        },
        t
      );
    });

    return () => {
      tl.kill();
    };
  }, [play, reducedMotion, duration, delay]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      aria-hidden
      className={cn(className)}
    >
      {/* Faint origin marker — keeps idle cells legible */}
      <g stroke={color} strokeWidth="0.6" strokeOpacity="0.18">
        <line x1="-3" y1="0" x2="3" y2="0" />
        <line x1="0" y1="-3" x2="0" y2="3" />
      </g>
      <g ref={groupRef} fill={color}>
        {BLOBS.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={0} />
        ))}
      </g>
    </svg>
  );
}
