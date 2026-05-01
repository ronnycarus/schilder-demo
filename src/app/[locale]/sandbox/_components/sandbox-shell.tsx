'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CellState = 'idle' | 'animating' | 'reduced-motion';

export function SandboxRow({
  name,
  description,
  children
}: {
  name: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-ink/10 py-12 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="font-display text-3xl font-bold tracking-tight">{name}</h2>
        {description && <p className="max-w-md text-sm text-ink/60">{description}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-3">{children}</div>
    </section>
  );
}

export function SandboxCell({
  state,
  loop = false,
  loopInterval = 3500,
  children,
  className
}: {
  state: CellState;
  loop?: boolean;
  loopInterval?: number;
  children: ReactNode;
  className?: string;
}) {
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setReplayKey((k) => k + 1), loopInterval);
    return () => clearInterval(id);
  }, [loop, loopInterval]);

  const replay = () => setReplayKey((k) => k + 1);

  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col rounded-lg border border-ink/15 bg-canvas/40 p-5',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-script text-xs uppercase tracking-wider text-ink/40">
          {state}
        </span>
        {state === 'animating' && (
          <button
            type="button"
            onClick={replay}
            className="font-script text-xs text-ink/40 underline-offset-2 hover:text-paint hover:underline"
          >
            ▷ replay
          </button>
        )}
      </div>
      <div
        key={replayKey}
        className="flex flex-1 items-center justify-center overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}
