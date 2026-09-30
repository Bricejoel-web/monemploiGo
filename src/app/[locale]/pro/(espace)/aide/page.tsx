import Link from "next/link";
import { requireProAccount } from "@/lib/pro/dal";
import { PRO_STARTER, READ_ONLY_DAYS } from "@/lib/pro/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  locale: "fr",
  path: "/pro/aide",
  title: "Aide | MonEmploiGo Pro",
  description: "Aide de l'espace professionnel MonEmploiGo Pro.",
  noindex: true,
  frenchOnly: true,
});

// Réponses tirées uniquement des CGU Pro validées : aucune promesse au-delà.
const FAQ = [
  {
    q: "Qu'est-ce que Pro Starter ?",
    a: `Un abonnement de ${PRO_STARTER.periodDays} jours qui permet de suivre jusqu'à ${PRO_STARTER.maxActiveCandidates} candidats actifs en même temps et de finaliser jusqu'à ${PRO_STARTER.maxDocumentsPerPeriod} documents par période.`,
  },
  {
    q: "Quand un document compte-t-il dans le quota ?",
    a: "Au moment où il est finalisé et devient téléchargeable. Les brouillons ne comptent pas. Un document finalisé peut être téléchargé autant de fois que nécessaire.",
  },
  {
    q: "L'abonnement se renouvelle-t-il tout seul ?",
    a: "Non. Il n'y a aucun renouvellement automatique : vous renouvelez vous-même, quand vous le souhaitez.",
  },
  {
    q: "Que se passe-t-il à l'expiration ?",
    a: `Votre espace passe en lecture seule pendant ${READ_ONLY_DAYS} jours : vous pouvez consulter et télécharger vos documents, mais pas en créer. Sans renouvellement, les candidats et documents sont ensuite supprimés définitivement. Vous êtes prévenu avant.`,
  },
  {
    q: "MonEmploiGo peut-il garantir un visa, un emploi ou une Ausbildung ?",
    a: "Non. MonEmploiGo fournit des outils de préparation et de gestion documentaire. Ce n'est ni une agence de recrutement, ni une agence d'immigration, et aucun résultat n'est garanti.",
  },
];

export default async function ProHelpPage() {
  await requireProAccount();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-bold">Aide</h1>

      <div className="flex flex-col gap-3">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">{a}</p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="font-semibold">Nous contacter</h2>
        <p className="mt-2 text-black/70 dark:text-white/70">
          Pour toute question sur votre espace, votre abonnement ou un paiement :{" "}
          <a href="mailto:monemploigo.contact@gmail.com" className="font-medium underline">
            monemploigo.contact@gmail.com
          </a>
        </p>
        <p className="mt-3">
          <Link href="/fr/pro/conditions-utilisation" className="font-medium underline">
            Conditions d&apos;utilisation de MonEmploiGo Pro
          </Link>
        </p>
      </div>
    </div>
  );
}
