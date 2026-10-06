/**
 * Page où revenir après la connexion (paramètre « suivant »). Seul un chemin
 * interne du site est accepté : jamais une adresse externe (« //exemple.com »,
 * « https://… », « /\exemple.com ») — sinon le lien de connexion servirait à
 * rediriger vers un site piégé. Sans dépendance : utilisé aussi par le proxy.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  if (!/^\/(fr|en)\//.test(value)) return null;
  if (value.includes("//") || value.includes("\\") || /[\r\n]/.test(value)) return null;
  // Revenir sur la connexion ou l'inscription n'aurait aucun sens.
  if (/^\/(fr|en)\/(connexion|inscription)(\/|\?|$)/.test(value)) return null;
  return value;
}
