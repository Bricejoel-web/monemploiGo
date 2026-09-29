/**
 * Polices utilisées par les mises en page de CV et de lettres
 * (src/components/cv/layouts). Chargées UNIQUEMENT sur les pages qui
 * affichent des documents (catalogues, éditeurs, aperçu à imprimer) — et non
 * plus sur tout le site : 7 familles de polices Google bloquaient le premier
 * affichage de chaque page, y compris l'accueil et les pages légales qui
 * n'en ont pas besoin.
 */
export function CvFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,600&display=swap"
    />
  );
}
