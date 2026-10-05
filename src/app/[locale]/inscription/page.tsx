import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/dal";
import { seoMetadata } from "@/lib/seo-pages";

export async function generateMetadata({ params }: PageProps<"/[locale]/inscription">) {
  const { locale } = await params;
  return seoMetadata(locale, "signup", "/inscription", { noindex: true });
}

export default async function SignupPage({ params }: PageProps<"/[locale]/inscription">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Déjà connecté (session vérifiée en base) : directement au tableau de bord.
  if (await verifySession()) redirect(`/${locale}/tableau-de-bord`);
  const dict = await getDictionary(locale as Locale);

  return (
    <AuthLayout title={dict.auth.signupTitle} subtitle={dict.auth.signupSubtitle} dict={dict} variant="signup">
      <SignupForm locale={locale as Locale} dict={dict} />
    </AuthLayout>
  );
}
