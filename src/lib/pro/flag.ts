/**
 * MonEmploiGo Pro est construit par phases (voir docs/ROADMAP.md). Tant que
 * PRO_ENABLED ne vaut pas "true", rien de Pro n'est visible : pages /pro
 * introuvables, et ni CGU Pro ni section Pro dans la politique de
 * confidentialité — les textes publiés ne doivent jamais décrire un service
 * qui n'existe pas encore (décision de l'utilisateur du 2026-09-30).
 *
 * Les pages légales sont générées à la construction du site : changer la
 * variable sur Vercel ne prend effet qu'après un redéploiement.
 *
 * Pas de `import "server-only"` : le proxy (src/proxy.ts) l'utilise aussi.
 * Aucune valeur secrète ici, seulement un interrupteur.
 */
export function isProEnabled(): boolean {
  return process.env.PRO_ENABLED === "true";
}
