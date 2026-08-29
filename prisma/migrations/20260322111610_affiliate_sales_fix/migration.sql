-- CreateTable
CREATE TABLE "AffiliateSale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateSale_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AffiliateSale" ADD CONSTRAINT "AffiliateSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
