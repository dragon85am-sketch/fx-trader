"use client";

import React from "react";

type PriceTick = {
  type?: string;
  time?: string;
  instrument?: string;
  bids?: Array<{ price: string }>;
  asks?: Array<{ price: string }>;
  closeoutBid?: string;
  closeoutAsk?: string;
};

function midFromTick(t: PriceTick): number | null {
  const bid = t.bids?.[0]?.price ?? t.closeoutBid;
  const ask = t.asks?.[0]?.price ?? t.closeoutAsk;
  const b = Number(bid);
  const a = Number(ask);
  if (Number.isFinite(b) && Number.isFinite(a)) return (b + a) / 2;
  return null;
}

export function useOandaPricingSSE(instruments: string[], enabled: boolean) {
  const [prices, setPrices] = React.useState<Record<string, number>>({});
  const [status, setStatus] = React.useState<"OFF" | "CONNECTING" | "ON" | "ERROR">("OFF");

  React.useEffect(() => {
    if (!enabled || !instruments.length) {
      setStatus("OFF");
      return;
    }

    const list = instruments.slice(0, 30).join(",");
    const url = `/api/oanda/stream?instruments=${encodeURIComponent(list)}`;

    setStatus("CONNECTING");
    const es = new EventSource(url);

    es.onopen = () => setStatus("ON");

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as PriceTick;
        if (data.type !== "PRICE") return;

        const inst = (data.instrument ?? "").toUpperCase();
        const mid = midFromTick(data);
        if (!inst || mid === null) return;

        setPrices((prev) => ({ ...prev, [inst]: mid }));
      } catch {}
    };

    es.onerror = () => {
      setStatus("ERROR");
      es.close();
    };

    return () => es.close();
  }, [enabled, instruments.join(",")]);

  return { prices, status };
}