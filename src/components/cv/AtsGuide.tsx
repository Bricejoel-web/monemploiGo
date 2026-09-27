import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { CheckIcon, FlagIcon, MailIcon, ShieldCheckIcon } from "@/components/home/icons";

/**
 * Explique l'intérêt du format ATS en tête des catalogues "CV ATS" et
 * "CV Allemagne (ATS)", au moment où le visiteur choisit son modèle.
 * Chaque affirmation correspond à ce que font réellement les mises en page
 * de ces catégories (une colonne sans icône ni photo pour ATS ; titres en
 * allemand, données personnelles et photo facultatives pour l'Allemagne).
 */
export function AtsGuide({ variant, dict, locale }: { variant: "ats" | "german"; dict: Dictionary; locale: Locale }) {
  const guide = dict.atsGuide;
  const content = variant === "ats" ? guide.ats : guide.german;
  const TitleIcon = variant === "ats" ? ShieldCheckIcon : FlagIcon;

  return (
    <section
      aria-labelledby={`ats-guide-${variant}`}
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-[#fbfaf8] p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.06] sm:p-6"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f2994a] to-[#eb5757]" />

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2994a]/15 to-[#eb5757]/15 text-[#c94f30] dark:text-[#f2994a]">
          <TitleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id={`ats-guide-${variant}`} className="text-lg font-bold">
            {content.title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm text-black/65 dark:text-white/65">{content.intro}</p>
        </div>
      </div>

      {/* Sur mobile, les points défilent horizontalement au doigt (même
          principe que les catalogues) pour ne pas repousser les modèles
          loin sous l'encadré ; grille classique dès `sm:`. */}
      <ul
        className={`no-scrollbar -mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 ${
          variant === "ats" ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {content.points.map((point) => (
          <li
            key={point.title}
            className="w-64 shrink-0 snap-start rounded-xl border border-black/[0.07] bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:w-auto"
          >
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <CheckIcon className="h-3 w-3" />
              </span>
              {point.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-black/60 dark:text-white/60">{point.text}</p>
          </li>
        ))}
      </ul>

      {variant === "ats" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-black/70 dark:text-white/70">{guide.ats.whenTitle}</span>
          {guide.ats.when.map((item) => (
            <span key={item} className="rounded-full bg-black/[0.05] px-2.5 py-1 text-black/70 dark:bg-white/10 dark:text-white/70">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <Link
          href={`/${locale}/bewerbungsbrief`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c94f30] hover:underline dark:text-[#f2994a]"
        >
          <MailIcon className="h-4 w-4 shrink-0" />
          {guide.german.letterCta} →
        </Link>
      )}
    </section>
  );
}
