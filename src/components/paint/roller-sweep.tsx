'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useReducedMotion as useRMHook } from '@/lib/hooks/use-reduced-motion';
import { cn } from '@/lib/cn';

type Direction = 'ltr' | 'rtl';

export interface RollerSweepProps {
  baseColor?: string;
  paintColor?: string;
  rollerColor?: string;
  rollerWidth?: number;
  width?: number | string;
  height?: number | string;
  direction?: Direction;
  duration?: number;
  delay?: number;
  ease?: string;
  play?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export function RollerSweep({
  baseColor = 'var(--color-canvas)',
  paintColor = 'var(--color-paint)',
  rollerColor,
  rollerWidth = 64,
  width = '100%',
  height = 100,
  direction = 'ltr',
  duration = 1.8,
  delay = 0,
  ease = 'power2.inOut',
  play = true,
  reducedMotion: reducedMotionProp,
  className
}: RollerSweepProps) {
  const paintRef = useRef<HTMLDivElement>(null);
  const rollerRef = useRef<HTMLDivElement>(null);
  const hookRM = useRMHook();
  const reducedMotion = reducedMotionProp ?? hookRM;
  const finalRollerColor = rollerColor ?? paintColor;

  useEffect(() => {
    const paint = paintRef.current;
    const roller = rollerRef.current;
    if (!paint || !roller) return;

    const startClip =
      direction === 'ltr' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    const endClip = 'inset(0 0 0 0)';
    const startLeft = direction === 'ltr' ? '-15%' : '105%';
    const endLeft = direction === 'ltr' ? '105%' : '-15%';

    if (reducedMotion) {
      gsap.set(paint, { clipPath: endClip });
      gsap.set(roller, { left: '105%', autoAlpha: 0 });
      return;
    }

    if (!play) {
      gsap.set(paint, { clipPath: startClip });
      gsap.set(roller, { left: startLeft, autoAlpha: 1 });
      return;
    }

    gsap.set(paint, { clipPath: startClip });
    gsap.set(roller, { left: startLeft, autoAlpha: 1 });

    const tl = gsap.timeline({ delay });
    tl.to(paint, { clipPath: endClip, duration, ease }, 0);
    tl.to(roller, { left: endLeft, duration, ease }, 0);
    tl.to(roller, { autoAlpha: 0, duration: 0.25, ease: 'power1.out' }, duration - 0.1);

    return () => {
      tl.kill();
    };
  }, [play, reducedMotion, direction, duration, delay, ease]);

  return (
    <div
      className={cn('relative overflow-hidden rounded-md', className)}
      style={{ width, height, backgroundColor: baseColor }}
      aria-hidden
    >
      <div
        ref={paintRef}
        className="absolute inset-0"
        style={{ backgroundColor: paintColor }}
      />
      <div
        ref={rollerRef}
        className="absolute top-0 will-change-[left]"
        style={{ height: '100%', width: rollerWidth, left: '-15%' }}
      >
        <RollerSvg color={finalRollerColor} />
      </div>
    </div>
  );
}

function RollerSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 60 100"
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
    >
      {/* Handle posts */}
      <rect x="22" y="2" width="3" height="22" fill="var(--color-paint-earth)" />
      <rect x="35" y="2" width="3" height="22" fill="var(--color-paint-earth)" />
      {/* Frame */}
      <rect x="2" y="22" width="6" height="56" rx="2" fill="var(--color-paint-earth)" />
      <rect x="52" y="22" width="6" height="56" rx="2" fill="var(--color-paint-earth)" />
      {/* Roller cylinder (the painted surface) */}
      <rect x="6" y="22" width="48" height="56" rx="3" fill={color} />
      {/* Subtle highlight */}
      <rect
        x="6"
        y="24"
        width="48"
        height="6"
        rx="3"
        fill="white"
        fillOpacity="0.15"
      />
    </svg>
  );
}
