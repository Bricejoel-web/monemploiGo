import Link from "next/link";
import { BrandedText } from "@/components/layout/BrandedText";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { notFound } from "next/navigation";
import {
  BoltIcon,
  PhoneIcon,
  ShieldCheckIcon,
  FlagIcon,
  GlobeIcon,
  LockIcon,
  DocumentIcon,
  StarIcon,
  MailIcon,
  CheckIcon,
  PlayIcon,
} from "@/components/home/icons";
import { PRICE_FCFA, COVER_LETTER_PRICE_FCFA } from "@/lib/cv/catalog";
import { CATEGORY_SLUGS } from "@/lib/cv/category-routes";
import { verifySession } from "@/lib/auth/dal";
import { getPortraitById, unsplashProfileLink } from "@/lib/photos/unsplash";
import type { CvCategory } from "@/lib/cv/types";

const CATEGORIES: CvCategory[] = ["STANDARD", "PREMIUM", "ATS", "GERMAN_ATS"];

const CATEGORY_ICONS: Record<CvCategory, typeof BoltIcon> = {
  STANDARD: DocumentIcon,
  PREMIUM: StarIcon,
  ATS: ShieldCheckIcon,
  GERMAN_ATS: FlagIcon,
};

// Choix éditorial fixe (pas une photo de démonstration de CV) — voir les
// pistes présentées à l'utilisateur avant intégration, docs/ROADMAP.md.
const HERO_PHOTO_ID = "PoJVgIbdKV0";

