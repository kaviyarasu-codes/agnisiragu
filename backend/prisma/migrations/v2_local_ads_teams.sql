-- ============================================================
-- Agnisiragu v2 Migration — Run this on Neon SQL console
-- Adds: device column, new roles, LocalAd table, Team table
-- ============================================================

-- 1. New AdminRole enum values
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'ADVERTISEMENT_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'LOCAL_ADS_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'ADMOB_MANAGER';

-- 2. Add phone column to Admin (if not exists)
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 3. Add device column to AuditLog (if not exists)
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "device" TEXT;

-- 4. Create AdType enum
DO $$ BEGIN
  CREATE TYPE "AdType" AS ENUM ('IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create CtaType enum
DO $$ BEGIN
  CREATE TYPE "CtaType" AS ENUM ('WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Create AdStatus enum
DO $$ BEGIN
  CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Create AdPlacement enum
DO $$ BEGIN
  CREATE TYPE "AdPlacement" AS ENUM ('ADMOB', 'LOCAL', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Create LocalAd table
CREATE TABLE IF NOT EXISTS "LocalAd" (
  "id"             TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT         NOT NULL,
  "description"    TEXT,
  "adType"         "AdType"     NOT NULL DEFAULT 'IMAGE',
  "mediaUrl"       TEXT,
  "carousel"       JSONB,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "categoryId"     TEXT,
  "targetAudience" TEXT,
  "priority"       INTEGER      NOT NULL DEFAULT 50,
  "status"         "AdStatus"   NOT NULL DEFAULT 'DRAFT',
  "ctaType"        "CtaType"    NOT NULL DEFAULT 'WHATSAPP',
  "ctaValue"       TEXT         NOT NULL,
  "placement"      "AdPlacement" NOT NULL DEFAULT 'LOCAL',
  "clickCount"     INTEGER      NOT NULL DEFAULT 0,
  "impressions"    INTEGER      NOT NULL DEFAULT 0,
  "adminId"        TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocalAd_pkey" PRIMARY KEY ("id")
);

-- 9. Create Team table
CREATE TABLE IF NOT EXISTS "Team" (
  "id"          TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT         NOT NULL,
  "nameTa"      TEXT,
  "type"        TEXT         NOT NULL,
  "description" TEXT,
  "color"       TEXT         NOT NULL DEFAULT '#6366f1',
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Team_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "Team_type_key"  UNIQUE ("type")
);

-- 10. Foreign key: LocalAd → Admin (optional, skip if Admin table name differs)
DO $$ BEGIN
  ALTER TABLE "LocalAd" ADD CONSTRAINT "LocalAd_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 11. Indexes for performance
CREATE INDEX IF NOT EXISTS "LocalAd_status_idx"    ON "LocalAd"("status");
CREATE INDEX IF NOT EXISTS "LocalAd_placement_idx" ON "LocalAd"("placement");
CREATE INDEX IF NOT EXISTS "LocalAd_adminId_idx"   ON "LocalAd"("adminId");
CREATE INDEX IF NOT EXISTS "Team_type_idx"          ON "Team"("type");
CREATE INDEX IF NOT EXISTS "Team_isActive_idx"      ON "Team"("isActive");

-- Done! ✓
SELECT 'Migration v2 applied successfully' AS result;
