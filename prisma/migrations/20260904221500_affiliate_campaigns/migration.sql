ALTER TABLE "User" ADD COLUMN "referredByCampaignId" TEXT;
CREATE TABLE "AffiliateCampaign" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "slug" TEXT NOT NULL,
 "clicks" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "AffiliateCampaign_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AffiliateCampaign_userId_slug_key" ON "AffiliateCampaign"("userId","slug");
CREATE INDEX "AffiliateCampaign_userId_idx" ON "AffiliateCampaign"("userId");
ALTER TABLE "AffiliateCampaign" ADD CONSTRAINT "AffiliateCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
