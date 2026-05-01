import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const PRIMITIVES = [
  'BrushStroke',
  'RollerSweep',
  'Drip',
  'PaintSplash',
  'PaintMask',
  'DripCounter'
];

export default async function SandboxPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Sandbox');

  return (
    <main className="min-h-screen px-8 py-12 sm:px-12">
      <Link href="/" className="font-script text-sm text-ink/50 hover:text-paint">
        {t('back')}
      </Link>
      <h1 className="font-display mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-xl text-base text-ink/70">{t('subtitle')}</p>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRIMITIVES.map((label) => (
          <div
            key={label}
            className="flex min-h-[180px] flex-col rounded-lg border border-ink/15 p-6"
          >
            <span className="font-script text-xs text-ink/40">{t('empty')}</span>
            <span className="font-display mt-auto text-lg font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
