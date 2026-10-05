import { createHmac } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { gotoReady, expectNoHorizontalScroll } from "./helpers";
import { DB_WRITES_SKIP_REASON, createUser, dbWritesAllowed, deleteTestUsers, effectiveEnv, loginAs, testDb, testEmail } from "./db";

// Parrainage « Parrainer & gagner » : les 12 scénarios demandés, de bout en
// bout (lien, page d'arrivée, inscription, achats, webhook rejoué, retraits,
// administration, auto-parrainage, remboursement). Joués une fois, dans
// l'ordre, sur ordinateur (limites de tentatives par adresse IP).

const BASE_URL = "http://localhost:3100";
const ADMIN_EMAIL = "admin-e2e@e2e.monemploigo.test";

test.skip(process.env.REFERRAL_ENABLED === "false", "parrainage désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.skip(({ isMobile }) => isMobile, "parcours joué une fois, sur ordinateur");
test.describe.configure({ mode: "serial" });
test.afterAll(deleteTestUsers);

const acceptCookies = (context: BrowserContext) => context.addInitScript(() => localStorage.setItem("monemploigo_cookie_consent", "acknowledged"));
test.beforeEach(({ context }) => acceptCookies(context));

let referrer: { userId: string; email: string };
let code = "";
let referredEmail = "";
let referredId = "";

async function stats(page: Page) {
  await page.goto("/fr/parrainage");
  const value = (label: string) => page.getByRole("region", { name: "Mes gains" }).locator("div", { has: page.getByText(label, { exact: true }) }).first();
  return { value };
}

async function paidDraft(type: "CV" | "COVER_LETTER") {
  const { getCvTemplatesByCategory, coverLetterCatalog } = await import("../src/lib/cv/catalog");
  return testDb().document.create({
    data: {
      userId: referredId,
      type,
      category: type === "CV" ? "STANDARD" : null,
      templateSlug: type === "CV" ? getCvTemplatesByCategory("STANDARD")[0].slug : coverLetterCatalog[0].slug,
      title: `${type} — test`,
      contentJson: JSON.stringify(type === "CV" ? { fullName: "Personne Recommandée", jobTitle: "", email: "", phone: "", summary: "", experience: [], education: [], skills: [], languages: [] } : { fullName: "Personne Recommandée", email: "", phone: "", date: "", subject: "", body: "Texte." }),
    },
  });
}

async function payThroughSite(page: Page, documentId: string) {
  await gotoReady(page, `/fr/paiement/${documentId}`);
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page.getByRole("link", { name: /PDF/ })).toBeVisible();
}

const commissionsOf = (userId: string) => testDb().referralCommission.findMany({ where: { referrerId: userId } });

test("TEST 1 & 2 : liens Cameroun et Allemagne, copie et partage WhatsApp", async ({ page, context }) => {
  await testDb().user.deleteMany({ where: { email: ADMIN_EMAIL } });
  referrer = await createUser("Brice Test");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await loginAs(context, referrer.userId, BASE_URL);
  await gotoReady(page, "/fr/parrainage");

  await expect(page.getByRole("heading", { name: "Parrainer & gagner" })).toBeVisible();
  code = (await testDb().user.findUniqueOrThrow({ where: { id: referrer.userId } })).referralCode!;
  expect(code).toMatch(/^BRICE\d{2,4}$/);

  const link = page.getByLabel("Votre lien");
  await page.getByLabel(/Emploi au Cameroun/).check();
  await expect(link).toHaveValue(`https://monemploigo.vercel.app/?ref=${code}&domain=cameroun`);
  await page.getByLabel(/Projet professionnel en Allemagne/).check();
  await expect(link).toHaveValue(`https://monemploigo.vercel.app/?ref=${code}&domain=allemagne`);
  const whatsapp = await page.getByRole("link", { name: "Partager sur WhatsApp" }).getAttribute("href");
  expect(decodeURIComponent(whatsapp!)).toContain("projet professionnel en Allemagne");
  expect(decodeURIComponent(whatsapp!)).not.toContain("200 FCFA");
  await page.getByRole("button", { name: "Copier le lien" }).click();
  await expect(page.getByText("✓ Lien copié !")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`ref=${code}&domain=allemagne`);
  // Aucun émoji en guise d'icône, aucun Canada.
  await expect(page.getByText(/Canada/)).toHaveCount(0);
  await expectNoHorizontalScroll(page);

  // Le code reste le même d'une visite à l'autre.
  await page.reload();
  expect((await testDb().user.findUniqueOrThrow({ where: { id: referrer.userId } })).referralCode).toBe(code);
});

