import { LogoMark } from "@/components/layout/Logo";

// Convention Next.js : affiché automatiquement pendant le chargement de
// n'importe quelle page de ce segment (et de ses sous-routes), le temps
// que les données serveur soient prêtes — c'est ce que l'utilisateur voit
// pendant qu'il attend, sans avoir à instrumenter chaque page une à une.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
      <div className="animate-pulse">
        <LogoMark size={40} />
      </div>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="animate-loading-bar h-full w-1/3 rounded-full bg-gradient-to-r from-[#f2994a] to-[#eb5757]" />
      </div>
    </div>
  );
}
