import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Phases 7 et 8 (MonEmploiGo Pro) : « Mon abonnement », paiement Pro Starter
// et activation côté serveur (passerelle simulée : PAYMENT_MODE=mock, voir
// playwright.config.ts). Chaque scénario vérifie la base, pas seulement
// l'affichage.

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.skip(({ isMobile }) => isMobile, "parcours joué une fois, sur ordinateur");
test.afterAll(deleteTestUsers);
test.slow();

async function period(accountId: string, startOffsetDays: number) {
  const startsAt = new Date(Date.now() + startOffsetDays * DAY);
  return testDb().subscription.create({
    data: { professionalAccountId: accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY) },
  });
}

async function pay(page: import("@playwright/test").Page) {
  await page.goto("/fr/pro/abonnement");
  await page.getByLabel("J'ai lu le récapitulatif et la règle de remboursement ci-dessus.").check();
  await page.getByRole("button", { name: "Payer 5 000 FCFA avec Mobile Money" }).click();
}

test("première activation : récapitulatif, case obligatoire, période de 30 jours, trace conservée", async ({ page, context }) => {
  const pro = await createProUser("Agence Abonnement");
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/dashboard");
  await page.getByRole("link", { name: "Activer Pro Starter" }).click();
  await expect(page).toHaveURL(/\/fr\/pro\/abonnement$/);

  const recap = page.getByRole("region", { name: "Récapitulatif avant paiement" });
  await expect(recap.getByText("5 000 FCFA (XAF) / 30 jours")).toBeVisible();
  await expect(recap.getByText("Règle de remboursement (CGU Pro, article 12)")).toBeVisible();
  await expect(recap.getByText("Sans renouvellement automatique.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Historique des paiements" })).toContainText("Aucun paiement pour le moment.");
  await expectNoHorizontalScroll(page);

  // Sans la case, le navigateur bloque l'envoi : aucun paiement créé.
  await page.getByRole("button", { name: "Payer 5 000 FCFA avec Mobile Money" }).click();
  expect(await testDb().payment.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);

  const before = Date.now();
  await pay(page);
  await expect(page.getByText("Actif", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Historique des paiements" })).toContainText("Confirmé");

  const subs = await testDb().subscription.findMany({ where: { professionalAccountId: pro.accountId } });
  expect(subs).toHaveLength(1);
  expect(subs[0].paymentId).not.toBeNull();
  expect(subs[0].priceFcfa).toBe(5000);
  expect(subs[0].startsAt.getTime()).toBeGreaterThanOrEqual(before - 60_000);
  expect(subs[0].expiresAt.getTime() - subs[0].startsAt.getTime()).toBe(30 * DAY);

  const payment = await testDb().payment.findUniqueOrThrow({ where: { id: subs[0].paymentId! } });
  expect(payment).toMatchObject({ kind: "PRO_SUBSCRIPTION", status: "SUCCESS", amountFcfa: 5000, documentId: null });
  const record = await testDb().proPaymentRecord.findUniqueOrThrow({ where: { paymentId: payment.id } });
  expect(record).toMatchObject({ status: "SUCCESS", amountFcfa: 5000, currency: "XAF", plan: "PRO_STARTER", companyName: "Agence Abonnement" });
  // Abonnement Pro exclu du parrainage.
  expect(await testDb().referralCommission.count({ where: { paymentId: payment.id } })).toBe(0);

  // Le tableau de bord débloque « Nouveau candidat ».
  await page.goto("/fr/pro/dashboard");
  await expect(page.getByRole("link", { name: "Nouveau candidat" }).first()).toBeVisible();
  await expect(page.getByText("Abonnement requis")).toHaveCount(0);
});

test("renouvellement anticipé : la nouvelle période commence à la fin de l'actuelle, sans perte de jours", async ({ page, context }) => {
  const pro = await createProUser("Agence Anticipée");
  const current = await period(pro.accountId, -20);
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/abonnement");
  await expect(page.getByRole("heading", { name: "Renouveler Pro Starter" })).toBeVisible();
  await pay(page);
  await expect(page.getByRole("region", { name: "Historique des paiements" })).toContainText("Confirmé");

  const renewal = await testDb().subscription.findFirstOrThrow({ where: { professionalAccountId: pro.accountId, paymentId: { not: null } } });
  expect(renewal.startsAt.getTime()).toBe(current.expiresAt.getTime());
  expect(renewal.expiresAt.getTime()).toBe(current.expiresAt.getTime() + 30 * DAY);
});

test("renouvellement après expiration : la période commence à la confirmation, accès complet rétabli", async ({ page, context }) => {
  const pro = await createProUser("Agence Expirée");
  await period(pro.accountId, -40);
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/abonnement");
  await expect(page.getByText("Votre espace est en lecture seule", { exact: false })).toBeVisible();
  const before = Date.now();
  await pay(page);
  await expect(page.getByText("Actif", { exact: true }).first()).toBeVisible();
  const renewal = await testDb().subscription.findFirstOrThrow({ where: { professionalAccountId: pro.accountId, paymentId: { not: null } } });
  expect(renewal.startsAt.getTime()).toBeGreaterThanOrEqual(before - 60_000);
});

test("confirmation reçue plusieurs fois : une seule période ; retour vers « Mon abonnement »", async ({ page, context }) => {
  const pro = await createProUser("Agence Retour");
  const payment = await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING", providerRef: "MOCK-AMOUNT-5000-retour" },
  });
  await loginAs(context, pro.userId, BASE_URL);
  await Promise.all([page.request.get(`/fr/paiement/retour?ref=${payment.id}`), page.request.get(`/fr/paiement/retour?ref=${payment.id}`)]);
  await page.goto(`/fr/paiement/retour?ref=${payment.id}`);
  await expect(page).toHaveURL(/\/fr\/pro\/abonnement\?paiement=confirme$/);
  await expect(page.getByText("Paiement confirmé : votre abonnement Pro Starter est actif", { exact: false })).toBeVisible();
  expect(await testDb().subscription.count({ where: { professionalAccountId: pro.accountId } })).toBe(1);
});