export default async function HomePage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const session = await verifySession();

  const advantages = [
    { icon: BoltIcon, title: dict.home.advantage1Title, text: dict.home.advantage1Text },
    { icon: PhoneIcon, title: dict.home.advantage2Title, text: dict.home.advantage2Text },
    { icon: ShieldCheckIcon, title: dict.home.advantage3Title, text: dict.home.advantage3Text },
    { icon: FlagIcon, title: dict.home.advantage4Title, text: dict.home.advantage4Text },
    { icon: GlobeIcon, title: dict.home.advantage5Title, text: dict.home.advantage5Text },
    { icon: LockIcon, title: dict.home.advantage6Title, text: dict.home.advantage6Text },
  ];

  const heroPortrait = getPortraitById(HERO_PHOTO_ID);

  return (
    <div className="flex flex-col">
      {/* Hero — vraie photo en arrière-plan, fortement assombrie de façon
          uniforme (voile marqué, plus seulement un dégradé concentré en
          bas) pour un rendu sobre et professionnel où le texte se pose
          directement sur l'image, sans panneau en verre. */}
      <section className="relative">
        <div
          className="relative flex min-h-[560px] items-center overflow-hidden bg-[#0b1420] bg-cover bg-center px-6 py-20 sm:min-h-[620px]"
          style={heroPortrait ? { backgroundImage: `url(${heroPortrait.url})` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/10" />
          <div className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] opacity-10 blur-3xl" />

          {/* Crédit photo en légende directement sur l'image (au lieu d'une
              ligne à part sur fond blanc juste sous le héros sombre, qui
              créait une bande blanche disgracieuse entre l'image et la
              zone de contenu suivante). */}
          {heroPortrait && (
            <p className="absolute right-4 bottom-3 z-10 text-[11px] text-white/50">
              Photo :{" "}
              <a href={unsplashProfileLink(heroPortrait)} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80">
                {heroPortrait.photographerName}
              </a>{" "}
              sur Unsplash
            </p>
          )}

          <div className="relative z-10 mx-auto w-full max-w-6xl">
            <div className="max-w-xl">
              <span className="animate-fade-in-up inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#ffb27a] uppercase backdrop-blur-sm">
                {dict.home.heroKicker}
              </span>
              <h1
                className="animate-fade-in-up mt-5 text-4xl leading-[1.1] font-bold text-white sm:text-5xl lg:text-6xl"
                style={{ animationDelay: "0.08s" }}
              >
                {dict.home.heroTitle}
              </h1>
              <p
                className="animate-fade-in-up mt-5 max-w-md text-base text-white/75 sm:text-lg"
                style={{ animationDelay: "0.16s" }}
              >
                {dict.home.heroSubtitle}
              </p>
              <div className="animate-fade-in-up mt-8 flex flex-wrap items-center gap-5" style={{ animationDelay: "0.24s" }}>
                <Link
                  href={`/${locale}/${session ? "tableau-de-bord" : "inscription"}`}
                  className="btn-shine inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#eb5757]/30 transition-all hover:scale-[1.04] hover:shadow-xl hover:shadow-[#eb5757]/40"
                >
                  {session ? dict.home.heroCtaLoggedIn : dict.home.heroCtaPrimary}
                </Link>
                <Link href={`/${locale}/cv`} className="group inline-flex items-center gap-3 text-sm font-semibold text-white">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors group-hover:bg-white/25">
                    <span className="absolute inset-0 rounded-full bg-white/25 opacity-0 transition-opacity group-hover:animate-ping group-hover:opacity-100" />
                    <PlayIcon className="relative ml-0.5 h-4 w-4 text-white" />
                  </span>
                  {dict.home.heroCtaSecondary}
                </Link>
              </div>
              <div className="animate-fade-in-up mt-10 flex flex-wrap gap-x-6 gap-y-3" style={{ animationDelay: "0.32s" }}>
                {[dict.home.heroStat1, dict.home.heroStat2, dict.home.heroStat3].map((stat) => (
                  <span key={stat} className="inline-flex items-center gap-2 text-sm text-white/80">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757]">
                      <CheckIcon className="h-3 w-3 text-white" />
                    </span>
                    {stat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone de contenu marketing — un seul fond texturé continu (au lieu
          d'un damier blanc/gris qui laissait des aplats de blanc trop nus)
          pour les 3 sections Avantages / Comment ça marche / Catégories. */}
      <div className="bg-dot-grid relative bg-[#efe6d8] dark:bg-white/[0.05]">
        <div className="h-1 w-full bg-gradient-to-r from-[#16324f] via-[#f2994a] to-[#eb5757]" />
        {/* Avantages */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              <BrandedText text={dict.home.advantagesTitle} />
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {advantages.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-black/[0.1] bg-[#fbfaf8] p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-black/10 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] transition-colors group-hover:from-[#f2994a]/25 group-hover:to-[#eb5757]/25 dark:text-[#f2994a]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{dict.home.howItWorksTitle}</h2>
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                [dict.home.step1Title, dict.home.step1Text],
                [dict.home.step2Title, dict.home.step2Text],
                [dict.home.step3Title, dict.home.step3Text],
              ].map(([title, text], index) => (
                <div
                  key={title}
                  className="relative overflow-hidden rounded-2xl border border-black/[0.1] bg-[#fbfaf8] p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
                >
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] text-lg font-bold text-white shadow-md shadow-[#eb5757]/25">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{title.replace(/^\d+\.\s*/, "")}</h3>
                  <p className="mt-2 text-sm text-black/60 dark:text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catégories */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">{dict.home.categoriesTitle}</h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const CategoryIcon = CATEGORY_ICONS[category];
                return (
                  <Link
                    key={category}
                    href={`/${locale}/cv/${CATEGORY_SLUGS[category]}`}
                    className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-black/[0.1] bg-[#fbfaf8] p-6 dark:bg-white/[0.06] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10"
                  >
                    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <span className="mt-2 font-semibold">
                      {dict.dashboard[category === "GERMAN_ATS" ? "germanAts" : (category.toLowerCase() as "standard" | "premium" | "ats")]}
                    </span>
                    <p className="text-sm text-black/60 dark:text-white/60">{dict.catalog.categoryDescriptions[category]}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex w-fit items-center rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
                        {dict.catalog.from} {PRICE_FCFA[category]} FCFA
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-sm font-medium text-[#c94f30] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#f2994a]"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                );
              })}
              <Link
                href={`/${locale}/lettres-de-motivation`}
                className="group relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-black/[0.1] bg-[#fbfaf8] p-6 dark:bg-white/[0.06] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10"
              >
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
                  <MailIcon className="h-5 w-5" />
                </div>
                <span className="mt-2 font-semibold">{dict.dashboard.coverLetters}</span>
                <p className="text-sm text-black/60 dark:text-white/60">{dict.catalog.letterSubtitle}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex w-fit items-center rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
                    {dict.catalog.from} {COVER_LETTER_PRICE_FCFA} FCFA
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-sm font-medium text-[#c94f30] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#f2994a]"
                  >
                    →
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16324f] to-[#0d1f33] px-8 py-14 text-center shadow-xl sm:py-16">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] opacity-25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] opacity-15 blur-3xl" />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl">{dict.home.ctaBandTitle}</h2>
          <Link
            href={`/${locale}/${session ? "tableau-de-bord" : "inscription"}`}
            className="relative mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#171512] transition-transform hover:scale-[1.03]"
          >
            {session ? dict.home.heroCtaLoggedIn : dict.home.ctaBandButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
