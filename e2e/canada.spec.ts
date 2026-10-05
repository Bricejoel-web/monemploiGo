import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";
import type { CvData } from "../src/lib/cv/types";
import { getCvTemplatesByCategory } from "../src/lib/cv/catalog";
import { CANADA_MODELS } from "../src/lib/cv/canada/models";
import { expectNoHorizontalScroll, gotoReady, referralEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// CV Canada (CV Canadien et CV Canadien ATS) : contenu, ordre des sections,
// langue du document indépendante du site, photo facultative, extraction du
// texte du PDF ATS, catalogue, page de présentation, prix et parrainage.

const BASE_URL = "http://localhost:3100";
const acceptCookies = (context: BrowserContext) => context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

const canada = getCvTemplatesByCategory("CANADA");
const canadaAts = getCvTemplatesByCategory("CANADA_ATS");
const slugOf = (layoutId: string) => [...canada, ...canadaAts].find((t) => t.layoutId === layoutId)!.slug;
// Modèles à colonne secondaire : compétences et langues sont lues à part.
const SIDEBAR = new Set(CANADA_MODELS.filter((m) => m.layout.columns === "sidebar").map((m) => m.id.toLowerCase()));
// Échantillon représentatif : une colonne, colonne secondaire, deux ATS.
const SAMPLE_LAYOUTS = ["can-std-01", "can-std-02", "can-ats-01", "can-ats-20"];

// Petite photo valide (1 × 1 px) : seul son affichage compte.
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const beginner: CvData = {
  fullName: "Awa Débutante",
  jobTitle: "Assistante administrative",
  email: "awa@example.com",
  phone: "+237 600 00 00 01",
  address: "Yaoundé, Cameroun",
  summary: "Diplômée en gestion, organisée et à l'aise avec les outils bureautiques.",
  experience: [],
  education: [{ degree: "BTS en gestion", school: "Institut de Yaoundé", start: "09/2022", end: "06/2024" }],
  skills: ["Microsoft Excel", "Accueil", "Classement"],
  languages: [{ name: "Français", level: "Langue maternelle" }],
};

const experienced: CvData = {
  fullName: "Clarisse Ewondo",
  jobTitle: "Comptable",
  email: "clarisse@example.com",
  phone: "+237 670 00 00 00",
  address: "Douala, Cameroun",
  linkedin: "https://www.linkedin.com/in/clarisse-ewondo/",
  summary: "Comptable avec 6 ans d'expérience en tenue de livres et préparation des états financiers.",
  // Saisies dans le désordre : le CV doit les classer du plus récent au plus ancien.
  experience: [
    { role: "Stagiaire comptable", company: "Cabinet Alpha", location: "Douala", start: "01/2016", end: "06/2018", description: "Saisie des pièces comptables" },
    { role: "Comptable", company: "Littoral Trading", location: "Douala", start: "03/2021", end: "présent", description: "Tenue de la comptabilité de 3 filiales\nRapprochements bancaires mensuels" },
    { role: "Aide-comptable", company: "Groupe Beta", location: "Yaoundé", start: "07/2018", end: "02/2021", description: "Suivi des comptes clients" },
  ],
  education: [{ degree: "Licence en comptabilité", school: "Université de Douala", start: "09/2012", end: "06/2015" }],
  skills: ["Comptabilité générale", "Rapprochements bancaires", "Fiscalité", "Excel avancé", "Sage", "États financiers"],
  languages: [
    { name: "Français", level: "Langue maternelle" },
    { name: "Anglais", level: "B2" },
  ],
  certifications: [{ name: "Certificat en comptabilité informatisée", issuer: "Centre de formation", year: "2020" }],
};

async function paidCv(userId: string, layoutId: string, data: CvData, includePhoto = false) {
  const template = [...canada, ...canadaAts].find((t) => t.layoutId === layoutId)!;
  return testDb().document.create({
    data: {
      userId,
      type: "CV",
      category: template.category,
      templateSlug: template.slug,
      title: `${data.fullName} — test`,
      contentJson: JSON.stringify(data),
      includePhoto,
      photoDataUrl: includePhoto ? (data.photoDataUrl ?? null) : null,
      status: "PAID",
      paidAt: new Date(),
    },
  });
}

async function cvText(page: Page, documentId: string) {
  await gotoReady(page, `/fr/document/${documentId}/apercu`);
  return (await page.locator("article.a4-page").first().innerText()).replace(/\s+/g, " ");
}

function expectInOrder(text: string, parts: string[]) {
  const lower = text.toLowerCase();
  let from = -1;
  for (const part of parts) {
    const at = lower.indexOf(part.toLowerCase(), from + 1);
    expect(at, `« ${part} » absent ou hors de l'ordre attendu`).toBeGreaterThan(from);
    from = at;
  }
}

test.describe("pages publiques Canada", () => {
  test("catalogues, page /canada et avertissement", async ({ page }) => {
    for (const [path, count] of [["/fr/cv/canada", canada.length], ["/fr/cv/canada-ats", canadaAts.length]] as const) {
      expect((await page.goto(path))?.status()).toBe(200);
      await expect(page.locator(`a[href^="/fr/cv/modele/"]`)).toHaveCount(count);
      // Pas de photo d'exemple sur les CV Canada : elle reste facultative.
      await expect(page.locator("article.a4-page img")).toHaveCount(0);
    }
    expect(canada.length).toBe(21);
    expect(canadaAts.length).toBe(20);

    expect((await page.goto("/fr/canada"))?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Préparez votre candidature pour le Canada");
    await expect(page.getByText("Nos documents ne sont pas des documents officiels délivrés par les autorités canadiennes", { exact: false })).toBeVisible();
    await expect(page.getByText("1 500 FCFA par document").first()).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.goto("/en/canada");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prepare your application for Canada");
  });
});

test.describe("CV Canada", () => {
  test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
  test.skip(({ isMobile }) => isMobile, "joué une fois, sur ordinateur");
  test.describe.configure({ mode: "serial" });
  test.afterAll(deleteTestUsers);

  let user: { userId: string; email: string };
  test.beforeAll(async () => {
    user = await createUser("Canada Test");
  });

  test("TEST 1, 7, 8 : profil débutant, sans expérience, certification ni LinkedIn → sections masquées", async ({ page, context }) => {
    await loginAs(context, user.userId, BASE_URL);
    for (const layout of SAMPLE_LAYOUTS) {
      const text = await cvText(page, (await paidCv(user.userId, layout, beginner)).id);
      // Colonne secondaire : coordonnées, compétences et langues y sont lues
      // à part ; les modèles en une colonne suivent strictement l'ordre validé.
      if (SIDEBAR.has(layout)) {
        expectInOrder(text, ["Awa Débutante", "Assistante administrative", "Résumé professionnel", "Formation"]);
        expectInOrder(text, ["Compétences", "Langues"]);
        expect(text).toContain("Yaoundé, Cameroun");
      } else {
        expectInOrder(text, ["Awa Débutante", "Assistante administrative", "Yaoundé, Cameroun", "Résumé professionnel", "Compétences", "Formation", "Langues"]);
      }
      for (const absent of ["Expérience professionnelle", "Certifications", "linkedin", "Nationalité", "Date de naissance"]) expect(text.toLowerCase(), `${layout} : ${absent}`).not.toContain(absent.toLowerCase());
    }
  });

  test("TEST 2, 3, 9 : professionnel expérimenté, en français, expériences du plus récent au plus ancien", async ({ page, context }) => {
    await loginAs(context, user.userId, BASE_URL);
    for (const layout of SAMPLE_LAYOUTS) {
      const text = await cvText(page, (await paidCv(user.userId, layout, experienced)).id);
      expectInOrder(text, ["Littoral Trading", "Groupe Beta", "Cabinet Alpha"]);
      expectInOrder(text, ["Formation", "Certifications"]);
      expect(text).toContain("Présent");
      for (const part of ["linkedin.com/in/clarisse-ewondo", "Certificat en comptabilité informatisée", "Centre de formation — 2020", "Français — Langue maternelle", "Anglais — B2", "Tenue de la comptabilité de 3 filiales"]) {
        expect(text, `${layout} : ${part}`).toContain(part);
      }
    }
  });

  test("TEST 4 : CV en anglais alors que le site est en français", async ({ page, context }) => {
    await loginAs(context, user.userId, BASE_URL);
    const text = await cvText(page, (await paidCv(user.userId, "can-std-01", { ...experienced, cvLanguage: "en" })).id);
    expectInOrder(text, ["Professional Summary", "Professional Experience", "Education", "Certifications"]);
    expect(text).toContain("Present");
    expect(text).toContain("Français — Native");
    expect(text.toLowerCase()).not.toContain("résumé professionnel");
  });

  test("TEST 5 et 6 : photo facultative sur le CV Canadien, jamais sur le CV ATS", async ({ page, context }) => {
    await loginAs(context, user.userId, BASE_URL);
    const withPhoto = { ...experienced, photoDataUrl: PHOTO };
    await cvText(page, (await paidCv(user.userId, "can-std-01", withPhoto, true)).id);
    await expect(page.locator("article.a4-page img")).toHaveCount(1);
    await cvText(page, (await paidCv(user.userId, "can-std-01", withPhoto, false)).id);
    await expect(page.locator("article.a4-page img")).toHaveCount(0);
    await cvText(page, (await paidCv(user.userId, "can-ats-01", withPhoto, true)).id);
    await expect(page.locator("article.a4-page img")).toHaveCount(0);
  });

  test("TEST 10 : extraction du texte du PDF des 20 modèles ATS, ordre strict et rien de perdu", async ({ page, context }) => {
    // Un vrai PDF par modèle ATS (rendu Chromium du site) : long.
    test.setTimeout(20 * 60_000);
    await loginAs(context, user.userId, BASE_URL);
    let owner = user;
    for (const [index, template] of canadaAts.entries()) {
      // Le site limite chaque compte à 15 PDF par quart d'heure (protection
      // anti-abus) : un nouveau compte de test toutes les 10 générations.
      if (index > 0 && index % 10 === 0) {
        owner = await createUser(`Canada ATS ${index}`);
        await loginAs(context, owner.userId, BASE_URL);
      }
      const layout = template.layoutId;
      const lang = index % 2 === 0 ? "fr" : "en";
      const document = await paidCv(owner.userId, layout, { ...experienced, cvLanguage: lang });
      const response = await page.request.get(`/api/documents/${document.id}/pdf?lang=fr`);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      const pdf = await getDocumentProxy(new Uint8Array(await response.body()));
      const { text } = await extractText(pdf, { mergePages: true });
      const flat = text.replace(/\s+/g, " ");
      const headings =
        lang === "en"
          ? ["Professional Summary", "Skills", "Professional Experience", "Education", "Certifications", "Languages"]
          : ["Résumé professionnel", "Compétences", "Expérience professionnelle", "Formation", "Certifications", "Langues"];
      expectInOrder(flat, ["Clarisse Ewondo", "Comptable", "Douala, Cameroun", "clarisse@example.com", ...headings]);
      for (const part of [...experienced.skills, "Littoral Trading", "Groupe Beta", "Cabinet Alpha", "Licence en comptabilité", "Certificat en comptabilité informatisée", "Rapprochements bancaires mensuels"]) {
        expect(flat, `${layout} : « ${part} » perdu à l'extraction`).toContain(part);
      }
      // Ni lettres espacées ni ligatures dans le texte extrait.
      expect(flat).not.toMatch(/[ﬁﬂ]/);
      expect(flat).not.toMatch(/R É S U M É|P R O F E S S I O N A L/i);
    }
  });

  test("formulaire : langue du CV, LinkedIn, certifications, rubrique libre masquée, pas de photo en ATS", async ({ page, context }) => {
    await loginAs(context, user.userId, BASE_URL);
    await gotoReady(page, `/fr/cv/modele/${slugOf("can-std-01")}`);
    await expect(page.getByLabel("Langue du CV")).toBeVisible();
    await expect(page.getByLabel("Ville, pays")).toBeVisible();
    await expect(page.getByText("Rubrique supplémentaire")).toHaveCount(0);
    await expect(page.getByLabel("Date de naissance")).toHaveCount(0);
    await expect(page.getByLabel("Nationalité")).toHaveCount(0);
    await page.locator("#summary").fill("Comptable avec 6 ans d'expérience.");
    await page.getByLabel("Profil LinkedIn").fill("linkedin.com/in/test-canada");
    await page.getByRole("button", { name: "+ Ajouter une certification" }).click();
    await page.getByLabel("Nom de la certification").fill("Certificat de test");
    const preview = page.locator("article.a4-page").first();
    await expect(preview).toContainText("linkedin.com/in/test-canada");
    await expect(preview).toContainText("Certificat de test");
    await expect(preview).toContainText("Résumé professionnel");
    await page.getByLabel("Langue du CV").selectOption("en");
    await expect(preview).toContainText("Professional Summary");

    // Photo déconseillée au Canada : avertissement avant tout choix de fichier.
    const warning = page.getByText("Photo non recommandée pour les candidatures au Canada.", { exact: false });
    await expect(warning).toHaveCount(0);
    await page.getByRole("button", { name: "Ajouter ma photo" }).last().click();
    await expect(warning).toBeVisible();
    await page.getByRole("button", { name: "Continuer sans photo" }).click();
    await expect(warning).toHaveCount(0);
    await expect(preview.locator("img")).toHaveCount(0);

    await gotoReady(page, `/fr/cv/modele/${slugOf("can-ats-01")}`);
    await expect(page.getByText("Les CV ATS n'ont pas de photo", { exact: false })).toBeVisible();
  });

  test("prix 1 500 FCFA et commission de parrainage de 200 FCFA sur un CV Canada", async ({ page, context }) => {
    test.skip(!referralEnabled, "parrainage désactivé");
    const referrer = await createUser("Parrain Canada");
    await testDb().user.update({ where: { id: referrer.userId }, data: { referralCode: `CAN${Date.now() % 1000000}` } });
    const buyer = await createUser("Filleul Canada");
    await testDb().user.update({ where: { id: buyer.userId }, data: { referredById: referrer.userId, referralDomain: "CANADA", referredAt: new Date() } });
    const draft = await testDb().document.create({
      data: { userId: buyer.userId, type: "CV", category: "CANADA_ATS", templateSlug: slugOf("can-ats-20"), title: "CV Canada — test", contentJson: JSON.stringify(experienced) },
    });
    await loginAs(context, buyer.userId, BASE_URL);
    await gotoReady(page, `/fr/paiement/${draft.id}`);
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByRole("link", { name: /PDF/ })).toBeVisible();

    const payment = await testDb().payment.findFirstOrThrow({ where: { documentId: draft.id, status: "SUCCESS" } });
    expect(payment.amountFcfa).toBe(1500);
    const commission = await testDb().referralCommission.findUniqueOrThrow({ where: { paymentId: payment.id } });
    expect(commission.amountFcfa).toBe(200);
    expect(commission.referrerId).toBe(referrer.userId);
  });

  test("lien de parrainage Canada → page d'arrivée Canada", async ({ page }) => {
    test.skip(!referralEnabled, "parrainage désactivé");
    await page.goto("/fr/recommandation?domaine=canada");
    await expect(page.getByText("Préparez votre candidature pour le Canada.")).toBeVisible();
    await expect(page.getByText("CV Canadien ATS", { exact: false })).toBeVisible();
    await expect(page.getByText("ne garantissent ni emploi, ni admission, ni visa, ni permis", { exact: false })).toBeVisible();
    await expect(page.getByText("Cette récompense n'augmente pas le prix que vous payez.")).toBeVisible();
  });
});
