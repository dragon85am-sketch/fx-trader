CREATE TABLE IF NOT EXISTS "FxScannerTrade" (
  "id" TEXT NOT NULL,
  "instrument" TEXT NOT NULL,
  "storageSymbol" TEXT NOT NULL,
  "tf" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "confirmation" INTEGER NOT NULL DEFAULT 4,
  "signalTime" TIMESTAMP(3) NOT NULL,
  "entry" DOUBLE PRECISION NOT NULL,
  "sl" DOUBLE PRECISION NOT NULL,
  "tp1" DOUBLE PRECISION NOT NULL,
  "tp2" DOUBLE PRECISION NOT NULL,
  "tp3" DOUBLE PRECISION NOT NULL,
  "rr" DOUBLE PRECISION NOT NULL DEFAULT 2,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "tp1Hit" BOOLEAN NOT NULL DEFAULT false,
  "tp2Hit" BOOLEAN NOT NULL DEFAULT false,
  "tp3Hit" BOOLEAN NOT NULL DEFAULT false,
  "telegramSignal" BOOLEAN NOT NULL DEFAULT false,
  "telegramClosed" BOOLEAN NOT NULL DEFAULT false,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FxScannerTrade_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FxScannerTrade_storageSymbol_tf_side_signalTime_key" ON "FxScannerTrade"("storageSymbol","tf","side","signalTime");
CREATE INDEX IF NOT EXISTS "FxScannerTrade_status_openedAt_idx" ON "FxScannerTrade"("status","openedAt");
CREATE INDEX IF NOT EXISTS "FxScannerTrade_instrument_tf_status_idx" ON "FxScannerTrade"("instrument","tf","status");
