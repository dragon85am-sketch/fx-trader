// app/api/oanda/instruments/route.ts
import { NextResponse } from "next/server";
import { tryOanda, oandaFetch } from "@/lib/oandaClient";
import { getCachedInstruments, setCachedInstruments } from "@/lib/oandaResolver";

type OandaEnv = "auto" | "practice" | "live";

function readEnvFromUrl(req: Request): OandaEnv {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("env") ?? process.env.OANDA_ENV ?? "auto").toLowerCase();

  if (raw === "practice" || raw === "live" || raw === "auto") return raw;
  return "auto";
}

export async function GET(req: Request) {
  const mode = readEnvFromUrl(req);

  const res = await tryOanda(mode, async (cfg) => {
    if (!cfg?.accountId) {
      throw new Error(`Missing OANDA accountId for env=${cfg?.env ?? "unknown"}`);
    }

    const cached = getCachedInstruments(cfg.env);
    if (cached) return cached;

    const r = await oandaFetch(cfg, `/v3/accounts/${cfg.accountId}/instruments`);
    const text = await r.text();

    if (!r.ok) {
      throw new Error(`OANDA instruments failed ${r.status}: ${text.slice(0, 500)}`);
    }

    const j = JSON.parse(text);

    const list = Array.isArray(j?.instruments)
      ? j.instruments.map((x: any) => ({
          name: String(x?.name ?? ""),
          displayName: String(x?.displayName ?? x?.name ?? ""),
          type: String(x?.type ?? ""),
        }))
      : [];

    setCachedInstruments(cfg.env, list);
    return list;
  });

  if (!res.ok) {
    return NextResponse.json(
      {
        error: "No working OANDA env",
        details: String(res.error ?? "unknown error"),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    env: res.env,
    count: res.data?.length ?? 0,
    instruments: res.data ?? [],
  });
}