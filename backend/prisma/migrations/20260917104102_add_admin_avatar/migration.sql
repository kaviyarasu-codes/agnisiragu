/*
  Warnings:

  - You are about to drop the column `newsId` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `articleId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CardStyle" AS ENUM ('STANDARD', 'FULL_BLEED', 'NEWSPRINT');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "CtaType" AS ENUM ('WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('ADMOB', 'LOCAL', 'BOTH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminRole" ADD VALUE 'EDITOR_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'EDITOR_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE 'VERIFICATION_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'VERIFICATION_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE 'REPORTER_APP_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'REPORTER_APP_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE 'REPORTERS_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'REPORTERS_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE 'ADVERTISEMENT_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'LOCAL_ADS_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE 'ADMOB_MANAGER';

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_newsId_fkey";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "teamType" TEXT;

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "byline" TEXT,
ADD COLUMN     "cardStyle" "CardStyle" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "commentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dislikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "searchText" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "device" TEXT;

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "newsId",
ADD COLUMN     "articleId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalAd" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "adType" "AdType" NOT NULL,
    "mediaUrl" TEXT,
    "carousel" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "targetAudience" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "ctaType" "CtaType" NOT NULL,
    "ctaValue" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL DEFAULT 'BOTH',
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocalAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTa" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#CC1F2D',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Team_type_key" ON "Team"("type");

-- CreateIndex
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalAd" ADD CONSTRAINT "LocalAd_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
