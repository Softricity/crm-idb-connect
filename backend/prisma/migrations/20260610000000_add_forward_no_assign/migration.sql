-- AlterTable: add forward_no_assign to departments
ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "forward_no_assign" BOOLEAN NOT NULL DEFAULT false;
