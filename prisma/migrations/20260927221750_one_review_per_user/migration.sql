-- DropIndex
DROP INDEX "Review_userId_documentId_key";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "publishConsent";

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_key" ON "Review"("userId");

