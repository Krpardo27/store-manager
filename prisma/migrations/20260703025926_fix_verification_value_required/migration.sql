/*
  Warnings:

  - Made the column `value` on table `verifications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "verifications" ALTER COLUMN "value" SET NOT NULL;
