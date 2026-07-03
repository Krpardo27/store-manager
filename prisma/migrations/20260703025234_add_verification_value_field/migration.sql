/*
  Warnings:

  - You are about to drop the column `expires` on the `verifications` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "expires",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" TEXT;
