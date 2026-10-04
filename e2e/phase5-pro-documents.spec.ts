import { expect, test, type BrowserContext } from "@playwright/test";
import { expectNoHorizontalScroll, gotoReady, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phase 5 (MonEmploiGo Pro) : documents créés avec les éditeurs existants,
// préremplissage depuis le dossier, brouillon → finalisation (quota,
// verrouillage), téléchargement, séparation stricte avec l'espace
// particulier, isolation entre structures.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.afterAll(deleteTestUsers);
const acceptCookies = (context: BrowserContext) => context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

async function setup(company: string, { documentsUsed = 0, expired = false } = {}) {
  const pro = await createProUser(company);
  const startsAt = new Date(Date.now() - (expired ? 40 : 1) * DAY);
  const period = await testDb().subscription.create({
    data: { professionalAccountId: pro.accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY), documentsUsed },
  });
  const candidate = await testDb().professionalCandidate.create({
    data: {
      professionalAccountId: pro.accountId,
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      phone: "+237 600 00 00 01",
      professionalField: "Infirmier",
      languages: "Français, Anglais",
    },
  });
  return { ...pro, period, candidate };
}

async function draftCv(s: Awaited<ReturnType<typeof setup>>, content: object = {}) {
  return testDb().document.create({
    data: {
      userId: s.userId,
      professionalAccountId: s.accountId,
      candidateId: s.candidate.id,
      type: "CV",
      category: "STANDARD",
      templateSlug: (await firstTemplate("standard")) ?? "",
      title: "CV — test",
      contentJson: JSON.stringify({
        fullName: "Jean Dupont", jobTitle: "Infirmier", email: "jean.dupont@example.com", phone: "", address: "Douala", summary: "",
        photoDataUrl: null, experience: [{ role: "Infirmier", company: "Hôpital Laquintinie", location: "Douala", start: "2020-01", end: "", description: "" }],
        education: [], skills: ["Soins", "Hygiène"], languages: [{ name: "Français", level: "" }], ...content,
      }),
    },
  });
}

let templateCache: Record<string, string> = {};
async function firstTemplate(kind: string) {
  if (!templateCache[kind]) {
    const { getCvTemplatesByCategory } = await import("../src/lib/cv/catalog");
    templateCache = { ...templateCache, standard: getCvTemplatesByCategory("STANDARD")[0].slug };
  }
  return templateCache[kind];
}

test("CV : modèle, éditeur prérempli, brouillon, finalisation, verrouillage, téléchargement", async ({ page, context }) => {
  const s = await setup("Structure Documents");
  await loginAs(context, s.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/candidats/${s.candidate.id}`);
  await page.getByRole("link", { name: "Créer un document" }).click();
  await expect(page.getByRole("heading", { name: "Créer un document" })).toBeVisible();
  for (const label of ["CV Standard", "CV Premium", "CV ATS", "CV Allemagne (ATS)", "Lettre de motivation", "Bewerbungsbrief"]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${label.replace(/[()]/g, "\\$&")}`) })).toBeVisible();
  }
  await page.getByRole("link", { name: /^CV Standard/ }).click();
  await page.getByRole("link", { name: "Utiliser ce modèle" }).first().click();

  // Éditeur du site, prérempli, en mode Pro (pas de prix, pas de paiement, pas d'« IA »).
  await expect(page.getByLabel("Nom complet")).toHaveValue("Jean Dupont");
  await expect(page.getByLabel("E-mail")).toHaveValue("jean.dupont@example.com");
  await expect(page.getByText("FCFA")).toHaveCount(0);
  await expect(page.getByText(/\bIA\b/)).toHaveCount(0);
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();

  await expect(page).toHaveURL(/\/fr\/pro\/documents\/[a-z0-9]+$/);
  await expect(page.getByText("brouillon", { exact: false }).first()).toBeVisible();
  const docId = page.url().split("/").pop()!;
  expect((await testDb().document.findUniqueOrThrow({ where: { id: docId } })).status).toBe("DRAFT");
  expect((await testDb().subscription.findUniqueOrThrow({ where: { id: s.period.id } })).documentsUsed).toBe(0);

  await page.getByRole("button", { name: "Finaliser ce document" }).click();
  await expect(page.getByText("Document finalisé : il est verrouillé et téléchargeable.", { exact: false })).toBeVisible();
  expect((await testDb().document.findUniqueOrThrow({ where: { id: docId } })).status).toBe("FINALIZED");
  expect((await testDb().subscription.findUniqueOrThrow({ where: { id: s.period.id } })).documentsUsed).toBe(1);

  // Verrouillé : plus de bouton Modifier, et la page de modification refuse.
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
  await page.goto(`/fr/pro/documents/${docId}/modifier`);
  await expect(page.getByText("Ce document est finalisé : il est verrouillé.", { exact: false })).toBeVisible();

  // Téléchargement réel du PDF.
  await gotoReady(page, `/fr/pro/documents/${docId}`);
  const downloadPromise = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("link", { name: "Télécharger mon PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("CV-Jean-Dupont.pdf");
  await expectNoHorizontalScroll(page);
});