test("TEST 3 & 4 : arrivée par le lien Allemagne, puis inscription → parrain enregistré", async ({ browser }) => {
  const visitor = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(visitor);
  const page = await visitor.newPage();
  await page.goto(`/?ref=${code}&domain=allemagne`);
  await expect(page).toHaveURL(/\/fr\/recommandation\?domaine=allemagne$/);
  await expect(page.getByText("Préparez votre candidature pour votre projet professionnel en Allemagne.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pourquoi avez-vous reçu ce lien ?" })).toBeVisible();
  await expect(page.getByText("Cette récompense n'augmente pas le prix que vous payez.")).toBeVisible();
  await expect(page.getByText("aucun visa, emploi ou Ausbildung n'est garanti", { exact: false })).toBeVisible();
  const cookie = (await visitor.cookies()).find((c) => c.name === "monemploigo_ref");
  expect(cookie?.httpOnly).toBe(true);

  // Navigation ailleurs avant l'inscription : l'attribution est conservée.
  await page.goto("/fr/cv");
  referredEmail = testEmail("recommande");
  await gotoReady(page, "/fr/inscription");
  await page.getByLabel("Prénom").fill("Aline");
  await page.getByLabel("Nom", { exact: true }).fill("Recommandée");
  await page.getByLabel("Adresse e-mail").fill(referredEmail);
  await page.getByLabel("Mot de passe", { exact: true }).fill("Pro-Test#2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Pro-Test#2026");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);

  const referred = await testDb().user.findFirstOrThrow({ where: { email: referredEmail } });
  expect(referred.referredById).toBe(referrer.userId);
  expect(referred.referralDomain).toBe("ALLEMAGNE");
  referredId = referred.id;
  expect((await visitor.cookies()).some((c) => c.name === "monemploigo_ref")).toBe(false);
  await visitor.close();
});

