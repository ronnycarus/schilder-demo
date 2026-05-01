import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Inter, Caveat } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { CanvasTexture } from '@/components/paint/canvas-texture';
import { BrushCursor } from '@/components/paint/brush-cursor';
import { LenisProvider } from '@/components/paint/lenis-provider';
import { CanvasStageLoader } from '@/components/three/canvas-stage-loader';
import '../globals.css';

const display = localFont({
  variable: '--font-display-raw',
  display: 'swap',
  src: [
    {
      path: '../../../public/fonts/cabinet-grotesk-bold.woff2',
      weight: '700',
      style: 'normal'
    },
    {
      path: '../../../public/fonts/cabinet-grotesk-extrabold.woff2',
      weight: '800',
      style: 'normal'
    }
  ]
});

const body = Inter({
  variable: '--font-body-raw',
  subsets: ['latin'],
  display: 'swap'
});

const script = Caveat({
  variable: '--font-script-raw',
  subsets: ['latin'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Studio Kalk — Schilderwerk binnen, buiten en alles ertussen',
  description: 'Een rustig huis begint met de juiste verf.'
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} ${script.variable} h-full antialiased`}
    >
      <body className="relative min-h-screen bg-canvas font-body text-ink">
        <NextIntlClientProvider>
          <LenisProvider>
            <CanvasStageLoader />
            <CanvasTexture />
            <BrushCursor />
            <div className="relative z-10">{children}</div>
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
