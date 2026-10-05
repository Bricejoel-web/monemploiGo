"use client";

import { useState, type ReactNode } from "react";
import { GlobeIcon } from "@/components/home/icons";
import { ChatIcon, CopyIcon, FlagCameroon, FlagGermany } from "./icons";

type Domain = "cameroun" | "allemagne" | "general";

const DOMAINS: { value: Domain; title: string; text: string; icon: ReactNode }[] = [
  { value: "cameroun", title: "Emploi au Cameroun", text: "Pour les personnes qui recherchent un emploi au Cameroun.", icon: <FlagCameroon /> },
  {
    value: "allemagne",
    title: "Projet professionnel en Allemagne",
    text: "Pour les personnes qui souhaitent préparer une candidature dans le cadre d'un projet professionnel en Allemagne.",
    icon: <FlagGermany />,
  },
  { value: "general", title: "Recommandation générale", text: "Pour les personnes qui souhaitent simplement découvrir les services de MonEmploiGo.", icon: <GlobeIcon className="h-6 w-6 text-[#16324f] dark:text-white" /> },
];

/** Message WhatsApp : une vraie recommandation, jamais « achète pour que je gagne ». */
function whatsappMessage(domain: Domain, link: string): string {
  if (domain === "allemagne") {
    return `👋 Salut !\n\nSi tu prépares un projet professionnel en Allemagne et que tu as besoin d'un CV ou d'une lettre de motivation, je te recommande MonEmploiGo.\n\nTu peux découvrir leurs services ici 👇\n\n${link}\n\nJ'espère que ça pourra t'aider dans ta démarche. 😊`;
  }
  if (domain === "cameroun") {
    return `👋 Salut !\n\nSi tu recherches un emploi au Cameroun et que tu as besoin d'un CV professionnel ou d'une lettre de motivation, je te recommande MonEmploiGo.\n\nDécouvre les services ici 👇\n\n${link}\n\nBonne chance pour ta recherche d'emploi ! 😊`;
  }
  return `👋 Salut !\n\nSi tu as besoin d'un CV ou d'une lettre de motivation, je te recommande MonEmploiGo : on crée ses documents simplement, depuis son téléphone.\n\nDécouvre leurs services ici 👇\n\n${link}\n\nJ'espère que ça pourra t'aider ! 😊`;
}

export function ReferralShare({ code, siteUrl }: { code: string; siteUrl: string }) {
  const [domain, setDomain] = useState<Domain>("cameroun");
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl}/?ref=${code}&domain=${domain}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Navigateur sans presse-papiers : on sélectionne le lien pour une copie manuelle.
      document.getElementById("referral-link")?.focus();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Domaine de recommandation</legend>
        {DOMAINS.map((d) => (
          <label
            key={d.value}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
              domain === d.value ? "border-[#f2994a] bg-[#f2994a]/10" : "border-black/10 bg-white hover:bg-black/[0.02] dark:border-white/15 dark:bg-white/5"
            }`}
          >
            <input type="radio" name="domain" value={d.value} checked={domain === d.value} onChange={() => setDomain(d.value)} className="mt-1" />
            <span className="mt-0.5">{d.icon}</span>
            <span>
              <span className="block font-semibold">{d.title}</span>
              <span className="block text-sm text-black/65 dark:text-white/65">{d.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="referral-link" className="text-sm font-medium">
          Votre lien
        </label>
        <input
          id="referral-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 font-mono text-xs dark:border-white/20 dark:bg-white/5"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            <CopyIcon />
            Copier le lien
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage(domain, link))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <ChatIcon />
            Partager sur WhatsApp
          </a>
          {copied && (
            <span role="status" className="self-center text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ✓ Lien copié !
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