test("montant différent de 5 000 FCFA : paiement refusé, aucune période activée", async ({ page, context }) => {
  const pro = await createProUser("Agence Montant");
  const payment = await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING", providerRef: "MOCK-AMOUNT-4000-montant" },
  });
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto(`/fr/paiement/retour?ref=${payment.id}`);
  await expect(page).toHaveURL(/\/fr\/pro\/abonnement\?paiement=echec$/);
  expect((await testDb().payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("FAILED");
  expect(await testDb().subscription.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
});

test("paiement en cours de confirmation : pas de second paiement possible ; échec → aucun abonnement", async ({ page, context }) => {
  const pro = await createProUser("Agence En Cours");
  await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING", providerRef: "MOCK-PROCESSING-1" },
  });
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/abonnement");
  await expect(page.getByText("Votre paiement est en cours de confirmation", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Payer/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Disponible dans|Annuler ce paiement/ })).toBeVisible();

  const failedPro = await createProUser("Agence Échec");
  const failed = await testDb().payment.create({
    data: { userId: failedPro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: failedPro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING", providerRef: "MOCK-FAILED-1" },
  });
  await loginAs(context, failedPro.userId, BASE_URL);
  await page.goto(`/fr/paiement/retour?ref=${failed.id}`);
  await expect(page).toHaveURL(/\/fr\/pro\/abonnement\?paiement=echec$/);
  await expect(page.getByText("Le paiement n'a pas abouti. Aucun abonnement n'a été activé.")).toBeVisible();
  expect(await testDb().subscription.count({ where: { professionalAccountId: failedPro.accountId } })).toBe(0);
  expect((await testDb().proPaymentRecord.findUniqueOrThrow({ where: { paymentId: failed.id } })).status).toBe("FAILED");
});

test("isolation : l'historique et le retour de paiement d'une structure sont invisibles pour une autre", async ({ page, context }) => {
  const owner = await createProUser("Agence Propriétaire");
  await loginAs(context, owner.userId, BASE_URL);
  await pay(page);
  await expect(page.getByRole("region", { name: "Historique des paiements" })).toContainText("Confirmé");
  const ownerPayment = await testDb().payment.findFirstOrThrow({ where: { professionalAccountId: owner.accountId } });

  const other = await createProUser("Agence Voisine");
  await loginAs(context, other.userId, BASE_URL);
  await page.goto("/fr/pro/abonnement");
  await expect(page.getByRole("region", { name: "Historique des paiements" })).toContainText("Aucun paiement pour le moment.");
  await expect(page.getByText(ownerPayment.id)).toHaveCount(0);
  await page.goto(`/fr/paiement/retour?ref=${ownerPayment.id}`);
  await expect(page).not.toHaveURL(/abonnement/);
});
