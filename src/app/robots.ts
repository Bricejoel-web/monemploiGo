import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Exploration : tout le site public est ouvert. Sont bloqués les espaces
 * privés (qui redirigent de toute façon vers la connexion) et les ~314
 * éditeurs de modèles, presque identiques entre eux et réservés aux
 * connectés — les explorer ne ferait que gaspiller le budget d'exploration.
 * Connexion et inscription restent explorables pour que Google y lise leur
 * `noindex`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/*/tableau-de-bord",
        "/*/paiement/",
        "/*/document/",
        "/*/cv/modele/",
        "/*/lettres-de-motivation/modele/",
        "/*/bewerbungsbrief/modele/",
        // Espace MonEmploiGo Pro privé (données de candidats, abonnements).
        "/*/pro/dashboard",
        "/*/pro/candidats",
        "/*/pro/documents",
        "/*/pro/abonnement",
        "/*/pro/parametres",
        "/*/pro/aide",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
