import Link from "next/link";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { AccountArea } from "@/components/layout/AccountArea";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isProEnabled } from "@/lib/pro/flag";
import { isReferralEnabled } from "@/lib/referral/config";

/**
 * En-tête SANS lecture de session : les pages publiques restent statiques
 * (mises en cache, servies sans calcul). Les liens « connecté » et
 * « visiteur » sont tous rendus ; le bon groupe est montré avant le premier
 * affichage grâce à l'indicateur de session (classes .si-connecte /
 * .si-deconnecte, voir src/lib/auth/session-hint.ts). Le menu « Mon compte »
 * charge ensuite le nom et l'e-mail (AccountArea).
 */
export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  // Parrainage et Pro : français uniquement, visibles seulement quand leur
  // interrupteur est activé. Le parrainage est une fonction du compte (lien
  // pour les personnes connectées) ; le Pro s'adresse aux structures, d'où un
  // lien à part, à côté de la connexion, hors du menu des candidats.
  const showReferral = locale === "fr" && isReferralEnabled();
  const showPro = locale === "fr" && isProEnabled();

  const navLinkClass =
    "rounded-full px-2.5 py-2 text-foreground transition-colors hover:bg-[#f2994a]/15 hover:text-[#c94f30] dark:hover:bg-white/[0.08] dark:hover:text-[#f2994a]";

  return (
    <header className="print-hide sticky top-0 z-50 border-b border-black/[0.06] bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:border-white/10">
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-6">
          <Logo locale={locale} siteName={dict.site.name} />
          <nav className="hidden items-center gap-0.5 text-[15px] font-semibold xl:flex">
            <Link href={`/${locale}/cv`} className={navLinkClass}>
              {dict.nav.cvs}
            </Link>
            <Link href={`/${locale}/lettres-de-motivation`} className={navLinkClass}>
              {dict.nav.coverLetters}
            </Link>
            <Link href={`/${locale}/etranger`} className={navLinkClass}>
              {dict.nav.abroad}
            </Link>
            <Link href={`/${locale}/tableau-de-bord`} className={`si-connecte ${navLinkClass}`}>
              {dict.nav.dashboard}
            </Link>
            {showReferral && (
              <Link href="/fr/parrainage" className={`si-connecte ${navLinkClass}`}>
                Parrainer & gagner
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} />
          <div className="si-deconnecte hidden items-center gap-2 xl:flex">
            {showPro && (
              <Link
                href="/fr/pro/connexion"
                className="rounded-full border border-[#16324f]/25 px-3 py-1.5 text-sm font-semibold text-[#16324f] transition-colors hover:bg-[#16324f]/[0.06] dark:border-white/25 dark:text-white dark:hover:bg-white/[0.08]"
              >
                Espace Pro
              </Link>
            )}
            <Link href={`/${locale}/connexion`} className={`text-sm ${navLinkClass}`}>
              {dict.nav.login}
            </Link>
            <Link
              href={`/${locale}/inscription`}
              className="rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#eb5757]/25 transition-transform hover:scale-[1.03] hover:shadow-md hover:shadow-[#eb5757]/30"
            >
              {dict.nav.signup}
            </Link>
          </div>
          <div className="si-connecte hidden items-center gap-2 xl:flex">
            <AccountArea
              locale={locale}
              labels={{ account: dict.nav.account, dashboard: dict.nav.dashboard, logout: dict.nav.logout }}
              showReferral={showReferral}
              showPro={showPro}
            />
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
            showReferral={showReferral}
            showPro={showPro}
          />
        </div>
      </div>
    </header>
  );
}
