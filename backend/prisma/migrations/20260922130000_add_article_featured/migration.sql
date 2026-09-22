-- AlterTable
ALTER TABLE "Article" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Article" ADD COLUMN "featuredOrder" INTEGER;

-- Speeds up the homepage-picks query (WHERE isFeatured ORDER BY featuredOrder)
CREATE INDEX "Article_isFeatured_featuredOrder_idx" ON "Article"("isFeatured", "featuredOrder");
