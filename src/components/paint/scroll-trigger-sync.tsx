'use client';

import { useEffect } from 'react';
import { useLenis } from 'lenis/react';
import { ScrollTrigger } from '@/lib/gsap';

export function ScrollTriggerSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [lenis]);

  return null;
}
