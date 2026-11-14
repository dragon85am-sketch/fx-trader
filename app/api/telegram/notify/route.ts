import { PrismaClient } from "@prisma/client";
const telegramDeliveryDb = new PrismaClient();
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Side = "BUY" | "SELL";
type ClosedStatus = "TP2" | "TP3" | "SL" | "TP1_BE"; // TP3: legacy history only

type WeeklyRow = {
  instrument: string;
  wins: number;
  losses: number;
  value: number;
  unit: "pips" | "pts";
};

type TelegramPayload = {
  type?: "SIGNAL" | "CLOSED" | "WEEKLY";
  deliveryKey?: string;

  instrument?: string;
  side?: Side;
  tf?: string;

  liquidity?: number;
  rr?: number;

  entry?: number;
  sl?: number;

  tp1?: number;
  tp2?: number;
  tp3?: number;

  status?: ClosedStatus;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  tp3Hit?: boolean;

  timeISO?: string;
  imageUrl?: string;

  weekly?: {
    periodStartISO: string;
    periodEndISO: string;
    total: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPips: number;
    totalPoints: number;
    rows: WeeklyRow[];
  };
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function price(value: number | undefined, instrument = "") {
  if (value == null || !Number.isFinite(Number(value))) return "—";

  const symbol = instrument.toUpperCase();
  const n = Number(value);

  if (symbol.endsWith("USDT")) return n.toFixed(5);
  if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return n.toFixed(3);
  if (symbol.includes("JPY")) return n.toFixed(3);
  if (symbol.length === 6) return n.toFixed(5);

  return n.toFixed(5);
}

function buildSignalMessage(p: TelegramPayload) {
  const sideIcon = p.side === "BUY" ? "🟢" : "🔴";
  const instrument = p.instrument ?? "UNKNOWN";
  const tf = p.tf ?? "";
  const liq = Number.isFinite(Number(p.liquidity))
    ? `${Math.round(Number(p.liquidity))}%`
    : "—";
  const rr = Number.isFinite(Number(p.rr))
    ? Number(p.rr).toFixed(2)
    : "—";

  return [
    "🚨 <b>FXTRADE SIGNAL</b>",
    "",
    `<b>${esc(instrument)}${tf ? ` · ${esc(tf)}` : ""}</b>`,
    `${sideIcon} <b>${esc(p.side)}</b>`,
    "",
    "📊 <b>SETUP</b>",
    `Liquidity: <b>${liq}</b>`,
    `RR: <b>${rr}</b>`,
    "",
    "📍 <b>POZIOMY</b>",
    `Entry: <code>${price(p.entry, instrument)}</code>`,
    `SL: <code>${price(p.sl, instrument)}</code>`,
    "",
    "🎯 <b>TAKE PROFIT</b>",
    `⚪ TP1: <code>${price(p.tp1, instrument)}</code>`,
    `⚪ TP2: <code>${price(p.tp2, instrument)}</code>`,
    "",
    "🛡 TP1 → SL na BE",
    "🏆 TP2 → zamknięcie transakcji (WIN)",
    "",
    "🔵 <b>FxTrade Professional Trading</b>",
  ].join("\n");
}

function buildClosedMessage(p: TelegramPayload) {
  const status = p.status;
  const sideIcon = p.side === "BUY" ? "🟢" : "🔴";
  const instrument = p.instrument ?? "UNKNOWN";
  const tf = p.tf ?? "";

  const tp1 = p.tp1Hit ? "✅" : "⚪";
  const tp2 = p.tp2Hit ? "✅" : "⚪";

  let title = "✅ <b>TRADE CLOSED</b>";
  let result = "📈 <b>RESULT: SUCCESS</b>";
  let detail = "";

  if (status === "TP2") {
    title = "🏆 <b>TRADE CLOSED — FULL WIN</b>";
    result = "💰 <b>RESULT: SUCCESS — TP2</b>";
    detail = "Cel TP2 osiągnięty. Transakcja zamknięta.";
  } else if (status === "TP3") {
    // Zachowujemy czytelność historycznych rekordów sprzed zmiany logiki na TP2.
    title = "🏆 <b>TRADE CLOSED — HISTORICAL TP3</b>";
    result = "💰 <b>RESULT: SUCCESS — TP3 (historyczny)</b>";
  } else if (status === "TP1_BE") {
    title = "✅ <b>TRADE CLOSED — SUCCESS</b>";
    result = "🛡 <b>RESULT: TP1 + BE</b>";
    detail = "🛡 Po realizacji zysku pozycja wróciła do BE.";
  } else if (status === "SL") {
    title = "❌ <b>TRADE CLOSED</b>";
    result = "📉 <b>RESULT: LOSS — SL</b>";
    detail = "❌ Stop Loss został trafiony przed TP1.";
  }

  return [
    title,
    "",
    `<b>${esc(instrument)}${tf ? ` · ${esc(tf)}` : ""}</b>`,
    `${sideIcon} <b>${esc(p.side)}</b>`,
    "",
    "🎯 <b>WYNIK TAKE PROFIT</b>",
    `${tp1} TP1: <code>${price(p.tp1, instrument)}</code>${p.tp1Hit ? "  <b>HIT</b>" : ""}`,
    `${tp2} TP2: <code>${price(p.tp2, instrument)}</code>${p.tp2Hit ? "  <b>HIT</b>" : ""}`,
    "",
    detail,
    result,
    "",
    `📍 Entry: <code>${price(p.entry, instrument)}</code>`,
    `🛡 SL/BE: <code>${price(p.sl, instrument)}</code>`,
    "",
    "🔵 <b>FxTrade Professional Trading</b>",
  ]
    .filter(Boolean)
    .join("\n");
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtSigned(value: number, digits = 0) {
  if (!Number.isFinite(value)) return "0";
  const n = Number(value.toFixed(digits));
  return `${n > 0 ? "+" : ""}${n}`;
}

function buildWeeklyMessage(p: TelegramPayload) {
  const w = p.weekly;

  if (!w) {
    return "📊 <b>FXTRADE WEEKLY REPORT</b>\n\nBrak danych raportu.";
  }

  const rows = Array.isArray(w.rows) ? w.rows : [];
  const header = "INSTRUMENT   W   L      WYNIK";
  const sep = "-------------------------------";
  const tableRows = rows.length
    ? rows.map((r) => {
        const instrument = String(r.instrument ?? "").slice(0, 10).padEnd(10, " ");
        const wins = String(r.wins ?? 0).padStart(2, " ");
        const losses = String(r.losses ?? 0).padStart(2, " ");
        const value = `${fmtSigned(Number(r.value ?? 0), r.unit === "pts" ? 2 : 0)} ${r.unit}`;
        return `${instrument}  ${wins}  ${losses}  ${value.padStart(11, " ")}`;
      })
    : ["BRAK TRADE'ÓW W TYM TYGODNIU"];

  const table = [header, sep, ...tableRows].join("\n");

  return [
    "📊 <b>FXTRADE — RAPORT TYGODNIOWY</b>",
    "",
    `🗓 <b>${esc(fmtDate(w.periodStartISO))} → ${esc(fmtDate(w.periodEndISO))}</b>`,
    "",
    `<pre>${esc(table)}</pre>`,
    "",
    `✅ Wygrane: <b>${Math.round(w.wins ?? 0)}</b>`,
    `❌ Przegrane: <b>${Math.round(w.losses ?? 0)}</b>`,
    `🎯 Win rate: <b>${Number(w.winRate ?? 0).toFixed(1)}%</b>`,
    `📈 Forex / metale: <b>${fmtSigned(Number(w.totalPips ?? 0), 0)} pips</b>`,
    `₿ Crypto: <b>${fmtSigned(Number(w.totalPoints ?? 0), 2)} pts</b>`,
    `📋 Wszystkie zamknięte: <b>${Math.round(w.total ?? 0)}</b>`,
    "",
    "🔵 <b>FxTrade Professional Trading</b>",
  ].join("\n");
}

async function sendText(args: {
  botToken: string;
  chatId: string;
  threadId?: number;
  text: string;
}) {
  const { botToken, chatId, threadId, text } = args;

  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      ...(threadId ? { message_thread_id: threadId } : {}),
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });
}

