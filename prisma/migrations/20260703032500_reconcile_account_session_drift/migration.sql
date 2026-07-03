-- Reconcile drift introduced by prisma db push for Better Auth compatibility.
-- Keep this migration to align migration history with the current database schema.

ALTER TABLE "accounts"
ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP(3);

DROP INDEX IF EXISTS "sessions_sessionId_key";

ALTER TABLE "sessions"
DROP COLUMN IF EXISTS "sessionId";
