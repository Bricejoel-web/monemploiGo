import type { ReactNode } from "react";
import { BoltIcon, ShieldCheckIcon, GlobeIcon, CheckIcon } from "@/components/home/icons";
import { BrandedText } from "@/components/layout/BrandedText";
import { getPortraitById, unsplashProfileLink } from "@/lib/photos/unsplash";
import type { Dictionary } from "@/i18n/dictionaries";

// Choix éditorial fixe (même principe que le héros de l'accueil, voir
// docs/ROADMAP.md) — un portrait différent de celui de l'accueil, pour ne
// pas répéter la même photo entre la page d'accueil et ces pages.
const AUTH_HERO_PHOTO_ID = "QazU5SRLudU";

export function AuthLayout({
  title,
  subtitle,
  dict,
  variant,
  children,
}: {
  title: string;
  subtitle: string;
  dict: Dictionary;
  variant: "signup" | "login";
  children: ReactNode;
}) {
  const portrait = getPortraitById(AUTH_HERO_PHOTO_ID);
  const heroTitle = variant === "signup" ? dict.auth.signupHeroTitle : dict.auth.loginHeroTitle;
  const heroSubtitle = variant === "signup" ? dict.auth.signupHeroSubtitle : dict.auth.loginHeroSubtitle;

  const features = [
    { icon: BoltIcon, title: dict.auth.feature1Title, text: dict.auth.feature1Text },
    { icon: ShieldCheckIcon, title: dict.auth.feature2Title, text: dict.auth.feature2Text },
    { icon: GlobeIcon, title: dict.auth.feature3Title, text: dict.auth.feature3Text },
    { icon: CheckIcon, title: dict.auth.feature4Title, text: dict.auth.feature4Text },
  ];

  return (
    <div
      className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[#0b1420] bg-cover bg-center px-6 py-12"
      style={portrait ? { backgroundImage: `url(${portrait.url})` } : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      <div className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#f2994a] to-[#eb5757] opacity-20 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="animate-fade-in-up text-white">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#ffb27a] uppercase backdrop-blur-sm">
            {dict.auth.heroKicker}
          </span>
          <h1 className="mt-5 max-w-lg text-3xl leading-[1.15] font-bold sm:text-4xl">
            <BrandedText text={heroTitle} />
          </h1>
          <p className="mt-4 max-w-md text-white/75">{heroSubtitle}</p>

          {variant === "signup" && (
            <>
              <ul className="mt-8 flex flex-col gap-4">
                {features.map(({ icon: Icon, title: fTitle, text }) => (
                  <li key={fTitle} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f2994a]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{fTitle}</p>
                      <p className="text-xs text-white/60">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-8 max-w-[220px] -rotate-2 font-serif text-lg text-[#ffb27a] italic">{dict.auth.handwrittenNote}</p>
            </>
          )}

          {portrait && (
            <p className="mt-10 text-xs text-white/35">
              Photo :{" "}
              <a href={unsplashProfileLink(portrait)} target="_blank" rel="noopener noreferrer" className="underline">
                {portrait.photographerName}
              </a>{" "}
              sur Unsplash
            </p>
          )}
        </div>

        <div className="animate-fade-in-up mx-auto w-full max-w-md rounded-3xl border border-white/15 bg-black/35 p-7 shadow-2xl backdrop-blur-xl sm:p-8" style={{ animationDelay: "0.08s" }}>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
