-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_documentId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- Documents déjà payés avant l'introduction de la durée de conservation :
-- leurs 3 semaines démarrent à la mise en service de la fonctionnalité,
-- pour ne jamais supprimer rétroactivement un document d'un client existant.
UPDATE "Document" SET "paidAt" = NOW() WHERE "status" = 'PAID' AND "paidAt" IS NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "documentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Document_status_paidAt_idx" ON "Document"("status", "paidAt");

-- CreateIndex
CREATE INDEX "Document_status_updatedAt_idx" ON "Document"("status", "updatedAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