test("préremplissage : un nouveau CV reprend l'expérience du CV précédent ; la lettre reprend les compétences", async ({ page, context }) => {
  const s = await setup("Structure Préremplissage");
  await draftCv(s);
  await loginAs(context, s.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/candidats/${s.candidate.id}/document/standard/${await firstTemplate("standard")}`);
  await expect(page.getByLabel("Entreprise").first()).toHaveValue("Hôpital Laquintinie");
  await expect(page.getByLabel("Nom complet")).toHaveValue("Jean Dupont");

  await page.goto(`/fr/pro/candidats/${s.candidate.id}/document/lettre`);
  await page.getByRole("link", { name: "Utiliser ce modèle" }).first().click();
  await expect(page.getByLabel("Nom complet")).toHaveValue("Jean Dupont");
  await expect(page.locator("#cl-keySkills")).toHaveValue("Soins, Hygiène");
  await expect(page.getByText(/\bIA\b/)).toHaveCount(0);
  await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/documents\/[a-z0-9]+$/);
  const letter = await testDb().document.findFirstOrThrow({ where: { candidateId: s.candidate.id, type: "COVER_LETTER" } });
  const content = JSON.parse(letter.contentJson);
  expect(content.keySkills).toBe("Soins, Hygiène");
  expect(content.body.length).toBeGreaterThan(50); // corps généré automatiquement à l'enregistrement
});

test("séparation : un document Pro n'apparaît jamais dans l'espace particulier", async ({ page, context }) => {
  const s = await setup("Structure Séparation");
  const doc = await draftCv(s);
  await loginAs(context, s.userId, BASE_URL);

  await gotoReady(page, "/fr/tableau-de-bord");
  await expect(page.getByText("CV — test")).toHaveCount(0);
  // Ni paiement, ni éditeur particulier pour un document Pro.
  await page.goto(`/fr/paiement/${doc.id}`);
  await expect(page.getByRole("button", { name: /payer/i })).toHaveCount(0);
  await page.goto(`/fr/cv/modele/${doc.templateSlug}?documentId=${doc.id}`);
  await expect(page.getByLabel("Nom complet")).toHaveValue("");
});

test("aucune fonction IA : éditeurs particuliers de lettre et de Bewerbungsbrief", async ({ page, context }) => {
  const s = await setup("Structure Sans IA");
  await loginAs(context, s.userId, BASE_URL);
  const { coverLetterCatalog, bewerbungsbriefCatalog } = await import("../src/lib/cv/catalog");
  for (const path of [`/fr/lettres-de-motivation/modele/${coverLetterCatalog[0].slug}`, `/fr/bewerbungsbrief/modele/${bewerbungsbriefCatalog[0].slug}`]) {
    await gotoReady(page, path);
    await expect(page.getByRole("button", { name: "Générer automatiquement" }), path).toBeVisible();
    await expect(page.getByText(/\bIA\b|intelligence artificielle/i), path).toHaveCount(0);
  }
});

test("quota : finalisation impossible à 30/30 ; deux finalisations simultanées à 29 → une seule", async ({ browser }) => {
  const full = await setup("Structure Quota Plein", { documentsUsed: 30 });
  const fullDoc = await draftCv(full);
  const ctx = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(ctx);
  await loginAs(ctx, full.userId, BASE_URL);
  const page = await ctx.newPage();
  await gotoReady(page, `/fr/pro/documents/${fullDoc.id}`);
  await expect(page.getByText("Votre quota mensuel est atteint.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Finaliser ce document" })).toHaveCount(0);
  await ctx.close();

  const s = await setup("Structure Quota Concurrence", { documentsUsed: 29 });
  const [d1, d2] = [await draftCv(s), await draftCv(s)];
  const contexts = await Promise.all([1, 2].map(() => browser.newContext({ baseURL: BASE_URL })));
  const pages = await Promise.all(
    contexts.map(async (c, i) => {
      await acceptCookies(c);
      await loginAs(c, s.userId, BASE_URL);
      const p = await c.newPage();
      await gotoReady(p, `/fr/pro/documents/${[d1, d2][i].id}`);
      return p;
    }),
  );
  await Promise.all(pages.map((p) => p.getByRole("button", { name: "Finaliser ce document" }).click()));
  await Promise.all(pages.map((p) => expect(p).toHaveURL(/(finalise=1|erreur=quota)$/)));
  expect((await testDb().subscription.findUniqueOrThrow({ where: { id: s.period.id } })).documentsUsed).toBe(30);
  expect(await testDb().document.count({ where: { professionalAccountId: s.accountId, status: "FINALIZED" } })).toBe(1);
  await Promise.all(contexts.map((c) => c.close()));
});

test("lecture seule : document finalisé téléchargeable, brouillon bloqué, aucune création", async ({ page, context }) => {
  const s = await setup("Structure Expirée", { expired: true });
  const draft = await draftCv(s);
  const finalized = await draftCv(s);
  await testDb().document.update({ where: { id: finalized.id }, data: { status: "FINALIZED", finalizedAt: new Date(Date.now() - 20 * DAY) } });
  await loginAs(context, s.userId, BASE_URL);

  await gotoReady(page, `/fr/pro/documents/${finalized.id}`);
  await expect(page.getByRole("link", { name: "Télécharger mon PDF" })).toBeVisible();
  await gotoReady(page, `/fr/pro/documents/${draft.id}`);
  await expect(page.getByText("Abonnement non actif : ce brouillon ne peut plus être modifié ni finalisé.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finaliser ce document" })).toHaveCount(0);
  await page.goto(`/fr/pro/candidats/${s.candidate.id}/document`);
  await expect(page.getByText("la création de documents est indisponible", { exact: false })).toBeVisible();
});

test("isolation : ni consultation ni téléchargement du document d'une autre structure", async ({ browser }) => {
  const a = await setup("Structure A");
  const doc = await draftCv(a);
  await testDb().document.update({ where: { id: doc.id }, data: { status: "FINALIZED", finalizedAt: new Date() } });
  const b = await createProUser("Structure B");

  const ctx = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(ctx);
  await loginAs(ctx, b.userId, BASE_URL);
  const page = await ctx.newPage();
  await page.goto(`/fr/pro/documents/${doc.id}`);
  await expect(page.getByRole("heading", { name: "Cette page n'existe pas dans votre espace." })).toBeVisible();
  const pdf = await page.request.get(`/api/documents/${doc.id}/pdf?lang=fr`, { maxRedirects: 0 });
  expect(pdf.headers()["content-type"] ?? "").not.toContain("application/pdf");
  await ctx.close();
});
