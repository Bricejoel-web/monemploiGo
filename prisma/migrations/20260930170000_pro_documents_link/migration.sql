-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "candidateId" TEXT,
ADD COLUMN     "professionalAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Document_professionalAccountId_idx" ON "Document"("professionalAccountId");

-- CreateIndex
CREATE INDEX "Document_candidateId_idx" ON "Document"("candidateId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_professionalAccountId_fkey" FOREIGN KEY ("professionalAccountId") REFERENCES "ProfessionalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "ProfessionalCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

