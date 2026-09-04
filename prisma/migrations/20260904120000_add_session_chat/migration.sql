CREATE TABLE "SessionMessage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SessionMessage_createdAt_idx" ON "SessionMessage"("createdAt");
CREATE INDEX "SessionMessage_userId_idx" ON "SessionMessage"("userId");
ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
