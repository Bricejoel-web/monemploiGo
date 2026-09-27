const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Tailwind v4 structure tout son CSS généré à l'intérieur de blocs
    // `@layer` (calques de cascade) — une syntaxe CSS relativement récente
    // (~2022) que les très vieux navigateurs (WebView Android anciens,
    // fréquents sur les téléphones d'entrée de gamme visés par ce site) ne
    // comprennent pas du tout. Contrairement à d'autres fonctions modernes
    // que Tailwind encadre déjà d'un repli automatique (`@supports`, voir
    // `color-mix()`), l'absence de support de `@layer` fait échouer TOUT le
    // fichier CSS d'un coup — exactement le bug signalé par un utilisateur
    // (page qui s'affiche en HTML brut, sans aucun style). Ce plugin
    // "aplati" les calques en CSS classique équivalent (même ordre de
    // cascade, sans dépendre du support natif de `@layer`) juste après la
    // génération de Tailwind.
    "@csstools/postcss-cascade-layers": {},
  },
};

export default config;
