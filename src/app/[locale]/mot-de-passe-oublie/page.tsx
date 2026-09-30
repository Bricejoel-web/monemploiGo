import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/mot-de-passe-oublie">) {
  const { locale } = await params;
  return seoMetadata(locale, "forgotPassword", "/mot-de-passe-oublie", { noindex: true });
}

// Commun aux particuliers et à MonEmploiGo Pro (?espace=pro : retour vers la
// connexion Pro, e-mail en français).
export default async function ForgotPasswordPage({ params, searchParams }: PageProps<"/[locale]/mot-de-passe-oublie">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { espace } = await searchParams;
  const space = espace === "pro" ? "pro" : "particulier";
  const dict = await getDictionary(locale as Locale);
  const t = dict.passwordReset;

  return (
    <AuthLayout
      title={t.forgotTitle}
      subtitle={t.forgotSubtitle}
      dict={dict}
      variant="login"
      hero={{ kicker: space === "pro" ? "MonEmploiGo Pro" : dict.auth.heroKicker, title: t.forgotTitle, subtitle: t.forgotSubtitle }}
    >
      <ForgotPasswordForm locale={locale as Locale} space={space} dict={dict} loginHref={space === "pro" ? "/fr/pro/connexion" : `/${locale}/connexion`} />
    </AuthLayout>
  );
}
