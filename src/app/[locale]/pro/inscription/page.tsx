import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ProCreateSpaceForm, ProSignupForm } from "@/components/pro/ProAuthForms";
import { getCurrentUser } from "@/lib/auth/dal";
import { getCurrentProAccount } from "@/lib/pro/dal";
import { isProEnabled } from "@/lib/pro/flag";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/inscription",
  title: "Créer un espace professionnel | MonEmploiGo Pro",
  description: "Créez l'espace professionnel MonEmploiGo Pro de votre structure.",
  noindex: true,
  frenchOnly: true,
});

const HERO = {
  kicker: "MonEmploiGo Pro",
  title: "Gérez plus facilement les documents de vos candidats depuis un seul espace.",
  subtitle: "Créez l'espace professionnel de votre structure, puis activez Pro Starter pour gérer vos candidats et leurs documents.",
};

// Deux cas : visiteur sans compte (nouveau compte + espace Pro), ou compte
// MonEmploiGo déjà connecté sans espace Pro (création de l'espace sur ce
// compte, sans doublon).
export default async function ProSignupPage() {
  if (!isProEnabled()) notFound();
  if (await getCurrentProAccount()) redirect("/fr/pro/dashboard");
  const user = await getCurrentUser();
  const dict = await getDictionary("fr");

  return user ? (
    <AuthLayout title="Créer votre espace professionnel" subtitle="Quelques informations sur votre structure." dict={dict} variant="signup" hero={HERO}>
      <ProCreateSpaceForm dict={dict} accountEmail={user.email} />
    </AuthLayout>
  ) : (
    <AuthLayout title="Créer un espace professionnel" subtitle="Pour les structures qui accompagnent des candidats." dict={dict} variant="signup" hero={HERO}>
      <ProSignupForm dict={dict} />
    </AuthLayout>
  );
}
