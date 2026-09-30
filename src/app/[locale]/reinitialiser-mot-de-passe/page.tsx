import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/PasswordResetForms";
import { isPasswordResetTokenValid } from "@/lib/auth/password-reset";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/reinitialiser-mot-de-passe">) {
  const { locale } = await params;
  // Le lien contient le jeton : il ne doit jamais partir vers un autre site
  // dans l'en-tête Referer.
  return { ...(await seoMetadata(locale, "resetPassword", "/reinitialiser-mot-de-passe", { noindex: true })), referrer: "no-referrer" as const };
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[locale]/reinitialiser-mot-de-passe">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { token: rawToken, espace } = await searchParams;
  const token = typeof rawToken === "string" ? rawToken : "";
  const space = espace === "pro" ? "pro" : "particulier";
  const dict = await getDictionary(locale as Locale);
  const t = dict.passwordReset;
  const forgotHref = `/${locale}/mot-de-passe-oublie${space === "pro" ? "?espace=pro" : ""}`;
  const valid = token.length > 0 && (await isPasswordResetTokenValid(token));

  return (
    <AuthLayout
      title={t.resetTitle}
      subtitle={t.resetSubtitle}
      dict={dict}
      variant="login"
      hero={{ kicker: space === "pro" ? "MonEmploiGo Pro" : dict.auth.heroKicker, title: t.resetTitle, subtitle: t.resetSubtitle }}
    >
      {valid ? (
        <ResetPasswordForm locale={locale as Locale} space={space} dict={dict} token={token} forgotHref={forgotHref} />
      ) : (
        <div className="flex flex-col gap-4">
          <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
            {t.invalidLink}
          </p>
          <p className="text-center text-sm">
            <Link href={forgotHref} className="font-medium text-[#f2994a] hover:underline">
              {t.newRequest}
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
