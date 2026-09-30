-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('PRO_STARTER');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "professionalAccountId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PRO_STARTER',
    "priceFcfa" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "documentsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalCandidate" (
    "id" TEXT NOT NULL,
    "professionalAccountId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "destinationCountry" TEXT,
    "professionalField" TEXT,
    "applicationType" TEXT,
    "educationLevel" TEXT,
    "languages" TEXT,
    "germanLevel" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_professionalAccountId_expiresAt_idx" ON "Subscription"("professionalAccountId", "expiresAt");

-- CreateIndex
CREATE INDEX "ProfessionalCandidate_professionalAccountId_status_idx" ON "ProfessionalCandidate"("professionalAccountId", "status");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_professionalAccountId_fkey" FOREIGN KEY ("professionalAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCandidate" ADD CONSTRAINT "ProfessionalCandidate_professionalAccountId_fkey" FOREIGN KEY ("professionalAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

