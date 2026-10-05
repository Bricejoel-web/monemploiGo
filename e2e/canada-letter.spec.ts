import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";
import type { CvData } from "../src/lib/cv/types";
import { buildCanadaLetter } from "../src/lib/letters/canada/generate";
import { emptyProfile, type CanadaLetterContent } from "../src/lib/letters/canada/profile";
import { gotoReady } from "./helpers";
import { DB_WRITES_SKIP_REASON, createUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Lettre de présentation Canada : trois sources (saisie, CV MonEmploiGo,
// CV PDF importé), vérification, génération, paiement et PDF ; et règles
// du générateur (rien d'inventé, mobilité seulement si choisie).

const BASE_URL = "http://localhost:3100";
const acceptCookies = (context: BrowserContext) => context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

test.describe("générateur de la lettre Canada", () => {
  const base = (): CanadaLetterContent => ({
    source: "manual",
    profile: { ...emptyProfile(), personalInfo: { ...emptyProfile().personalInfo, firstName: "Awa", lastName: "Test" } },
    job: { position: "Assistante administrative", company: "Groupe Nord" },
    options: { language: "fr", mobility: "omit" },
    date: "",
  });

  test("rien n'est inventé quand le profil est presque vide", () => {
    const letter = buildCanadaLetter(base());
    const text = letter.paragraphs.join(" ").toLowerCase();
    for (const absent of ["certification", "expérience de", "mes missions", "compétences en", "canada", "visa", "permis", "immigr", "autorisé"]) {
      expect(text, absent).not.toContain(absent);
    }
    expect(letter.salutation).toBe("Madame, Monsieur,");
    expect(letter.subject).toBe("Candidature au poste d'assistante administrative");
  });

  test("mobilité mentionnée seulement si choisie, en français comme en anglais", () => {
    const fr = buildCanadaLetter({ ...base(), options: { language: "fr", mobility: "yes" } }).paragraphs.join(" ");
    expect(fr).toContain("mobilité professionnelle vers le Canada");
    expect(buildCanadaLetter({ ...base(), options: { language: "fr", mobility: "no" } }).paragraphs.join(" ")).not.toContain("Canada");
    const en = buildCanadaLetter({ ...base(), options: { language: "en", mobility: "yes" } });
    expect(en.paragraphs.join(" ")).toContain("Currently based in Cameroon, I am open to relocating to Canada");
    expect(en.salutation).toBe("Dear Hiring Manager,");
    expect(buildCanadaLetter({ ...base(), job: { ...base().job, recruiterName: "Ms. Roy" }, options: { language: "en", mobility: "omit" } }).salutation).toBe("Dear Ms. Roy,");
  });

  test("l'offre d'emploi ne fait jamais apparaître une compétence absente du profil", () => {
    const content = base();
    content.profile.skills = ["Accueil", "Classement"];
    content.job.offerText = "Compétences requises : Excel, Sage, accueil du public.";
    const text = buildCanadaLetter(content).paragraphs.join(" ");
    expect(text).toContain("accueil");
    expect(text).not.toMatch(/Excel|Sage/);
  });
});

test.describe("parcours de la lettre Canada", () => {
  test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
  test.skip(({ isMobile }) => isMobile, "joué une fois, sur ordinateur");
  test.describe.configure({ mode: "serial" });
  test.afterAll(deleteTestUsers);

  const continueTo = (page: Page) => page.getByRole("button", { name: "Continuer" }).click();
  const preview = (page: Page) => page.locator("article.a4-page").first();

  test("accès réservé, entrée du tableau de bord et de la page /canada", async ({ page, context }) => {
    const response = await page.goto("/fr/lettre-canada");
    expect(new URL(page.url()).pathname).toBe("/fr/connexion");
    expect(response?.status()).toBe(200);
    await page.goto("/fr/canada");
    await expect(page.getByRole("link", { name: "Créer ma lettre" })).toHaveAttribute("href", "/fr/lettre-canada");
    const user = await createUser("Lettre Entree");
    await loginAs(context, user.userId, BASE_URL);
    await gotoReady(page, "/fr/tableau-de-bord");
    await page.getByRole("link", { name: /Lettre de présentation Canada/ }).click();
    await expect(page.getByRole("heading", { name: "Créez votre lettre de présentation Canada" })).toBeVisible();
    await expect(page.getByText("Vous n'avez pas encore de CV MonEmploiGo.")).toBeVisible();
  });

  test("saisie manuelle → aperçu → paiement 1 500 FCFA → PDF", async ({ page, context }) => {
    test.slow();
    const user = await createUser("Lettre Manuelle");
    await loginAs(context, user.userId, BASE_URL);
    await gotoReady(page, "/fr/lettre-canada");
    await page.getByRole("button", { name: /Renseigner mes informations manuellement/ }).click();
    await page.getByLabel("Prénom").fill("Clarisse");
    await page.getByLabel("Nom", { exact: true }).fill("Ewondo");
    await page.getByLabel("Ville", { exact: true }).fill("Douala");
    await page.getByLabel("Compétences").fill("Comptabilité générale, Excel avancé");
    await page.getByLabel("Poste", { exact: true }).fill("Comptable");
    await page.getByLabel("Entreprise", { exact: true }).fill("Société du Littoral");
    await page.getByLabel(/Décrivez brièvement/).fill("Tenue de la comptabilité de 3 filiales");
    await continueTo(page);
    await page.getByLabel("Quel poste souhaitez-vous obtenir ?").fill("Comptable");
    await page.getByLabel("Nom de l'entreprise").fill("Groupe Laurentide");
    await continueTo(page);
    await page.getByLabel("Oui").check();
    await continueTo(page);
    await expect(preview(page)).toContainText("Madame, Monsieur,");
    await expect(preview(page)).toContainText("Candidature au poste de comptable");
    await expect(preview(page)).toContainText("Dans mes fonctions de comptable (Société du Littoral)");
    await expect(preview(page)).toContainText("mobilité professionnelle vers le Canada");
    await expect(preview(page)).toContainText("Douala, Cameroun");

    // Retouche du texte généré.
    const first = page.getByRole("textbox", { name: "Retoucher le texte 1" });
    await first.fill("Paragraphe retouché par la candidate.");
    await expect(preview(page)).toContainText("Paragraphe retouché par la candidate.");

    await expect(page.getByText("1500 FCFA")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer et payer" }).click();
    await expect(page).toHaveURL(/\/fr\/paiement\//);
    const documentId = page.url().split("/").at(-1)!;
    const doc = await testDb().document.findUniqueOrThrow({ where: { id: documentId } });
    expect(doc.type).toBe("COVER_LETTER");
    expect(doc.templateSlug).toBe("letter-can-01");

    // Brouillon : reprise depuis le tableau de bord, dans le parcours Canada.
    await gotoReady(page, "/fr/tableau-de-bord");
    await expect(page.locator(`a[href="/fr/lettre-canada?documentId=${documentId}"]`)).toHaveCount(1);
    await gotoReady(page, `/fr/lettre-canada?documentId=${documentId}`);
    await expect(page.getByLabel("Prénom")).toHaveValue("Clarisse");

    await gotoReady(page, `/fr/paiement/${documentId}`);
    await page.getByRole("button", { name: "Payer" }).click();
    await expect(page.getByRole("link", { name: /PDF/ })).toBeVisible();
    const payment = await testDb().payment.findFirstOrThrow({ where: { documentId, status: "SUCCESS" } });
    expect(payment.amountFcfa).toBe(1500);

    const pdf = await page.request.get(`/api/documents/${documentId}/pdf?lang=fr`);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    const { text, totalPages } = await extractText(await getDocumentProxy(new Uint8Array(await pdf.body())), { mergePages: true });
    expect(totalPages).toBe(1);
    const flat = text.replace(/\s+/g, " ");
    expect(flat).toContain("Paragraphe retouché par la candidate.");
    expect(flat).toContain("Cordialement,");
    expect(flat).not.toMatch(/visa|permis de travail|immigr/i);

  });

  test("depuis un CV MonEmploiGo, puis depuis le même CV importé en PDF", async ({ page, context }) => {
    test.slow();
    const user = await createUser("Lettre Source");
    const cv: CvData = {
      fullName: "Clarisse Ewondo",
      jobTitle: "Comptable",
      email: "clarisse@example.com",
      phone: "+237 670 00 00 00",
      address: "Douala, Cameroun",
      summary: "Comptable avec 6 ans d'expérience.",
      experience: [{ role: "Comptable", company: "Littoral Trading", location: "Douala", start: "03/2021", end: "présent", description: "Rapprochements bancaires mensuels" }],
      education: [{ degree: "Licence en comptabilité", school: "Université de Douala", start: "09/2015", end: "06/2018" }],
      skills: ["Fiscalité", "Excel avancé"],
      languages: [{ name: "Français", level: "Langue maternelle" }],
    };
    const cvDoc = await testDb().document.create({
      data: { userId: user.userId, type: "CV", category: "CANADA", templateSlug: "can-std-01", title: "CV Clarisse — Corporate Classic", contentJson: JSON.stringify(cv), status: "PAID", paidAt: new Date() },
    });
    await loginAs(context, user.userId, BASE_URL);

    // Source 1 : CV MonEmploiGo, informations reprises puis vérifiables.
    await gotoReady(page, "/fr/lettre-canada");
    await page.getByRole("button", { name: "CV Clarisse — Corporate Classic" }).click();
    await expect(page.getByRole("heading", { name: "Vérifiez les informations utilisées pour votre lettre" })).toBeVisible();
    await expect(page.getByLabel("Prénom")).toHaveValue("Clarisse");
    await expect(page.getByLabel("Ville", { exact: true })).toHaveValue("Douala");
    await expect(page.getByLabel("Poste", { exact: true })).toHaveValue("Comptable");

    // Source 2 : le PDF de ce CV, importé ; extraction à vérifier.
    const pdf = await page.request.get(`/api/documents/${cvDoc.id}/pdf?lang=fr`);
    await gotoReady(page, "/fr/lettre-canada");
    await page.locator('input[type="file"]').setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: await pdf.body() });
    await expect(page.getByRole("heading", { name: "Vérifiez les informations extraites" })).toBeVisible();
    await expect(page.getByText("Certaines informations n'ont pas pu être identifiées avec certitude.", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Prénom")).toHaveValue("Clarisse");
    await expect(page.getByLabel("Adresse e-mail")).toHaveValue("clarisse@example.com");

    // Un fichier qui n'est pas un PDF est refusé.
    await gotoReady(page, "/fr/lettre-canada");
    // Bouton d'import bien visible, nom du fichier sur sa propre ligne.
    await expect(page.getByRole("button", { name: "Choisir mon CV (PDF)" })).toBeVisible();
    await expect(page.getByText("Aucun fichier choisi")).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("pas un pdf") });
    await expect(page.getByText("Choisissez un fichier PDF.")).toBeVisible();
    await expect(page.getByText("cv.pdf", { exact: true })).toBeVisible();
  });
});
