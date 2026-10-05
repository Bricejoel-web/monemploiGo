import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export async function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const session = await verifySession();

  const navLinkClass =
    "rounded-full px-3 py-2 text-foreground transition-colors hover:bg-[#f2994a]/15 hover:text-[#c94f30] dark:hover:bg-white/[0.08] dark:hover:text-[#f2994a]";

  return (
    <header className="print-hide sticky top-0 z-50 border-b border-black/[0.06] bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:border-white/10">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Logo locale={locale} siteName={dict.site.name} />
          <nav className="hidden items-center gap-1 text-[15px] font-semibold md:flex">
            <Link href={`/${locale}/cv`} className={navLinkClass}>
              {dict.nav.cvs}
            </Link>
            <Link href={`/${locale}/lettres-de-motivation`} className={navLinkClass}>
              {dict.nav.coverLetters}
            </Link>
            <Link href={`/${locale}/etranger`} className={navLinkClass}>
              {dict.nav.abroad}
            </Link>
            {session && (
              <Link href={`/${locale}/tableau-de-bord`} className={navLinkClass}>
                {dict.nav.dashboard}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} />
          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <LogoutButton locale={locale} label={dict.nav.logout} />
            ) : (
              <>
                <Link href={`/${locale}/connexion`} className={`text-sm ${navLinkClass}`}>
                  {dict.nav.login}
                </Link>
                <Link
                  href={`/${locale}/inscription`}
                  className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.03] hover:shadow-md hover:shadow-[#eb5757]/30"
                >
                  {dict.nav.signup}
                </Link>
              </>
            )}
          </div>
          <MobileNav
            locale={locale}
            cvLabel={dict.nav.cvs}
            coverLettersLabel={dict.nav.coverLetters}
            abroadLabel={dict.nav.abroad}
            dashboardLabel={dict.nav.dashboard}
            loginLabel={dict.nav.login}
            signupLabel={dict.nav.signup}
            logoutLabel={dict.nav.logout}
            isLoggedIn={Boolean(session)}
          />
        </div>
      </div>
    </header>
  );
}
