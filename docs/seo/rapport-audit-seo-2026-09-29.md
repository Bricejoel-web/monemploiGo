# MonEmploiGo — Audit SEO et stratégie (29 septembre 2026)

> Étapes 1 à 4 de la règle de travail : **audit, rapport, architecture proposée, modifications proposées**. Aucun code n'a été modifié. Rien ne sera implémenté avant votre validation.

Méthode : mesures réelles sur https://monemploigo.vercel.app (HTML reçu par un robot Google, en-têtes HTTP, redirections), lecture du code, Lighthouse mobile (outil de Google), recherches web sur la concurrence. **Limite honnête** : je n'ai pas accès aux volumes de recherche réels (Google Keyword Planner, Search Console). Les difficultés de mots-clés ci-dessous sont **estimées** à partir des sites qui se classent aujourd'hui ; elles devront être confirmées par Search Console après 4 à 8 semaines d'indexation.

---

## 0. En résumé

- **Bonne base** : Next.js rend les pages côté serveur (Google reçoit un vrai HTML complet), le site est en HTTPS avec de bons en-têtes de sécurité, les URL sont propres, la langue (`lang="fr"`/`"en"`) est correcte, les pages 404 répondent bien 404, les URL techniques Vercel sont protégées (pas de site en double), les CV privés ne sont pas accessibles sans connexion.
- **Mais Google ne peut pas distinguer les pages** : les 20+ pages publiques ont **exactement le même titre et la même description**, sans canonical, sans hreflang, sans robots.txt ni sitemap.
- **Les pages privées répondent « 200 OK »** au lieu de rediriger (paiement, aperçu de document, éditeurs) : risque d'indexer des centaines de pages vides.
- **Performance mobile faible** : Lighthouse mobile 41/100 (accueil) et 20/100 (catalogue Premium), LCP 4,1 s et 7,1 s, CLS 0,259, jusqu'à 7 s de blocage — pénalisant pour les téléphones d'entrée de gamme et les forfaits limités au Cameroun.
- **Aucun nom de domaine propre** : toute l'autorité serait construite sur `monemploigo.vercel.app`. `monemploigo.com` et `monemploigo.cm` semblent libres (à confirmer chez un registraire).
- **Aucun contenu éditorial** (conseils, guides) : aujourd'hui, le site n'a rien à offrir aux recherches informationnelles (« comment faire un CV au Cameroun »), qui sont la principale porte d'entrée pour un nouveau site.

---

## 1. Audit technique classé

### CRITIQUE

