import Link from "next/link";

// Ressource Pro introuvable — y compris celle d'une autre structure : même
// message, sans rien révéler de son existence. (Page affichée en flux : le
// statut HTTP peut rester 200 ; elle n'est de toute façon jamais indexée.)
export default function ProNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <p className="text-sm font-semibold text-[#c94f30]">Introuvable</p>
      <h1 className="text-2xl font-bold">Cette page n&apos;existe pas dans votre espace.</h1>
      <p className="text-sm text-black/65 dark:text-white/65">Le dossier ou le document demandé n&apos;existe pas, ou n&apos;appartient pas à votre structure.</p>
      <Link href="/fr/pro/dashboard" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
