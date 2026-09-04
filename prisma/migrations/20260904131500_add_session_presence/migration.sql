CREATE TABLE "SessionPresence" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionPresence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SessionPresence_userId_key" ON "SessionPresence"("userId");
CREATE INDEX "SessionPresence_lastSeen_idx" ON "SessionPresence"("lastSeen");
ALTER TABLE "SessionPresence" ADD CONSTRAINT "SessionPresence_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
