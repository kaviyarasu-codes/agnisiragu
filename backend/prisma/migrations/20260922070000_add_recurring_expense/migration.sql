-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('DOMAIN', 'SERVER', 'OTHER');

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ExpenseType" NOT NULL DEFAULT 'OTHER',
    "provider" TEXT,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpense_renewalDate_idx" ON "RecurringExpense"("renewalDate");

-- AddForeignKey
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
