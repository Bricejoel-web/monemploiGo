import { LEGAL_CONFIG } from "./legal-config";
import { links, list, p, type LegalDocument } from "./document-types";

/**
 * Conditions d'utilisation de MonEmploiGo Pro (« CGU Pro »), validées par
 * l'utilisateur le 2026-09-30 (texte, conservation, remboursement, 6 points
 * complémentaires — voir docs/ROADMAP.md). En français uniquement, comme
 * l'espace Pro (décision du 2026-09-30).
 *
 * ⚠️ Chaque phrase doit correspondre à ce qui est réellement implémenté :
 * modifier ce texte ET le code ensemble (quota, conservation, verrouillage,
 * renouvellement, avertissements, remboursement).
 */
export const PRO_TERMS_CONTENT: LegalDocument = {
  title: "Conditions d'utilisation de MonEmploiGo Pro",
  lastUpdatedLabel: `Dernière mise à jour : ${LEGAL_CONFIG.proTermsLastUpdated}`,
  intro: [
    p("Les présentes Conditions d'utilisation de MonEmploiGo Pro (« CGU Pro ») s'appliquent à l'espace professionnel de MonEmploiGo."),
    p("Elles complètent les Conditions générales d'utilisation de MonEmploiGo (« CGU »), qui restent applicables. En cas de contradiction, les CGU Pro prévalent pour tout ce qui concerne l'espace professionnel."),
    links([
      { label: "Conditions générales d'utilisation de MonEmploiGo", path: "/conditions-utilisation" },
      { label: "Politique de confidentialité de MonEmploiGo", path: "/confidentialite" },
    ]),
  ],
  sections: [
    {
      heading: "1. Objet de MonEmploiGo Pro",
      blocks: [
        p("MonEmploiGo Pro est un espace destiné aux structures et aux professionnels qui accompagnent régulièrement des candidats dans la préparation de leurs candidatures professionnelles ou internationales."),
        p("Il permet notamment :"),
        list([
          "de gérer des dossiers de candidats ;",
          "de créer, pour ces candidats, les documents disponibles sur MonEmploiGo ;",
          "de consulter l'historique des documents et de les télécharger.",
        ]),
        p("MonEmploiGo Pro fournit uniquement des outils de préparation et de gestion documentaire."),
      ],
    },
    {
      heading: "2. Ce que MonEmploiGo n'est pas",
      blocks: [
        p("MonEmploiGo, y compris dans son offre Pro, n'est pas :"),
        list([
          "une agence de recrutement ;",
          "une agence d'intérim ;",
          "une agence d'immigration ;",
          "une agence de visa ;",
          "un cabinet juridique ;",
          "un organisme de formation ;",
          "un employeur ;",
          "le partenaire, le mandataire ou le représentant du professionnel.",
        ]),
        p("MonEmploiGo ne garantit pas l'obtention d'un emploi, d'un entretien, d'un contrat, d'une Ausbildung, d'une admission, d'un visa, d'un titre de séjour ou d'une autorisation de travail."),
        p("MonEmploiGo n'est pas partie à la relation entre le professionnel et ses candidats."),
      ],
    },
    {
      heading: "3. Accès à l'espace Pro",
      blocks: [
        p("L'espace Pro est rattaché à un compte MonEmploiGo. Un même compte peut disposer d'un espace particulier et d'un espace Pro : leurs données restent séparées et ne sont pas visibles de l'un à l'autre."),
        p("Le titulaire de l'espace Pro garantit :"),
        list([
          "qu'il agit dans le cadre d'une activité professionnelle ;",
          "que les informations relatives à sa structure sont exactes ;",
          "qu'il dispose, le cas échéant, des autorisations exigées par la réglementation pour exercer son activité.",
        ]),
        p("Un espace Pro correspond à une seule structure ou à un seul professionnel. Le titulaire est responsable de toute action réalisée avec ses identifiants."),
      ],
    },
    {
      heading: "4. Obligations du professionnel envers ses candidats",
      blocks: [
        p("Le professionnel s'engage à :"),
        list([
          "ne créer un dossier que pour une personne qui l'a sollicité et qui a accepté que ses informations soient utilisées pour préparer ses documents ;",
          "informer cette personne de l'utilisation de MonEmploiGo pour cette préparation ;",
          "ne saisir que les informations nécessaires à la candidature ;",
          "vérifier l'exactitude des informations et faire relire les documents par le candidat avant toute utilisation ;",
          "ne jamais présenter MonEmploiGo comme garant, partenaire ou certificateur de ses services, ni promettre à un candidat un résultat au nom de MonEmploiGo ;",
          "assumer seul les engagements, tarifs et prestations qu'il propose à ses candidats.",
        ]),
      ],
    },
    {
      heading: "5. Offre Pro Starter",
      blocks: [
        p("Pro Starter donne accès, pour une période de 30 jours, à :"),
        list([
          "jusqu'à 10 candidats actifs simultanément ;",
          "jusqu'à 30 documents finalisés par période ;",
          "la gestion des candidats et de leurs dossiers ;",
          "la création des documents disponibles sur MonEmploiGo ;",
          "l'historique des documents et leur téléchargement en PDF ;",
          "un tableau de bord professionnel ;",
          "la gestion de l'abonnement.",
        ]),
        p("Le quota non utilisé à la fin d'une période n'est pas reporté : chaque nouvelle période commence avec 30 documents disponibles."),
      ],
    },
    {
      heading: "6. Prix",
      blocks: [
        p("Pro Starter coûte 5 000 FCFA (XAF) par période de 30 jours."),
        p("Le prix applicable est celui affiché au moment du paiement. Une modification de prix ne s'applique jamais à une période déjà payée : elle s'applique au renouvellement suivant."),
      ],
    },
    {
      heading: "7. Paiement et activation",
      blocks: [
        p("Le paiement est traité par un prestataire de paiement externe (actuellement Notch Pay)."),
        p("L'abonnement n'est activé qu'après confirmation technique du paiement par le prestataire et vérification par les systèmes de MonEmploiGo. Le simple retour sur le site après le paiement ne suffit pas à activer l'abonnement."),
        p("Un même paiement ne peut activer qu'une seule période."),
      ],
    },
    {
      heading: "8. Durée et renouvellement",
      blocks: [
        p("L'abonnement n'est pas renouvelé automatiquement. Aucun paiement n'a lieu sans une action volontaire du professionnel."),
        p("Le professionnel peut renouveler son abonnement à tout moment :"),
        list([
          "un renouvellement effectué avant la fin de la période en cours commence à la fin de cette période, sans perte de jours ;",
          "un renouvellement effectué après l'expiration commence le jour de la confirmation du paiement.",
        ]),
      ],
    },
    {
      heading: "9. Candidats actifs et archivés",
      blocks: [
        p("Seuls les candidats actifs comptent dans la limite de 10. Un candidat archivé ne compte plus dans cette limite et peut être réactivé lorsqu'une place est disponible. Le nombre total de candidats enregistrés peut donc être supérieur à 10."),
        p("Le professionnel peut supprimer définitivement un candidat et ses documents à tout moment, notamment à la demande de ce candidat. Une confirmation est demandée avant cette suppression, qui est irréversible."),
        p("La suppression d'un candidat ne restitue pas les unités de quota déjà consommées."),
      ],
    },
    {
      heading: "10. Documents finalisés et quota",
      blocks: [
        list([
          "Un document en cours de préparation (brouillon) ne consomme aucun quota.",
          "Un document consomme une unité du quota au moment où il est finalisé et devient téléchargeable.",
          "Un document finalisé est verrouillé et ne peut plus être modifié. Une correction nécessite la création d'un nouveau document, qui consomme une nouvelle unité.",
          "Un document finalisé peut être téléchargé autant de fois que nécessaire pendant la durée d'accès, sans nouvelle consommation.",
          "Lorsque le quota de la période est atteint, aucune nouvelle finalisation n'est possible jusqu'à la période suivante.",
        ]),
      ],
    },
    {
      heading: "11. Expiration de l'abonnement",
      blocks: [
        p("À l'expiration de l'abonnement, l'espace Pro passe en lecture seule pendant 90 jours. Pendant cette période :"),
        list([
          "la consultation et le téléchargement des documents finalisés restent possibles ;",
          "la création de candidats, la création ou la finalisation de documents et toute modification sont bloquées ;",
          "la suppression définitive d'un candidat ou de l'espace Pro reste possible ;",
          "un renouvellement rétablit immédiatement l'accès complet, avec les données existantes.",
        ]),
        p("Le professionnel est prévenu le jour de l'expiration, puis 30 jours et 7 jours avant la suppression définitive : dans son tableau de bord et, lorsque l'envoi d'e-mails est disponible, par e-mail."),
        p("Au terme des 90 jours sans renouvellement, les candidats, les brouillons et les documents de l'espace Pro sont supprimés définitivement, selon les règles de conservation décrites dans la Politique de confidentialité."),
      ],
    },
    {
      heading: "12. Remboursement",
      blocks: [
        p("L'abonnement Pro Starter est payé pour une période de 30 jours."),
        p("Si aucun document n'a été finalisé pendant la période payée, le professionnel peut demander un remboursement au support, pendant cette période, en indiquant la référence du paiement. La demande est étudiée selon les présentes conditions et le droit applicable. Si le remboursement est accordé, l'abonnement prend fin."),
        p("Dès qu'au moins un document Pro a été finalisé et rendu téléchargeable pendant la période, aucun remboursement volontaire n'est accordé, sauf :"),
        list([
          "problème technique imputable à MonEmploiGo ;",
          "paiement débité mais abonnement non activé ;",
          "double paiement ;",
          "montant incorrectement débité ;",
          "service inaccessible en raison d'un problème imputable à MonEmploiGo ;",
          "tout autre cas imposé par la loi.",
        ]),
        p("La suppression de l'espace Pro ne donne pas droit à un remboursement, sauf si les conditions ci-dessus sont remplies."),
        p("Cette règle est rappelée avant chaque paiement."),
      ],
    },
    {
      heading: "13. Utilisation des documents créés",
      blocks: [
        p("Le professionnel peut remettre les documents finalisés aux candidats concernés, y compris dans le cadre d'une prestation d'accompagnement qu'il facture lui-même. Le candidat peut les utiliser pour ses démarches."),
        p("Il est interdit :"),
        list([
          "de revendre ou de redistribuer les modèles vierges de MonEmploiGo ;",
          "de revendre ou de céder l'accès à l'espace Pro ;",
          "de présenter la technologie ou les modèles de MonEmploiGo comme sa propre création.",
        ]),
      ],
    },
    {
      heading: "14. Contenus et usages interdits",
      blocks: [
        p("Les interdictions prévues par l'article 15 des CGU s'appliquent. Il est en outre interdit :"),
        list([
          "de créer un dossier ou un document pour une personne sans son accord ;",
          "de fabriquer de faux diplômes, attestations, expériences ou niveaux de langue ;",
          "de contourner les quotas, notamment en réutilisant un document pour un autre candidat ;",
          "d'automatiser l'utilisation de l'espace Pro.",
        ]),
      ],
    },
    {
      heading: "15. Suspension",
      blocks: [
        p("MonEmploiGo peut suspendre ou fermer un espace Pro en cas de fraude, de création de documents trompeurs, d'utilisation sans l'accord des candidats, de contournement des limites techniques ou de violation grave des présentes CGU Pro."),
        p("Lorsque cela est possible et approprié, le professionnel est informé du motif."),
      ],
    },
    {
      heading: "16. Suppression de l'espace Pro",
      blocks: [
        p("Le professionnel peut supprimer son espace Pro depuis ses paramètres (« Supprimer mon espace professionnel »), après une confirmation explicite."),
        p("La suppression est définitive. Elle efface les informations de la structure, les candidats et leurs documents. Le compte particulier éventuellement associé au même compte n'est pas supprimé."),
        p("La période d'abonnement en cours est perdue, sous réserve de l'article 12. Les données dont la conservation est imposée par la loi, comme les traces de paiement, sont traitées comme indiqué dans la Politique de confidentialité."),
      ],
    },
    {
      heading: "17. Responsabilité",
      blocks: [
        p("MonEmploiGo met des outils à disposition et ne contrôle pas le contenu saisi par le professionnel."),
        p("MonEmploiGo n'est pas responsable :"),
        list([
          "des informations fournies par le professionnel ou par ses candidats ;",
          "des décisions d'un employeur, d'un établissement ou d'une administration ;",
          "des engagements pris par le professionnel envers ses candidats.",
        ]),
        p("La responsabilité de MonEmploiGo reste limitée dans les limites autorisées par la législation applicable."),
      ],
    },
    {
      heading: "18. Droit applicable, litiges et contact",
      blocks: [
        p("Les articles 24 (droit applicable), 25 (règlement des litiges) et 26 (contact) des CGU s'appliquent : droit camerounais, recherche d'une solution amiable en priorité."),
        list(["MonEmploiGo", `E-mail : ${LEGAL_CONFIG.contactEmail}`, `Site : ${LEGAL_CONFIG.siteUrl}/fr`]),
      ],
    },
  ],
  closing: "MonEmploiGo Pro — Des outils pour préparer les documents de vos candidats.",
};
