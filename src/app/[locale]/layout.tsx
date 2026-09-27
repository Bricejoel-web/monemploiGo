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
    title: `${dict.site.name} — ${dict.site.tagline}`,
    description: dict.site.description,
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
        {/* Polices utilisées par les mises en page de CV (src/components/cv/layouts) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap"
        />
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
