'use client';

import dynamic from 'next/dynamic';

/**
 * Dynamic loader for the WebGL canvas. R3F mounts a real <canvas> at first
 * render and accesses window.devicePixelRatio, requestAnimationFrame, etc.;
 * skip SSR entirely by deferring the import to the client. The layout itself
 * stays a server component.
 */
const CanvasStage = dynamic(
  () => import('./canvas-stage').then((m) => m.CanvasStage),
  { ssr: false }
);

export function CanvasStageLoader() {
  return <CanvasStage />;
}
