"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Bell,
  Bitcoin,
  CalendarDays,
  Clock3,
  Crown,
  Radio,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";

type SessionKind = "DJ30" | "SCALPING" | "BTC";

type SessionItem = {
  label: SessionKind;
  time: string;
  subtitle: string;
};

type DayConfig = {
  day: string;
  date: string;
  city: "NEW YORK" | "LONDON" | "FRANKFURT" | "DUBAI" | "CRYPTO";
  image: string;
  sessions: SessionItem[];
  weekend?: boolean;
};

const DAYS: DayConfig[] = [
  {
    day: "PONIEDZIAŁEK",
    date: "19 MAJ",
    city: "NEW YORK",
    image: "/sessions/sessions-new-york.png",
    sessions: [
      { label: "DJ30", time: "15:30", subtitle: "DJ30 Session Live" },
      { label: "SCALPING", time: "19:30", subtitle: "Scalping Session Live" },
    ],
  },
  {
    day: "WTOREK",
    date: "20 MAJ",
    city: "LONDON",
    image: "/sessions/sessions-london.png",
    sessions: [
      { label: "DJ30", time: "15:30", subtitle: "DJ30 Session Live" },
      { label: "SCALPING", time: "19:30", subtitle: "Scalping Session Live" },
    ],
  },
  {
    day: "ŚRODA",
    date: "21 MAJ",
    city: "FRANKFURT",
    image: "/sessions/sessions-frankfurt.png",
    sessions: [
      { label: "DJ30", time: "15:30", subtitle: "DJ30 Session Live" },
      { label: "SCALPING", time: "19:30", subtitle: "Scalping Session Live" },
    ],
  },
  {
    day: "CZWARTEK",
    date: "22 MAJ",
    city: "DUBAI",
    image: "/sessions/sessions-dubai.png",
    sessions: [
      { label: "DJ30", time: "15:30", subtitle: "DJ30 Session Live" },
      { label: "SCALPING", time: "19:30", subtitle: "Scalping Session Live" },
    ],
  },
  {
    day: "PIĄTEK",
    date: "23 MAJ",
    city: "NEW YORK",
    image: "/sessions/sessions-new-york-2.png",
    sessions: [
      { label: "DJ30", time: "15:30", subtitle: "DJ30 Session Live" },
      { label: "SCALPING", time: "19:30", subtitle: "Scalping Session Live" },
    ],
  },
  {
    day: "SOBOTA",
    date: "24 MAJ",
    city: "CRYPTO",
    image: "/sessions/sessions-btc-saturday.png",
    weekend: true,
    sessions: [{ label: "BTC", time: "16:00", subtitle: "BTC Session Live" }],
  },
  {
    day: "NIEDZIELA",
    date: "25 MAJ",
    city: "CRYPTO",
    image: "/sessions/sessions-btc-sunday.png",
    weekend: true,
    sessions: [{ label: "BTC", time: "16:00", subtitle: "BTC Session Live" }],
  },
];

function getAmsterdamClock(date: Date) {
  const parts = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
    date: `${get("day")}.${get("month")}.${get("year")}`,
  };
}

function SessionIcon({ kind }: { kind: SessionKind }) {
  if (kind === "BTC") {
    return (
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-orange-300/45 bg-[radial-gradient(circle_at_35%_28%,#ffc86a_0%,#f59e0b_38%,#c05b00_72%,#4b1900_100%)] text-white shadow-[0_0_24px_rgba(249,115,22,.32)]">
        <Bitcoin className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.4} />
      </div>
    );
  }

  if (kind === "SCALPING") {
    return (
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,.12)]">
        <Activity className="h-5 w-5 sm:h-7 sm:w-7" />
      </div>
    );
  }

  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.12)]">
      <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7" />
    </div>
  );
}



