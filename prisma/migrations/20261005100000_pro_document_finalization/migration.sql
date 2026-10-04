-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'FINALIZED';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "finalizedAt" TIMESTAMP(3);

