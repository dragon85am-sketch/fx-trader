-- CreateTable
CREATE TABLE "DashboardStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "conversion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availablePayout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardStat_userId_key" ON "DashboardStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateStat_userId_key" ON "AffiliateStat"("userId");

-- AddForeignKey
ALTER TABLE "DashboardStat" ADD CONSTRAINT "DashboardStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateStat" ADD CONSTRAINT "AffiliateStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
