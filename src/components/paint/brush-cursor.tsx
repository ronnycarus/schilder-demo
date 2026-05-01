'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

const REST_ANGLE = -28;
const FOLLOW_LERP = 0.28;
const ANGLE_LERP = 0.18;
const REST_LERP = 0.05;

export function BrushCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(pointer: coarse)').matches) {
      el.style.display = 'none';
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let lastX = x;
    let lastY = y;
    let angle = REST_ANGLE;
    let raf = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        x = tx;
        y = ty;
        active = true;
        el.style.opacity = '1';
      }
    };

    const tick = () => {
      x += (tx - x) * FOLLOW_LERP;
      y += (ty - y) * FOLLOW_LERP;

      const dx = x - lastX;
      const dy = y - lastY;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.6) {
        const target = Math.atan2(dy, dx) * (180 / Math.PI);
        angle += (target - angle) * ANGLE_LERP;
      } else {
        angle += (REST_ANGLE - angle) * REST_LERP;
      }
      lastX = x;
      lastY = y;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`;
      raf = requestAnimationFrame(tick);
    };

    document.documentElement.classList.add('brush-cursor-active');
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove('brush-cursor-active');
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[60] -translate-x-[6px] -translate-y-1/2 opacity-0 transition-opacity duration-300 will-change-transform"
      style={{ mixBlendMode: 'multiply' }}
    >
      <svg width="44" height="14" viewBox="0 0 44 14" focusable="false">
        <path d="M 0 7 Q 1 1 8 1.6 L 8 12.4 Q 1 13 0 7 Z" fill="#1F3F6E" />
        <rect x="8" y="3" width="5" height="8" fill="#0A0A0C" />
        <rect x="13" y="5" width="29" height="4" rx="2" fill="#5E4632" />
        <circle cx="42" cy="7" r="2" fill="#5E4632" />
      </svg>
    </div>
  );
}
