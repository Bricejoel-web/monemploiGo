# Connecter monemploiGo à Google Search Console

Google Search Console est l'outil **gratuit** de Google qui montre comment le site apparaît dans les recherches : pages indexées, recherches qui amènent des visiteurs, clics, positions, erreurs. Il ne collecte aucune donnée sur les visiteurs du site.

## Situation actuelle

Le site n'a pas encore de nom de domaine propre : il est à l'adresse `https://monemploigo.vercel.app`. On utilise donc une propriété de type **« Préfixe de l'URL »**, vérifiée par une **balise HTML**.

Le site est déjà prêt : il affiche automatiquement la balise de vérification dès que le réglage `GOOGLE_SITE_VERIFICATION` est renseigné dans Vercel (voir `src/app/[locale]/layout.tsx`). Le code de vérification est **public** par nature (il apparaît dans le code de la page) : ce n'est pas un secret.

## Étapes

1. Ouvrez https://search.google.com/search-console et connectez-vous avec le compte Google du site (**monemploigo.contact@gmail.com**, recommandé : l'accès reste lié à l'entreprise).
2. Choisissez **« Préfixe de l'URL »** (à droite) et saisissez exactement : `https://monemploigo.vercel.app/`
3. Dans les méthodes de validation, choisissez **« Balise HTML »**. Google affiche une ligne du type :
   `<meta name="google-site-verification" content="AbCdEf123..." />`
4. Copiez **uniquement** la valeur entre les guillemets après `content=` (par exemple `AbCdEf123...`) et envoyez-la à votre développeur, **ou** ajoutez-la vous-même dans Vercel : Projet monemploigo → Settings → Environment Variables → nom `GOOGLE_SITE_VERIFICATION`, valeur = ce code, environnement **Production** → Save, puis redéployez.
5. Une fois le site redéployé, revenez dans Search Console et cliquez sur **« Valider »**. **Ne supprimez jamais ce réglage** : Google vérifie régulièrement sa présence.
6. Menu **Sitemaps** → saisissez `sitemap.xml` → **Envoyer**. (Adresse complète : `https://monemploigo.vercel.app/sitemap.xml`.)
7. Menu **Inspection de l'URL** → testez `https://monemploigo.vercel.app/fr` puis quelques pages clés (`/fr/cv`, `/fr/cv/allemagne`, `/fr/lettres-de-motivation`) → **Demander une indexation**.

## Ce qu'il faut surveiller ensuite (une fois par mois)

- **Pages** : nombre de pages indexées et raisons des exclusions. Normal : les pages de connexion, d'inscription, du tableau de bord, de paiement et les éditeurs de modèles sont volontairement **exclues** (`noindex` ou bloquées par `robots.txt`).
- **Performances** : clics, impressions, taux de clic (CTR), position moyenne, et surtout la liste des **requêtes** réellement tapées par les internautes — elle servira à ajuster les titres et à choisir les prochains articles.
- **Signaux Web essentiels** : vitesse réelle mesurée chez vos visiteurs (mobile).
- **Liens** : sites qui pointent vers monemploiGo.

## Si un nom de domaine est acheté plus tard

1. Ajouter le domaine dans Vercel comme domaine **principal**, avec redirection 301 depuis `monemploigo.vercel.app`.
2. Changer `siteUrl` dans `src/data/legal/legal-config.ts` (toutes les URL du site en dépendent : canonical, sitemap, partage, données structurées) et `APP_BASE_URL` dans Vercel (retour de paiement Notch Pay).
3. Dans Search Console : ajouter une propriété **« Domaine »** (vérification par un enregistrement DNS TXT chez le registraire), soumettre le nouveau sitemap, puis utiliser l'outil **« Changement d'adresse »** depuis l'ancienne propriété.
4. Mettre à jour l'adresse du webhook dans le tableau de bord Notch Pay.

## Bing (facultatif, 2 minutes)

Sur https://www.bing.com/webmasters, choisir « Importer depuis Google Search Console » : Bing reprend automatiquement le site et le sitemap.
