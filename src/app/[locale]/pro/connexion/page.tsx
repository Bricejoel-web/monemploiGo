import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ProLoginForm } from "@/components/pro/ProAuthForms";
import { verifySession } from "@/lib/auth/dal";
import { getCurrentProAccount } from "@/lib/pro/dal";
import { isProEnabled } from "@/lib/pro/flag";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/connexion",
  title: "Connexion | MonEmploiGo Pro",
  description: "Connectez-vous à l'espace professionnel MonEmploiGo Pro de votre structure.",
  noindex: true,
  frenchOnly: true,
});

export default async function ProLoginPage({ searchParams }: PageProps<"/[locale]/pro/connexion">) {
  if (!isProEnabled()) notFound();
  const { reinitialise, suspendu } = await searchParams;

  // Déjà connecté : espace Pro, ou création de l'espace pour ce compte.
  // (Un espace suspendu revient ici avec ?suspendu=1 : on affiche le message.)
  if (suspendu !== "1" && (await verifySession())) {
    redirect((await getCurrentProAccount()) ? "/fr/pro/dashboard" : "/fr/pro/inscription");
  }

  const dict = await getDictionary("fr");
  return (
    <AuthLayout
      title="Connexion à MonEmploiGo Pro"
      subtitle="Accédez à l'espace professionnel de votre structure."
      dict={dict}
      variant="login"
      hero={{
        kicker: "MonEmploiGo Pro",
        title: "Gérez plus facilement les documents de vos candidats depuis un seul espace.",
        subtitle: "Connectez-vous avec l'adresse e-mail et le mot de passe de votre compte MonEmploiGo.",
      }}
    >
      <ProLoginForm dict={dict} notice={reinitialise === "1" ? "reset" : suspendu === "1" ? "suspended" : undefined} />
    </AuthLayout>
  );
}
