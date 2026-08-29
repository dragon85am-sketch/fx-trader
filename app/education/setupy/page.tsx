import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";

const SETUPY = [
  {
    title: "1â€“2â€“3",
    desc: "Prosta, ale skuteczna struktura wejÅ›cia w trend. Idealna do szybkiego skalpowania.",
    href: "/education/setupy/123",
    badge: "POPULARNY",
    timeframe: "M1 - M5",
    level: "Åatwy",
    winRate: "75%",
    rr: "1.6 : 1",
    image: "/setup-123.png",
    accent: "sky",
    checks: [
      "Trend jest wyraÅºny",
      "Cena tworzy strukturÄ™ 1â€“2â€“3",
      "WejÅ›cie po wybiciu punktu 3",
      "SL pod/powyÅ¼ej punktu 2",
      "TP na kolejnym poziomie / RR 1:2+",
    ],
  },
  {
    title: "Retest",
    desc: "WejÅ›cie po reteÅ›cie kluczowego poziomu. Bardzo dobre przy wybiciach.",
    href: "/education/setupy/retest",
    badge: "NOWY",
    timeframe: "M1 - M15",
    level: "Åšredni",
    winRate: "72%",
    rr: "1.8 : 1",
    image: "/setup-retest.png",
    accent: "violet",
    checks: [
      "Zidentyfikuj kluczowy poziom",
      "Wybicie z poziomu",
      "PowrÃ³t ceny (retest)",
      "Formacja Å›wiecowa potwierdzajÄ…ca",
      "SL za poziomem",
      "TP na kolejnym poziomie / RR 1:2+",
    ],
  },
  {
    title: "Pullback",
    desc: "WejÅ›cie w trend po zdrowym cofniÄ™ciu. Wysoka skutecznoÅ›Ä‡ przy trendach.",
    href: "/education/setupy/pullback",
    badge: "POPULARNY",
    timeframe: "M5 - M15",
    level: "Åšredni",
    winRate: "80%",
    rr: "2.0 : 1",
    image: "/setup-pullback.png",
    accent: "cyan",
    checks: [
      "Trend jest wyraÅºny",
      "Cena wykonuje cofniÄ™cie",
      "Strefa popytu/podaÅ¼y",
      "Formacja potwierdzajÄ…ca",
      "SL za strefÄ…",
      "TP na kolejnym poziomie / RR 1:2+",
    ],
  },
];

function AccentDot({ accent }: { accent: string }) {
  const cls =
    accent === "violet"
      ? "bg-violet-400"
      : accent === "cyan"
      ? "bg-cyan-400"
      : "bg-sky-400";

  return <span className={`h-2 w-2 rounded-full ${cls}`} />;
}

