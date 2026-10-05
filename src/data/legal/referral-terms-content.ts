import { LEGAL_CONFIG } from "./legal-config";
import { links, list, p, type LegalDocument } from "./document-types";

/**
 * Conditions du programme « Parrainer & gagner », validées par
 * l'utilisateur le 2026-10-06 (avec ses précisions : frais Mobile Money à la
 * charge de MonEmploiGo, délai de 72 heures, suppression du compte, solde
 * négatif après remboursement). Français uniquement.
 *
 * ⚠️ Chaque phrase doit correspondre au code (src/lib/referral) : modifier
 * les deux ensemble.
 */
export const REFERRAL_TERMS_CONTENT: LegalDocument = {
  title: "Conditions du programme « Parrainer & gagner »",
  lastUpdatedLabel: `Dernière mise à jour : ${LEGAL_CONFIG.referralTermsLastUpdated}`,
  intro: [
    p("Le programme « Parrainer & gagner » permet aux utilisateurs de MonEmploiGo de recommander le site. Les présentes conditions complètent les Conditions générales d'utilisation."),
    links([
      { label: "Conditions générales d'utilisation de MonEmploiGo", path: "/conditions-utilisation" },
      { label: "Politique de confidentialité de MonEmploiGo", path: "/confidentialite" },
    ]),
  ],
  sections: [
    {
      heading: "1. Principe",
      blocks: [
        p("Tout titulaire d'un compte MonEmploiGo peut recommander le site grâce à son lien personnel. Il reçoit 200 FCFA fixes pour chaque document éligible payé par une personne inscrite grâce à ce lien, sans limite du nombre d'achats."),
      ],
    },
    {
      heading: "2. Documents éligibles",
      blocks: [
        p("Sont éligibles les CV, les lettres de motivation et les Bewerbungsbrief vendus à l'unité."),
        p("Sont exclus l'abonnement MonEmploiGo Pro, ainsi que les paiements échoués, annulés ou non confirmés."),
      ],
    },
    {
      heading: "3. Attribution",
      blocks: [
        list([
          "Le lien est mémorisé 30 jours dans le navigateur de la personne recommandée.",
          "Il est rattaché définitivement à son compte au moment de sa création.",
          "Un compte déjà existant ne peut pas être rattaché, et le parrain ne peut pas être changé.",
        ]),
      ],
    },
    {
      heading: "4. Moment de la récompense",
      blocks: [p("La récompense n'est enregistrée qu'après la confirmation réelle du paiement par le prestataire de paiement.")],
    },
    {
      heading: "5. Pratiques interdites",
      blocks: [
        list([
          "se recommander soi-même ou créer des comptes fictifs ;",
          "faire une publicité trompeuse, notamment promettre un visa, un emploi ou une Ausbildung ;",
          "présenter la récompense comme une réduction ;",
          "envoyer des messages non sollicités en masse.",
        ]),
        p("MonEmploiGo peut refuser ou annuler les récompenses obtenues ainsi, et retirer l'accès au programme."),
      ],
    },
    {
      heading: "6. Remboursement d'un achat",
      blocks: [
        p("Si un achat est remboursé, la récompense correspondante est annulée, et l'opération reste visible dans l'historique."),
        p("Si cette récompense avait déjà été retirée et que les gains disponibles ne suffisent pas à compenser l'annulation, le montant restant à récupérer est enregistré et déduit automatiquement des récompenses suivantes jusqu'à régularisation. Le solde peut donc être temporairement négatif."),
      ],
    },
    {
      heading: "7. Retraits",
      blocks: [
        list([
          "Le minimum de retrait est de 500 FCFA, versés par MTN Mobile Money ou Orange Money sur un numéro dont le bénéficiaire est titulaire.",
          "Le montant est réservé dès la demande.",
          "Les éventuels frais liés au paiement sont pris en charge par MonEmploiGo : le bénéficiaire reçoit le montant demandé.",
          "Les demandes de retrait sont traitées manuellement dans un délai pouvant aller jusqu'à 72 heures, week-end compris.",
          "Une demande peut être refusée, par exemple pour un numéro invalide ou une fraude : le montant redevient alors disponible.",
        ]),
      ],
    },
    {
      heading: "8. Suppression du compte",
      blocks: [
        list([
          "La suppression du compte n'est pas possible tant qu'une demande de retrait est en cours de traitement.",
          "Les gains disponibles non retirés au moment de la suppression pourront être perdus. Un avertissement est affiché avant la confirmation.",
          "Les informations relatives aux récompenses et aux retraits sont conservées pour l'historique et les obligations comptables, comme indiqué dans la Politique de confidentialité.",
        ]),
      ],
    },
    {
      heading: "9. Fin ou modification du programme",
      blocks: [p("MonEmploiGo peut modifier ou arrêter le programme. Les gains déjà acquis restent retirables pendant 90 jours après l'annonce.")],
    },
    {
      heading: "10. Responsabilité du bénéficiaire",
      blocks: [p("Le bénéficiaire reste responsable de ses éventuelles obligations déclaratives.")],
    },
    {
      heading: "11. Contact",
      blocks: [list(["MonEmploiGo", `E-mail : ${LEGAL_CONFIG.contactEmail}`])],
    },
  ],
  closing: "MonEmploiGo — Des documents professionnels pour mieux préparer sa candidature.",
};
