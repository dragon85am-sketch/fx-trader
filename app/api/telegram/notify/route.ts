import { NextResponse } from "next/server";

type Payload = {
  event?: "SCANNER_ON" | "ENTRY_FROZEN";

  symbol?: string;
  Symbol?: string;
  ticker?: string;
  pair?: string;
  market?: string;
  instrument?: string;
  data?: { symbol?: string };

  tf?: string;
  timeframe?: string;
  interval?: string;

  liquidity?: number;
  side?: "BUY" | "SELL";

  entry?: number;
  sl?: number;

  tps?: number[];
  tp1?: number;
  tp2?: number;
  tp3?: number;

  rr?: number;

  time?: number; // unix seconds
  timestamp?: number; // unix seconds

  imageUrl?: string;
};

function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function fmtNum(n?: number, dp = 5) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "â€”";
  return n.toFixed(dp);
}

function fmtPct(x?: number, dp = 2) {
  if (typeof x !== "number" || !Number.isFinite(x)) return "â€”";
  return `${x.toFixed(dp)}%`;
}

function pickSymbol(b: Payload) {
  return (
    b.symbol ??
    b.Symbol ??
    b.ticker ??
    b.pair ??
    b.market ??
    b.instrument ??
    b.data?.symbol ??
    "UNKNOWN"
  );
}

function pickTf(b: Payload) {
  return b.tf ?? b.timeframe ?? b.interval ?? "";
}

