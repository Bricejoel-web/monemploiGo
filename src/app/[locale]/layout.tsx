import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { InfoTicker, type TickerItem } from "@/components/layout/InfoTicker";
import { SITE_NAME, SITE_URL, organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    // Valeurs par défaut (pages privées) : chaque page publique définit ses
    // propres titre, description, canonical et hreflang (voir seo-pages.ts).
    title: `${dict.site.name} — ${dict.site.tagline}`,
    description: dict.site.description,
    // Jeton public de vérification Google Search Console (balise meta),
    // réglé dans les variables Vercel — voir docs/seo/google-search-console.md.
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Les polices des CV ne sont plus chargées ici mais seulement sur
            les pages qui affichent des documents : voir CvFonts. */}
        <JsonLd data={organizationJsonLd(dict.site.description)} />
        <Header locale={locale as Locale} dict={dict} />
        <InfoTicker
          items={dict.ticker.items as TickerItem[]}
          label={dict.ticker.label}
          regionLabel={dict.ticker.regionLabel}
          kindLabels={dict.ticker.kinds}
          pauseLabel={dict.ticker.pause}
          playLabel={dict.ticker.play}
          closeLabel={dict.ticker.close}
        />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} dict={dict} />
        <CookieConsent locale={locale as Locale} dict={dict} />
      </body>
    </html>
  );
}
