import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AlphaTradeRow = {
  id: string;
  instrument: string;
  tf: string;
  direction: "BUY" | "SELL";
  confidence: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
  priceAction: string;
  status: "ACTIVE" | "TP1_HIT" | "TP2_HIT" | "SL_HIT";
  openedAt: Date;
  tp1HitAt: Date | null;
  closedAt: Date | null;
  updatedAt: Date;
};

const OPEN_STATUSES = ["ACTIVE", "TP1_HIT"];

function jsonTrade(row: AlphaTradeRow | null) {
  if (!row) return null;
  return {
    ...row,
    openedAt: new Date(row.openedAt).toISOString(),
    tp1HitAt: row.tp1HitAt ? new Date(row.tp1HitAt).toISOString() : null,
    closedAt: row.closedAt ? new Date(row.closedAt).toISOString() : null,
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function findOpen(instrument: string, tf: string) {
  const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
    SELECT *
    FROM "AlphaTrade"
    WHERE "instrument" = ${instrument}
      AND "tf" = ${tf}
      AND "status" IN ('ACTIVE', 'TP1_HIT')
    ORDER BY "openedAt" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function candleTimeMs(c: any) {
  const raw = Number(c?.time);
  return Number.isFinite(raw) ? raw * 1000 : 0;
}

async function evaluateTrade(trade: AlphaTradeRow, candles: any[]) {
  const openedMs = new Date(trade.openedAt).getTime();
  const ordered = (Array.isArray(candles) ? candles : [])
    .filter((c) => candleTimeMs(c) >= openedMs)
    .sort((a, b) => candleTimeMs(a) - candleTimeMs(b));

  let current = trade;

  for (const candle of ordered) {
    const high = Number(candle.high);
    const low = Number(candle.low);
    if (!Number.isFinite(high) || !Number.isFinite(low)) continue;

    const isBuy = current.direction === "BUY";
    const slHit = isBuy ? low <= current.sl : high >= current.sl;
    const tp1Hit = isBuy ? high >= current.tp1 : low <= current.tp1;
    const tp2Hit = isBuy ? high >= current.tp2 : low <= current.tp2;

    // If SL and TP are both inside one OHLC candle, intrabar order is unknown.
    // Use the conservative outcome: SL first.
    if (slHit) {
      const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
        UPDATE "AlphaTrade"
        SET "status" = 'SL_HIT', "closedAt" = NOW(), "updatedAt" = NOW()
        WHERE "id" = ${current.id}
        RETURNING *
      `;
      return { active: null, closed: rows[0] ?? current };
    }

    if (tp2Hit) {
      const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
        UPDATE "AlphaTrade"
        SET
          "status" = 'TP2_HIT',
          "tp1HitAt" = COALESCE("tp1HitAt", NOW()),
          "closedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${current.id}
        RETURNING *
      `;
      return { active: null, closed: rows[0] ?? current };
    }

    if (tp1Hit && current.status === "ACTIVE") {
      const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
        UPDATE "AlphaTrade"
        SET "status" = 'TP1_HIT', "tp1HitAt" = NOW(), "updatedAt" = NOW()
        WHERE "id" = ${current.id}
        RETURNING *
      `;
      current = rows[0] ?? { ...current, status: "TP1_HIT" };
    }
  }

  return { active: current, closed: null };
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
      SELECT *
      FROM "AlphaTrade"
      WHERE "status" IN ('ACTIVE', 'TP1_HIT')
      ORDER BY "openedAt" DESC
    `;
    return NextResponse.json(
      { status: "ok", trades: rows.map((row) => jsonTrade(row)) },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Alpha trades API error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const setup = body?.setup;
    const candles = Array.isArray(body?.candles) ? body.candles : [];

    const instrument = String(setup?.instrument ?? "");
    const tf = String(setup?.tf ?? "");

    if (!instrument || !tf) {
      return NextResponse.json({ status: "error", error: "Missing instrument/tf" }, { status: 400 });
    }

    let active = await findOpen(instrument, tf);

    if (active) {
      const result = await evaluateTrade(active, candles);
      return NextResponse.json({
        status: "ok",
        active: jsonTrade(result.active),
        closed: jsonTrade(result.closed),
      });
    }

    // A new trade is locked only from a real READY analysis.
    if (setup?.status !== "READY") {
      return NextResponse.json({ status: "ok", active: null, closed: null });
    }

    const direction = setup?.direction === "SELL" ? "SELL" : "BUY";
    const confidence = Number(setup?.confidence);
    const entry = Number(setup?.entry);
    const sl = Number(setup?.sl);
    const tp1 = Number(setup?.tp1);
    const tp2 = Number(setup?.tp2);
    const rr = String(setup?.rr ?? "1 : 2.5");
    const priceAction = String(setup?.priceAction ?? "READY");

    if (![confidence, entry, sl, tp1, tp2].every(Number.isFinite)) {
      return NextResponse.json({ status: "error", error: "Invalid READY levels" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const rows = await prisma.$queryRaw<AlphaTradeRow[]>`
      INSERT INTO "AlphaTrade"
        ("id","instrument","tf","direction","confidence","entry","sl","tp1","tp2","rr","priceAction","status","openedAt","updatedAt")
      VALUES
        (${id},${instrument},${tf},${direction},${confidence},${entry},${sl},${tp1},${tp2},${rr},${priceAction},'ACTIVE',NOW(),NOW())
      RETURNING *
    `;

    active = rows[0] ?? null;

    return NextResponse.json({
      status: "ok",
      active: jsonTrade(active),
      closed: null,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Alpha trades API error" },
      { status: 500 }
    );
  }
}
