-- Abonnement Pro : objet du paiement, période reliée à son paiement (unique),
-- traces de paiement Pro conservées et avertissements d'expiration envoyés.
-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('DOCUMENT', 'PRO_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "ProExpiryNoticeKind" AS ENUM ('EXPIRED', 'DELETION_IN_30_DAYS', 'DELETION_IN_7_DAYS');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN     "professionalAccountId" TEXT;

-- CreateTable
CREATE TABLE "ProPaymentRecord" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "providerRef" TEXT,
    "amountFcfa" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" "PaymentStatus" NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PRO_STARTER',
    "companyName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProPaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProExpiryNotice" (
    "id" TEXT NOT NULL,
    "professionalAccountId" TEXT NOT NULL,
    "kind" "ProExpiryNoticeKind" NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProExpiryNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProPaymentRecord_paymentId_key" ON "ProPaymentRecord"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProExpiryNotice_professionalAccountId_kind_expiredAt_key" ON "ProExpiryNotice"("professionalAccountId", "kind", "expiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentId_key" ON "Subscription"("paymentId");

-- CreateIndex
CREATE INDEX "Payment_professionalAccountId_idx" ON "Payment"("professionalAccountId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_professionalAccountId_fkey" FOREIGN KEY ("professionalAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProExpiryNotice" ADD CONSTRAINT "ProExpiryNotice_professionalAccountId_fkey" FOREIGN KEY ("professionalAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

