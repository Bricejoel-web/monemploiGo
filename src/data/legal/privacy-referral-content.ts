import { LEGAL_CONFIG } from "./legal-config";
import { h3, links, list, p, type LegalBlock, type LegalDocument, type LegalSection } from "./document-types";

/**
 * Ajouts de la politique de confidentialité pour le programme « Parrainer &
 * gagner », validés par l'utilisateur le 2026-10-06. Publiés seulement quand
 * REFERRAL_ENABLED=true (voir src/lib/referral/config.ts).
 */
const ADDITIONS: Record<"fr" | "en", { section: LegalSection; retention: LegalBlock[]; lastUpdated: string; prefix: string }> = {
  fr: {
    section: {
      heading: "8 ter. Parrainage",
      blocks: [
        p("Le programme « Parrainer & gagner » est régi par ses propres conditions."),
        links([{ label: "Conditions du programme « Parrainer & gagner »", path: "/conditions-parrainage" }]),
        p("Dans ce cadre, MonEmploiGo traite :"),
        list([
          "le code de parrainage de l'utilisateur ;",
          "le lien entre le parrain et la personne recommandée, ainsi que le domaine du lien de recommandation ;",
          "les récompenses (montant, type de document, date) ;",
          "les demandes de retrait (montant, opérateur, numéro Mobile Money, statut, dates) ;",
          "le journal des décisions de l'administrateur sur les retraits et les récompenses.",
        ]),
        p("Le parrain ne voit jamais l'identité de la personne recommandée : seul un numéro anonyme lui est présenté. La personne recommandée est informée du parrainage sur sa page d'arrivée."),
        p("Le numéro Mobile Money indiqué pour un retrait sert uniquement à envoyer le paiement."),
        p("Un cookie technique, « monemploigo_ref », mémorise pendant 30 jours le lien de recommandation suivi, afin de l'attribuer au compte créé ; il est retiré une fois le compte créé (voir la Politique de cookies)."),
      ],
    },
    retention: [
      h3("Parrainage"),
      p("Les données du parrainage sont conservées tant que le compte existe."),
      p("Après la suppression du compte, les informations nécessaires relatives aux récompenses et aux retraits peuvent être conservées sous une forme permettant leur traçabilité comptable et leur audit, conformément aux obligations applicables."),
    ],
    lastUpdated: LEGAL_CONFIG.privacyWithReferralLastUpdated,
    prefix: "Dernière mise à jour : ",
  },
  en: {
    section: {
      heading: "8b. Referral programme",
      blocks: [
        p("The « Parrainer & gagner » referral programme is governed by its own terms (in French)."),
        links([{ label: "« Parrainer & gagner » programme terms (in French)", path: "/conditions-parrainage" }]),
        p("For this programme, MonEmploiGo processes:"),
        list([
          "the user's referral code;",
          "the link between the referrer and the referred person, and the domain of the referral link;",
          "rewards (amount, document type, date);",
          "withdrawal requests (amount, operator, Mobile Money number, status, dates);",
          "the log of the administrator's decisions on withdrawals and rewards.",
        ]),
        p("The referrer never sees the identity of the referred person: only an anonymous number is shown. The referred person is informed of the referral on their landing page."),
        p("The Mobile Money number given for a withdrawal is used only to send the payment."),
        p("A technical cookie, \"monemploigo_ref\", remembers the referral link followed for 30 days so it can be attributed to the account created; it is removed once the account is created (see the Cookie policy)."),
      ],
    },
    retention: [
      h3("Referral programme"),
      p("Referral data is kept for as long as the account exists."),
      p("After the account is deleted, the necessary information about rewards and withdrawals may be kept in a form that allows accounting traceability and audit, in accordance with applicable obligations."),
    ],
    lastUpdated: LEGAL_CONFIG.privacyWithReferralLastUpdatedEn,
    prefix: "Last updated: ",
  },
};

/** Politique complétée des ajouts du parrainage (après la section 8 / 8 bis). */
export function withReferralPrivacy(document: LegalDocument, locale: "fr" | "en"): LegalDocument {
  const additions = ADDITIONS[locale];
  const label = `${additions.prefix}${additions.lastUpdated}`;
  const isSection8 = (heading: string) => heading.startsWith("8.") || heading.startsWith("8 bis") || heading.startsWith("8a");
  const lastSection8 = document.sections.map((s) => isSection8(s.heading)).lastIndexOf(true);

  const sections = document.sections.flatMap((section, index) => {
    const n = Number.parseInt(section.heading, 10);
    let blocks = n === 17 ? [...section.blocks, ...additions.retention] : section.blocks;
    if (n === 29) blocks = blocks.map((b) => (b.type === "p" && b.text.startsWith(additions.prefix) ? p(label) : b));
    const updated = { ...section, blocks };
    return index === lastSection8 ? [updated, additions.section] : [updated];
  });
  return { ...document, lastUpdatedLabel: label, sections };
}