async function sendPhoto(args: {
  botToken: string;
  chatId: string;
  threadId?: number;
  photoUrl: string;
  caption: string;
}) {
  const { botToken, chatId, threadId, photoUrl, caption } = args;

  return fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      chat_id: chatId,
      ...(threadId ? { message_thread_id: threadId } : {}),
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
    }),
    cache: "no-store",
  });
}

export async function POST(req: NextRequest) {
  try {
    // Telegram is server-worker only. Browser/user sessions must never send alerts.
    const expected = process.env.FX_SCANNER_WORKER_KEY;
    const supplied = req.headers.get("x-fx-scanner-worker-key");
    if (!expected || supplied !== expected) {
      return NextResponse.json({ error: "Worker authorization required" }, { status: 403 });
    }
    const payload = (await req.json()) as TelegramPayload;
    // Idempotency key is mandatory for trade notifications after worker upgrade.
    // Legacy callers are rejected rather than bypassing durable deduplication.
    const notificationType = payload.type ?? "SIGNAL";
    const deliveryKey = payload.deliveryKey;
    if (notificationType !== "WEEKLY" && (!deliveryKey || !new RegExp(`^${notificationType}:[a-f0-9]{40}$`).test(deliveryKey))) {
      return NextResponse.json({ error: "Valid deliveryKey required" }, { status: 400 });
    }
    const type = payload.type ?? "SIGNAL";

    if (type !== "WEEKLY" && (!payload?.instrument || !payload?.side || !payload?.tf)) {
      return NextResponse.json(
        { error: "Missing instrument/side/tf" },
        { status: 400 }
      );
    }

    if (type === "WEEKLY" && !payload.weekly) {
      return NextResponse.json(
        { error: "Missing weekly report data" },
        { status: 400 }
      );
    }

    const deliveryDb = telegramDeliveryDb;
    let claimed = false;
    if (notificationType !== "WEEKLY") {
      // Atomic claim: a duplicate deliveryKey is ignored by PostgreSQL instead
      // of raising unique-constraint error 23505 (Prisma P2002).
      // Never re-send an existing CLAIMED/SENT/UNCERTAIN delivery automatically.
      const result = await deliveryDb.fxScannerTelegramDelivery.createMany({
        data: [{ id: deliveryKey! }],
        skipDuplicates: true,
      });
      if (result.count === 0) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: "Delivery already claimed; verify Telegram manually before retry",
          deliveryKey,
        });
      }
      claimed = true;
    }
    // CLAIMED is intentionally not automatically released: a crash or timeout may
    // happen after Telegram accepted the message but before the HTTP response.
    async function finishDelivery(ok: boolean, reason?: string) {
      if (claimed && deliveryKey) {
        await deliveryDb.fxScannerTelegramDelivery.update({
          where: { id: deliveryKey },
          data: { status: ok ? "SENT" : "UNCERTAIN", sentAt: ok ? new Date() : null, error: reason?.slice(0, 500) },
        });
      }
    }


    const botToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.TELEGRAM_TOKEN ||
      process.env.TG_BOT_TOKEN;

    const chatId =
      process.env.TELEGRAM_CHAT_ID ||
      process.env.TG_CHAT_ID;

    const threadIdRaw = process.env.TELEGRAM_THREAD_ID;
    const threadId =
      threadIdRaw && /^\d+$/.test(threadIdRaw)
        ? Number(threadIdRaw)
        : undefined;

    const defaultLogoUrl =
      `${(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://fx-trade.eu").replace(/\/$/, "")}/images/fxtrade-scanner-telegram.png`;

    // Osobny, stały obraz dla raportu tygodniowego.
    // Najpierw może być nadpisany przez FXTRADE_WEEKLY_IMAGE_URL.
    // Jeśli nie ustawisz tego ENV, route spróbuje użyć:
    //   {APP_URL}/images/fxtrade-weekly-report.png
    const appUrlRaw =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL;

    const appUrl = appUrlRaw
      ? appUrlRaw.replace(/\/$/, "")
      : "";

    const builtInWeeklyImageUrl = appUrl
      ? `${appUrl}/images/fxtrade-weekly-report.png`
      : undefined;

    const weeklyReportImageUrl =
      process.env.FXTRADE_WEEKLY_IMAGE_URL ||
      builtInWeeklyImageUrl;

    if (!botToken || !chatId) {
      console.error(
        "Telegram config missing: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID"
      );

      await finishDelivery(false, "Telegram configuration missing");
      return NextResponse.json(
        { error: "Telegram configuration missing" },
        { status: 500 }
      );
    }

    const text =
      type === "WEEKLY"
        ? buildWeeklyMessage(payload)
        : type === "CLOSED"
          ? buildClosedMessage(payload)
          : buildSignalMessage(payload);

    // SIGNAL i CLOSED zawsze używają bannera Scanner Alert.
    // WEEKLY ma osobną grafikę raportu.
    const photoUrl =
      type === "WEEKLY"
        ? payload.imageUrl || weeklyReportImageUrl || defaultLogoUrl
        : defaultLogoUrl;

    if (!photoUrl) {
      const response = await sendText({
        botToken,
        chatId,
        threadId,
        text,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Telegram sendMessage error:", data);

      await finishDelivery(false, "Telegram API returned failure");
        return NextResponse.json(
          { error: "Telegram send failed", details: data },
          { status: response.status }
        );
      }

      await finishDelivery(true);
      return NextResponse.json({
        ok: true,
        type,
        mode: "text",
      });
    }

    const isLongMessage = text.length > 1000;
    const safeCaption = isLongMessage
      ? type === "WEEKLY"
        ? "📊 <b>FXTRADE — RAPORT TYGODNIOWY</b>"
        : "🔵 <b>FxTrade Professional Trading</b>"
      : text;

    console.log("[TELEGRAM] sendPhoto attempt", {
      type,
      photoUrl,
      captionLength: safeCaption.length,
    });

    const photoResponse = await sendPhoto({
      botToken,
      chatId,
      threadId,
      photoUrl,
      caption: safeCaption,
    });

    const photoData = await photoResponse.json().catch(() => null);

    console.log("[TELEGRAM] sendPhoto response", {
      type,
      ok: photoResponse.ok,
      status: photoResponse.status,
      description: photoData?.description ?? null,
    });

    if (photoResponse.ok) {
      if (isLongMessage) {
        const textResponse = await sendText({
          botToken,
          chatId,
          threadId,
          text,
        });

        const textData = await textResponse.json().catch(() => null);
        if (!textResponse.ok) {
          console.error("Telegram weekly/details sendMessage error:", textData);
      await finishDelivery(false, "Telegram API returned failure");
          return NextResponse.json(
            { error: "Photo sent, but report text failed", details: textData },
            { status: textResponse.status }
          );
        }

      await finishDelivery(true);
        return NextResponse.json({ ok: true, type, mode: "photo_plus_text" });
      }

      await finishDelivery(true);
      return NextResponse.json({
        ok: true,
        type,
        mode: "photo",
      });
    }

    console.error(
      "Telegram sendPhoto error, fallback to text:",
      photoData
    );

    const fallbackResponse = await sendText({
      botToken,
      chatId,
      threadId,
      text,
    });

    const fallbackData = await fallbackResponse
      .json()
      .catch(() => null);

    if (!fallbackResponse.ok) {
      console.error(
        "Telegram fallback sendMessage error:",
        fallbackData
      );

      await finishDelivery(false, "Telegram API returned failure");
      return NextResponse.json(
        {
          error: "Telegram photo and fallback text failed",
          photo: photoData,
          fallback: fallbackData,
        },
        { status: fallbackResponse.status }
      );
    }

      await finishDelivery(true);
    return NextResponse.json({
      ok: true,
      type,
      mode: "fallback_text",
    });
  } catch (error) {
    console.error("Telegram notify error:", error);

    return NextResponse.json(
      { error: "Telegram notify failed" },
      { status: 500 }
    );
  }
}