function pickTimeStr(b: Payload) {
  const t =
    typeof b.time === "number"
      ? b.time
      : typeof b.timestamp === "number"
        ? b.timestamp
        : null;

  if (!t) return "";
  const dt = new Date(t * 1000);
  return dt.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function isFxSymbol(symbol: string) {
  return /^[A-Z]{6}$/.test(symbol.toUpperCase());
}

function pipSize(symbol: string) {
  const s = symbol.toUpperCase();
  return s.endsWith("JPY") ? 0.01 : 0.0001;
}

function toPips(symbol: string, distance: number) {
  const ps = pipSize(symbol);
  return Math.round(distance / ps);
}

function computeAutoRR(args: {
  side?: "BUY" | "SELL";
  entry?: number;
  sl?: number;
  tp1?: number;
  rr?: number;
}) {
  const { side, entry, sl, tp1, rr } = args;

  if (typeof rr === "number" && Number.isFinite(rr)) return rr;

  const ok =
    typeof entry === "number" &&
    typeof sl === "number" &&
    typeof tp1 === "number" &&
    Number.isFinite(entry) &&
    Number.isFinite(sl) &&
    Number.isFinite(tp1) &&
    entry !== sl &&
    !!side;

  if (!ok) return null;

  if (side === "BUY") {
    const risk = entry - sl;
    const reward = tp1 - entry;
    if (risk > 0 && reward > 0) return reward / risk;
    return null;
  }

  const risk = sl - entry;
  const reward = entry - tp1;
  if (risk > 0 && reward > 0) return reward / risk;
  return null;
}

function buildCaption(body: Payload) {
  const event = body.event ?? "ENTRY_FROZEN";
  const symbol = pickSymbol(body);
  const tf = pickTf(body);

  const liquidity = body.liquidity;
  const side = body.side;

  const entry = body.entry;
  const sl = body.sl;

  const tp1 = body.tps?.[0] ?? body.tp1;
  const tp2 = body.tps?.[1] ?? body.tp2;
  const tp3 = body.tps?.[2] ?? body.tp3;

  const timeStr = pickTimeStr(body);

  const sideEmoji = side === "BUY" ? "ðŸŸ¢" : side === "SELL" ? "ðŸ”´" : "âšª";

  const canCalc =
    typeof entry === "number" &&
    typeof sl === "number" &&
    Number.isFinite(entry) &&
    Number.isFinite(sl);

  const canCalcTp1 = canCalc && typeof tp1 === "number" && Number.isFinite(tp1);

  let slDistPct: number | null = null;
  let tp1DistPct: number | null = null;
  let slDistPips: number | null = null;
  let tp1DistPips: number | null = null;

  if (canCalc) {
    const slAbs = Math.abs(entry! - sl!);
    slDistPct = (slAbs / entry!) * 100;
    if (isFxSymbol(symbol)) slDistPips = toPips(symbol, slAbs);
  }

  if (canCalcTp1) {
    const tp1Abs = Math.abs(tp1! - entry!);
    tp1DistPct = (tp1Abs / entry!) * 100;
    if (isFxSymbol(symbol)) tp1DistPips = toPips(symbol, tp1Abs);
  }

  const rrValue = computeAutoRR({ side, entry, sl, tp1, rr: body.rr });
  const rrStr = rrValue !== null ? rrValue.toFixed(2) : "â€”";

  const slInfo =
    slDistPct === null
      ? ""
      : isFxSymbol(symbol)
        ? ` <i>(odstÄ™p: ${fmtPct(slDistPct)} â€¢ ${slDistPips} pips)</i>`
        : ` <i>(odstÄ™p: ${fmtPct(slDistPct)})</i>`;

  const tp1Info =
    tp1DistPct === null
      ? ""
      : isFxSymbol(symbol)
        ? ` <i>(odstÄ™p: ${fmtPct(tp1DistPct)} â€¢ ${tp1DistPips} pips)</i>`
        : ` <i>(odstÄ™p: ${fmtPct(tp1DistPct)})</i>`;

  const sym = esc(symbol);
  const tfStr = tf ? esc(tf) : "";
  const timeStrEsc = timeStr ? esc(timeStr) : "";

  if (event === "SCANNER_ON") {
    return (
      `<b>ðŸ“Œ Instrument:</b> <code>${sym}</code>` +
      (tfStr ? `  â€¢  <b>TF:</b> <code>${tfStr}</code>` : "") +
      (side ? `  â€¢  <b>Side:</b> ${sideEmoji} <b>${esc(side)}</b>` : "") +
      `\n` +
      (typeof liquidity === "number"
        ? `<b>ðŸ’§ Liquidity:</b> <b>${Math.round(liquidity)}%</b>`
        : `<b>ðŸ’§ Liquidity:</b> <b>â€”</b>`) +
      `\n` +
      (timeStrEsc ? `\n<b>ðŸ•’ Time:</b> <code>${timeStrEsc}</code>` : "") +
      `\n<b>ðŸ§  FxTrade</b>`
    );
  }

  return (
    `<b>ðŸ“Œ Instrument:</b> <code>${sym}</code>` +
    (tfStr ? `  â€¢  <b>TF:</b> <code>${tfStr}</code>` : "") +
    (side ? `  â€¢  <b>Side:</b> ${sideEmoji} <b>${esc(side)}</b>` : "") +
    `\n` +
    (typeof liquidity === "number"
      ? `<b>ðŸ’§ Liquidity:</b> <b>${Math.round(liquidity)}%</b>`
      : `<b>ðŸ’§ Liquidity:</b> <b>â€”</b>`) +
    `  â€¢  <b>ðŸŽ¯ RR:</b> <b>${rrStr}</b>\n\n` +
    `<b>ðŸ“ Poziomy</b>\n` +
    `â€¢ <b>Entry:</b> <code>${fmtNum(entry)}</code>\n` +
    `â€¢ <b>SL:</b> <code>${fmtNum(sl)}</code>${slInfo}\n\n` +
    `<b>âœ… Take Profit</b>\n` +
    `â€¢ <b>TP1:</b> <code>${fmtNum(tp1)}</code>${tp1Info}\n` +
    `â€¢ <b>TP2:</b> <code>${fmtNum(tp2)}</code>\n` +
    `â€¢ <b>TP3:</b> <code>${fmtNum(tp3)}</code>\n` +
    (timeStrEsc ? `\n<b>ðŸ•’ Time:</b> <code>${timeStrEsc}</code>\n` : `\n`) +
    `<b>ðŸ§  FxTrade</b>`
  );
}

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // FORUM/WÄ„TEK (opcjonalnie)
    const threadIdRaw = process.env.TELEGRAM_THREAD_ID;
    const threadId =
      threadIdRaw && /^\d+$/.test(threadIdRaw) ? Number(threadIdRaw) : undefined;

    const logoUrl = process.env.FXTRADE_LOGO_URL;

    if (!token || !chatId) {
      return NextResponse.json(
        { ok: false, error: "Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Payload;

    // 1) Tu sprawdzisz czy skaner w ogÃ³le wywoÅ‚uje endpoint:
    console.log("ðŸ”¥ TELEGRAM NOTIFY PAYLOAD:", JSON.stringify(body, null, 2));

    const caption = buildCaption(body);
    const photoUrl = body.imageUrl || logoUrl;

    // wspÃ³lne pole dla forum topic
    const threadPart = threadId ? { message_thread_id: threadId } : {};

    // 2) JeÅ›li nie masz photoUrl -> sendMessage
    if (!photoUrl) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          ...threadPart,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      const data = await res.json();
      console.log("ðŸ“¨ TELEGRAM sendMessage status:", res.status, "resp:", data);

      if (!res.ok) {
        return NextResponse.json({ ok: false, telegram: data }, { status: 500 });
      }
      return NextResponse.json({ ok: true, mode: "text" });
    }

    // 3) sendPhoto (UWAGA: caption limit ~1024 znaki)
    // JeÅ›li caption bywa dÅ‚ugi, Telegram odrzuci â€” dlatego tniemy bezpiecznie.
    const safeCaption = caption.length > 1000 ? caption.slice(0, 1000) + "â€¦" : caption;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        ...threadPart,
        photo: photoUrl,
        caption: safeCaption,
        parse_mode: "HTML",
      }),
    });

    const data = await res.json();
    console.log("ðŸ“¸ TELEGRAM sendPhoto status:", res.status, "resp:", data);

    if (!res.ok) {
      // fallback: jak foto nie przejdzie, wyÅ›lij sam tekst
      const res2 = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          ...threadPart,
          text: caption,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      const data2 = await res2.json();
      console.log("â†©ï¸ TELEGRAM fallback sendMessage status:", res2.status, "resp:", data2);

      if (!res2.ok) {
        return NextResponse.json(
          { ok: false, telegram: data, fallback: data2 },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, mode: "fallback_text" });
    }

    return NextResponse.json({ ok: true, mode: "photo" });
  } catch (e: any) {
    console.error("âŒ TELEGRAM NOTIFY ERROR:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
