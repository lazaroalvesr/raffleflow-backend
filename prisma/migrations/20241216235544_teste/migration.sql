-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN     "drawRaffleId" TEXT,
ALTER COLUMN "drawDate" DROP NOT NULL;
