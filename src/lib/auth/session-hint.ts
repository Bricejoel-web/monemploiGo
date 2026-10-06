/**
 * Indicateur « connecté » (cookie non secret, lisible par le navigateur) :
 * permet aux pages publiques d'être statiques (mises en cache) tout en
 * affichant d'emblée le bon en-tête. Il ne donne AUCUN accès : la vraie
 * session reste le cookie httpOnly signé, vérifié en base (verifySession).
 * Valeur « 1 » seulement, aucune donnée personnelle.
 */
export const SESSION_HINT_COOKIE = "monemploigo_connecte";

/**
 * Exécuté avant le premier affichage (comme pour éviter le clignotement d'un
 * thème sombre) : marque la page « connecte=1 » ; les règles de
 * globals.css (.si-connecte / .si-deconnecte) montrent alors les bons liens.
 */
export const SESSION_HINT_SCRIPT = `try{document.documentElement.dataset.connecte=document.cookie.split("; ").indexOf("${SESSION_HINT_COOKIE}=1")>-1?"1":"0"}catch(e){}`;
