import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { notFound } from "next/navigation";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  return seoMetadata(locale, "login", "/connexion", { noindex: true });
}

export default async function LoginPage({ params }: PageProps<"/[locale]/connexion">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);

  return (
    <AuthLayout title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle} dict={dict} variant="login">
      <LoginForm locale={locale as Locale} dict={dict} />
    </AuthLayout>
  );
}
