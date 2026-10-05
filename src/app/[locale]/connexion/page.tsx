import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  return seoMetadata(locale, "login", "/connexion", { noindex: true });
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Déjà connecté (session vérifiée en base) : directement au tableau de bord.
  if (await verifySession()) redirect(`/${locale}/tableau-de-bord`);
  const dict = await getDictionary(locale as Locale);
  const { reinitialise } = await searchParams;

  return (
    <AuthLayout title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle} dict={dict} variant="login">
      <LoginForm locale={locale as Locale} dict={dict} passwordJustReset={reinitialise === "1"} />
    </AuthLayout>
  );
}