test("TEST 5 & 6 : achat d'un CV puis d'une lettre → 200 + 200 FCFA, une seule personne recommandée", async ({ browser, page, context }) => {
  const buyer = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(buyer);
  await loginAs(buyer, referredId, BASE_URL);
  const buyerPage = await buyer.newPage();
  await payThroughSite(buyerPage, (await paidDraft("CV")).id);
  expect((await commissionsOf(referrer.userId)).map((c) => c.amountFcfa)).toEqual([200]);
  await payThroughSite(buyerPage, (await paidDraft("COVER_LETTER")).id);
  await buyer.close();

  const commissions = await commissionsOf(referrer.userId);
  expect(commissions.reduce((s, c) => s + c.amountFcfa, 0)).toBe(400);
  expect(new Set(commissions.map((c) => c.documentType))).toEqual(new Set(["CV", "COVER_LETTER"]));

  await loginAs(context, referrer.userId, BASE_URL);
  const { value } = await stats(page);
  await expect(value("Total gagné")).toContainText("400 FCFA");
  await expect(value("Personnes recommandées")).toContainText("1");
  await expect(page.getByText(/Utilisateur recommandé #\d{4}/).first()).toBeVisible();
  await expect(page.getByText(referredEmail)).toHaveCount(0);
});

test("TEST 7 : le même webhook reçu deux fois → une seule commission", async ({ request }) => {
  const doc = await paidDraft("CV");
  const payment = await testDb().payment.create({ data: { userId: referredId, documentId: doc.id, provider: "NOTCHPAY", amountFcfa: 1000, status: "PENDING", providerRef: "trx.test_e2e" } });
  const body = JSON.stringify({ type: "payment.complete", data: { merchant_reference: payment.id, amount: 1000, currency: "XAF", status: "complete" } });
  const signature = createHmac("sha256", effectiveEnv("NOTCHPAY_WEBHOOK_HASH")!).update(body).digest("hex");
  for (let i = 0; i < 3; i++) {
    const response = await request.post("/api/paiement/webhook/notchpay", { data: body, headers: { "content-type": "application/json", "x-notch-signature": signature } });
    expect(response.status()).toBe(200);
  }
  expect(await testDb().referralCommission.count({ where: { paymentId: payment.id } })).toBe(1);
  expect((await commissionsOf(referrer.userId)).reduce((s, c) => s + c.amountFcfa, 0)).toBe(600);
});

test("TEST 8 : retrait de 500 sur 800 → 300 disponibles, 500 en attente ; double demande simultanée refusée", async ({ browser }) => {
  // 4e achat éligible : solde de 800 FCFA.
  const buyer = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(buyer);
  await loginAs(buyer, referredId, BASE_URL);
  await payThroughSite(await buyer.newPage(), (await paidDraft("CV")).id);
  await buyer.close();

  const contexts = await Promise.all([1, 2].map(() => browser.newContext({ baseURL: BASE_URL })));
  const pages = await Promise.all(
    contexts.map(async (c) => {
      await acceptCookies(c);
      await loginAs(c, referrer.userId, BASE_URL);
      const p = await c.newPage();
      await gotoReady(p, "/fr/parrainage");
      await p.getByLabel("Montant du retrait (FCFA)").fill("500");
      await p.getByLabel("Paiement sur").selectOption("MTN_MOMO");
      await p.getByLabel("Numéro Mobile Money").fill("677 00 00 00");
      return p;
    }),
  );
  await Promise.all(pages.map((p) => p.getByRole("button", { name: "Demander le paiement" }).click()));
  await Promise.all(pages.map((p) => expect(p.getByText(/Votre demande de paiement est enregistrée|Montant supérieur à votre solde disponible/)).toBeVisible()));
  expect(await testDb().withdrawalRequest.count({ where: { userId: referrer.userId } })).toBe(1);

  const { value } = await stats(pages[0]);
  await expect(value("Solde disponible")).toContainText("300 FCFA");
  await expect(value("En attente")).toContainText("500 FCFA");
  await Promise.all(contexts.map((c) => c.close()));
});

test("TEST 9 & 10 : l'administrateur paie un retrait, puis en refuse un autre (montant restauré)", async ({ browser, page, context }) => {
  const admin = await createUser("Admin Test", ADMIN_EMAIL);
  // Un compte non administrateur n'a pas accès à l'administration.
  await loginAs(context, referrer.userId, BASE_URL);
  await page.goto("/fr/admin/retraits");
  await expect(page.getByRole("heading", { name: "Retraits de parrainage" })).toHaveCount(0);

  const adminCtx = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(adminCtx);
  await loginAs(adminCtx, admin.userId, BASE_URL);
  const adminPage = await adminCtx.newPage();
  await gotoReady(adminPage, "/fr/admin/retraits");
  await expect(adminPage.getByText("+237677000000")).toBeVisible();
  await adminPage.getByRole("link", { name: "Ouvrir" }).first().click();
  await adminPage.getByRole("button", { name: "Marquer comme payé" }).click();
  await expect(adminPage.getByText("Retrait marqué comme payé.")).toBeVisible();
  await expect(adminPage.getByText(/PENDING → PAID · 500 FCFA · par admin-e2e/)).toBeVisible();

  let { value } = await stats(page);
  await expect(value("Solde disponible")).toContainText("300 FCFA");
  await expect(value("En attente")).toContainText("0 FCFA");
  await expect(value("Total gagné")).toContainText("800 FCFA");

  // Nouvelle demande de 300, refusée : les 300 redeviennent disponibles.
  await expect(page.getByText("Disponible dès 500 FCFA de solde.")).toBeVisible();
  await testDb().withdrawalRequest.create({ data: { userId: referrer.userId, amountFcfa: 300, method: "ORANGE_MONEY", phoneNumber: "+237690000000" } });
  ({ value } = await stats(page));
  await expect(value("Solde disponible")).toContainText("0 FCFA");
  const pending = await testDb().withdrawalRequest.findFirstOrThrow({ where: { userId: referrer.userId, status: "PENDING" } });
  await gotoReady(adminPage, `/fr/admin/retraits/${pending.id}`);
  await adminPage.getByRole("button", { name: "Refuser" }).click();
  await expect(adminPage.getByText("Retrait refusé", { exact: false })).toBeVisible();
  ({ value } = await stats(page));
  await expect(value("Solde disponible")).toContainText("300 FCFA");
  await expect(value("Total gagné")).toContainText("800 FCFA");
  expect(await testDb().referralAuditLog.count({ where: { withdrawal: { userId: referrer.userId } } })).toBe(2);
  await adminCtx.close();
});

test("TEST 11 : auto-parrainage (même adresse, variante) → aucune attribution", async ({ browser }) => {
  const self = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(self);
  const page = await self.newPage();
  await page.goto(`/?ref=${code}&domain=cameroun`);
  const [local, domain] = referrer.email.split("@");
  const variant = `${local.toUpperCase()}+second@${domain}`;
  await gotoReady(page, "/fr/inscription");
  await page.getByLabel("Prénom").fill("Brice");
  await page.getByLabel("Nom", { exact: true }).fill("Bis");
  await page.getByLabel("Adresse e-mail").fill(variant);
  await page.getByLabel("Mot de passe", { exact: true }).fill("Pro-Test#2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Pro-Test#2026");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord$/);
  expect((await testDb().user.findFirstOrThrow({ where: { email: variant } })).referredById).toBeNull();
  await self.close();
});

test("TEST 12 : achat remboursé → commission annulée, historique conservé", async ({ browser, page, context }) => {
  const admin = await testDb().user.findFirstOrThrow({ where: { email: ADMIN_EMAIL } });
  const target = (await commissionsOf(referrer.userId)).find((c) => c.status === "VALID")!;
  const adminCtx = await browser.newContext({ baseURL: BASE_URL });
  await acceptCookies(adminCtx);
  await loginAs(adminCtx, admin.id, BASE_URL);
  const adminPage = await adminCtx.newPage();
  await gotoReady(adminPage, `/fr/admin/commissions?paiement=${target.paymentId}`);
  await adminPage.getByPlaceholder("Motif (ex. achat remboursé)").fill("Achat remboursé (test)");
  await adminPage.getByRole("button", { name: "Annuler (remboursement)" }).click();
  await expect(adminPage.getByText("Commission annulée et inscrite au journal.")).toBeVisible();
  await adminCtx.close();

  const after = await testDb().referralCommission.findUniqueOrThrow({ where: { id: target.id } });
  expect(after.status).toBe("CANCELLED");
  expect(after.cancelReason).toBe("Achat remboursé (test)");
  await loginAs(context, referrer.userId, BASE_URL);
  const { value } = await stats(page);
  await expect(value("Total gagné")).toContainText("600 FCFA");
  await expect(page.getByText("Annulé (achat remboursé)")).toBeVisible();
});

test("suppression du compte : refusée si retrait en attente, avertissement si gains, traces conservées", async ({ page, context }) => {
  const user = await createUser("Supprime Test");
  await testDb().user.update({ where: { id: user.userId }, data: { referralCode: `SUPP${Date.now() % 100000}` } });
  const commission = await testDb().referralCommission.create({ data: { referrerId: user.userId, documentType: "CV", amountFcfa: 800 } });
  const withdrawal = await testDb().withdrawalRequest.create({ data: { userId: user.userId, userCode: "SUPPTEST", amountFcfa: 500, method: "MTN_MOMO", phoneNumber: "+237677000001" } });
  await loginAs(context, user.userId, BASE_URL);

  // 1. Retrait en attente : refus décidé par le serveur, message affiché.
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.message());
    void d.accept();
  });
  await gotoReady(page, "/fr/tableau-de-bord");
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(page.getByText("Votre demande de retrait est actuellement en cours de traitement.", { exact: false })).toBeVisible();
  expect(await testDb().user.count({ where: { id: user.userId } })).toBe(1);

  // 2. Retrait payé, 300 FCFA encore disponibles : avertissement, puis suppression.
  await testDb().withdrawalRequest.update({ where: { id: withdrawal.id }, data: { status: "PAID", processedAt: new Date() } });
  await gotoReady(page, "/fr/tableau-de-bord");
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(page).toHaveURL(/\/fr$/);
  expect(dialogs.at(-1)).toContain("Vous avez actuellement 300 FCFA de gains disponibles.");
  expect(await testDb().user.count({ where: { id: user.userId } })).toBe(0);

  // 3. Traces financières conservées, détachées du compte.
  const kept = await testDb().withdrawalRequest.findUniqueOrThrow({ where: { id: withdrawal.id } });
  expect(kept.userId).toBeNull();
  expect(kept.userCode).toBe("SUPPTEST");
  expect(kept.status).toBe("PAID");
  expect((await testDb().referralCommission.findUniqueOrThrow({ where: { id: commission.id } })).referrerId).toBeNull();
  await testDb().withdrawalRequest.delete({ where: { id: withdrawal.id } });
  await testDb().referralCommission.delete({ where: { id: commission.id } });
});
