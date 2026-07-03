/*
  Warnings:

  - You are about to drop the column `token` on the `verifications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "verifications_identifier_token_key";

-- DropIndex
DROP INDEX "verifications_token_key";

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "token";

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");
