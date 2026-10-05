/** Logo de la structure, ou ses initiales s'il n'y en a pas (espace Pro uniquement). */
export function ProLogo({ companyName, logoDataUrl, size = 40 }: { companyName: string; logoDataUrl: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (logoDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image enregistrée en base (data URL), déjà réduite à 256 px
      <img
        src={logoDataUrl}
        alt={`Logo de ${companyName}`}
        style={style}
        className="shrink-0 rounded-full border border-black/10 bg-white object-contain dark:border-white/15"
      />
    );
  }
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: Math.round(size * 0.38) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#16324f] font-bold text-white dark:bg-white dark:text-[#16324f]"
    >
      {initials}
    </span>
  );
}
