import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SandboxRow, SandboxCell } from './_components/sandbox-shell';
import { BrushStroke } from '@/components/paint/brush-stroke';
import { Drip } from '@/components/paint/drip';

export default async function SandboxPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Sandbox');

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
      <Link href="/" className="font-script text-sm text-ink/50 hover:text-paint">
        {t('back')}
      </Link>
      <h1 className="font-display mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-xl text-base text-ink/70">{t('subtitle')}</p>

      <div className="mt-10">
        <SandboxRow
          name="BrushStroke"
          description="SVG path with stroke-dashoffset animated by GSAP. Used for headline underlines, accent marks, focus highlights."
        >
          <SandboxCell state="idle">
            <BrushStroke
              play={false}
              color="var(--color-paint)"
              width={220}
              height={28}
              variant={1}
            />
          </SandboxCell>
          <SandboxCell state="animating" loop>
            <BrushStroke
              play
              duration={1.0}
              color="var(--color-paint)"
              width={220}
              height={28}
              variant={2}
            />
          </SandboxCell>
          <SandboxCell state="reduced-motion">
            <BrushStroke
              reducedMotion
              color="var(--color-paint-deep)"
              width={220}
              height={28}
              variant={3}
            />
          </SandboxCell>
        </SandboxRow>

        <SandboxRow
          name="Drip"
          description="SVG drip with elastic-ease scaleY tween. Spawns on hover or scroll-in. Used at card bottom edges, focus underlines."
        >
          <SandboxCell state="idle">
            <Drip play={false} color="var(--color-paint)" />
          </SandboxCell>
          <SandboxCell state="animating" loop loopInterval={2200}>
            <Drip play color="var(--color-paint-deep)" duration={1.2} />
          </SandboxCell>
          <SandboxCell state="reduced-motion">
            <Drip reducedMotion color="var(--color-paint-earth)" />
          </SandboxCell>
        </SandboxRow>
      </div>
    </main>
  );
}
