"use client";

import { useEffect, useMemo, useState } from "react";

export default function LiveRatesHistoryTestPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/live-rates/history?mode=list", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const text = useMemo(() => JSON.stringify(data?.raw ?? data ?? {}, null, 2), [data]);
  const hasUS30 = /US[_\-/ ]?30|USA[_\-/ ]?30|DOW/i.test(text);

  return (
    <main style={{ minHeight: "100vh", background: "#070d18", color: "#e8f0ff", padding: 28, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Live-Rates — US30 History Test</h1>
        <p style={{ opacity: .75, marginTop: 0 }}>Ten test sprawdza oficjalną listę instrumentów z historycznym pokryciem.</p>

        {loading && <div style={{ marginTop: 24 }}>Pobieranie listy historycznej…</div>}
        {error && <div style={{ marginTop: 24, border: "1px solid #8f2a2a", padding: 16, borderRadius: 12 }}>Błąd: {error}</div>}

        {!loading && !error && (
          <>
            <div style={{ marginTop: 24, padding: 18, borderRadius: 14, border: `1px solid ${hasUS30 ? "#1f8f62" : "#805a20"}`, background: "#0b1424" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{hasUS30 ? "✅ US30 znaleziony na liście historii" : "⚠️ US30 nie został wykryty na liście historii"}</div>
              <div style={{ opacity: .8, marginTop: 8 }}>{hasUS30 ? "Możemy przejść do testu formatu danych historycznych." : "Wtedy Live-Rates zostaje świetnym live feedem, ale dla świec M1/M5/M15/H1/H4 trzeba użyć własnego candle engine / innego źródła historii."}</div>
            </div>
            <pre style={{ marginTop: 20, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#0b1424", border: "1px solid #24314a", borderRadius: 14, padding: 18, maxHeight: 620, overflow: "auto" }}>{text}</pre>
          </>
        )}
      </div>
    </main>
  );
}