export default function SetupyPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,8,23,.46), rgba(2,8,23,.70)), url('/setupy-glow-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,.16),transparent_46%)]"
      />
      <div className="relative z-10">
      <div className="mx-auto w-full max-w-[1900px] space-y-4 px-4 py-5 md:px-6 xl:px-8">

        {/* BACK */}
        <div>
          <Link
            href="/education"
            className="inline-flex items-center gap-2 rounded-[9px] border border-[#0d579e] bg-[#052348] px-3 py-2 text-[9px] font-semibold text-sky-100/75 transition hover:bg-[#0a3264] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            WrÃ³Ä‡ do Education
          </Link>
        </div>

        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[16px] border border-[#0d579e] bg-[linear-gradient(120deg,#12599a_0%,#0d477f_52%,#082f5d_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
          <div className="pointer-events-none absolute right-[10%] top-0 h-full w-[34%] opacity-[.12] [background-image:radial-gradient(circle,#38bdf8_1px,transparent_1px)] [background-size:7px_7px] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_72%)]" />

          <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_22px_rgba(14,165,233,.13)]">
                <TrendingUp className="h-7 w-7" />
              </div>

              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-200/55">
                  FX TRADE / EDUCATION / SETUPY
                </div>
                <h1 className="mt-1 text-[28px] font-semibold tracking-tight">Setupy</h1>
                <p className="mt-1 max-w-[620px] text-[11px] leading-5 text-sky-100/50">
                  Konkretne zasady, checklisty i przykÅ‚ady dla kaÅ¼dego setupu.
                  Na start 3 gÅ‚Ã³wne setupy do scalpingu i intraday.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                [BookOpen, "3", "Setupy dostÄ™pne"],
                [Clock3, "M1 - M15", "Timeframe"],
                [Target, "1.8 : 1", "Åšredni RR"],
                [Star, "78%", "SkutecznoÅ›Ä‡"],
              ].map(([Icon, value, label], index) => {
                const StatIcon = Icon as typeof BookOpen;

                return (
                  <div
                    key={index}
                    className="min-w-[145px] rounded-[11px] border border-[#0d579e] bg-[linear-gradient(145deg,#0d477f,#082f5d)] px-4 py-3 shadow-[0_0_20px_rgba(56,189,248,.10)]"
                  >
                    <div className="flex items-center gap-3">
                      <StatIcon className="h-5 w-5 text-sky-400" />
                      <div>
                        <div className="text-[15px] font-bold">{String(value)}</div>
                        <div className="text-[8px] text-sky-100/40">{String(label)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SETUP CARDS */}
        <section className="grid gap-3 xl:grid-cols-3">
          {SETUPY.map((setup, index) => {
            const borderClass =
              setup.accent === "violet"
                ? "border-violet-500/35"
                : setup.accent === "cyan"
                ? "border-cyan-500/35"
                : "border-sky-500/40";

            const accentText =
              setup.accent === "violet"
                ? "text-violet-300"
                : setup.accent === "cyan"
                ? "text-cyan-300"
                : "text-sky-300";

            const badgeClass =
              setup.accent === "violet"
                ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                : setup.accent === "cyan"
                ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                : "border-sky-400/30 bg-sky-500/10 text-sky-300";

            return (
              <article
                key={setup.title}
                className={`relative overflow-hidden rounded-[14px] border ${borderClass} bg-[linear-gradient(145deg,#0d477f_0%,#082f5d_55%,#06284f_100%)] p-5 shadow-[0_0_26px_rgba(14,165,233,.12),inset_0_1px_0_rgba(255,255,255,.06)]`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.05),transparent_40%)]" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] border ${borderClass} bg-[#0a3769] shadow-[0_0_16px_rgba(56,189,248,.10)] text-[15px] font-bold ${accentText}`}>
                        {index + 1}
                      </div>
                      <h2 className="text-[18px] font-semibold">{setup.title}</h2>
                    </div>

                    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-bold tracking-[.08em] ${badgeClass}`}>
                      {setup.badge}
                    </span>
                  </div>

                  <p className="mt-4 min-h-[44px] text-[11px] leading-5 text-sky-100/50">
                    {setup.desc}
                  </p>

                  <div className="mt-4 grid grid-cols-3 divide-x divide-[#0a417b] rounded-[10px] border border-[#0a417b] bg-[#0a3769]/90 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                    <div className="px-3">
                      <div className="text-[8px] text-sky-100/40">Timeframe</div>
                      <div className={`mt-1 text-[11px] font-semibold ${accentText}`}>
                        {setup.timeframe}
                      </div>
                    </div>
                    <div className="px-3">
                      <div className="text-[8px] text-sky-100/40">Poziom</div>
                      <div className="mt-1 text-[11px] font-semibold">{setup.level}</div>
                    </div>
                    <div className="px-3">
                      <div className="text-[8px] text-sky-100/40">Win Rate</div>
                      <div className={`mt-1 text-[11px] font-semibold ${accentText}`}>
                        {setup.winRate}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-sky-100/45">
                      Checklista
                    </div>

                    <div className="mt-3 space-y-2">
                      {setup.checks.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-[10px] text-sky-100/65">
                          <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accentText}`} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[10px] border border-[#0a417b] bg-[linear-gradient(135deg,#0a3769,#06284f)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[8px] uppercase tracking-[.12em] text-sky-100/40">
                          Åšredni RR
                        </div>
                        <div className={`mt-1 text-[22px] font-bold ${accentText}`}>{setup.rr}</div>
                      </div>

                      <div className="h-[128px] w-[190px] overflow-hidden rounded-[10px] border border-[#0a417b] bg-[#020d1c]">
                        <img
                          src={setup.image}
                          alt={`Setup ${setup.title}`}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={setup.href}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[9px] border ${borderClass} bg-[#0b4078] px-4 py-2.5 shadow-[0_0_18px_rgba(56,189,248,.08)] text-[10px] font-bold ${accentText} transition hover:bg-[#0a3264]`}
                  >
                    OtwÃ³rz setup
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {/* BOTTOM */}
        <section className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#0d477f,#082f5d_60%,#06284f)] p-5 shadow-[0_0_26px_rgba(14,165,233,.11),inset_0_1px_0_rgba(255,255,255,.05)]">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-300" />
              <h2 className="text-[15px] font-semibold">Jak korzystaÄ‡ z setupÃ³w?</h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                [TrendingUp, "Wybierz setup", "Dobierz setup do aktualnej sytuacji rynkowej."],
                [BookOpen, "SprawdÅº checklistÄ™", "Upewnij siÄ™, Å¼e speÅ‚nione sÄ… wszystkie warunki."],
                [ShieldCheck, "ZarzÄ…dzaj pozycjÄ…", "Stosuj plan zarzÄ…dzania ryzykiem i trzymaj siÄ™ planu."],
                [BarChart3, "Analizuj i notuj", "Zapisuj kaÅ¼dy trade w journalu i analizuj wyniki."],
              ].map(([Icon, title, desc], index) => {
                const StepIcon = Icon as typeof BookOpen;

                return (
                  <div key={index}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/10 text-sky-300">
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="mt-3 text-[10px] font-semibold">{String(title)}</div>
                    <div className="mt-1 text-[9px] leading-4 text-sky-100/40">{String(desc)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#0d579e] bg-[linear-gradient(145deg,#0d477f,#082f5d_60%,#06284f)] p-5 shadow-[0_0_26px_rgba(14,165,233,.11),inset_0_1px_0_rgba(255,255,255,.05)]">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-sky-300" />
              <h2 className="text-[15px] font-semibold">NajczÄ™Å›ciej uÅ¼ywane</h2>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_150px] md:items-center">
              <div className="space-y-4">
                {[
                  ["1â€“2â€“3", 64, "bg-sky-400"],
                  ["Pullback", 24, "bg-cyan-400"],
                  ["Retest", 12, "bg-violet-400"],
                ].map(([label, value, bar]) => (
                  <div key={String(label)}>
                    <div className="mb-1 flex items-center justify-between text-[9px]">
                      <span className="text-sky-100/65">{String(label)}</span>
                      <span className="font-semibold text-white">{String(value)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#062b54]">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="flex h-[115px] w-[115px] items-center justify-center rounded-full border-[10px] border-sky-500/20 border-t-sky-400 border-r-sky-400">
                  <div className="text-center">
                    <div className="text-[24px] font-bold">78%</div>
                    <div className="mt-1 text-[8px] text-sky-100/40">Åšrednia skutecznoÅ›Ä‡</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}

