"""FX TRADE MT5 history staging importer. DRY RUN by default; --apply requires psycopg and explicit approval.

Does NOT touch MarketCandle. Does NOT connect to DB in dry-run mode.
"""
import argparse
import csv
import hashlib
import io
import math
import os
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

CUTOFF = datetime(2026, 9, 23, tzinfo=timezone.utc)
TABLE = 'public."MarketCandleHistoryMT5"'

def load_rows(archive):
    rows = []
    counts = {}
    with zipfile.ZipFile(archive) as z:
        names = sorted(n for n in z.namelist() if n.upper().endswith('_D1_MT5.CSV'))
        if not names:
            raise ValueError('No *_D1_MT5.csv files in ZIP')
        for name in names:
            symbol = Path(name).name.split('_')[0].upper()
            if symbol not in ('EURUSD', 'USDJPY', 'XAUUSD'):
                raise ValueError(f'Unexpected symbol {symbol}; refusing import')
            reader = csv.DictReader(io.StringIO(z.read(name).decode('utf-8-sig')))
            required = {'time_utc','open','high','low','close','tick_volume'}
            if not required.issubset(reader.fieldnames or []):
                raise ValueError(f'{name}: missing columns')
            count = {'read':0,'candidates':0,'weekend':0,'recent':0}
            seen = set()
            for line, r in enumerate(reader, 2):
                count['read'] += 1
                try:
                    ts = datetime.fromisoformat(r['time_utc'].replace('Z','+00:00'))
                    if ts.tzinfo is None or ts.utcoffset().total_seconds()!=0 or (ts.hour,ts.minute,ts.second,ts.microsecond)!=(0,0,0,0):
                        raise ValueError('invalid UTC day bucket')
                    if ts in seen: raise ValueError('duplicate timestamp')
                    seen.add(ts)
                    o,h,l,c = [float(r[k]) for k in ('open','high','low','close')]
                    vol = int(r['tick_volume'])
                    if not all(math.isfinite(x) for x in (o,h,l,c)) or not (0 < l <= min(o,c) <= max(o,c) <= h) or not 0<=vol<=2147483647:
                        raise ValueError('invalid OHLC/volume')
                except (ValueError,TypeError,OverflowError) as e:
                    raise ValueError(f'{name}:{line}: {e}') from e
                if ts.weekday()>=5:
                    count['weekend']+=1; continue
                if ts>=CUTOFF:
                    count['recent']+=1; continue
                ident='mt5_'+hashlib.sha256(f'{symbol}|1day|{ts.isoformat()}'.encode()).hexdigest()[:32]
                rows.append((ident,symbol,'1day',ts,o,h,l,c,vol,'MT5'))
                count['candidates']+=1
            counts[symbol]=count
    return rows, counts

def apply(rows, database_url, ca_path):
    try:
        import psycopg
    except ImportError as e:
        raise RuntimeError('Install psycopg: python -m pip install "psycopg[binary]"') from e
    if not database_url: raise RuntimeError('Missing D1_BACKFILL_DATABASE_URL')
    if not ca_path or not Path(ca_path).is_file(): raise RuntimeError('Set D1_BACKFILL_CA_PATH to a trusted Supabase CA certificate file')
    # Use TLS certificate validation and never disable SSL verification.
    from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit
    parts=urlsplit(database_url)
    if parts.scheme not in ('postgres','postgresql'): raise RuntimeError('Invalid database URL')
    params=dict(parse_qsl(parts.query)); params.pop('sslmode',None); params.pop('sslrootcert',None)
    safe_url=urlunsplit((parts.scheme,parts.netloc,parts.path,urlencode(params),parts.fragment))
    inserted=0
    with psycopg.connect(safe_url, sslmode='verify-full', sslrootcert=str(Path(ca_path).resolve()), connect_timeout=20) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT to_regclass(%s)', ('public."MarketCandleHistoryMT5"',))
            if cur.fetchone()[0] is None: raise RuntimeError('Staging table does not exist')
            for row in rows:
                cur.execute('''INSERT INTO public."MarketCandleHistoryMT5"
                  (id,symbol,interval,bucket,open,high,low,close,ticks,source)
                  VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                  ON CONFLICT (symbol,interval,bucket) DO NOTHING''',row)
                inserted += cur.rowcount
        conn.commit()
    return inserted

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('zipfile', nargs='?', default='swiece d1.zip')
    p.add_argument('--apply', action='store_true', help='Write to separate MT5 staging table; requires licensing and session review')
    args=p.parse_args()
    try:
        rows,counts=load_rows(Path(args.zipfile))
        for symbol, count in counts.items(): print(symbol,count)
        print('TOTAL CANDIDATES:',len(rows))
        if not args.apply:
            print('DRY RUN — no database connection; no writes. To apply later, obtain broker licensing approval and review D1 session alignment.')
        else:
            if os.getenv('MT5_HISTORY_IMPORT_APPROVED')!='YES':
                raise RuntimeError('Apply blocked: set MT5_HISTORY_IMPORT_APPROVED=YES only after explicit approval of license and session rules')
            n=apply(rows,os.getenv('D1_BACKFILL_DATABASE_URL'),os.getenv('D1_BACKFILL_CA_PATH'))
            print('Inserted into MT5 staging table:',n)
    except Exception as e:
        print('ERROR:',e,file=sys.stderr)
        sys.exit(1)
