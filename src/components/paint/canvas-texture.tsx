import { cn } from '@/lib/cn';

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3' stitchTiles='stitch'/>
    <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;

const BAND_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='6'>
  <rect y='1' width='160' height='0.5' fill='#000' opacity='0.7'/>
  <rect y='4' width='160' height='0.4' fill='#000' opacity='0.5'/>
</svg>`;

export function CanvasTexture({ className }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden
        className={cn('pointer-events-none fixed inset-0 z-[2] mix-blend-multiply', className)}
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`,
          backgroundSize: '240px 240px',
          opacity: 0.05
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[2] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(BAND_SVG)}")`,
          backgroundSize: '160px 6px',
          opacity: 0.022
        }}
      />
    </>
  );
}
