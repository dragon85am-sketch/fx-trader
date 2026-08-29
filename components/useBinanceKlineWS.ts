"use client";

import * as React from "react";
import type { UTCTimestamp } from "lightweight-charts";

type Timeframe = "M1" | "M5" | "M15" | "M30" | "H1" | "H4";

const BINANCE_INTERVAL: Record<Timeframe, string> = {
  M1: "1m",
  M5: "5m",
  M15: "15m",
  M30: "30m",
  H1: "1h",
  H4: "4h",
};

type LiveCandle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export function useBinanceKlineWS(symbol: string, tf: Timeframe, enabled = true) {
  const [liveCandle, setLiveCandle] = React.useState<LiveCandle | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const aliveRef = React.useRef(true);

  React.useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    // jeśli nie Binance / nie enabled -> zamknij i wyjdź
    if (!enabled) {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;

      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;

      setLiveCandle(null);
      return;
    }

    if (!symbol) return;

    const interval = BINANCE_INTERVAL[tf] ?? "5m";
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const url = `wss://stream.binance.com:9443/ws/${stream}`;

    const cleanup = () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;

      const ws = wsRef.current;
      wsRef.current = null;

      try {
        ws?.close();
      } catch {}
    };

    const connect = () => {
      cleanup();

      if (!aliveRef.current) return;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data as string);
            const k = data?.k;
            if (!k) return;

            const t = Math.floor(Number(k.t) / 1000) as UTCTimestamp; // open time
            const o = Number(k.o);
            const h = Number(k.h);
            const l = Number(k.l);
            const c = Number(k.c);
            const v = Number(k.v);

            if (![o, h, l, c].every((x) => Number.isFinite(x))) return;

            setLiveCandle({
              time: t,
              open: o,
              high: h,
              low: l,
              close: c,
              volume: Number.isFinite(v) ? v : undefined,
            });
          } catch {
            // ignore
          }
        };

        ws.onerror = () => {
          // błąd -> zamknij, onclose odpali reconnect
          try {
            ws.close();
          } catch {}
        };

        ws.onclose = () => {
          if (!aliveRef.current) return;
          // reconnect z małym delay
          reconnectTimerRef.current = window.setTimeout(() => {
            if (!aliveRef.current) return;
            connect();
          }, 1000);
        };
      } catch {
        // jeśli nie da się utworzyć WS (np. offline), spróbuj ponownie
        reconnectTimerRef.current = window.setTimeout(() => {
          if (!aliveRef.current) return;
          connect();
        }, 1500);
      }
    };

    connect();

    return () => {
      cleanup();
    };
  }, [symbol, tf, enabled]);

  return { liveCandle };
}