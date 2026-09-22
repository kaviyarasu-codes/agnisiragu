-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PENDING', 'PAID');

-- CreateTable
CREATE TABLE "AdminDailyActivity" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activeMinutes" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSalaryRecord" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSalaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRAccessGrant" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HRAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDailyActivity_date_idx" ON "AdminDailyActivity"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDailyActivity_adminId_date_key" ON "AdminDailyActivity"("adminId", "date");

-- CreateIndex
CREATE INDEX "AdminSalaryRecord_adminId_idx" ON "AdminSalaryRecord"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSalaryRecord_adminId_month_year_key" ON "AdminSalaryRecord"("adminId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "HRAccessGrant_adminId_key" ON "HRAccessGrant"("adminId");

-- AddForeignKey
ALTER TABLE "AdminDailyActivity" ADD CONSTRAINT "AdminDailyActivity_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSalaryRecord" ADD CONSTRAINT "AdminSalaryRecord_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSalaryRecord" ADD CONSTRAINT "AdminSalaryRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRAccessGrant" ADD CONSTRAINT "HRAccessGrant_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HRAccessGrant" ADD CONSTRAINT "HRAccessGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
