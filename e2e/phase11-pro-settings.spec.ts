import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, proEnabled } from "./helpers";
import { DB_WRITES_SKIP_REASON, createProUser, dbWritesAllowed, deleteTestUsers, loginAs, testDb } from "./db";

// Rubrique « Paramètres » de l'espace Pro : informations de la structure et
// « Supprimer mon espace professionnel » (CGU Pro, article 16).

const DAY = 24 * 60 * 60 * 1000;
const BASE_URL = "http://localhost:3100";

test.skip(!proEnabled, "Pro désactivé");
test.skip(!dbWritesAllowed, DB_WRITES_SKIP_REASON);
test.afterAll(deleteTestUsers);
test.slow();

test("informations de la structure : modification, valeurs refusées, chaque structure ne modifie que la sienne", async ({ page, context, isMobile }) => {
  const pro = await createProUser("Agence Paramètres");
  const other = await createProUser("Agence Intouchable");
  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/parametres");
  await expect(page.getByRole("heading", { name: "Paramètres", level: 1 })).toBeVisible();
  await expectNoHorizontalScroll(page);
  if (isMobile) return;

  await page.getByLabel("Téléphone").fill("pas un numéro");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Numéro de téléphone invalide", { exact: false })).toBeVisible();

  await page.getByLabel("Nom de la structure").fill("Agence Renommée");
  await page.getByLabel("Téléphone").fill("+237 699 11 22 33");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
  const saved = await testDb().professionalAccount.findUniqueOrThrow({ where: { id: pro.accountId } });
  expect(saved).toMatchObject({ companyName: "Agence Renommée", phone: "+237 699 11 22 33" });
  expect((await testDb().professionalAccount.findUniqueOrThrow({ where: { id: other.accountId } })).companyName).toBe("Agence Intouchable");

  await page.goto("/fr/pro/dashboard");
  await expect(page.getByRole("heading", { name: "Bonjour, Agence Renommée" })).toBeVisible();
});

test("suppression de l'espace : confirmation exigée, bloquée pendant un paiement, puis définitive avec traces conservées", async ({ page, context, isMobile }) => {
  test.skip(isMobile, "parcours joué une fois, sur ordinateur");
  const pro = await createProUser("Agence Supprimée");
  const startsAt = new Date(Date.now() - 2 * DAY);
  await testDb().subscription.create({ data: { professionalAccountId: pro.accountId, priceFcfa: 5000, startsAt, expiresAt: new Date(startsAt.getTime() + 30 * DAY) } });
  const candidate = await testDb().professionalCandidate.create({ data: { professionalAccountId: pro.accountId, firstName: "Awa", lastName: "Candidate" } });
  await testDb().document.create({
    data: { userId: pro.userId, professionalAccountId: pro.accountId, candidateId: candidate.id, type: "COVER_LETTER", templateSlug: "classique", title: "Lettre", contentJson: "{}" },
  });
  // Document particulier du même compte : il doit survivre.
  const personal = await testDb().document.create({ data: { userId: pro.userId, type: "COVER_LETTER", templateSlug: "classique", title: "Ma lettre", contentJson: "{}" } });
  // Paiement Pro confirmé : sa trace doit survivre.
  const paid = await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "SUCCESS", providerRef: "MOCK-ancien" },
  });
  await testDb().proPaymentRecord.create({ data: { paymentId: paid.id, providerRef: "MOCK-ancien", amountFcfa: 5000, status: "SUCCESS", companyName: "Agence Supprimée" } });

  await loginAs(context, pro.userId, BASE_URL);
  await page.goto("/fr/pro/parametres");
  await page.getByRole("link", { name: "Supprimer mon espace professionnel" }).click();
  await expect(page.getByText("vos candidats (1) et leurs documents (1) seront supprimés", { exact: false })).toBeVisible();
  await expect(page.getByText("votre compte MonEmploiGo particulier n'est pas supprimé", { exact: false })).toBeVisible();
  await expect(page.getByText("sera perdue, sous réserve de l'article 12", { exact: false })).toBeVisible();

  // Paiement d'abonnement en cours de confirmation : suppression refusée.
  const processing = await testDb().payment.create({
    data: { userId: pro.userId, kind: "PRO_SUBSCRIPTION", professionalAccountId: pro.accountId, provider: "NOTCHPAY", amountFcfa: 5000, status: "PENDING", providerRef: "MOCK-PROCESSING-suppr" },
  });
  await page.getByLabel("Je comprends que la suppression de mon espace professionnel", { exact: false }).check();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/erreur=paiement$/);
  await expect(page.getByText("Un paiement d'abonnement est en cours de confirmation.", { exact: false })).toBeVisible();
  expect(await testDb().professionalAccount.count({ where: { id: pro.accountId } })).toBe(1);

  await testDb().payment.update({ where: { id: processing.id }, data: { status: "FAILED" } });
  await page.getByLabel("Je comprends que la suppression de mon espace professionnel", { exact: false }).check();
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await expect(page).toHaveURL(/\/fr\/tableau-de-bord\?espace-pro=supprime$/);
  await expect(page.getByText("Votre espace professionnel a été supprimé.", { exact: false })).toBeVisible();

  expect(await testDb().professionalAccount.count({ where: { id: pro.accountId } })).toBe(0);
  expect(await testDb().professionalCandidate.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
  expect(await testDb().document.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
  expect(await testDb().subscription.count({ where: { professionalAccountId: pro.accountId } })).toBe(0);
  expect(await testDb().user.count({ where: { id: pro.userId } })).toBe(1);
  expect(await testDb().document.count({ where: { id: personal.id } })).toBe(1);
  expect((await testDb().proPaymentRecord.findUniqueOrThrow({ where: { paymentId: paid.id } })).companyName).toBe("Agence Supprimée");

  // L'espace Pro n'existe plus : retour à la création d'espace.
  await page.goto("/fr/pro/dashboard");
  await expect(page).toHaveURL(/\/fr\/pro\/inscription$/);
});