| # | Problème | Impact SEO | Fichier(s) | Correction recommandée |
|---|---|---|---|---|
| C1 | **Titre et description identiques sur toutes les pages** (« monemploiGo — Créez votre CV… »), y compris connexion, CGU, catalogues. | Google ne sait pas quelle page répond à quelle recherche ; pages vues comme doublons ; titres réécrits par Google ; mauvais taux de clic. | `src/app/[locale]/layout.tsx` (seul `generateMetadata` du site) | `generateMetadata` propre à chaque page publique (titre ≤ 60 caractères, description ≤ 155), en FR et EN. |
| C2 | **Pas de robots.txt ni de sitemap.xml** (404). | Google ne découvre les pages que par les liens ; aucune consigne d'exploration ; impossible de soumettre un sitemap à Search Console. | aucun | `src/app/robots.ts` et `src/app/sitemap.ts` (générés par Next.js, liste des seules pages indexables). |
| C3 | **Pages privées en « 200 OK » avec redirection différée** (`<meta http-equiv="refresh" content="1;url=/fr/connexion">`) : `/fr/paiement/…`, `/fr/document/…/apercu`, et les **~314 éditeurs** `/…/modele/…` (179 CV + 100 lettres + 35 Bewerbungsbrief), tous liés depuis les catalogues. | Google explore des centaines d'URL qui affichent une page vide puis la connexion : « soft 404 », doublons de la page de connexion, budget d'exploration gaspillé. (Aucune donnée personnelle n'est exposée : le serveur ne renvoie rien sans session.) | `src/app/[locale]/loading.tsx` (déclenche l'envoi anticipé), `src/proxy.ts` (ne protège que `tableau-de-bord`) | Protéger ces routes dans le proxy (vraie redirection 307 **avant** tout rendu), `noindex` + `Disallow` dans robots.txt, et `rel="nofollow"` inutile si robots.txt bloque déjà. |
| C4 | **Pas de nom de domaine propre.** | L'autorité (liens, mentions, historique) se construit sur une sous-adresse de Vercel ; changer plus tard impose une migration. Les partenaires hésitent à lier une adresse « vercel.app ». | Vercel / `APP_BASE_URL` | Acheter un domaine **avant** Search Console et les démarches de liens, le définir comme domaine principal, redirection 301 depuis `vercel.app`. |
| C5 | **Performance mobile** : LCP 4,1 s (accueil) / 7,1 s (catalogue), blocage 1 s / 7 s, pages catalogue de **1,2 à 2,4 Mo de HTML** et **9 145 éléments** (Premium). | Core Web Vitals « mauvais » (facteur de classement et surtout d'abandon), consommation de données pour les visiteurs. | `src/app/[locale]/cv/[categorie]/page.tsx`, `lettres-de-motivation/page.tsx`, `bewerbungsbrief/page.tsx`, `TemplateThumbnail`, `AdaptiveZone` | Aperçus **pré-rendus en images** (WebP, générés une fois) au lieu de 64-100 CV complets calculés dans le téléphone ; ne rendre chaque aperçu **qu'une fois** (aujourd'hui en double : grille + carrousel mobile masqué) ; chargement différé des images. |

### IMPORTANT

| # | Problème | Impact SEO | Fichier(s) | Correction |
|---|---|---|---|---|
| I1 | **Pas de canonical.** | Variantes (`/cv` → `/fr/cv`, paramètres) non consolidées. | layout / pages | `alternates.canonical` absolu sur chaque page. |
| I2 | **Pas de hreflang** FR/EN. | Google peut voir `/fr/…` et `/en/…` comme doublons ou montrer la mauvaise langue. | layout / pages | `alternates.languages` (`fr`, `en`, `x-default` → `/fr`). |
| I3 | **Pas d'Open Graph / Twitter card / image de partage.** | Partages WhatsApp, Facebook, LinkedIn sans image ni titre propre (essentiel au Cameroun, où WhatsApp est le 1er canal). | layout / pages | `openGraph`, `twitter`, image `opengraph-image` (1200×630) générée par Next.js. |
| I4 | **Aucune donnée structurée.** | Pas de nom de site ni de logo dans Google, pas de fil d'Ariane. | aucun | JSON-LD `Organization`, `WebSite`, `BreadcrumbList` (voir §5). |
| I5 | **Catalogues : 101 à 201 balises H1** (les noms fictifs des CV d'exemple : « Hervé Nana », « Nicolas André »…) et des milliers de mots de contenu fictif. | Sujet de la page brouillé ; le texte dominant est celui de CV imaginaires. | 3 mises en page de CV + lettres (`src/components/cv/layouts`) | Aperçus en images (C5) ; à défaut, `<div>` au lieu de `<h1>` dans les aperçus. |
| I6 | **Aucune page en cache** (`cache-control: private, no-store`) : chaque visite interroge le serveur aux États-Unis. | TTFB plus élevé depuis le Cameroun, démarrages à froid (3,8 s mesurés sur une première requête). | `src/components/layout/Header.tsx` (lit la session) | Rendre statiques les pages publiques ; afficher l'état « connecté » via un petit composant client. |
| I7 | **CLS 0,259** (seuil « mauvais » : 0,25) : le pied de page se décale sur toutes les pages. | Core Web Vitals. | à localiser (élément au-dessus du pied de page qui change de hauteur après affichage) | Réserver la hauteur de l'élément en cause. |
| I8 | **Image principale de l'accueil = image de fond CSS Unsplash**, non prioritaire, non optimisée. | LCP de l'accueil. | `src/app/[locale]/page.tsx` | `next/image` avec `priority` (WebP, tailles adaptées au téléphone). |
| I9 | **Polices Google : 7 familles chargées sur toutes les pages**, dans `<head>`. | Poids et délai, y compris sur les pages légales qui n'affichent aucun CV. | `src/app/[locale]/layout.tsx` | Ne charger les polices des CV que sur les pages qui en affichent (éditeurs, aperçus), via `next/font` (auto-hébergées, sans requête vers Google). |
| I10 | **100 images d'exemple par catalogue, sans chargement différé**, dont 50 dans le carrousel mobile masqué sur ordinateur. | Poids, données mobiles. | catalogues | `loading="lazy"`, un seul rendu par modèle. |
| I11 | **Pas de pages « À propos », « Contact », « Tarifs et paiement »** ; identité de l'exploitant absente. | Signaux de confiance (E-E-A-T) faibles ; les partenaires et médias ont besoin de savoir qui est derrière le site. | — | Voir §8. |
| I12 | **Aucun contenu de conseils**. | Le site ne peut se positionner sur aucune recherche informationnelle. | — | Section `/fr/conseils` (voir §2 et §7). |

### À AMÉLIORER

| # | Problème | Correction |
|---|---|---|
| A1 | Page 404 par défaut de Next.js, en anglais (« This page could not be found »), sans navigation. | `not-found.tsx` traduite, avec liens vers l'accueil et les catalogues. |
| A2 | Redirection de `/` vers `/fr` en 307 (temporaire) selon la langue du navigateur. | Acceptable ; compléter par `x-default`. |
| A3 | Pas de fil d'Ariane visible sur les catégories (seulement un lien « Retour aux catégories »). | Fil d'Ariane visible + `BreadcrumbList`. |
| A4 | Pages anglaises avec des adresses en français (`/en/lettres-de-motivation`). | Optionnel ; ne pas changer avant d'avoir un domaine (éviter deux migrations). |
| A5 | Pas d'`apple-touch-icon` (404). | Ajouter l'icône (écran d'accueil des téléphones). |
| A6 | Textes alternatifs vides sur les photos d'exemple. | Correct pour des images décoratives ; à revoir avec les aperçus en images (alt descriptif : « Exemple de CV Premium, modèle Cercles »). |
| A7 | 578 Ko de JavaScript (non compressé) sur l'accueil. | Réduire après C5/I6 (moins d'hydratation). |

### OPTIONNEL

- Adresses anglaises traduites (`/en/cover-letters`) — après le domaine.
- Données structurées `Product`/`Offer` pour les prix — possible mais sans intérêt immédiat (et **jamais** d'avis ou de note sans avis réels publiés).
- Bing Webmaster Tools (importe Search Console en 1 clic).

### Points vérifiés et corrects

HTML rendu côté serveur (pas de contenu uniquement côté client), HTTPS + HSTS, CSP, `lang` correct, 404 réelles avec `noindex`, URL de déploiement Vercel protégées (302 vers la connexion Vercel : pas de doublon indexable), favicon présent, compression Brotli active, CV et documents privés inaccessibles sans session, aucun secret dans le code client.

---

## 2. Architecture SEO proposée

Principe : **peu de pages, chacune utile**. Pas de pages par ville (`/cv-douala`…) : elles n'apporteraient rien de plus que la page générale et relèveraient du « doorway SEO ».

```
/fr                              Accueil — « Créer son CV en ligne au Cameroun »
/fr/cv                           Catalogue des CV (hub) — « Modèles de CV »
  /fr/cv/standard                CV Standard
  /fr/cv/premium                 CV Premium (« CV professionnel »)
  /fr/cv/ats                     CV ATS (guide déjà présent)
  /fr/cv/allemagne               CV allemand / Lebenslauf / Ausbildung (guide déjà présent)
/fr/lettres-de-motivation        Lettres de motivation (dont « lettre de demande d'emploi »)
/fr/bewerbungsbrief              Lettre de motivation allemande (Ausbildung)
/fr/conseils                     NOUVEAU — hub des guides et articles
  /fr/conseils/<article>         NOUVEAU — articles (voir §7)
/fr/tarifs                       NOUVEAU — prix, paiement Mobile Money, conservation 21 jours, remboursement
/fr/a-propos                     NOUVEAU — qui, pourquoi, comment (faits vérifiables)
/fr/contact                      NOUVEAU — e-mail, délais de réponse
/fr/conditions-utilisation, /fr/confidentialite, /fr/mentions-legales, /fr/cookies   (indexables, faible priorité)
(+ équivalents /en/…)

NON indexables (noindex + Disallow) : /*/connexion, /*/inscription, /*/tableau-de-bord,
/*/paiement/*, /*/document/*, /*/cv/modele/*, /*/lettres-de-motivation/modele/*,
/*/bewerbungsbrief/modele/*, /api/*
```

Remarques :
- On **garde les adresses actuelles** (`/fr/cv/allemagne`…) : elles sont claires, et en changer maintenant n'apporte rien.
- Les pages « modèle » individuelles (314 éditeurs) restent **hors index** : elles sont presque identiques entre elles (même contenu, couleur différente) et réservées aux connectés.
- `connexion`/`inscription` en `noindex` : elles n'ont pas de valeur de recherche et doublonnent l'accueil.

---

## 3. Modifications techniques proposées (dans l'ordre)

1. **Domaine** (C4) — dès que vous l'avez acheté : domaine principal dans Vercel, 301 depuis `vercel.app`, `APP_BASE_URL` et webhook Notch Pay mis à jour.
2. **Protection des routes privées dans le proxy** (C3) — vraie redirection avant tout rendu ; `noindex` sur ces pages.
3. **Métadonnées par page** (C1, I1, I2, I3) — titres, descriptions, canonical, hreflang, Open Graph, Twitter, image de partage.
4. **robots.txt + sitemap.xml** (C2) — sitemap limité aux pages indexables, avec `lastmod` et alternatives de langue.
5. **Données structurées** (I4) — `Organization`, `WebSite`, `BreadcrumbList`, plus `Article` sur les conseils.
6. **Page 404 traduite**, fil d'Ariane, `apple-touch-icon` (A1, A3, A5).
7. **Performance** (C5, I5–I10) — aperçus en images, un seul rendu par modèle, chargement différé, polices des CV seulement là où elles servent, image d'accueil optimisée, correction du CLS, pages publiques statiques.
8. **Pages de confiance** (I11) : À propos, Contact, Tarifs.
9. **Section Conseils** (I12) : structure, puis articles un par un, relus par vous.

---

## 4. Google Search Console

**Sans domaine propre**, seule une propriété « préfixe d'URL » (`https://monemploigo.vercel.app/`) est possible, vérifiée par une **balise meta** (le jeton de vérification est public par nature : ce n'est pas un secret). **Avec un domaine**, la propriété « Domaine » (vérifiée par un enregistrement DNS TXT) couvre tout le domaine et est préférable.

Procédure détaillée (à livrer dans `docs/seo/google-search-console.md` lors de l'implémentation) :
1. Aller sur https://search.google.com/search-console, se connecter avec un compte Google de l'entreprise (idéalement `monemploigo.contact@gmail.com`).
2. « Ajouter une propriété » → **Domaine** → saisir `monemploigo.com` (exemple) → copier l'enregistrement TXT → l'ajouter chez le registraire (ou dans Vercel si le DNS y est géré) → « Valider ».
3. Menu « Sitemaps » → soumettre `https://<domaine>/sitemap.xml`.
4. « Inspection de l'URL » → tester l'accueil et 2-3 pages clés → « Demander une indexation ».
5. Vérifier ensuite : Pages (indexées / exclues et pourquoi), Signaux Web essentiels, Liens.

Contrôles que j'effectuerai après implémentation : sitemap valide et limité aux pages 200 indexables, robots.txt, canonical auto-référent, `noindex` des pages privées, absence de chaînes de redirection, 404 correctes, absence de doublons FR/EN (hreflang).

---

## 5. Données structurées proposées (JSON-LD)

| Type | Où | Contenu (uniquement du réel) |
|---|---|---|
| `Organization` | toutes les pages (layout) | `name` MonEmploiGo, `url` (domaine officiel), `logo`, `email` monemploigo.contact@gmail.com, `sameAs` **uniquement** les profils officiels qui existeront réellement. **Pas** d'adresse, de téléphone, de note, d'avis, de chiffres. |
| `WebSite` | accueil | `name`, `url`, `inLanguage` fr/en. (Pas de `SearchAction` : le site n'a pas de moteur de recherche interne.) |
| `BreadcrumbList` | catégories, conseils | reflète le fil d'Ariane **visible**. |
| `Article` | chaque article de conseils | titre, dates réelles de publication/mise à jour, auteur réel (vous ou « Équipe MonEmploiGo »), image. |
| `FAQPage` | **seulement** si une page affiche réellement une FAQ visible | questions/réponses identiques au texte affiché. (Note : Google n'affiche plus ces résultats enrichis que pour certains sites officiels ; l'intérêt est surtout sémantique.) |

**JobPosting (phase 6)** : non applicable aujourd'hui (le site ne publie pas d'offres). Si un jour vous publiez de vraies offres : une URL publique par offre, `JobPosting` uniquement sur la page de l'offre (jamais sur une liste), `datePosted`, `validThrough`, employeur réel, lieu (`jobLocation` Cameroun) ou `jobLocationType: TELECOMMUTE`, salaire seulement s'il est affiché ; à l'expiration : retirer le balisage **et** la page (404/410) ou la marquer expirée, puis notifier Google (sitemap à jour, ou Indexing API réservée aux offres). Ne jamais baliser une offre fausse, expirée ou une page générique.

---

## 6. Mots-clés (recherche initiale)

Difficulté estimée d'après les sites présents aujourd'hui (blogs camerounais, sites d'emploi, générateurs gratuits, sites français internationaux). Priorité : **P1** (maintenant) → **P4** (plus tard / ne pas viser).

| Mot-clé | Intention | Difficulté estimée | Pertinence | Page cible | Priorité |
|---|---|---|---|---|---|
| créer un CV en ligne Cameroun | transactionnelle | moyenne (job-cameroun.com, taf4all.fr) | très forte | /fr/cv | P1 |
| modèle CV Cameroun / modèle de CV camerounais | commerciale | moyenne-forte (camerounblog.com ×3, emploiscameroun.com, emploijeune.cm) | très forte | /fr/cv + guide pilier | P1 |
| CV professionnel Cameroun | commerciale | moyenne | forte | /fr/cv/premium | P1 |
| générateur de CV Cameroun | transactionnelle | faible-moyenne | forte | /fr/cv | P1 |
| comment faire un CV au Cameroun | informationnelle | moyenne | très forte | article pilier « Guide du CV au Cameroun » | P1 |
| CV jeune diplômé / CV sans expérience Cameroun | informationnelle | faible-moyenne | très forte (option « pas encore d'expérience ») | article | P1 |
| lettre de demande d'emploi (Cameroun) | trans./info. | moyenne | très forte (formulation locale) | /fr/lettres-de-motivation + article modèle | P1 |
| lettre de motivation Cameroun / modèle | commerciale | moyenne | forte | /fr/lettres-de-motivation | P1 |
| CV Ausbildung / CV pour une Ausbildung | commerciale | moyenne | très forte | /fr/cv/allemagne | P1 |
| CV allemand Cameroun / CV Ausbildung Cameroun | commerciale | faible | très forte | /fr/cv/allemagne | P1 |
| lettre de motivation Ausbildung | commerciale | moyenne | très forte | /fr/bewerbungsbrief | P1 |
| comment postuler à une Ausbildung depuis le Cameroun | informationnelle | moyenne (mtravelbusiness.com très présent) | très forte | guide pilier Ausbildung | P1 |
| CV ATS Cameroun | commerciale | faible | forte | /fr/cv/ats | P1 |
| CV ATS / c'est quoi un CV ATS | info./commerciale | forte (sites français internationaux) | forte | /fr/cv/ats + article | P2 |
| CV allemand / Lebenslauf | info./commerciale | forte (zety, cvmaker, modeles-cv…) | forte | /fr/cv/allemagne | P2 |
| documents candidature Allemagne (depuis le Cameroun) | informationnelle | moyenne | forte | article | P2 |
| lettre de demande de stage / CV pour stage (vacances, académique) | trans./info. | moyenne | forte | article + lettres | P2 |
| quel format de CV au Cameroun / CV avec photo | informationnelle | faible | forte | article | P2 |
| comment rédiger une lettre de motivation | informationnelle | forte | moyenne | article | P2 |
| CV template Cameroon | commerciale (EN) | moyenne | forte (anglophones) | /en/cv | P2 |
| how to write a CV in Cameroon | informationnelle (EN) | moyenne (africarrieres, blogs) | forte | article EN | P2 |
| niveau B1/B2 allemand pour une Ausbildung | informationnelle | moyenne | forte | article (sources : Goethe, Make it in Germany) | P3 |
| erreurs à éviter dans un CV | informationnelle | forte | moyenne | article | P3 |
| questions d'entretien d'embauche (Cameroun) | informationnelle | moyenne | moyenne | article | P3 |
| cover letter Cameroon / ATS resume Cameroon | commerciale (EN) | faible-moyenne | forte | pages EN | P3 |
| Bewerbung Ausbildung Pflege (requête allemande) | commerciale | forte (sites allemands) | moyenne | /fr/bewerbungsbrief | P3 |
| emploi Cameroun / recherche emploi Cameroun | navigation | très forte (sites d'offres) | faible (le site n'est pas un site d'offres) | article « où chercher un emploi » | P4 |
| CV gratuit Cameroun | transactionnelle | moyenne (générateurs gratuits) | **intention décalée** : chez MonEmploiGo, la création est libre mais le téléchargement est payant | ne pas viser en page outil ; seulement un article honnête | P4 |

Formulations locales à privilégier naturellement : « lettre de demande d'emploi », « dossier de candidature », « demande de stage », « stage de vacances », « jeune diplômé », « concours », « Douala / Yaoundé » (dans les exemples, pas en pages dédiées).

---

## 7. Stratégie éditoriale (section « Conseils »)

Règles : un article **seulement** s'il répond vraiment à une question ; original ; exemples concrets ; sources citées (sites officiels) ; liens internes utiles ; **relu et validé par vous** avant publication ; date de mise à jour visible ; rythme réaliste (2 articles par mois plutôt que 20 d'un coup).

Premiers contenus proposés (ordre recommandé) :

| # | Titre de travail | Mot-clé principal | Liens internes | Sources |
|---|---|---|---|---|
| 1 | Guide du CV au Cameroun 2026 (pilier, « ressource à citer ») | comment faire un CV au Cameroun | /fr/cv, /fr/cv/premium, /fr/cv/ats, articles 2-4 | pratiques de recrutement observées, sans chiffres inventés |
| 2 | CV sans expérience : réussir son premier CV de jeune diplômé | CV jeune diplômé Cameroun | /fr/cv/standard, guide 1 | — |
| 3 | Lettre de demande d'emploi : modèle et conseils | lettre de demande d'emploi | /fr/lettres-de-motivation | — |
| 4 | CV ATS : ce que c'est, et quand l'utiliser | CV ATS | /fr/cv/ats | — |
| 5 | Postuler à une Ausbildung depuis le Cameroun : le guide (pilier) | Ausbildung depuis le Cameroun | /fr/cv/allemagne, /fr/bewerbungsbrief | make-it-in-germany.com, arbeitsagentur.de, goethe.de/ins/cm, anabin |
| 6 | CV allemand (Lebenslauf) : les différences avec un CV camerounais | CV allemand | /fr/cv/allemagne | idem |
| 7 | Lettre de motivation pour une Ausbildung (Bewerbungsbrief) | lettre de motivation Ausbildung | /fr/bewerbungsbrief | idem |
| 8 | Demande de stage : CV et lettre | lettre de demande de stage | /fr/lettres-de-motivation, /fr/cv | — |
| 9 | Quel format de CV au Cameroun (photo, longueur, langue) ? | format CV Cameroun | guide 1 | — |
| 10 | How to write a CV in Cameroon (EN, anglophones) | how to write a CV in Cameroon | /en/cv | — |
| 11 | 10 erreurs fréquentes dans un CV | erreurs CV | guide 1, /fr/cv | — |
| 12 | Préparer un entretien d'embauche | entretien d'embauche | guide 1 | — |

---

## 8. Confiance (E-E-A-T)

- **À propos** : ce qu'est MonEmploiGo, pour qui, comment ça marche, ce que le site ne fait pas (pas une agence de recrutement ni d'immigration — cohérent avec les CGU). Faits vérifiables uniquement.
- **Contact** : e-mail, délai de réponse réaliste, sujets (paiement, données personnelles).
- **Tarifs et paiement** : prix réels (1 000 / 1 500 / 2 000 XAF), paiement Mobile Money via Notch Pay (Cameroun), conservation 21 jours, remboursement (renvoi aux CGU §12).
- **Identité de l'exploitant** : indispensable pour les médias, les écoles et la loi — **à fournir par vous**.
- Interdits respectés : aucun faux avis, témoignage, chiffre, partenaire, « n°1 ».

---

## 9. Maillage interne

- Accueil → catalogues, guide CV, guide Ausbildung, tarifs.
- Chaque catalogue → le guide correspondant (ATS → article ATS, Allemagne → guide Ausbildung) + les autres catalogues.
- Chaque article → 1 à 3 pages outils pertinentes + 1 à 2 articles liés, avec des textes de lien naturels (« créer votre CV allemand »), jamais des listes de mots-clés.
- Pied de page : Conseils, Tarifs, À propos, Contact + pages légales.
- Fil d'Ariane visible sur catégories et articles.

---

## 10. Autorité hors site (off-page), relations presse et partenariats

**Principes** : aucun achat de liens, aucun échange massif, aucun robot, aucun commentaire de masse, aucun faux annuaire. On obtient des mentions en proposant **des ressources utiles** (guides gratuits, conseils d'experts, outils) et des **partenariats réels**.

### Catégories de sites et méthode de contact

| Catégorie | Méthode |
|---|---|
| Sites d'emploi camerounais | Proposer un article invité réellement utile (ex. « 5 erreurs vues dans les CV »), ou un lien vers le guide gratuit dans leurs pages conseils ; e-mail + page Facebook de la plateforme. |
| Blogs carrière / emploi | Échange d'expertise : article invité, citation dans leurs guides, interview. |
| Médias (économie, tech, jeunesse) | Communiqué de lancement factuel, puis sujets « conseils » saisonniers (rentrée, concours, vacances utiles). |
| Universités, écoles, centres de formation | Ateliers CV (en ligne ou sur place) pour les étudiants ; ressource « Guide du CV » pour leurs pages orientation/insertion. |
| Associations étudiantes, clubs | Partenariat d'atelier, code de réduction **réel** si vous le décidez. |
| Écosystème Allemagne / Ausbildung (cours d'allemand, Goethe-Institut) | Proposer le guide Ausbildung comme ressource ; atelier « CV allemand » pour leurs apprenants. |
| Écosystème tech / entrepreneuriat | Présentation de la jeune pousse (Digital Business Africa, événements comme le Cameroon International Tech Summit). |
| Annuaires de qualité | Uniquement les annuaires réels et modérés (ex. annuaires de startups camerounaises), jamais les « fermes à liens ». |

### Prospects identifiés (à vérifier avant contact — **ne contacter personne automatiquement**)

| Nom | URL | Type | Pourquoi pertinent | Collaboration possible | Page MonEmploiGo à proposer | Qualité estimée | Risque spam |
|---|---|---|---|---|---|---|---|
| Emploi.cm | https://www.emploi.cm/ | site d'emploi | public cible identique | article conseils / ressource | Guide du CV | élevée | faible |
| Emplois Cameroun | https://emploiscameroun.com/ | site d'emploi (propose aussi des CV) | public identique | article invité ; attention : partiellement concurrent | Guide Ausbildung | moyenne-élevée | faible |
| MinaJobs | https://minajobs.net/ | site d'emploi | public identique | page ressources, article | Guide du CV | moyenne-élevée | faible |
| Offre-emploi.cm | https://www.offre-emploi.cm/ | site d'emploi | public identique | ressource | Guide du CV | moyenne | faible |
| JobInCamer | https://www.jobincamer.com/ | site d'emploi | public identique | ressource | Guide du CV | moyenne | faible |
| Cameroon Desk | https://www.cameroondesks.com/ | emplois, concours, bourses | jeunes diplômés, concours | article « dossier de candidature » | Guide du CV, CV sans expérience | moyenne | faible-moyen |
| JobInfoCamer | https://www.jobinfocamer.com/ | site d'emploi | public identique | ressource | Guide du CV | moyenne | faible-moyen |
| EmploiJeune.cm | https://www.emploijeune.cm/ | emploi des jeunes (a déjà une page « modèles de CV ») | jeunes | ressource complémentaire | CV sans expérience | moyenne | faible |
| Africarrieres (Cameroun) | https://africarrieres.com/cameroon/en/guide/pratique/writing-cv | guide carrière | a un guide CV Cameroun | citation / ressource | CV template Cameroon (EN) | moyenne | faible |
| Camerounblog | https://camerounblog.com/ | blog (plusieurs articles « modèle de CV ») | se classe sur nos mots-clés | article invité, citation | Guide Ausbildung | moyenne | moyen (vérifier la qualité) |
| Digital Business Africa | https://www.digitalbusiness.africa/ | média tech / startups | rubrique startups camerounaises | présentation « startup de la semaine » | À propos | élevée | faible |
| Cameroon CEO | https://cameroonceo.com/ | média startups | classements de startups | interview | À propos | moyenne | faible |
| Goethe-Institut Kamerun | https://www.goethe.de/ins/cm/ | institut culturel (examens d'allemand) | public Ausbildung | ressource / atelier CV allemand (partenariat exigeant, à tenter sans attente) | Guide Ausbildung | très élevée | nul |
| Cameroon International Tech Summit | (événement, Yaoundé, octobre 2026) | événement tech | visibilité, presse | participation / démonstration | À propos | moyenne | faible |
| Universités (Yaoundé I, Douala, Buea, Dschang), écoles (ESSEC Douala, IUT…) | **à rechercher** : services d'orientation / insertion | établissements | étudiants et jeunes diplômés | ateliers CV, page ressources | Guide du CV | très élevée | nul |

Non retenus : générateurs de CV concurrents (job-cameroun.com, taf4all.fr), cabinets de recrutement internationaux (peu de chance), agences d'immigration commerciales (qualité et risque variables — seulement au cas par cas).

### Modèles de messages (à personnaliser, envoyés par vous)

**Site d'emploi / blog** — Objet : *Une ressource gratuite pour vos candidats : Guide du CV au Cameroun 2026*
> Bonjour [Prénom], je suis [Nom], fondateur de MonEmploiGo, un outil camerounais de création de CV et de lettres de motivation. Nous avons publié un guide gratuit, sans inscription, sur la rédaction d'un CV au Cameroun (structure, CV sans expérience, CV ATS). Si vous le jugez utile pour vos lecteurs, vous pouvez le citer ou le reprendre en partie avec un lien. Je peux aussi écrire pour vous un article inédit sur un sujet de votre choix (ex. « les erreurs fréquentes dans les CV »). Merci pour votre travail auprès des candidats. [Signature, e-mail]

**École / université** — Objet : *Proposition d'atelier gratuit « Réussir son CV » pour vos étudiants*
> Bonjour, MonEmploiGo aide les candidats camerounais à préparer leur CV et leur lettre de motivation. Nous proposons à votre service d'orientation un atelier gratuit d'une heure (en ligne ou sur place) et un guide que vos étudiants peuvent consulter librement. [Signature]

**Média** — Objet : *Lancement : MonEmploiGo, des CV adaptés aux recruteurs camerounais et aux candidatures Ausbildung*
> (Joindre le communiqué ci-dessous.)

### Dossier de présentation (PR)

- **Description courte** : MonEmploiGo est une plateforme camerounaise en ligne pour créer un CV et une lettre de motivation professionnels, y compris au format ATS et au format allemand (Lebenslauf) pour les candidatures Ausbildung, avec paiement par Mobile Money.
- **Description longue** : MonEmploiGo permet aux candidats du Cameroun de créer en quelques minutes un CV (Standard, Premium, ATS ou allemand) et une lettre de motivation, en français ou en anglais. L'aperçu se met à jour en direct et indique si le CV tient sur une page. Le document se télécharge en PDF après un paiement par Mobile Money (MTN, Orange), de 1 000 à 2 000 XAF selon le modèle. Pour les candidatures en Allemagne, le site propose des CV au format Lebenslauf et une lettre de motivation allemande (Bewerbungsbrief). MonEmploiGo n'est ni une agence de recrutement ni une agence d'immigration : c'est un outil de création de documents.
- **Communiqué de presse (brouillon)** : titre factuel, date, ce que fait le service, pour qui, prix, paiement, protection des données (documents supprimés après 21 jours), contact presse — **[identité de l'exploitant à compléter]**. Aucun chiffre d'utilisateurs tant qu'il n'est pas réel.
- **Sujets pouvant intéresser les médias** : « CV ATS : pourquoi les candidats camerounais doivent s'y intéresser » ; « Postuler à une Ausbildung depuis le Cameroun : les pièges du dossier » ; « Premier CV sans expérience : comment faire » ; « CV bilingue au Cameroun ».
- **Statistiques que nous pourrions produire plus tard** (agrégées, anonymes, jamais individuelles) : part des CV d'une page, catégories de modèles les plus choisies, part des candidats sans expérience, part des CV en anglais. **Aucune n'est publiable aujourd'hui** (trop peu de données) ; à étudier dans 6 à 12 mois, et à mentionner d'abord dans la politique de confidentialité.

### Présence de marque (phase 15)

Priorités au Cameroun : **Facebook** (page officielle), **WhatsApp Business** + **chaîne WhatsApp** (conseils), **LinkedIn** (page entreprise, crédibilité auprès des écoles et médias), **TikTok** (conseils CV en vidéos courtes), **YouTube** (tutoriels). Instagram optionnel. Mêmes nom, logo, description, site et e-mail partout. Les liens n'iront dans `sameAs` qu'une fois les profils réellement créés.

**SEO local** : pas de fiche Google Business Profile tant qu'il n'y a pas d'adresse professionnelle réelle et vérifiable (une adresse inventée est interdite).

---

## 11. Mesure (phase 20)

- **Google Search Console** : pages indexées, clics, impressions, CTR, positions, requêtes, pages les plus performantes, erreurs d'indexation, Core Web Vitals, liens. Gratuit, sans aucune donnée personnelle des visiteurs.
- **Bing Webmaster Tools** : import depuis Search Console.
- **Suivi des liens** : rapport « Liens » de Search Console (gratuit) ; outils payants inutiles au départ.
- **Mesure d'audience** : aucune aujourd'hui (conforme à la politique de confidentialité). Si vous en voulez une, choisir un outil sans cookie ni donnée personnelle (ex. Vercel Web Analytics) **et** mettre à jour la politique de confidentialité et la page cookies avant de l'activer.
- Tableau de suivi mensuel simple : pages indexées, clics, impressions, 10 premières requêtes, domaines référents, LCP/CLS mobiles.

---

## 12. Plan d'action

**NIVEAU 1 — URGENT** (exploration et indexation)
1. Acheter le domaine et le configurer (vous, puis moi pour la configuration).
2. Protéger les routes privées dans le proxy + `noindex`.
3. Titres, descriptions, canonical, hreflang uniques.
4. robots.txt et sitemap.xml.
5. Search Console + soumission du sitemap.

**NIVEAU 2 — IMPORTANT** (technique et structure)
6. Aperçus des catalogues en images + un seul rendu par modèle (LCP, blocage, poids).
7. Polices des CV uniquement là où elles servent ; image d'accueil optimisée ; correction du CLS.
8. Pages publiques statiques (cache près des visiteurs).
9. Open Graph + image de partage ; données structurées ; 404 traduite ; fil d'Ariane ; apple-touch-icon.
10. Pages À propos, Contact, Tarifs ; identité de l'exploitant.

**NIVEAU 3 — CROISSANCE** (contenu et maillage)
11. Section Conseils + Guide du CV au Cameroun (pilier).
12. Guide Ausbildung depuis le Cameroun (pilier).
13. Articles 2 à 4, puis 2 par mois ; maillage interne.
14. Suivi des requêtes réelles dans Search Console, ajustement des titres.

**NIVEAU 4 — AUTORITÉ** (off-page)
15. Profils officiels (Facebook, WhatsApp, LinkedIn, TikTok) + `sameAs`.
16. Contacts avec 5 sites d'emploi (articles invités / ressources).
17. Ateliers CV avec 2-3 écoles ou universités.
18. Communiqué de lancement aux médias tech/économie.
19. Approche de l'écosystème Allemagne/Ausbildung.
20. Étude anonymisée future (quand les données le permettront).

---

## 13. Décisions attendues de votre part

1. **Nom de domaine** : lequel acheter (`monemploigo.com` recommandé ; `monemploigo.cm` pour l'ancrage camerounais — les deux peuvent pointer vers le site) ? Je vous guiderai pour l'achat et la configuration.
2. **Validation de l'architecture** (§2) et de la liste des pages nouvelles : Conseils, Tarifs, À propos, Contact.
3. **Validation des modifications techniques** (§3), notamment la refonte des aperçus en images (le plus gros chantier, et le plus gros gain).
4. **Identité de l'exploitant** (nom/société, ville) pour À propos, mentions légales, communiqué.
5. **Auteur des articles** : sous votre nom (plus crédible) ou « Équipe MonEmploiGo » ?

Sources consultées pour la concurrence et les prospects : pages de résultats pour « créer un CV en ligne Cameroun », « CV Ausbildung Allemagne Cameroun », « offres d'emploi Cameroun », « comment postuler Ausbildung depuis le Cameroun », « CV template Cameroon », médias tech camerounais, Goethe-Institut Kamerun (recherches web du 29/09/2026).
