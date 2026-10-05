import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isProEnabled } from "@/lib/pro/flag";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="print-hide border-t border-black/[0.08] bg-[#efe6d8] px-6 py-12 text-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <Logo locale={locale} siteName={dict.site.name} />
          <p className="mt-3 max-w-xs text-black/60 dark:text-white/60">{dict.footer.tagline}</p>
        </div>
        <div>
          <p className="font-semibold">{dict.footer.navigationTitle}</p>
          <ul className="mt-3 flex flex-col gap-2 text-black/60 dark:text-white/60">
            <li>
              <Link href={`/${locale}/cv`} className="hover:text-foreground hover:underline">
                {dict.nav.cvs}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/lettres-de-motivation`} className="hover:text-foreground hover:underline">
                {dict.nav.coverLetters}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/bewerbungsbrief`} className="hover:text-foreground hover:underline">
                {dict.nav.bewerbungsbrief}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/etranger`} className="hover:text-foreground hover:underline">
                {dict.nav.abroad}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/tarifs`} className="hover:text-foreground hover:underline">
                {dict.nav.pricing}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/a-propos`} className="hover:text-foreground hover:underline">
                {dict.footer.about}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/contact`} className="hover:text-foreground hover:underline">
                {dict.footer.contact}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">{dict.footer.legalTitle}</p>
          <ul className="mt-3 flex flex-col gap-2 text-black/60 dark:text-white/60">
            <li>
              <Link href={`/${locale}/mentions-legales`} className="hover:text-foreground hover:underline">
                {dict.footer.legalNotice}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/confidentialite`} className="hover:text-foreground hover:underline">
                {dict.footer.privacyPolicy}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/conditions-utilisation`} className="hover:text-foreground hover:underline">
                {dict.footer.termsOfUse}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/cookies`} className="hover:text-foreground hover:underline">
                {dict.footer.cookiePolicy}
              </Link>
            </li>
            {isProEnabled() && (
              <li>
                <Link href="/fr/pro/conditions-utilisation" className="hover:text-foreground hover:underline">
                  {dict.footer.proTerms}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-black/[0.06] pt-6 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        © {new Date().getFullYear()} {dict.site.name}. {dict.footer.rightsReserved}
      </div>
    </footer>
  );
}
