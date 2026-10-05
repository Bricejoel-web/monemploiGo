import Link from "next/link";
import { requireProAccount } from "@/lib/pro/dal";
import { formatLongDate } from "@/lib/format-date";
import { pageMetadata } from "@/lib/seo";
import { ProPageHeader } from "@/components/pro/DashboardParts";
import { ProSettingsForm } from "@/components/pro/ProSettingsForm";
import { ProLogoField } from "@/components/pro/ProLogoField";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/parametres",
  title: "Paramètres | MonEmploiGo Pro",
  description: "Paramètres de votre espace professionnel.",
  noindex: true,
  frenchOnly: true,
});

// Paramètres de l'espace Pro : informations de la structure et suppression
// de l'espace (CGU Pro, article 16 ; politique de confidentialité, section 18).
export default async function ProSettingsPage() {
  const account = await requireProAccount();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <ProPageHeader title={<h1 className="text-2xl font-bold">Paramètres</h1>} />

      <section aria-label="Logo de la structure" className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-4 text-lg font-semibold">Logo de la structure</h2>
        <ProLogoField companyName={account.companyName} logoDataUrl={account.logoDataUrl} />
      </section>

      <section aria-label="Informations de la structure" className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-4 text-lg font-semibold">Informations de la structure</h2>
        <ProSettingsForm values={{ companyName: account.companyName, managerName: account.managerName, email: account.email, phone: account.phone }} />
      </section>

      <section aria-label="Conditions acceptées" className="rounded-2xl border border-black/10 bg-white p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Conditions acceptées</h2>
        <p className="mt-2 text-black/70 dark:text-white/70">
          Le {formatLongDate(account.termsAcceptedAt, "fr")} :{" "}
          <Link href="/fr/conditions-utilisation" target="_blank" className="font-medium underline">
            conditions générales d&apos;utilisation
          </Link>{" "}
          et{" "}
          <Link href="/fr/pro/conditions-utilisation" target="_blank" className="font-medium underline">
            conditions d&apos;utilisation de MonEmploiGo Pro
          </Link>
          .
        </p>
      </section>

      <section aria-label="Supprimer mon espace professionnel" className="rounded-2xl border border-red-300/70 bg-white p-6 text-sm shadow-sm dark:border-red-800/60 dark:bg-white/5">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Supprimer mon espace professionnel</h2>
        <p className="mt-2 text-black/70 dark:text-white/70">
          Suppression définitive des informations de la structure, des candidats et de leurs documents. Votre compte MonEmploiGo particulier n&apos;est pas
          supprimé.
        </p>
        <Link
          href="/fr/pro/parametres/supprimer"
          className="mt-4 inline-flex rounded-full border border-red-300 px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Supprimer mon espace professionnel
        </Link>
      </section>
    </div>
  );
}
