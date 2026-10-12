-- Run once in Supabase SQL Editor. Independent of MarketCandle.
CREATE TABLE IF NOT EXISTS public."MarketDailyClose" (
  symbol text NOT NULL,
  day date NOT NULL,
  close double precision NOT NULL CHECK (close > 0),
  source text NOT NULL DEFAULT 'live-rates-historical',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, day)
);
CREATE INDEX IF NOT EXISTS "MarketDailyClose_day_idx" ON public."MarketDailyClose" (day DESC);
ALTER TABLE public."MarketDailyClose" ENABLE ROW LEVEL SECURITY;
-- No public policies: access only through server-side database credentials.