function LiveBadge({ scalping = false }: { scalping?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[7px] font-black ${
        scalping
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-cyan-200/40 bg-cyan-500/10 text-cyan-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${scalping ? "bg-emerald-400" : "bg-cyan-400"}`} />
      {scalping ? "SCALPING LIVE" : "SESSION LIVE"}
    </span>
  );
}

function TradingMiniChart() {
  const candles = [
    { x: 8, high: 34, low: 21, open: 29, close: 24, up: true },
    { x: 20, high: 31, low: 18, open: 25, close: 20, up: true },
    { x: 32, high: 30, low: 17, open: 20, close: 26, up: false },
    { x: 44, high: 26, low: 14, open: 22, close: 17, up: true },
    { x: 56, high: 25, low: 11, open: 18, close: 22, up: true },
    { x: 68, high: 22, low: 10, open: 17, close: 20, up: false },
    { x: 80, high: 20, low: 8, open: 14, close: 18, up: true },
    { x: 92, high: 18, low: 6, open: 12, close: 16, up: true },
  ];

  return (
    <svg viewBox="0 0 104 42" className="h-[78px] w-full">
      <path d="M0 36H104M0 22H104M0 8H104" stroke="rgba(148,163,184,.07)" />
      {candles.map((c) => {
        const color = c.up ? "#2dd4bf" : "#f43f5e";
        const top = Math.min(c.open, c.close);
        const height = Math.max(4, Math.abs(c.open - c.close));
        return (
          <g key={c.x}>
            <line x1={c.x} y1={c.low} x2={c.x} y2={c.high} stroke={color} strokeWidth="1.3" />
            <rect x={c.x - 2.5} y={top} width="5" height={height} rx="1" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function Donut78() {
  return (
    <div className="relative grid h-[124px] w-[124px] place-items-center rounded-full sm:h-[142px] sm:w-[142px] bg-[conic-gradient(#22d3ee_0deg,#22d3ee_280deg,#0b2b49_280deg,#0b2b49_360deg)] shadow-[0_0_32px_rgba(34,211,238,.20)]">
      <div className="grid h-[94px] w-[94px] place-items-center rounded-full sm:h-[108px] sm:w-[108px] border border-cyan-300/10 bg-[#061426]">
        <div className="text-center">
          <div className="text-[24px] font-black text-white sm:text-[28px]">78%</div>
          <div className="mt-1 text-[8px] font-bold uppercase tracking-[.10em] text-slate-400">
            skuteczność
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SesjePage() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = now
    ? getAmsterdamClock(now)
    : { time: "--:--:--", date: "--.--.----" };

  return (
    <main className="relative isolate min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.42), rgba(2,8,23,.68)), url('/sesje-trading-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      {/* BOCZNE TAPETY - tylko strona SESJE */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden"
      />

      {/* płynne przejście tapet do środka */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none hidden"
      />

      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[2520px] px-2 py-3 sm:px-4 md:px-7 xl:px-[90px] 2xl:px-[120px] min-[1900px]:px-[135px]">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[14px] border border-cyan-300/16 bg-[linear-gradient(180deg,#0e5b9b_0%,#0a3f73_100%)] px-3 py-3 sm:rounded-[18px] sm:px-4 shadow-[0_16px_44px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,255,255,.025)]">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-[#07192b] text-cyan-300 sm:h-12 sm:w-12">
                <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>

              <div className="min-w-0">
                <h1 className="text-[19px] font-black leading-tight tracking-tight sm:text-[25px] md:text-[34px]">
                  HARMONOGRAM{" "}
                  <span className="bg-[linear-gradient(90deg,#67e8f9,#22d3ee,#38bdf8)] bg-clip-text text-transparent">
                    SESJI LIVE
                  </span>
                </h1>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.10em] text-slate-400">
                  PLAN SESJI NA ŻYWO – TRADING Z PROFESJONALISTAMI
                </p>
              </div>
            </div>

            <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
              <div className="hidden text-right md:block">
                <div className="flex items-center justify-end gap-2 text-[18px] font-black">
                  <Clock3 className="h-5 w-5 text-slate-300" />
                  {clock.time}
                </div>
                <div className="mt-0.5 text-[9px] text-slate-400">CET {clock.date}</div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#061b1b]/65 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.9)]" />
                <div>
                  <div className="text-[10px] font-black">LIVE SCHEDULE</div>
                  <div className="text-[7px] text-slate-400">AKTUALNY HARMONOGRAM</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 DAY SCHEDULE */}
        <section className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {DAYS.map((day, index) => {
            const weekend = Boolean(day.weekend);
            const sunday = day.day === "NIEDZIELA";

            return (
              <article
                key={day.day}
                className={`min-w-0 overflow-hidden rounded-[16px] border bg-[linear-gradient(180deg,#0b5795_0%,#083a69_100%)] shadow-[0_14px_36px_rgba(0,0,0,.25)] ${
                  weekend
                    ? sunday
                      ? "border-cyan-400/35"
                      : "border-orange-400/40"
                    : "border-cyan-200/40"
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className={`text-[10px] font-black ${weekend ? (sunday ? "text-cyan-300" : "text-orange-300") : "text-white"}`}>
                    {day.day}
                  </div>
                  <div className={`text-[9px] font-bold ${weekend ? (sunday ? "text-cyan-300/80" : "text-orange-300/80") : "text-cyan-300"}`}>
                    {day.date}
                  </div>
                </div>

                {weekend ? (
                  <div className="relative h-[170px] overflow-hidden border-b border-cyan-300/10 bg-[#06111c] sm:h-[190px] xl:h-[215px]">
                    <Image
                      src={day.image}
                      alt={`${day.day} BTC session`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1280px) 14vw, 100vw"
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative h-[150px] overflow-hidden border-b border-cyan-300/10 bg-[#061320] sm:h-[132px]">
                      <Image
                        src={day.image}
                        alt={`${day.city} trading session`}
                        fill
                        priority={index < 2}
                        className="object-cover"
                        sizes="(min-width: 1280px) 14vw, 100vw"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,11,20,.05),rgba(2,11,20,.16)_58%,rgba(2,11,20,.70))]" />
                    </div>

                    <div className="space-y-2 p-2.5">
                      {day.sessions.map((session) => (
                        <div
                          key={`${day.day}-${session.label}`}
                          className={`rounded-[13px] border bg-[#0b4f86]/85 p-2.5 ${
                            session.label === "SCALPING"
                              ? "border-emerald-400/20"
                              : "border-cyan-400/20"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SessionIcon kind={session.label} />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-[11px] font-black text-white">{session.label}</div>
                                  <div className="mt-0.5 text-[7px] text-slate-500">{session.subtitle}</div>
                                </div>
                                <div className="text-[17px] font-black text-white">{session.time}</div>
                              </div>

                              <div className="mt-2">
                                <LiveBadge scalping={session.label === "SCALPING"} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div
                  className={`border-t px-3 py-3 ${
                    weekend
                      ? sunday
                        ? "border-cyan-400/15"
                        : "border-orange-400/15"
                      : "border-cyan-400/10"
                  }`}
                >
                  <div
                    className={`text-[8px] font-black uppercase tracking-[.12em] ${
                      weekend
                        ? sunday
                          ? "text-cyan-300"
                          : "text-orange-300"
                        : "text-cyan-300"
                    }`}
                  >
                    NAJBLIŻSZA SESJA
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[8px] text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {day.sessions[0].subtitle}
                  </div>
                  <div
                    className={`mt-1 text-[15px] font-black ${
                      weekend
                        ? sunday
                          ? "text-cyan-100"
                          : "text-orange-300"
                        : "text-slate-300"
                    }`}
                  >
                    {weekend
                      ? day.day === "SOBOTA"
                        ? "6D 00:45:21"
                        : "7D 00:45:21"
                      : `${index + 1}D 00:45:21`}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* LOWER ROW */}
        <section className="mt-3 grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1.28fr)_minmax(0,1.02fr)]">
          {/* CURRENT SESSION */}
          <div className="relative overflow-hidden rounded-[16px] border border-cyan-200/40 bg-[radial-gradient(circle_at_75%_15%,rgba(103,232,249,.20),transparent_34%),linear-gradient(180deg,#0d65a8,#08457a)] p-4">
            <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:34px_34px]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black tracking-[.06em] text-cyan-300">
                  AKTUALNA SESJA
                </div>
                <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[8px] font-black text-emerald-300">
                  ● LIVE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[.9fr_1.1fr] sm:items-end">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-amber-400/20 bg-amber-500/5">
                      <Image
                        src="/sessions/sessions-gold-bars.png"
                        alt="Gold bars"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="text-[19px] font-black text-orange-300 sm:text-[23px]">
                      GOLD <span className="text-[9px] font-semibold text-slate-400">(XAUUSD)</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[24px] font-black sm:text-[29px]">16:00</div>
                  <div className="mt-2 text-[9px] font-semibold text-cyan-300">TRWA SESJA</div>
                  <div className="mt-1 text-[10px] text-slate-300">FOREX Scalping</div>
                </div>

                <div>
                  <TradingMiniChart />
                  <div className="-mt-2 text-right text-[10px] font-black text-slate-300">19:30</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 min-[390px]:grid-cols-3">
                {[
                  ["LIKWIDNOŚĆ", "85%", "text-cyan-300"],
                  ["ZMIENNOŚĆ", "ŚREDNIA", "text-cyan-300"],
                  ["TREND", "BULLISH", "text-emerald-300"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="rounded-[9px] border border-cyan-300/12 bg-[#0b4f86]/85 px-2 py-2.5 text-center"
                  >
                    <div className="text-[7px] font-semibold text-slate-500">{label}</div>
                    <div className={`mt-1 text-[12px] font-black ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              <Link
                href="/sesje/live"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border border-cyan-300/30 bg-[linear-gradient(90deg,#0798c6,#078fd8)] px-4 py-3 text-[11px] font-black text-white shadow-[0_0_20px_rgba(34,211,238,.16)] hover:brightness-110"
              >
                <Radio className="h-4 w-4" />
                DOŁĄCZ DO SESJI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* NEXT SESSIONS */}
          <div className="overflow-hidden rounded-[16px] border border-cyan-200/35 bg-[linear-gradient(180deg,#0d65a8,#08457a)]">
            <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
              <div className="text-[11px] font-black">NAJBLIŻSZE SESJE</div>
              <button className="text-[8px] font-black text-cyan-300">
                ZOBACZ WSZYSTKIE →
              </button>
            </div>

            {[
              ["DJ30", "15:30", "DJ30 Session Live", "LIVE"],
              ["SCALPING", "19:30", "Scalping Session Live", "00:45:21"],
              ["BTC", "16:00", "BTC Session Live", "1D 00:45:21"],
              ["DJ30", "15:30", "DJ30 Session Live", "1D 23:45:21"],
              ["SCALPING", "19:30", "Scalping Session Live", "2D 00:45:21"],
            ].map(([name, time, subtitle, status], index) => {
              const kind = name as SessionKind;
              return (
                <div
                  key={`${name}-${index}`}
                  className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 border-b border-cyan-300/10 px-3 py-3 last:border-b-0 sm:grid-cols-[42px_minmax(0,1fr)_auto_auto] sm:gap-3 sm:px-4"
                >
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl border ${
                      kind === "SCALPING"
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                        : kind === "BTC"
                          ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
                          : "border-cyan-200/40 bg-cyan-500/10 text-cyan-300"
                    }`}
                  >
                    {kind === "SCALPING" ? (
                      <Activity className="h-5 w-5" />
                    ) : kind === "BTC" ? (
                      <Bitcoin className="h-5 w-5" />
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-black">{name}</div>
                    <div className="mt-0.5 text-[8px] text-slate-500">{subtitle}</div>
                  </div>

                  <div className="text-[11px] font-black text-slate-300">{time}</div>

                  {status === "LIVE" ? (
                    <span className="rounded-md border border-cyan-200/40 bg-cyan-500/10 px-2 py-1 text-[7px] font-black text-cyan-300">
                      LIVE
                    </span>
                  ) : (
                    <div className="hidden text-[9px] font-bold text-slate-400 sm:block">{status}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* STATS */}
          <div className="rounded-[16px] border border-cyan-200/35 bg-[linear-gradient(180deg,#0d65a8,#08457a)] p-4">
            <div className="text-[11px] font-black">STATYSTYKI SESJI</div>

            <div className="mt-4 grid grid-cols-1 items-center justify-items-center gap-4 sm:grid-cols-[150px_1fr] sm:justify-items-stretch sm:gap-5">
              <Donut78 />

              <div className="space-y-3">
                {[
                  [CalendarDays, "SESJE W TYGODNIU", "7", "text-cyan-300"],
                  [TrendingUp, "ŚREDNI RR", "2.45", "text-cyan-300"],
                  [Activity, "WYGRANE", "78%", "text-emerald-300"],
                  [ShieldCheck, "TRANSAKCJE", "152", "text-slate-300"],
                ].map(([Icon, label, value, color]) => {
                  const RowIcon = Icon as typeof CalendarDays;
                  return (
                    <div
                      key={String(label)}
                      className="flex items-center gap-3 border-b border-cyan-300/10 pb-2 last:border-b-0"
                    >
                      <RowIcon className="h-4 w-4 text-slate-300" />
                      <div className="flex-1 text-[8px] font-semibold text-slate-400">
                        {String(label)}
                      </div>
                      <div className={`text-[13px] font-black ${String(color)}`}>
                        {String(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Link
              href="/sesje/raport"
              className="mt-4 flex items-center justify-center gap-2 rounded-[9px] border border-cyan-400/30 bg-cyan-500/8 px-4 py-3 text-[10px] font-black text-cyan-300 hover:bg-cyan-500/12"
            >
              ZOBACZ RAPORT
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* BOTTOM STRIP */}
        <section className="mt-3 grid grid-cols-1 overflow-hidden rounded-[14px] border border-cyan-200/30 bg-[linear-gradient(180deg,#0b5795,#073b6b)] sm:grid-cols-2 xl:grid-cols-5">
          {[
            [Radio, "SESSION LIVE", "Sesje z analizą i transakcjami na żywo", "text-violet-300"],
            [Zap, "SCALPING LIVE", "Szybkie setupy i scalping na żywo", "text-cyan-300"],
            [CalendarDays, "7 DNI W TYGODNIU", "Pełny harmonogram sesji live", "text-cyan-300"],
            [Crown, "PRO QUALITY", "Profesjonalna edukacja i realne podejście do rynku", "text-violet-300"],
            [Bell, "POWIADOMIENIA", "Nie przegap żadnej ważnej sesji", "text-amber-300"],
          ].map(([Icon, title, text, color], index) => {
            const InfoIcon = Icon as typeof Radio;
            return (
              <div
                key={String(title)}
                className={`flex items-center gap-3 p-4 ${
                  index ? "border-t border-cyan-300/10 sm:border-l xl:border-t-0" : ""
                }`}
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-current/20 bg-[#0b5795] ${String(color)}`}>
                  <InfoIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[9px] font-black">{String(title)}</div>
                  <div className="mt-1 max-w-[175px] text-[8px] leading-4 text-slate-400">
                    {String(text)}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <footer className="mt-3 flex min-w-0 items-center justify-center gap-2 px-2 py-2 text-center text-[7px] font-semibold uppercase tracking-[.16em] text-cyan-100/55 sm:gap-4 sm:text-[8px] sm:tracking-[.30em]">
          <span className="hidden h-px w-28 bg-cyan-500/20 sm:block" />
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          FX TRADE PROFESSIONAL – TRADING Z PROFESJONALISTAMI
          <span className="hidden h-px w-28 bg-cyan-500/20 sm:block" />
        </footer>
      </div>
    </main>
  );
}
