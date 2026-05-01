'use client';

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const update = () => setPrefers(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return prefers;
}
