/*
  Warnings:

  - You are about to drop the `CoverLetterTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CvTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `coverLetterTemplateId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `cvTemplateId` on the `Document` table. All the data in the column will be lost.
  - Added the required column `templateSlug` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CoverLetterTemplate_slug_key";

-- DropIndex
DROP INDEX "CvTemplate_category_idx";

-- DropIndex
DROP INDEX "CvTemplate_slug_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CoverLetterTemplate";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CvTemplate";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "includePhoto" BOOLEAN NOT NULL DEFAULT false,
    "photoDataUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("contentJson", "createdAt", "id", "includePhoto", "photoDataUrl", "status", "title", "type", "updatedAt", "userId") SELECT "contentJson", "createdAt", "id", "includePhoto", "photoDataUrl", "status", "title", "type", "updatedAt", "userId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
