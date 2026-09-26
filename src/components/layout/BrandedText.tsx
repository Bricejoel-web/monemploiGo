// Quand "monemploiGo" apparaît en texte brut à l'intérieur d'un titre (pas
// via le composant Logo, qui gère déjà ce cas), le "Go" doit rester en
// corail comme dans le logo — sinon le nom du site perd sa couleur de
// marque dès qu'il est écrit dans une phrase plutôt qu'affiché seul dans
// l'en-tête. Cherche "monemploiGo" dans la chaîne traduite et colore
// uniquement son "Go" final, sans toucher au reste du texte.
export function BrandedText({ text }: { text: string }) {
  const match = /monemploi(Go)/i.exec(text);
  if (!match) return <>{text}</>;

  const start = match.index;
  const end = start + match[0].length;
  const brandBase = match[0].slice(0, -2);
  const go = match[0].slice(-2);

  return (
    <>
      {text.slice(0, start)}
      {brandBase}
      <span className="text-[#eb5757]">{go}</span>
      {text.slice(end)}
    </>
  );
}
