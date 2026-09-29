/**
 * Données structurées JSON-LD (schema.org). Règle du projet : n'y mettre que
 * des informations réelles et visibles — jamais d'adresse, de téléphone,
 * d'avis, de note ou de chiffres inventés (voir docs/seo).
 * Le `<` est échappé pour qu'un texte ne puisse jamais fermer la balise.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
