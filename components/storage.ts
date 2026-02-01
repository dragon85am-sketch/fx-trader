export type OnboardingSetup = { setup: string; tf: string; session: string };

export type TradeSide = "LONG" | "SHORT";
export type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  market: string;
  tf: string;
  side: TradeSide;
  setup: string;
  resultR: number;
  mistake: string;
  session: string;
  notes: string;
};

const K = {
  paid: "fxtrader_paid",
  onboarding: "fxtrader_onboarding",
  trades: "fxtrader_trades",
} as const;

export function getPaid(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(K.paid) === "true";
}
export function setPaid(v: boolean) {
  localStorage.setItem(K.paid, v ? "true" : "false");
}

export type OnboardingState = {
  completed: boolean;
  step: number; // 0..5
  tradesCount: number; // 0..10
  setup?: OnboardingSetup;
};

const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  step: 0,
  tradesCount: 0,
};

export function getOnboarding(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING;

  try {
    const raw = localStorage.getItem(K.onboarding);
    if (!raw) return DEFAULT_ONBOARDING;

    const parsed = JSON.parse(raw) as Partial<OnboardingState>;

    return {
      completed: parsed.completed ?? false,
      step: parsed.step ?? 0,
      tradesCount: parsed.tradesCount ?? 0,
      setup: parsed.setup ?? { setup: "", tf: "", session: "" },
    };
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export function setOnboarding(s: OnboardingState) {
  localStorage.setItem(K.onboarding, JSON.stringify(s));
}

const seedTrades: Trade[] = [
  { id: "t1", date: "2026-01-28", market: "BTCUSDT", tf: "M1", side: "SHORT", setup: "M1 1–2–3", resultR: 1.6, mistake: "Brak", session: "NY", notes: "Pullback do mid BB, odrzucenie i kontynuacja." },
  { id: "t2", date: "2026-01-29", market: "BTCUSDT", tf: "M1", side: "SHORT", setup: "M1 1–2–3", resultR: -1, mistake: "Brak potwierdzenia", session: "London", notes: "Zbyt szybkie wejście (brak zamknięcia świecy sygnałowej)." },
  { id: "t3", date: "2026-01-30", market: "BTCUSDT", tf: "M1", side: "LONG", setup: "M1 retest mid BB", resultR: 1.1, mistake: "Brak", session: "NY", notes: "Trend z M5 w górę, czysty retest." },
  { id: "t4", date: "2026-01-31", market: "BTCUSDT", tf: "M1", side: "SHORT", setup: "M1 1–2–3", resultR: 2.0, mistake: "Brak", session: "London", notes: "TP1 na dolnej BB, reszta na LL." },
  { id: "t5", date: "2026-01-31", market: "BTCUSDT", tf: "M1", side: "SHORT", setup: "M1 1–2–3", resultR: -1, mistake: "FOMO", session: "NY", notes: "Wejście po impulsie – złamana zasada." },
];

export function getTrades(): Trade[] {
  if (typeof window === "undefined") return seedTrades;
  try {
    const raw = localStorage.getItem(K.trades);
    if (!raw) return seedTrades;
    const parsed = JSON.parse(raw) as Trade[];
    return Array.isArray(parsed) ? parsed : seedTrades;
  } catch {
    return seedTrades;
  }
}

export function setTrades(trades: Trade[]) {
  localStorage.setItem(K.trades, JSON.stringify(trades));
}
