-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "attachmentUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
