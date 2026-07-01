-- ============================================================
-- Agnisiragu — Neon Migration
-- Run this in Neon SQL Editor (one statement at a time if needed)
-- ============================================================

-- 1. Expand AdminRole enum with new team roles
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'EDITOR_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'EDITOR_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'VERIFICATION_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'VERIFICATION_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'REPORTER_APP_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'REPORTER_APP_MEMBER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'REPORTERS_MANAGER';
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'REPORTERS_MEMBER';

-- 2. Add new columns to Admin table
ALTER TABLE "Admin"
  ADD COLUMN IF NOT EXISTS "isActive"  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "phone"     TEXT,
  ADD COLUMN IF NOT EXISTS "teamType"  TEXT;

-- 3. Create MediaFile table
CREATE TABLE IF NOT EXISTS "MediaFile" (
  "id"        TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "filename"  TEXT         NOT NULL,
  "url"       TEXT         NOT NULL,
  "publicId"  TEXT         NOT NULL,
  "mimeType"  TEXT         NOT NULL,
  "size"      INTEGER      NOT NULL DEFAULT 0,
  "adminId"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaFile_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "Admin"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. Create AppConfig table
CREATE TABLE IF NOT EXISTS "AppConfig" (
  "id"        TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "key"       TEXT         NOT NULL,
  "value"     JSONB        NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppConfig_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "AppConfig_key_key"  UNIQUE ("key")
);
