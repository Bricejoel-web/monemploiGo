# monemploigo

Plateforme de création rapide de CV et lettres de motivation pour l'Afrique.

## Stack technique

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 7** + SQLite en local (driver adapter `@prisma/adapter-better-sqlite3`)
- Authentification maison (sessions JWT signées via `jose`, mots de passe hachés avec `bcryptjs`)
- Paiement : abstraction MTN Mobile Money / Orange Money avec un mode `mock` par défaut
- Export **Word** via `docx`, export **PDF** via l'impression navigateur (format A4 natif)
- Internationalisation FR/EN native (sans librairie tierce — voir `docs/ROADMAP.md`)

## Démarrage

```bash
npm install
npx prisma migrate dev   # crée prisma/dev.db si besoin
npm run dev
```

Le site est disponible sur http://localhost:3000 (redirige vers `/fr` ou `/en`).

## Variables d'environnement

Copier `.env.example` vers `.env` et adapter :

- `DATABASE_URL` — chemin de la base SQLite (`file:./prisma/dev.db` par défaut)
- `SESSION_SECRET` — clé aléatoire longue pour signer les sessions
- `PAYMENT_MODE` — `mock` (paiement simulé, par défaut) ou `live`
- `MTN_MOMO_*` — identifiants API MTN Mobile Money (voir https://momodeveloper.mtn.com)
- `ORANGE_MONEY_*` — identifiants API Orange Money Web Payment (voir https://developer.orange.com/apis/om-webpay)

En mode `mock`, tout paiement réussit instantanément — utile pour développer et démontrer
le parcours complet sans compte marchand actif.

## Catalogue de modèles

Les modèles de CV et de lettres de motivation ne sont **pas stockés en base** : ils sont
générés par code à partir d'archétypes de mise en page × palettes de couleurs
(voir `src/lib/cv/layouts.ts`, `src/lib/cv/themes.ts`, `src/lib/cv/catalog.ts`). Cela permet
de maintenir un vrai catalogue de 215 CV + 100 lettres sans dupliquer 315 composants React :

| Catégorie         | Modèles | Prix     |
| ------------------ | ------: | -------- |
| CV Standard         |      50 | 500 FCFA |
| CV Premium          |     100 | 1000 FCFA |
| CV ATS              |      50 | 1000 FCFA |
| CV Allemagne (ATS)  |      15 | 1000 FCFA |
| Lettres de motivation |    100 | 500 FCFA |

## Structure

```
src/app/[locale]/        pages (routage FR/EN)
src/components/          composants React (cv, dashboard, layout, auth, payment)
src/lib/cv/              moteur de templates (layouts, thèmes, catalogue, rendu A4)
src/lib/auth/            sessions, mots de passe, actions serveur
src/lib/payment/         abstraction MTN / Orange Money
src/lib/export/          génération Word (docx)
src/lib/documents/       création de documents, paiement, chargement
prisma/schema.prisma     modèle de données (User, Document, Payment)
docs/ROADMAP.md          feuille de route et décisions
```

## Sécurité

- Mots de passe hachés (bcrypt, coût 12), sessions JWT `httpOnly` + `secure` en production
- Limiteur de débit en mémoire sur connexion / inscription / paiement
- En-têtes de sécurité (CSP, HSTS, X-Frame-Options, etc.) dans `next.config.ts`
- Vérification de propriété systématique avant tout accès à un document ou un paiement

## Points connus / limites (voir `docs/ROADMAP.md`)

- Prix des lettres de motivation et du nombre de modèles "Allemagne" : hypothèses à valider,
  le cahier des charges initial ne les précisait pas.
- Photo de profil stockée en base (data URL) — suffisant pour la V1, à migrer vers un stockage
  objet (S3-compatible) si le volume grandit.
- Pas de photos de personnes réelles utilisées dans les modèles (voir ROADMAP — choix
  juridique) : illustrations vectorielles à la place, photo de l'utilisateur uploadée par
  lui-même dans l'éditeur.
