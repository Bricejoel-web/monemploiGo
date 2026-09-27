import { LEGAL_CONFIG } from "./legal-config";

/**
 * Contenu complet des Conditions Générales d'Utilisation (CGU), fourni tel
 * quel par l'utilisateur (FR) et traduit en anglais pour la version EN du
 * site — voir docs/ROADMAP.md. Les coordonnées de contact et la date de
 * dernière mise à jour sont injectées depuis legal-config.ts plutôt que
 * codées en dur ici, pour pouvoir être changées en un seul endroit.
 *
 * ⚠️ La traduction anglaise n'a pas de valeur juridique supérieure ou
 * différente du texte français d'origine ; en cas de divergence, le
 * français prévaut (précisé dans l'introduction de la version EN).
 */

export type TermsBlock = { type: "p"; text: string } | { type: "list"; items: string[] };
export interface TermsSection {
  heading: string;
  blocks: TermsBlock[];
}
export interface TermsContent {
  title: string;
  lastUpdatedLabel: string;
  intro: TermsBlock[];
  sections: TermsSection[];
  closing: string;
}

const p = (text: string): TermsBlock => ({ type: "p", text });
const list = (items: string[]): TermsBlock => ({ type: "list", items });

export const TERMS_CONTENT: Record<"fr" | "en", TermsContent> = {
  fr: {
    title: "Conditions générales d'utilisation — MonEmploiGo",
    lastUpdatedLabel: `Dernière mise à jour : ${LEGAL_CONFIG.lastUpdated}`,
    intro: [
      p("Bienvenue sur MonEmploiGo, une plateforme numérique destinée à faciliter la création de documents professionnels pour les personnes à la recherche d'un emploi, d'une formation ou d'une opportunité professionnelle, notamment au Cameroun et plus largement en Afrique."),
      p("En utilisant MonEmploiGo, l'utilisateur reconnaît avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation (CGU)."),
    ],
    sections: [
      {
        heading: "1. Présentation de MonEmploiGo",
        blocks: [
          p("MonEmploiGo est une plateforme numérique permettant notamment aux utilisateurs de :"),
          list([
            "créer et personnaliser des CV ;",
            "créer des lettres de motivation ;",
            "créer certains documents professionnels destinés à la recherche d'emploi ;",
            "générer des CV adaptés aux systèmes de recrutement automatisés (ATS), notamment pour certaines candidatures internationales ;",
            "télécharger les documents créés dans les formats proposés par la plateforme ;",
            "conserver certains documents dans leur espace personnel.",
          ]),
          p("MonEmploiGo est un service de création de documents professionnels."),
          p("MonEmploiGo n'est pas :"),
          list([
            "une agence de recrutement ;",
            "une agence d'intérim ;",
            "une agence d'immigration ;",
            "une agence de visa ;",
            "un cabinet juridique ;",
            "un organisme de formation ;",
            "un employeur ;",
            "un représentant d'un employeur ou d'une entreprise étrangère.",
          ]),
          p("MonEmploiGo ne garantit donc pas l'obtention d'un emploi, d'un entretien, d'un contrat de travail, d'un contrat d'Ausbildung, d'un visa, d'un permis de séjour ou de toute autre opportunité professionnelle ou administrative."),
          p("La création d'un CV ou d'une lettre de motivation augmente uniquement la disponibilité d'un document de candidature et ne constitue pas une promesse de résultat."),
        ],
      },
      {
        heading: "2. Acceptation des CGU",
        blocks: [
          p("L'utilisation du site, la création d'un compte ou l'achat d'un service impliquent l'acceptation des présentes CGU."),
          p("Si l'utilisateur n'accepte pas ces conditions, il doit cesser d'utiliser MonEmploiGo."),
          p("MonEmploiGo peut modifier les présentes CGU lorsque cela est nécessaire, notamment pour tenir compte de l'évolution du service, de la réglementation ou de nouvelles fonctionnalités."),
          p("La date de dernière mise à jour est indiquée en haut du présent document."),
        ],
      },
      {
        heading: "3. Conditions d'accès",
        blocks: [
          p("L'utilisation de MonEmploiGo nécessite de fournir certaines informations exactes lors de la création du compte."),
          p("L'utilisateur s'engage à :"),
          list([
            "fournir des informations exactes, complètes et à jour ;",
            "ne pas créer de compte sous une fausse identité ;",
            "conserver ses identifiants confidentiels ;",
            "ne pas partager son compte avec une autre personne lorsque cela compromet sa sécurité ;",
            "informer MonEmploiGo en cas d'utilisation non autorisée de son compte.",
          ]),
          p("L'utilisateur est responsable des informations saisies dans ses documents."),
        ],
      },
      {
        heading: "4. Utilisation des documents",
        blocks: [
          p("Les informations utilisées pour créer un CV, une lettre de motivation ou tout autre document sont fournies par l'utilisateur."),
          p("L'utilisateur est seul responsable :"),
          list([
            "de l'exactitude de ses informations personnelles ;",
            "de ses diplômes et qualifications déclarés ;",
            "de ses expériences professionnelles ;",
            "de ses coordonnées ;",
            "de ses langues et niveaux déclarés ;",
            "de toute autre information figurant dans ses documents.",
          ]),
          p("MonEmploiGo ne garantit pas l'exactitude des informations fournies par l'utilisateur."),
          p("L'utilisateur doit vérifier attentivement son document avant de l'utiliser dans une candidature."),
        ],
      },
      {
        heading: "5. CV destinés aux systèmes ATS",
        blocks: [
          p("MonEmploiGo peut proposer des modèles de CV conçus pour être plus facilement analysés par certains systèmes de recrutement automatisés, communément appelés ATS (Applicant Tracking Systems)."),
          p("Cette optimisation ne constitue toutefois aucune garantie de passage d'un ATS, de classement par un recruteur ou d'obtention d'un emploi."),
          p("Le fonctionnement des ATS varie selon les entreprises, les logiciels utilisés, les paramètres de recrutement et les offres concernées."),
          p("L'utilisateur reste responsable de l'adaptation de sa candidature à chaque offre d'emploi."),
        ],
      },
      {
        heading: "6. Candidatures internationales et Allemagne",
        blocks: [
          p("Certains services de MonEmploiGo peuvent être destinés aux personnes souhaitant présenter leur candidature à l'étranger, notamment en Allemagne."),
          p("MonEmploiGo peut fournir des formats ou modèles adaptés à certaines pratiques de candidature."),
          p("Cependant :"),
          list([
            "MonEmploiGo ne garantit aucune reconnaissance officielle d'un document ;",
            "MonEmploiGo ne garantit aucune acceptation par une entreprise, une administration ou un établissement ;",
            "MonEmploiGo ne garantit aucune obtention de visa ou de titre de séjour ;",
            "MonEmploiGo ne garantit aucune obtention d'Ausbildung ou de contrat de travail.",
          ]),
          p("L'utilisateur doit vérifier les exigences spécifiques de l'employeur, de l'établissement ou de l'administration concernée."),
        ],
      },
      {
        heading: "7. Prix des services",
        blocks: [
          p("Les prix applicables aux services sont ceux affichés sur MonEmploiGo au moment de la commande."),
          p("Les prix peuvent évoluer à tout moment pour les nouvelles commandes."),
          p("Une modification tarifaire ne modifie pas le prix d'une commande déjà validée, sauf disposition contraire clairement communiquée à l'utilisateur."),
          p("Les prix affichés sont exprimés en FCFA (XAF) sauf indication contraire."),
        ],
      },
      {
        heading: "8. Commande et paiement",
        blocks: [
          p("Lorsqu'un utilisateur sélectionne un service payant, il peut être invité à :"),
          list([
            "sélectionner le service ;",
            "renseigner ou compléter les informations nécessaires ;",
            "vérifier le contenu et le prix ;",
            "procéder au paiement ;",
            "attendre la confirmation du paiement ;",
            "accéder au document lorsque la commande est validée.",
          ]),
          p("MonEmploiGo peut utiliser des prestataires de paiement tiers, notamment des solutions de paiement mobile ou électronique."),
          p("Le traitement technique du paiement peut donc être effectué par un prestataire de paiement externe."),
          p("MonEmploiGo ne demande jamais à l'utilisateur de communiquer publiquement ses codes secrets, mots de passe, codes PIN Mobile Money ou informations d'authentification."),
        ],
      },
      {
        heading: "9. Confirmation du paiement",
        blocks: [
          p("Un paiement n'est considéré comme validé qu'après confirmation technique du prestataire de paiement et vérification par les systèmes de MonEmploiGo."),
          p("L'affichage d'une page de retour ou d'un message provenant du navigateur ne constitue pas, à lui seul, une preuve suffisante de paiement."),
          p("MonEmploiGo peut effectuer des vérifications supplémentaires afin de prévenir les erreurs, fraudes, paiements falsifiés ou incohérences de montant."),
          p("En cas de problème technique, l'utilisateur peut contacter le support avec les informations relatives à sa commande."),
        ],
      },
      {
        heading: "10. Livraison des documents numériques",
        blocks: [
          p("Les services proposés par MonEmploiGo sont principalement numériques."),
          p("Après confirmation du paiement, l'utilisateur peut accéder au document acheté ou aux fonctionnalités correspondant à sa commande, selon le service concerné."),
          p("Après confirmation du paiement, le document peut être retéléchargé gratuitement et sans limite depuis le tableau de bord pendant 3 semaines (21 jours). À l'issue de ce délai, il est supprimé automatiquement et définitivement de nos serveurs. Il appartient à l'utilisateur de conserver une copie du fichier téléchargé."),
          p("Les brouillons (documents non payés) sont également supprimés automatiquement lorsqu'ils n'ont pas été modifiés pendant 3 semaines."),
          p("L'utilisateur doit vérifier son document avant de le télécharger, l'imprimer ou l'envoyer à un employeur."),
          p("MonEmploiGo ne peut être tenu responsable d'une candidature envoyée avec un document contenant des informations incorrectes saisies par l'utilisateur."),
        ],
      },
      {
        heading: "11. Politique de remboursement",
        blocks: [
          p("En raison de la nature numérique des services, lorsqu'un document a déjà été généré, rendu accessible ou téléchargé après confirmation du paiement, les demandes de remboursement peuvent être limitées, sous réserve des droits impératifs prévus par la législation applicable."),
          p("Toutefois, MonEmploiGo pourra examiner les situations particulières, notamment :"),
          list([
            "paiement effectué mais service non accessible ;",
            "double paiement ;",
            "erreur technique imputable à MonEmploiGo ;",
            "paiement confirmé mais commande non délivrée ;",
            "montant débité incorrectement en raison d'un problème technique.",
          ]),
          p("Toute demande doit être adressée au support avec les informations permettant d'identifier la transaction."),
          p("Cette clause devra être validée juridiquement avant publication définitive, notamment au regard des règles camerounaises applicables au commerce électronique et à la protection du consommateur."),
        ],
      },
      {
        heading: "12. Propriété intellectuelle",
        blocks: [
          p("L'interface MonEmploiGo, son identité visuelle, son logo, ses textes, ses éléments graphiques, son code, ses modèles et ses fonctionnalités sont protégés par les règles applicables en matière de propriété intellectuelle."),
          p("Sauf autorisation contraire, il est interdit de :"),
          list([
            "copier intégralement la plateforme ;",
            "reproduire son interface à des fins commerciales ;",
            "revendre les modèles de MonEmploiGo ;",
            "redistribuer les modèles ou documents fournis par la plateforme comme s'ils étaient ses propres créations ;",
            "tenter d'extraire ou de reproduire le fonctionnement interne du service ;",
            "utiliser automatiquement ou massivement la plateforme à des fins non autorisées.",
          ]),
        ],
      },
      {
        heading: "13. Utilisation autorisée des documents créés",
        blocks: [
          p("Après achat d'un document, l'utilisateur peut l'utiliser pour ses propres démarches professionnelles."),
          p("Il peut notamment :"),
          list([
            "télécharger son CV ;",
            "l'imprimer ;",
            "l'envoyer à des employeurs ;",
            "l'utiliser dans ses candidatures ;",
            "l'adapter à différentes offres.",
          ]),
          p("L'achat d'un document ne transfère pas à l'utilisateur les droits de propriété intellectuelle sur l'interface, les modèles ou la technologie de MonEmploiGo."),
        ],
      },
      {
        heading: "14. Contenus interdits",
        blocks: [
          p("Il est interdit d'utiliser MonEmploiGo pour :"),
          list([
            "créer de faux diplômes ;",
            "fabriquer de fausses attestations ou justificatifs ;",
            "usurper l'identité d'une autre personne ;",
            "fournir volontairement de fausses informations dans le but de tromper un employeur ou une administration ;",
            "produire des documents destinés à une fraude ;",
            "contourner les mesures de sécurité de la plateforme ;",
            "tenter d'obtenir gratuitement un service payant par des moyens frauduleux ;",
            "attaquer, perturber ou compromettre les systèmes informatiques de MonEmploiGo ;",
            "utiliser des scripts ou robots pour surcharger le service ;",
            "exploiter une faille de sécurité sans la signaler de manière responsable.",
          ]),
          p("MonEmploiGo peut suspendre ou supprimer un compte utilisé à des fins manifestement frauduleuses ou illégales, sous réserve de la législation applicable."),
        ],
      },
      {
        heading: "15. Sécurité du compte",
        blocks: [
          p("L'utilisateur doit conserver ses identifiants de connexion de manière confidentielle."),
          p("MonEmploiGo met en œuvre des mesures techniques raisonnables destinées à protéger les comptes et les données."),
          p("Toutefois, aucun service accessible sur Internet ne peut garantir une sécurité absolue."),
          p("En cas de suspicion d'accès non autorisé au compte, l'utilisateur doit contacter MonEmploiGo dans les meilleurs délais."),
        ],
      },
      {
        heading: "16. Données personnelles",
        blocks: [
          p("MonEmploiGo peut traiter certaines données personnelles nécessaires au fonctionnement du service, notamment pour :"),
          list([
            "créer et gérer le compte utilisateur ;",
            "créer les documents demandés ;",
            "traiter les commandes ;",
            "assurer le paiement ;",
            "assurer le support ;",
            "sécuriser la plateforme ;",
            "prévenir les fraudes ;",
            "améliorer le fonctionnement du service.",
          ]),
          p("MonEmploiGo s'engage à traiter les données personnelles conformément aux règles applicables en matière de protection des données personnelles, notamment à la loi camerounaise n°2024/017 du 23 décembre 2024 relative à la protection des données à caractère personnel."),
          p("Les informations détaillées concernant les données collectées, leurs finalités, leur durée de conservation, les destinataires éventuels et les droits des utilisateurs doivent être présentées dans une Politique de confidentialité distincte."),
          p("Les présentes CGU ne remplacent donc pas cette politique."),
        ],
      },
      {
        heading: "17. Prestataires externes",
        blocks: [
          p("Certaines fonctionnalités de MonEmploiGo peuvent dépendre de services tiers, notamment :"),
          list([
            "prestataires de paiement ;",
            "services d'hébergement ;",
            "services techniques ;",
            "services d'envoi d'e-mails ;",
            "outils de sécurité ou d'analyse nécessaires au fonctionnement de la plateforme.",
          ]),
          p("Une interruption d'un prestataire externe peut temporairement affecter certaines fonctionnalités de MonEmploiGo."),
          p("MonEmploiGo ne peut garantir la disponibilité permanente de services contrôlés par des tiers."),
        ],
      },
      {
        heading: "18. Disponibilité du service",
        blocks: [
          p("MonEmploiGo s'efforce de maintenir la plateforme accessible et fonctionnelle."),
          p("Cependant, le service peut être temporairement indisponible notamment en raison :"),
          list([
            "d'une maintenance ;",
            "d'une panne technique ;",
            "d'un problème d'hébergement ;",
            "d'une défaillance d'un prestataire externe ;",
            "d'une interruption du réseau Internet ;",
            "d'un événement indépendant de la volonté de MonEmploiGo.",
          ]),
          p("Lorsque cela est raisonnablement possible, les interruptions importantes peuvent être communiquées aux utilisateurs."),
        ],
      },
      {
        heading: "19. Limitation de responsabilité",
        blocks: [
          p("MonEmploiGo fournit des outils destinés à faciliter la création de candidatures professionnelles."),
          p("La plateforme ne garantit pas :"),
          list([
            "l'obtention d'un emploi ;",
            "l'obtention d'un entretien ;",
            "l'acceptation d'une candidature ;",
            "l'obtention d'un contrat ;",
            "l'obtention d'une Ausbildung ;",
            "l'obtention d'un visa ;",
            "l'obtention d'un permis de séjour ;",
            "l'acceptation d'un document par une administration ou une entreprise.",
          ]),
          p("MonEmploiGo ne peut pas être tenu responsable d'une décision prise par un employeur, une administration, un établissement de formation ou toute autre organisation à la suite de l'utilisation d'un document créé sur la plateforme."),
          p("La responsabilité de MonEmploiGo reste limitée dans les limites autorisées par la législation applicable."),
        ],
      },
      {
        heading: "20. Suspension ou fermeture d'un compte",
        blocks: [
          p("MonEmploiGo peut suspendre temporairement ou fermer un compte lorsque cela est nécessaire notamment en cas :"),
          list([
            "de fraude ;",
            "d'utilisation illégale du service ;",
            "de tentative d'attaque informatique ;",
            "de violation répétée des présentes CGU ;",
            "d'utilisation abusive de la plateforme.",
          ]),
          p("Lorsque cela est possible et approprié, l'utilisateur peut être informé de la raison de la suspension."),
        ],
      },
      {
        heading: "21. Résiliation par l'utilisateur",
        blocks: [
          p("L'utilisateur peut cesser d'utiliser MonEmploiGo à tout moment."),
          p("Il peut demander la suppression de son compte conformément aux modalités prévues dans la plateforme et la politique de confidentialité."),
          p("La suppression d'un compte peut entraîner la perte d'accès aux documents ou données associés, sous réserve des obligations légales de conservation applicables."),
        ],
      },
      {
        heading: "22. Liens externes",
        blocks: [
          p("MonEmploiGo peut contenir des liens vers des sites ou services appartenant à des tiers."),
          p("Ces sites sont soumis à leurs propres conditions d'utilisation et politiques de confidentialité."),
          p("MonEmploiGo n'est pas responsable du contenu ou du fonctionnement de sites tiers qu'il ne contrôle pas."),
        ],
      },
      {
        heading: "23. Droit applicable",
        blocks: [
          p("Les présentes Conditions Générales d'Utilisation sont principalement soumises au droit applicable au Cameroun, sous réserve des règles impératives qui pourraient être applicables à l'utilisateur en fonction de son pays de résidence."),
          p("Les activités de commerce électronique au Cameroun sont notamment encadrées par la loi n°2010/021 du 21 décembre 2010 régissant le commerce électronique."),
          p("Les règles relatives à la protection des consommateurs et à la protection des données personnelles applicables au service doivent également être respectées."),
        ],
      },
      {
        heading: "24. Règlement des litiges",
        blocks: [
          p("En cas de difficulté concernant l'utilisation de MonEmploiGo, l'utilisateur est invité à contacter d'abord le support afin de rechercher une solution amiable."),
          p("À défaut de résolution amiable, le litige pourra être soumis aux juridictions compétentes conformément au droit applicable."),
        ],
      },
      {
        heading: "25. Contact",
        blocks: [
          p("Pour toute question concernant les présentes CGU, une commande, un paiement ou l'utilisation de la plateforme :"),
          list([
            "MonEmploiGo",
            `E-mail : ${LEGAL_CONFIG.contactEmail}`,
            `Téléphone / WhatsApp : ${LEGAL_CONFIG.contactPhone}`,
            `Adresse : ${LEGAL_CONFIG.contactAddress}`,
          ]),
        ],
      },
      {
        heading: "26. Acceptation",
        blocks: [
          p("En créant un compte, en utilisant les services ou en validant une commande, l'utilisateur reconnaît avoir pris connaissance des présentes Conditions Générales d'Utilisation et les accepter."),
        ],
      },
    ],
    closing: "MonEmploiGo — Des documents professionnels pour mieux préparer sa candidature.",
  },
  en: {
    title: "Terms of Use — MonEmploiGo",
    lastUpdatedLabel: `Last updated: ${LEGAL_CONFIG.lastUpdated}`,
    intro: [
      p("Welcome to MonEmploiGo, a digital platform designed to help people looking for a job, a training program, or a professional opportunity create professional documents, in particular in Cameroon and more broadly in Africa."),
      p("By using MonEmploiGo, the user acknowledges having read, understood and accepted these Terms of Use."),
      p("This English version is provided for convenience; in the event of any discrepancy, the French version (\"Conditions Générales d'Utilisation\") prevails."),
    ],
    sections: [
      {
        heading: "1. About MonEmploiGo",
        blocks: [
          p("MonEmploiGo is a digital platform that notably allows users to:"),
          list([
            "create and customize CVs/resumes;",
            "create cover letters;",
            "create certain professional documents intended for job searching;",
            "generate CVs adapted to Applicant Tracking Systems (ATS), in particular for certain international applications;",
            "download the documents created in the formats offered by the platform;",
            "keep certain documents in their personal space.",
          ]),
          p("MonEmploiGo is a professional document creation service."),
          p("MonEmploiGo is not:"),
          list([
            "a recruitment agency;",
            "a temporary staffing agency;",
            "an immigration agency;",
            "a visa agency;",
            "a law firm;",
            "a training organization;",
            "an employer;",
            "a representative of an employer or a foreign company.",
          ]),
          p("MonEmploiGo therefore does not guarantee obtaining a job, an interview, an employment contract, an Ausbildung (apprenticeship) contract, a visa, a residence permit, or any other professional or administrative opportunity."),
          p("Creating a CV or a cover letter only increases the availability of an application document and does not constitute a promise of results."),
        ],
      },
      {
        heading: "2. Acceptance of the Terms of Use",
        blocks: [
          p("Using the site, creating an account, or purchasing a service implies acceptance of these Terms of Use."),
          p("If the user does not accept these terms, they must stop using MonEmploiGo."),
          p("MonEmploiGo may amend these Terms of Use when necessary, in particular to reflect changes to the service, applicable regulations, or new features."),
          p("The date of the last update is indicated at the top of this document."),
        ],
      },
      {
        heading: "3. Access conditions",
        blocks: [
          p("Using MonEmploiGo requires providing certain accurate information when creating an account."),
          p("The user agrees to:"),
          list([
            "provide accurate, complete and up-to-date information;",
            "not create an account under a false identity;",
            "keep their login credentials confidential;",
            "not share their account with another person when doing so would compromise its security;",
            "inform MonEmploiGo in the event of unauthorized use of their account.",
          ]),
          p("The user is responsible for the information entered in their documents."),
        ],
      },
      {
        heading: "4. Use of documents",
        blocks: [
          p("The information used to create a CV, a cover letter, or any other document is provided by the user."),
          p("The user is solely responsible for:"),
          list([
            "the accuracy of their personal information;",
            "their declared degrees and qualifications;",
            "their professional experience;",
            "their contact details;",
            "their declared languages and proficiency levels;",
            "any other information contained in their documents.",
          ]),
          p("MonEmploiGo does not guarantee the accuracy of the information provided by the user."),
          p("The user must carefully review their document before using it in an application."),
        ],
      },
      {
        heading: "5. CVs designed for ATS systems",
        blocks: [
          p("MonEmploiGo may offer CV templates designed to be more easily parsed by certain automated recruitment systems, commonly known as ATS (Applicant Tracking Systems)."),
          p("This optimization does not, however, constitute any guarantee of passing an ATS, being shortlisted by a recruiter, or obtaining a job."),
          p("How ATS systems work varies depending on the company, the software used, the recruitment settings, and the position concerned."),
          p("The user remains responsible for adapting their application to each job posting."),
        ],
      },
      {
        heading: "6. International applications and Germany",
        blocks: [
          p("Some MonEmploiGo services may be intended for people wishing to apply abroad, in particular in Germany."),
          p("MonEmploiGo may provide formats or templates adapted to certain application practices."),
          p("However:"),
          list([
            "MonEmploiGo does not guarantee any official recognition of a document;",
            "MonEmploiGo does not guarantee acceptance by any company, administration, or institution;",
            "MonEmploiGo does not guarantee obtaining a visa or residence permit;",
            "MonEmploiGo does not guarantee obtaining an Ausbildung or employment contract.",
          ]),
          p("The user must verify the specific requirements of the employer, institution, or administration concerned."),
        ],
      },
      {
        heading: "7. Service pricing",
        blocks: [
          p("The prices applicable to the services are those displayed on MonEmploiGo at the time of the order."),
          p("Prices may change at any time for new orders."),
          p("A price change does not affect the price of an order already confirmed, unless otherwise clearly communicated to the user."),
          p("Displayed prices are expressed in FCFA (XAF) unless otherwise indicated."),
        ],
      },
      {
        heading: "8. Order and payment",
        blocks: [
          p("When a user selects a paid service, they may be asked to:"),
          list([
            "select the service;",
            "enter or complete the necessary information;",
            "review the content and the price;",
            "proceed with payment;",
            "wait for payment confirmation;",
            "access the document once the order is confirmed.",
          ]),
          p("MonEmploiGo may use third-party payment providers, in particular mobile or electronic payment solutions."),
          p("The technical processing of payment may therefore be carried out by an external payment provider."),
          p("MonEmploiGo never asks users to publicly share their secret codes, passwords, Mobile Money PIN codes, or authentication information."),
        ],
      },
      {
        heading: "9. Payment confirmation",
        blocks: [
          p("A payment is only considered valid after technical confirmation from the payment provider and verification by MonEmploiGo's systems."),
          p("The display of a return page or a message from the browser does not, by itself, constitute sufficient proof of payment."),
          p("MonEmploiGo may carry out additional checks to prevent errors, fraud, falsified payments, or amount discrepancies."),
          p("In the event of a technical issue, the user may contact support with information relating to their order."),
        ],
      },
      {
        heading: "10. Delivery of digital documents",
        blocks: [
          p("The services offered by MonEmploiGo are mainly digital."),
          p("After payment confirmation, the user can access the purchased document or the features corresponding to their order, depending on the service concerned."),
          p("After payment confirmation, the document can be downloaded again free of charge and without limit from the dashboard for 3 weeks (21 days). After that period, it is automatically and permanently deleted from our servers. The user is responsible for keeping a copy of the downloaded file."),
          p("Drafts (unpaid documents) are also deleted automatically when they have not been edited for 3 weeks."),
          p("The user must review their document before downloading, printing, or sending it to an employer."),
          p("MonEmploiGo cannot be held liable for an application sent with a document containing incorrect information entered by the user."),
        ],
      },
      {
        heading: "11. Refund policy",
        blocks: [
          p("Due to the digital nature of the services, once a document has already been generated, made accessible, or downloaded after payment confirmation, refund requests may be limited, subject to any mandatory rights provided for by applicable law."),
          p("However, MonEmploiGo may review specific situations, in particular:"),
          list([
            "payment made but service not accessible;",
            "duplicate payment;",
            "technical error attributable to MonEmploiGo;",
            "payment confirmed but order not delivered;",
            "amount incorrectly charged due to a technical issue.",
          ]),
          p("Any request must be sent to support with information allowing the transaction to be identified."),
          p("This clause must be legally validated before final publication, in particular with regard to Cameroonian rules applicable to e-commerce and consumer protection."),
        ],
      },
      {
        heading: "12. Intellectual property",
        blocks: [
          p("The MonEmploiGo interface, its visual identity, its logo, its text, its graphic elements, its code, its templates, and its features are protected under applicable intellectual property rules."),
          p("Unless otherwise authorized, it is prohibited to:"),
          list([
            "fully copy the platform;",
            "reproduce its interface for commercial purposes;",
            "resell MonEmploiGo's templates;",
            "redistribute the templates or documents provided by the platform as if they were one's own creations;",
            "attempt to extract or reproduce the internal workings of the service;",
            "use the platform automatically or on a large scale for unauthorized purposes.",
          ]),
        ],
      },
      {
        heading: "13. Authorized use of created documents",
        blocks: [
          p("After purchasing a document, the user may use it for their own professional purposes."),
          p("In particular, they may:"),
          list([
            "download their CV;",
            "print it;",
            "send it to employers;",
            "use it in their applications;",
            "adapt it to different job postings.",
          ]),
          p("Purchasing a document does not transfer to the user any intellectual property rights over MonEmploiGo's interface, templates, or technology."),
        ],
      },
      {
        heading: "14. Prohibited content",
        blocks: [
          p("It is prohibited to use MonEmploiGo to:"),
          list([
            "create fake diplomas;",
            "fabricate false certificates or supporting documents;",
            "impersonate another person;",
            "knowingly provide false information in order to deceive an employer or an administration;",
            "produce documents intended for fraud;",
            "circumvent the platform's security measures;",
            "attempt to obtain a paid service for free through fraudulent means;",
            "attack, disrupt, or compromise MonEmploiGo's computer systems;",
            "use scripts or bots to overload the service;",
            "exploit a security vulnerability without reporting it responsibly.",
          ]),
          p("MonEmploiGo may suspend or delete an account used for clearly fraudulent or illegal purposes, subject to applicable law."),
        ],
      },
      {
        heading: "15. Account security",
        blocks: [
          p("The user must keep their login credentials confidential."),
          p("MonEmploiGo implements reasonable technical measures designed to protect accounts and data."),
          p("However, no service accessible over the Internet can guarantee absolute security."),
          p("If unauthorized access to the account is suspected, the user must contact MonEmploiGo as soon as possible."),
        ],
      },
      {
        heading: "16. Personal data",
        blocks: [
          p("MonEmploiGo may process certain personal data necessary for the operation of the service, in particular to:"),
          list([
            "create and manage the user account;",
            "create the requested documents;",
            "process orders;",
            "handle payment;",
            "provide support;",
            "secure the platform;",
            "prevent fraud;",
            "improve the service.",
          ]),
          p("MonEmploiGo undertakes to process personal data in accordance with applicable personal data protection rules, in particular Cameroonian law n°2024/017 of December 23, 2024 on the protection of personal data."),
          p("Detailed information about the data collected, its purposes, its retention period, any recipients, and users' rights must be presented in a separate Privacy Policy."),
          p("These Terms of Use therefore do not replace that policy."),
        ],
      },
      {
        heading: "17. External providers",
        blocks: [
          p("Certain MonEmploiGo features may depend on third-party services, in particular:"),
          list([
            "payment providers;",
            "hosting services;",
            "technical services;",
            "email delivery services;",
            "security or analytics tools necessary for the platform to operate.",
          ]),
          p("An interruption of an external provider may temporarily affect certain MonEmploiGo features."),
          p("MonEmploiGo cannot guarantee the permanent availability of services controlled by third parties."),
        ],
      },
      {
        heading: "18. Service availability",
        blocks: [
          p("MonEmploiGo strives to keep the platform accessible and functional."),
          p("However, the service may be temporarily unavailable, in particular due to:"),
          list([
            "maintenance;",
            "a technical failure;",
            "a hosting issue;",
            "a failure by an external provider;",
            "an Internet network interruption;",
            "an event beyond MonEmploiGo's control.",
          ]),
          p("Where reasonably possible, significant interruptions may be communicated to users."),
        ],
      },
      {
        heading: "19. Limitation of liability",
        blocks: [
          p("MonEmploiGo provides tools designed to facilitate the creation of professional applications."),
          p("The platform does not guarantee:"),
          list([
            "obtaining a job;",
            "obtaining an interview;",
            "the acceptance of an application;",
            "obtaining a contract;",
            "obtaining an Ausbildung;",
            "obtaining a visa;",
            "obtaining a residence permit;",
            "the acceptance of a document by an administration or a company.",
          ]),
          p("MonEmploiGo cannot be held liable for a decision made by an employer, an administration, a training institution, or any other organization following the use of a document created on the platform."),
          p("MonEmploiGo's liability remains limited to the extent permitted by applicable law."),
        ],
      },
      {
        heading: "20. Suspension or closure of an account",
        blocks: [
          p("MonEmploiGo may temporarily suspend or close an account when necessary, in particular in the event of:"),
          list([
            "fraud;",
            "illegal use of the service;",
            "an attempted cyberattack;",
            "repeated violation of these Terms of Use;",
            "abusive use of the platform.",
          ]),
          p("Where possible and appropriate, the user may be informed of the reason for the suspension."),
        ],
      },
      {
        heading: "21. Termination by the user",
        blocks: [
          p("The user may stop using MonEmploiGo at any time."),
          p("They may request the deletion of their account in accordance with the procedures provided on the platform and in the Privacy Policy."),
          p("Deleting an account may result in the loss of access to associated documents or data, subject to applicable legal retention obligations."),
        ],
      },
      {
        heading: "22. External links",
        blocks: [
          p("MonEmploiGo may contain links to sites or services belonging to third parties."),
          p("These sites are subject to their own terms of use and privacy policies."),
          p("MonEmploiGo is not responsible for the content or operation of third-party sites that it does not control."),
        ],
      },
      {
        heading: "23. Governing law",
        blocks: [
          p("These Terms of Use are primarily governed by the law applicable in Cameroon, subject to any mandatory rules that may apply to the user depending on their country of residence."),
          p("E-commerce activities in Cameroon are notably governed by law n°2010/021 of December 21, 2010 on electronic commerce."),
          p("Consumer protection and personal data protection rules applicable to the service must also be complied with."),
        ],
      },
      {
        heading: "24. Dispute resolution",
        blocks: [
          p("In the event of a difficulty regarding the use of MonEmploiGo, the user is invited to first contact support to seek an amicable solution."),
          p("Failing an amicable resolution, the dispute may be submitted to the competent courts in accordance with applicable law."),
        ],
      },
      {
        heading: "25. Contact",
        blocks: [
          p("For any question regarding these Terms of Use, an order, a payment, or the use of the platform:"),
          list([
            "MonEmploiGo",
            `Email: ${LEGAL_CONFIG.contactEmail}`,
            `Phone / WhatsApp: ${LEGAL_CONFIG.contactPhone}`,
            `Address: ${LEGAL_CONFIG.contactAddress}`,
          ]),
        ],
      },
      {
        heading: "26. Acceptance",
        blocks: [
          p("By creating an account, using the services, or confirming an order, the user acknowledges having read and accepted these Terms of Use."),
        ],
      },
    ],
    closing: "MonEmploiGo — Professional documents to help you prepare your application.",
  },
};
