import { LEGAL_CONFIG } from "./legal-config";
import { h3, list, p, type LegalBlock, type LegalDocument, type LegalSection } from "./document-types";

/**
 * Ajouts de la politique de confidentialité pour MonEmploiGo Pro, validés
 * par l'utilisateur le 2026-09-30. Ils ne sont publiés que lorsque Pro est
 * activé (PRO_ENABLED, voir src/lib/pro/flag.ts) : la politique ne décrit
 * jamais un traitement qui n'existe pas encore. Le texte de base
 * (privacy-content.ts) n'est pas modifié.
 */
interface ProPrivacyAdditions {
  /** Nouvelle section insérée juste après la section 8. */
  section: LegalSection;
  /** Blocs ajoutés à la fin des sections existantes, par numéro. */
  append: Record<number, LegalBlock[]>;
  lastUpdated: string;
  lastUpdatedPrefix: string;
}

const ADDITIONS: Record<"fr" | "en", ProPrivacyAdditions> = {
  fr: {
    section: {
      heading: "8 bis. MonEmploiGo Pro",
      blocks: [
        p("MonEmploiGo Pro est un espace destiné aux structures et aux professionnels qui préparent les documents de candidature de leurs candidats. Il est régi par les Conditions d'utilisation de MonEmploiGo Pro."),
        h3("Données du professionnel"),
        p("Pour l'espace Pro, MonEmploiGo traite :"),
        list([
          "le nom de la structure et le nom du responsable ;",
          "l'adresse e-mail et le numéro de téléphone professionnels ;",
          "la version des Conditions d'utilisation de MonEmploiGo Pro acceptée et la date de cette acceptation ;",
          "l'historique des abonnements et des paiements ;",
          "les compteurs d'utilisation (candidats actifs, documents finalisés).",
        ]),
        p("MonEmploiGo est responsable de ces traitements."),
        h3("Données des candidats"),
        p("Le professionnel peut enregistrer, pour chacun de ses candidats :"),
        list([
          "son identité et ses coordonnées ;",
          "le pays de destination, le domaine et le type de candidature ;",
          "son niveau d'études et ses langues, y compris son niveau d'allemand ;",
          "le contenu de ses documents (expériences, formations, compétences) et, si elle est ajoutée, sa photographie.",
        ]),
        p("Pour ces données, le professionnel est responsable du traitement. MonEmploiGo agit comme sous-traitant : il traite ces données uniquement pour fournir le service au professionnel."),
        p("MonEmploiGo n'utilise pas les données des candidats pour ses propres besoins, ne les vend pas, ne les utilise pas à des fins commerciales et ne contacte pas directement les candidats, sauf obligation légale ou demande de support appropriée. Aucune donnée de candidat n'est transmise au prestataire de paiement."),
        h3("Obligations du professionnel"),
        p("Le professionnel doit :"),
        list([
          "informer ses candidats de l'utilisation de MonEmploiGo et de l'hébergement de leurs données hors du Cameroun (voir section 15) ;",
          "disposer de leur accord ou d'une autre base légale ;",
          "ne saisir que les données nécessaires à la candidature ;",
          "répondre à leurs demandes d'accès, de rectification ou d'effacement.",
        ]),
        p("Le professionnel peut supprimer définitivement un candidat et ses documents à tout moment depuis son espace."),
        h3("Demandes des candidats"),
        p("Un candidat qui s'adresse à MonEmploiGo est orienté vers le professionnel concerné. Sa demande est transmise à ce professionnel lorsque c'est possible, sauf si la loi impose à MonEmploiGo d'agir directement."),
        h3("Confidentialité et séparation des espaces"),
        p("Les données d'un espace Pro ne sont accessibles qu'au professionnel titulaire. L'équipe MonEmploiGo n'y accède que pour assurer le support à sa demande, la sécurité du service ou le respect d'une obligation légale."),
        p("Lorsqu'un même compte dispose d'un espace particulier et d'un espace Pro, les données de ces deux espaces restent séparées."),
        h3("Conservation"),
        p("Les règles de conservation propres à l'espace Pro sont présentées à la section 17."),
      ],
    },
    append: {
      13: [
        p("Pour l'espace Pro, MonEmploiGo peut également envoyer des avertissements relatifs à l'expiration de l'abonnement et à la suppression prochaine des données de l'espace Pro."),
      ],
      15: [
        p("Les données des candidats enregistrées dans l'espace Pro sont hébergées dans les mêmes conditions que les autres données (voir la section 8 bis)."),
      ],
      17: [
        h3("Espace Pro"),
        list([
          "Pendant l'abonnement : les candidats (actifs et archivés), les brouillons et les documents finalisés sont conservés. La suppression automatique des documents après 21 jours ne s'applique pas à l'espace Pro.",
          "Après l'expiration : l'espace passe en lecture seule pendant 90 jours (consultation et téléchargement uniquement). Un renouvellement pendant ce délai rétablit l'accès complet aux données existantes.",
          "Avertissements : le jour de l'expiration, puis 30 jours et 7 jours avant la suppression définitive, dans le tableau de bord et, lorsque l'envoi d'e-mails est disponible, par e-mail.",
          "Après 90 jours sans renouvellement : les candidats, les brouillons et les documents de l'espace Pro sont supprimés définitivement. Les informations de la structure sont conservées tant que le compte existe, sans aucune donnée de candidat.",
          "Suppression d'un candidat par le professionnel : le candidat et ses documents sont supprimés immédiatement et définitivement.",
          "Suppression de l'espace Pro : les informations de la structure, les candidats et leurs documents sont supprimés immédiatement et définitivement.",
          "Traces de paiement Pro (référence, montant, devise, date, statut, offre et nom de la structure) : conservées, séparément des données de candidature et sans aucune donnée de candidat, pendant la durée imposée par les obligations comptables, fiscales et légales applicables, y compris après la suppression de l'espace Pro ou du compte, puis supprimées.",
        ]),
      ],
      18: [
        p("L'espace Pro se supprime séparément, depuis ses paramètres (« Supprimer mon espace professionnel ») : cette suppression n'entraîne pas celle du compte particulier. La suppression du compte entraîne celle de l'espace Pro qui lui est associé. Dans les deux cas, les traces de paiement Pro sont conservées comme indiqué à la section 17."),
      ],
    },
    lastUpdated: LEGAL_CONFIG.privacyWithProLastUpdated,
    lastUpdatedPrefix: "Dernière mise à jour : ",
  },
  en: {
    section: {
      heading: "8a. MonEmploiGo Pro",
      blocks: [
        p("MonEmploiGo Pro is a space for organisations and professionals who prepare application documents for their candidates. It is governed by the MonEmploiGo Pro Terms of Use (available in French)."),
        h3("Professional's data"),
        p("For the Pro space, MonEmploiGo processes:"),
        list([
          "the organisation's name and the manager's name;",
          "the professional email address and phone number;",
          "the version of the MonEmploiGo Pro Terms of Use accepted and the date of acceptance;",
          "the history of subscriptions and payments;",
          "usage counters (active candidates, finalised documents).",
        ]),
        p("MonEmploiGo is the controller of this processing."),
        h3("Candidates' data"),
        p("The professional may record, for each candidate:"),
        list([
          "their identity and contact details;",
          "the destination country, field and type of application;",
          "their level of education and languages, including their level of German;",
          "the content of their documents (experience, education, skills) and, if added, their photograph.",
        ]),
        p("For this data, the professional is the controller. MonEmploiGo acts as a processor: it processes this data only to provide the service to the professional."),
        p("MonEmploiGo does not use candidates' data for its own purposes, does not sell it, does not use it for commercial purposes and does not contact candidates directly, except where required by law or for an appropriate support request. No candidate data is sent to the payment provider."),
        h3("Professional's obligations"),
        p("The professional must:"),
        list([
          "inform their candidates that MonEmploiGo is used and that their data is hosted outside Cameroon (see section 15);",
          "have their consent or another legal basis;",
          "only enter the data needed for the application;",
          "handle their requests for access, rectification or erasure.",
        ]),
        p("The professional can permanently delete a candidate and their documents at any time from their space."),
        h3("Requests from candidates"),
        p("A candidate who contacts MonEmploiGo is referred to the professional concerned. Their request is forwarded to that professional where possible, unless the law requires MonEmploiGo to act directly."),
        h3("Confidentiality and separation of spaces"),
        p("The data in a Pro space is accessible only to the professional who holds it. The MonEmploiGo team only accesses it to provide support at the professional's request, to secure the service or to comply with a legal obligation."),
        p("When the same account has both a personal space and a Pro space, the data of the two spaces remains separate."),
        h3("Retention"),
        p("The retention rules specific to the Pro space are set out in section 17."),
      ],
    },
    append: {
      13: [
        p("For the Pro space, MonEmploiGo may also send notices about the expiry of the subscription and the upcoming deletion of the Pro space's data."),
      ],
      15: [
        p("Candidates' data recorded in the Pro space is hosted under the same conditions as other data (see section 8a)."),
      ],
      17: [
        h3("Pro space"),
        list([
          "During the subscription: candidates (active and archived), drafts and finalised documents are kept. The automatic deletion of documents after 21 days does not apply to the Pro space.",
          "After expiry: the space becomes read-only for 90 days (viewing and downloading only). Renewing during this period restores full access to the existing data.",
          "Notices: on the day of expiry, then 30 days and 7 days before permanent deletion, in the dashboard and, when email sending is available, by email.",
          "After 90 days without renewal: the Pro space's candidates, drafts and documents are permanently deleted. The organisation's details are kept for as long as the account exists, without any candidate data.",
          "Deletion of a candidate by the professional: the candidate and their documents are deleted immediately and permanently.",
          "Deletion of the Pro space: the organisation's details, the candidates and their documents are deleted immediately and permanently.",
          "Pro payment records (reference, amount, currency, date, status, plan and organisation name): kept separately from application data and without any candidate data, for the period required by applicable accounting, tax and legal obligations, including after the Pro space or the account is deleted, then deleted.",
        ]),
      ],
      18: [
        p("The Pro space is deleted separately, from its settings (\"Delete my professional space\"): this does not delete the personal account. Deleting the account deletes the Pro space associated with it. In both cases, Pro payment records are kept as described in section 17."),
      ],
    },
    lastUpdated: LEGAL_CONFIG.privacyWithProLastUpdatedEn,
    lastUpdatedPrefix: "Last updated: ",
  },
};

const sectionNumber = (heading: string) => Number.parseInt(heading, 10);

/** Politique de confidentialité complétée des ajouts Pro. */
export function withProPrivacy(document: LegalDocument, locale: "fr" | "en"): LegalDocument {
  const additions = ADDITIONS[locale];
  const label = `${additions.lastUpdatedPrefix}${additions.lastUpdated}`;
  const sections = document.sections.flatMap((section) => {
    const n = sectionNumber(section.heading);
    let blocks = [...section.blocks, ...(additions.append[n] ?? [])];
    // La date répétée dans « Entrée en vigueur » suit la nouvelle version.
    if (n === 29) {
      blocks = blocks.map((block) =>
        block.type === "p" && block.text.startsWith(additions.lastUpdatedPrefix) ? p(label) : block,
      );
    }
    const updated = { ...section, blocks };
    return n === 8 ? [updated, additions.section] : [updated];
  });
  return { ...document, lastUpdatedLabel: label, sections };
}
