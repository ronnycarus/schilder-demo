import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ScrollDrivenMask } from '@/components/paint/scroll-driven-mask';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Phase0');
  const tFooter = await getTranslations('Footer');

  return (
    <main className="relative flex flex-col">
      <section className="flex min-h-screen flex-col">
        <header className="px-8 py-6 sm:px-12 sm:py-8">
          <span className="font-display text-xl font-bold tracking-tight">Studio Kalk</span>
        </header>

        <div className="flex flex-1 flex-col items-start justify-center px-8 pb-16 sm:px-12">
          <p className="font-script mb-4 text-base text-paint/80 sm:text-lg">{t('status')}</p>
          {/* Headline reveals in lockstep with the 3D roller — same Lenis
              progress drives both. Range [0, 0.4] matches HeroStage. */}
          <ScrollDrivenMask range={[0, 0.4]} direction="ltr">
            <h1 className="font-display max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
              {t('title')}
            </h1>
          </ScrollDrivenMask>
          <p className="mt-8 max-w-xl text-base text-ink/70 sm:text-lg">{t('subtitle')}</p>
        </div>
      </section>

      {/* Phase 2.0 scroll runway — temporary 3vh of scroll height so the
          Lenis-driven camera Y has somewhere to travel through. Phase 2.4
          replaces this with the real services / process / portfolio /
          palette / testimonials / contact stages. */}
      <section className="flex h-[300vh] items-center justify-center px-8">
        <p className="font-script text-center text-sm tracking-wider text-ink/25">
          fase 2.4 vult hier de stages in — scroll om de camera te bewegen
        </p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-8 py-6 sm:px-12 sm:py-8">
        <p className="font-script text-xs tracking-wider text-ink/40">{tFooter('phase')}</p>
        <Link
          href="/sandbox"
          className="font-script text-xs tracking-wider text-paint underline-offset-4 hover:underline"
        >
          {tFooter('sandboxLink')}
        </Link>
      </footer>
    </main>
  );
}
