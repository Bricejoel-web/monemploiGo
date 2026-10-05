-- DropForeignKey
ALTER TABLE "ReferralCommission" DROP CONSTRAINT "ReferralCommission_referrerId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_userId_fkey";

-- AlterTable
ALTER TABLE "ReferralCommission" ALTER COLUMN "referrerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WithdrawalRequest" ADD COLUMN     "userCode" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

