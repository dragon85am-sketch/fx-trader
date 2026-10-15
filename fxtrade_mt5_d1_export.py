"""FX TRADE: read-only MT5 D1 export. Does not trade or write to database."""
from pathlib import Path
from datetime import datetime, timezone
import csv
import MetaTrader5 as mt5

SYMBOLS = ('EURUSD', 'XAUUSD', 'USDJPY')
CANDLES = 500
OUT = Path(__file__).resolve().parent / 'fxtrade_d1_csv'

def find_symbol(target):
    names = [s.name for s in (mt5.symbols_get() or [])]
    if target in names:
        return target
    candidates = [n for n in names if n.upper().startswith(target)]
    if len(candidates) == 1:
        return candidates[0]
    print(f'{target}: symbol not unambiguous. Candidates: {candidates[:12]}')
    return None

def main():
    if not mt5.initialize():
        raise RuntimeError(f'MT5 initialization failed: {mt5.last_error()}')
    try:
        info = mt5.account_info()
        if info is None:
            raise RuntimeError('MT5 terminal is not logged into an account')
        print('Connected to MT5. Export only; no trading.')
        OUT.mkdir(exist_ok=True)
        for target in SYMBOLS:
            symbol = find_symbol(target)
            if not symbol:
                continue
            if not mt5.symbol_select(symbol, True):
                print(f'{target}: unable to select {symbol}: {mt5.last_error()}')
                continue
            # Position 0 is the current, possibly unfinished D1 candle; exclude it.
            bars = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_D1, 1, CANDLES)
            if bars is None or len(bars) == 0:
                print(f'{target}: no data: {mt5.last_error()}')
                continue
            rows = []
            for b in bars:
                o, h, l, c = (float(b[k]) for k in ('open', 'high', 'low', 'close'))
                if not (l <= min(o, c) <= max(o, c) <= h and l > 0):
                    print(f'{target}: invalid OHLC, export aborted')
                    rows = []
                    break
                rows.append((datetime.fromtimestamp(int(b['time']), tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), o, h, l, c, int(b['tick_volume'])))
            if not rows:
                continue
            rows.sort(key=lambda r: r[0])
            filename = OUT / f'{target}_D1_MT5.csv'
            with filename.open('w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(('time_utc', 'open', 'high', 'low', 'close', 'tick_volume'))
                writer.writerows(rows)
            print(f'{target} ({symbol}): {len(rows)} candles, {rows[0][0]} -> {rows[-1][0]} | {filename}')
        print('Export completed. Files are local CSV; database unchanged.')
    finally:
        mt5.shutdown()

if __name__ == '__main__':
    main()
