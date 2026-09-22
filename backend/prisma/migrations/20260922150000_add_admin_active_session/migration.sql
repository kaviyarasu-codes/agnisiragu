-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "activeSessionId" TEXT;
ALTER TABLE "Admin" ADD COLUMN "activeSessionDevice" TEXT;
ALTER TABLE "Admin" ADD COLUMN "activeSessionIp" TEXT;
ALTER TABLE "Admin" ADD COLUMN "activeSessionAt" TIMESTAMP(3);
