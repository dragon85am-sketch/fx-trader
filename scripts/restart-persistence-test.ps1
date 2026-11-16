param([ValidateSet('prepare','verify')][string]$Mode)
$ErrorActionPreference = 'Stop'
$container = 'fxtrade-postgres-test'
$db = 'fxtrade_restart_test'
$user = 'fxtrade_test'
$testId = 'FXTRADE-RESTART-TEST-001'

$running = docker inspect --format '{{.State.Running}}' $container 2>$null
if ($LASTEXITCODE -ne 0 -or $running -ne 'true') { throw 'STOP: Testowy kontener PostgreSQL nie jest uruchomiony.' }
$port = docker port $container 5432/tcp
if ($LASTEXITCODE -ne 0 -or $port -notmatch '127\.0\.0\.1:55432') { throw "STOP: Nieoczekiwany port: $port" }
$identity = docker exec $container psql -X -U $user -d $db -Atqc 'SELECT current_database(),current_user'
if ($LASTEXITCODE -ne 0 -or $identity.Trim() -ne 'fxtrade_restart_test|fxtrade_test') { throw "STOP: Nieoczekiwana baza: $identity" }

if ($Mode -eq 'prepare') {
$sql = @'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public."FxScannerTrade" WHERE id='FXTRADE-RESTART-TEST-001') THEN
    RAISE EXCEPTION 'Testowy rekord juz istnieje. Uruchom tryb verify.';
  END IF;
  INSERT INTO public."FxScannerTrade" (
    id, instrument, "storageSymbol", tf, side, "signalTime", entry, sl, tp1, tp2, tp3,
    status, "tp1Hit", "tp2Hit", "tp3Hit", "telegramSignal", "telegramClosed", "updatedAt"
  ) VALUES (
    'FXTRADE-RESTART-TEST-001','BTCUSD','BTCUSD','M1','BUY','2026-11-08T00:00:00Z',
    75000, 74900, 75100, 75200, 75300,
    'ACTIVE', true, false, false, false, false, CURRENT_TIMESTAMP
  );
END $$;
SELECT id,status,"tp1Hit",entry,sl,tp1,tp2 FROM public."FxScannerTrade" WHERE id='FXTRADE-RESTART-TEST-001';
'@
} else {
$sql = @'
DO $$
DECLARE r record; n integer;
BEGIN
  SELECT * INTO r FROM public."FxScannerTrade" WHERE id='FXTRADE-RESTART-TEST-001';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: Brak sygnalu po restarcie procesu'; END IF;
  IF r.status <> 'ACTIVE' OR r."tp1Hit" IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: Stan ACTIVE / TP1 nie zostal zachowany'; END IF;
  IF r.entry <> 75000 OR r.sl <> 74900 OR r.tp1 <> 75100 OR r.tp2 <> 75200 THEN RAISE EXCEPTION 'FAIL: Zmiana zamrozonych poziomow'; END IF;
  IF r."tp2Hit" OR r."tp3Hit" THEN RAISE EXCEPTION 'FAIL: Niespodziewany stan TP2/TP3'; END IF;
  SELECT count(*) INTO n FROM public."FxScannerTrade" WHERE "storageSymbol"='BTCUSD' AND tf='M1' AND side='BUY' AND "signalTime"='2026-11-08T00:00:00Z';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: Liczba rekordow sygnalu = %', n; END IF;
  RAISE NOTICE 'PASS: ACTIVE, TP1 HIT, Entry/SL/TP1/TP2 i brak duplikatow';
END $$;
SELECT id,status,"tp1Hit",entry,sl,tp1,tp2 FROM public."FxScannerTrade" WHERE id='FXTRADE-RESTART-TEST-001';
'@
}
$sql | docker exec -i $container psql -X -v ON_ERROR_STOP=1 -U $user -d $db
if ($LASTEXITCODE -ne 0) { throw 'FAIL: Test zakonczyl sie bledem.' }
Write-Host "PASS: $Mode" -ForegroundColor Green
