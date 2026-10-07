CREATE TABLE IF NOT EXISTS "FxScannerReadySetup" (
  "id" TEXT NOT NULL,
  "instrument" TEXT NOT NULL,
  "storageSymbol" TEXT NOT NULL,
  "tf" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "signalTime" TIMESTAMP(3) NOT NULL,
  "entry" DOUBLE PRECISION NOT NULL,
  "sl" DOUBLE PRECISION NOT NULL,
  "tp1" DOUBLE PRECISION NOT NULL,
  "tp2" DOUBLE PRECISION NOT NULL,
  "tp3" DOUBLE PRECISION NOT NULL,
  "rr" DOUBLE PRECISION NOT NULL DEFAULT 2,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FxScannerReadySetup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FxScannerReadySetup_storageSymbol_tf_key" ON "FxScannerReadySetup"("storageSymbol", "tf");
CREATE INDEX IF NOT EXISTS "FxScannerReadySetup_instrument_tf_idx" ON "FxScannerReadySetup"("instrument", "tf");
CREATE INDEX IF NOT EXISTS "FxScannerReadySetup_updatedAt_idx" ON "FxScannerReadySetup"("updatedAt");
